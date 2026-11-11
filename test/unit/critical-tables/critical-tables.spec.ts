import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GetCriticalLocationsHandler } from '../../../src/modules/critical-tables/application/cqrs/handlers/get-critical-locations.handler.js';
import { GetCriticalTableHandler } from '../../../src/modules/critical-tables/application/cqrs/handlers/get-critical-table.handler.js';
import { ListCriticalTypesHandler } from '../../../src/modules/critical-tables/application/cqrs/handlers/list-critical-types.handler.js';
import { LookupCriticalTableHandler } from '../../../src/modules/critical-tables/application/cqrs/handlers/lookup-critical-table.handler.js';
import { GetCriticalTableQuery } from '../../../src/modules/critical-tables/application/cqrs/queries/get-critical-table.query.js';
import { LookupCriticalTableQuery } from '../../../src/modules/critical-tables/application/cqrs/queries/lookup-critical-table.query.js';
import type { CriticalEntry } from '../../../src/modules/critical-tables/domain/entities/critical-table.js';
import { findCriticalEntry, NO_EFFECT } from '../../../src/modules/critical-tables/domain/services/critical-lookup.js';
import { FileCriticalTableRepository } from '../../../src/modules/critical-tables/infrastructure/files/file.critical-table.repository.js';
import { BUNDLED_DIR } from '../../../src/modules/shared/infrastructure/files/table-paths.js';
import { CORE_LAW, tablePaths, tempDir, USER, writeJson } from '../support/tables.js';

// Every bundled critical table (spec 034): 15 tables x severities A-E.
const CRITICAL_DIR = path.join(BUNDLED_DIR, 'critical');
const TABLES = ['G', 'H', 'I', 'K', 'L', 'O', 'P', 'S', 'T', 'U', 'W', 'acid', 'holy', 'steam', 'subdual'];
const SEVERITIES = ['A', 'B', 'C', 'D', 'E'] as const;
const LOCATIONS = ['head', 'chest', 'abdomen', 'leg', 'arm'];

type Effect = Record<string, unknown> & { status: string };
const number = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

// Allowed fields of each effect status, and a check of its values
const EFFECTS: Record<string, { fields: string[]; check?: (e: Effect) => boolean }> = {
  // Spec 034, phase 4: effects the book only gives in the text
  attack_penalty: { fields: ['value', 'rounds'], check: e => number(e.value) && e.value < 0 },
  blinded: { fields: ['rounds'] },
  cannot_attack: { fields: ['rounds'], check: e => number(e.rounds) },
  cannot_parry: { fields: ['rounds', 'delay'] },
  disarmed: { fields: [] },
  half_activity: { fields: ['rounds', 'delay'] },
  half_movement: { fields: ['rounds'] },
  heal: { fields: ['value', 'applyTo'], check: e => number(e.value) && e.value > 0 && e.applyTo === 'source' },
  limb_useless: { fields: ['location', 'rounds'], check: e => ['arm', 'leg'].includes(e.location as string) },
  bleeding: { fields: ['value'], check: e => number(e.value) && e.value > 0 },
  breakage_roll: { fields: ['value'], check: e => number(e.value) && e.value <= 0 },
  conditional_dying: { fields: ['condition'], check: e => typeof e.condition === 'string' },
  dead: { fields: [] },
  dying: { fields: ['rounds', 'duration'], check: e => e.rounds === undefined || number(e.rounds) },
  fatigue: { fields: ['value'], check: e => number(e.value) && e.value < 0 },
  grappled: { fields: ['value'], check: e => number(e.value) && e.value > 0 },
  incapacitated: { fields: ['rounds', 'duration'] },
  knocked_back_distance: { fields: ['value'], check: e => number(e.value) && e.value > 0 },
  paralyzed: { fields: ['rounds', 'duration'] },
  penalty: { fields: ['value', 'rounds'], check: e => number(e.value) && e.value < 0 },
  prone: { fields: [] },
  staggered: { fields: ['rounds', 'value'], check: e => number(e.rounds) && number(e.value) && e.value > 0 },
  stunned: { fields: ['rounds', 'value', 'delay'], check: e => number(e.rounds) && number(e.value) && e.value < 0 },
  unconscious: { fields: ['delay', 'delayDuration', 'duration'] },
};

const validateEntry = (entry: CriticalEntry) => {
  expect(number(entry.rollMin) && number(entry.rollMax)).toBe(true);
  expect(number(entry.dmg) && entry.dmg >= 0).toBe(true);
  expect(LOCATIONS).toContain(entry.location);
  expect(typeof entry.message).toBe('string');
  expect(Array.isArray(entry.effects)).toBe(true);
  (entry.effects as Effect[]).forEach(effect => {
    const schema = EFFECTS[effect.status];
    if (!schema) throw new Error(`Invalid status effect: ${effect.status}`);
    Object.keys(effect)
      .filter(key => key !== 'status')
      .forEach(key => expect([effect.status, schema.fields]).toEqual([effect.status, expect.arrayContaining([key])]));
    if (schema.check) expect([effect.status, schema.check(effect)]).toEqual([effect.status, true]);
  });
};

