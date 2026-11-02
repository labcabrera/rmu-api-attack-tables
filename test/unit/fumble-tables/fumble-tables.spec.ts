import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GetFumbleTableHandler } from '../../../src/modules/fumble-tables/application/cqrs/handlers/get-fumble-table.handler.js';
import { ListFumbleTablesHandler } from '../../../src/modules/fumble-tables/application/cqrs/handlers/list-fumble-tables.handler.js';
import { LookupFumbleTableHandler } from '../../../src/modules/fumble-tables/application/cqrs/handlers/lookup-fumble-table.handler.js';
import { GetFumbleTableQuery } from '../../../src/modules/fumble-tables/application/cqrs/queries/get-fumble-table.query.js';
import { LookupFumbleTableQuery } from '../../../src/modules/fumble-tables/application/cqrs/queries/lookup-fumble-table.query.js';
import type { FumbleEntry } from '../../../src/modules/fumble-tables/domain/entities/fumble-table.js';
import { FileFumbleTableRepository } from '../../../src/modules/fumble-tables/infrastructure/files/file.fumble-table.repository.js';
import { BUNDLED_DIR } from '../../../src/modules/shared/infrastructure/files/table-paths.js';
import { CORE_LAW, tablePaths, tempDir, USER, writeJson } from '../support/tables.js';

// Every bundled fumble table (spec 034): the ten columns of the Core Law melee and ranged fumble tables.
const FUMBLE_DIR = path.join(BUNDLED_DIR, 'fumble');
const TABLES = [
  'animals',
  'bows',
  'elemental-balls-cones',
  'elemental-bolts',
  'melee-one-hand',
  'melee-two-hand',
  'mounted-arms',
  'slings',
  'thrown',
  'unarmed',
];

type Effect = Record<string, unknown> & { status: string };
const number = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const DICE = /^\d+d\d+$/;

const EFFECTS: Record<string, { fields: string[]; check: (e: Effect) => boolean }> = {
  additional_critical: { fields: ['severity'], check: e => /^[A-E]$/.test(e.severity as string) },
  attack_penalty: { fields: ['value', 'rounds'], check: e => number(e.value) && e.value < 0 },
  bleeding: { fields: ['value'], check: e => number(e.value) && e.value > 0 },
  breakage_roll: { fields: ['value'], check: e => number(e.value) && e.value <= 0 },
  cannot_attack: { fields: ['rounds'], check: e => number(e.rounds) },
  cannot_parry: { fields: ['rounds'], check: e => number(e.rounds) },
  disarmed: { fields: [], check: () => true },
  fatigue: { fields: ['value'], check: e => number(e.value) && e.value < 0 },
  initiative_penalty: { fields: ['value', 'rounds', 'delay'], check: e => number(e.value) && e.value < 0 && number(e.rounds) },
  hits: { fields: ['value'], check: e => DICE.test(e.value as string) || (number(e.value) && e.value > 0) },
  // Feet, or dice of feet ("2d10")
  knocked_back_distance: { fields: ['value'], check: e => DICE.test(e.value as string) || (number(e.value) && e.value > 0) },
  penalty: { fields: ['value', 'rounds'], check: e => number(e.value) && e.value < 0 },
  prone: { fields: [], check: () => true },
  staggered: { fields: ['rounds', 'value'], check: e => number(e.rounds) && number(e.value) && e.value > 0 },
  stunned: { fields: ['rounds', 'value', 'delay'], check: e => number(e.rounds) && number(e.value) && e.value < 0 },
};

const validateEntry = (entry: FumbleEntry) => {
  expect(number(entry.rollMin) && number(entry.rollMax)).toBe(true);
  expect(typeof entry.text).toBe('string');
  ((entry.effects ?? []) as Effect[]).forEach(effect => {
    const schema = EFFECTS[effect.status];
    if (!schema) throw new Error(`Invalid status effect: ${effect.status}`);
    Object.keys(effect)
      .filter(key => key !== 'status')
      .forEach(key => expect([effect.status, schema.fields]).toEqual([effect.status, expect.arrayContaining([key])]));
    expect([effect.status, schema.check(effect)]).toEqual([effect.status, true]);
  });
};

const bundled = new FileFumbleTableRepository(tablePaths());
const lookup = (id: string, roll: number, repository = bundled) =>
  new LookupFumbleTableHandler(repository).execute(new LookupFumbleTableQuery(id, roll));

describe('bundled fumble tables', () => {
  it('has every column of Core Law and lists them', async () => {
    const files = readdirSync(FUMBLE_DIR).filter(file => file !== 'empty-template.json');
    expect(files.sort()).toEqual(TABLES.map(t => `${t}.json`));
    await expect(new ListFumbleTablesHandler(bundled).execute()).resolves.toEqual(TABLES);
  });

  it.each(TABLES)('%s covers rolls 1-100 with valid entries', async table => {
    (JSON.parse(readFileSync(path.join(FUMBLE_DIR, `${table}.json`), 'utf8')) as FumbleEntry[]).forEach(validateEntry);
    for (let roll = 1; roll <= 100; roll++) {
      const result = await lookup(table, roll);
      expect([roll, result.rollMin <= roll && roll <= result.rollMax]).toEqual([roll, true]);
    }
  });
});

describe('fumble lookup', () => {
  it('answers 404 for an unknown table and 400 for an invalid id', async () => {
    await expect(lookup('melee-two-hands', 10)).rejects.toMatchObject({ statusCode: 404 });
    await expect(lookup('../bows', 10)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('reports a gap in the data as a server error', async () => {
    const dir = tempDir('fumble');
    writeJson(path.join(dir, 'fumble', 'gap.json'), [{ rollMin: 1, rollMax: 50, text: 'low', effects: [] }]);
    await expect(lookup('gap', 80, new FileFumbleTableRepository(tablePaths(dir)))).rejects.toMatchObject({
      statusCode: 500,
      code: 'invalid-table-data',
    });
  });
});

describe('whole fumble table', () => {
  it('gives every row as the file has it, with Core Law access', async () => {
    const handler = new GetFumbleTableHandler(bundled);
    const table = await handler.execute(new GetFumbleTableQuery('bows', CORE_LAW));
    expect(table).toEqual({ id: 'bows', entries: JSON.parse(readFileSync(path.join(FUMBLE_DIR, 'bows.json'), 'utf8')) as unknown });
    await expect(handler.execute(new GetFumbleTableQuery('bows', USER))).rejects.toMatchObject({ statusCode: 403 });
    await expect(handler.execute(new GetFumbleTableQuery('missing', CORE_LAW))).rejects.toMatchObject({ statusCode: 404 });
    await expect(handler.execute(new GetFumbleTableQuery('../bows', CORE_LAW))).rejects.toMatchObject({ statusCode: 400 });
  });
});