const bundled = new FileCriticalTableRepository(tablePaths());
const lookup = (type: string, severity: string, roll: number, location?: string, natural = false, repository = bundled) =>
  new LookupCriticalTableHandler(repository).execute(new LookupCriticalTableQuery(type, severity, roll, location, natural));
const locationMap = (entries: CriticalEntry[]) => entries.map(e => ({ from: e.rollMin, to: e.rollMax, location: e.location }));

describe('bundled critical tables', () => {
  it('has every table of Core Law and lists its types', async () => {
    const files = readdirSync(CRITICAL_DIR).filter(file => file !== 'empty-template.json');
    expect(files.sort()).toEqual(TABLES.flatMap(t => SEVERITIES.map(s => `${t}-${s}.json`)).sort());
    await expect(new ListCriticalTypesHandler(bundled).execute()).resolves.toEqual([...TABLES].sort());
  });

  describe.each(TABLES)('table %s', table => {
    it.each(SEVERITIES)('severity %s covers rolls 1-100 with valid entries', async severity => {
      const entries = JSON.parse(readFileSync(path.join(CRITICAL_DIR, `${table}-${severity}.json`), 'utf8')) as CriticalEntry[];
      expect(entries).toHaveLength(20);
      entries.forEach(validateEntry);
      for (let roll = 1; roll <= 100; roll++) {
        const result = await lookup(table, severity, roll);
        expect([roll, result.rollMin <= roll && roll <= result.rollMax]).toEqual([roll, true]);
      }
    });
  });
});

describe('critical locations', () => {
  it('every critical table file shares the same roll → location map', () => {
    const files = readdirSync(CRITICAL_DIR).filter(file => file.endsWith('.json'));
    const maps = files.map(file => ({
      file,
      map: locationMap(JSON.parse(readFileSync(path.join(CRITICAL_DIR, file), 'utf8')) as CriticalEntry[]),
    }));
    const reference = maps.find(m => m.file === 'K-A.json')!.map;
    expect(maps.filter(m => JSON.stringify(m.map) !== JSON.stringify(reference)).map(m => m.file)).toEqual([]);
  });

  it('serves the common map, from 1 to 100 without gaps', async () => {
    const map = await new GetCriticalLocationsHandler(bundled).execute();
    expect(map).toEqual(locationMap(JSON.parse(readFileSync(path.join(CRITICAL_DIR, 'S-E.json'), 'utf8')) as CriticalEntry[]));
    map.forEach((range, i) => expect(range.from).toBe(i === 0 ? 1 : map[i - 1].to + 1));
    expect(map.at(-1)!.to).toBe(100);
    expect(map.find(range => range.from === 81)).toEqual({ from: 81, to: 85, location: 'head' });
    expect(map.find(range => range.from === 21)).toEqual({ from: 21, to: 25, location: 'chest' });
  });

  it('fails on a table with a different map, and 404 without tables', async () => {
    const rows = (split: number): CriticalEntry[] => [
      { rollMin: 1, rollMax: split, dmg: 0, location: 'head', message: 'a' },
      { rollMin: split + 1, rollMax: 100, dmg: 0, location: 'leg', message: 'b' },
    ];
    const tables: Record<string, CriticalEntry[]> = { A: rows(50), B: rows(60) };
    const repository = {
      listTypes: () => Promise.resolve(['X']),
      findSeverity: (_type: string, severity: string) => Promise.resolve(tables[severity] ?? null),
    };
    await expect(new GetCriticalLocationsHandler(repository).execute()).rejects.toMatchObject({
      statusCode: 500,
      code: 'critical-locations-mismatch',
      message: expect.stringContaining('X-B') as string,
    });
    const empty = { listTypes: () => Promise.resolve([]), findSeverity: () => Promise.resolve(null) };
    await expect(new GetCriticalLocationsHandler(empty).execute()).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('critical lookup', () => {
  it('returns the entry of roll 1', async () => {
    await expect(lookup('K', 'A', 1)).resolves.toMatchObject({ rollMin: 1, rollMax: 1, location: 'head' });
  });

  it('answers 404 for an unknown table and 400 for an invalid id or severity', async () => {
    await expect(lookup('missing', 'A', 10)).rejects.toMatchObject({ statusCode: 404 });
    await expect(lookup('../K', 'A', 10)).rejects.toMatchObject({ statusCode: 400, code: 'invalid-table-id' });
    await expect(lookup('K', 'F', 10)).rejects.toMatchObject({ statusCode: 400, code: 'invalid-severity' });
  });

  // Synthetic rows: only the bands and locations matter.
  const row = (rollMin: number, rollMax: number, location: string): CriticalEntry => ({
    rollMin,
    rollMax,
    dmg: rollMin,
    location,
    message: `${rollMin}-${rollMax}`,
    effects: [],
  });
  const entries = [
    row(1, 10, 'chest'),
    row(11, 20, 'arm'),
    row(21, 65, 'chest'),
    row(66, 66, 'head'),
    row(67, 80, 'leg'),
    row(81, 100, 'arm'),
  ];

  it('takes the first row of the location at or below the roll', () => {
    expect(findCriticalEntry(entries, 'B', 50).message).toBe('21-65');
    expect(findCriticalEntry(entries, 'B', 50, 'arm').message).toBe('11-20');
    expect(findCriticalEntry(entries, 'B', 66, 'head')).toBe(NO_EFFECT);
    expect(findCriticalEntry(entries, 'B', 5, 'leg')).toBe(NO_EFFECT);
  });

  it('never reaches 66 with a location, unless the 66 is natural', () => {
    expect(findCriticalEntry(entries, 'B', 66, 'arm').message).toBe('11-20');
    expect(findCriticalEntry(entries, 'B', 66, 'arm', true).message).toBe('66-66');
    expect(findCriticalEntry(entries, 'B', 66, 'head', true).message).toBe('66-66');
    // natural only matters for a 66: other rolls still move down to the location
    expect(findCriticalEntry(entries, 'B', 70, 'head', true)).toBe(NO_EFFECT);
    expect(findCriticalEntry(entries, 'B', 70, 'chest', true).message).toBe('21-65');
    // without a location a 66 is the 66 row anyway
    expect(findCriticalEntry(entries, 'B', 66).message).toBe('66-66');
  });

  it('keeps a natural 66 on the bundled tables with a forced location', async () => {
    await expect(lookup('K', 'C', 66, 'head', true)).resolves.toMatchObject({ rollMin: 66, rollMax: 66 });
    await expect(lookup('K', 'C', 66, 'head')).resolves.toMatchObject({ rollMin: 16, rollMax: 20, location: 'head' });
  });

  it('reads Z as the A row below the one of the roll, on its location', () => {
    expect(findCriticalEntry(entries, 'Z', 50).message).toBe('1-10');
    expect(findCriticalEntry(entries, 'Z', 90).message).toBe('11-20');
    // 67-…: two below the roll, which may still be in the same row
    expect(findCriticalEntry(entries, 'Z', 70).message).toBe('67-80');
    expect(findCriticalEntry(entries, 'Z', 5)).toBe(NO_EFFECT);
    expect(findCriticalEntry([], 'Z', 5)).toBe(NO_EFFECT);
  });

  it('reads Z from the A file', async () => {
    const a = await lookup('K', 'A', 40);
    const z = await lookup('K', 'Z', 40);
    expect(z.rollMax).toBeLessThan(a.rollMin);
  });
});

describe('whole critical table', () => {
  it('aggregates every severity of a type', async () => {
    const table = await new GetCriticalTableHandler(bundled).execute(new GetCriticalTableQuery('P', CORE_LAW));
    expect(table.type).toBe('P');
    expect(Object.keys(table.severities)).toEqual([...SEVERITIES]);
    for (const severity of SEVERITIES) {
      const file = JSON.parse(readFileSync(path.join(CRITICAL_DIR, `P-${severity}.json`), 'utf8')) as unknown;
      expect(table.severities[severity]).toEqual(file);
    }
  });

  it('leaves out the severities without a file, and needs one at least', async () => {
    const dir = tempDir('critical');
    writeJson(path.join(dir, 'critical-tables', 'X-B.json'), [{ rollMin: 1, rollMax: 100, message: 'b', injury: { type: 'bone' } }]);
    const handler = new GetCriticalTableHandler(new FileCriticalTableRepository(tablePaths(dir)));
    const table = await handler.execute(new GetCriticalTableQuery('X', ['rmu-admin']));
    expect(table.severities).toEqual({ B: [{ rollMin: 1, rollMax: 100, message: 'b', injury: { type: 'bone' } }] });
    await expect(handler.execute(new GetCriticalTableQuery('missing', ['rmu-admin']))).rejects.toMatchObject({ statusCode: 404 });
    await expect(handler.execute(new GetCriticalTableQuery('../K', ['rmu-admin']))).rejects.toMatchObject({ statusCode: 400 });
  });

  it('needs Core Law access', async () => {
    await expect(new GetCriticalTableHandler(bundled).execute(new GetCriticalTableQuery('P', USER))).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
