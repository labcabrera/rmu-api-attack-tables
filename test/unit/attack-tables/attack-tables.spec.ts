import { readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GetAttackTableHandler } from '../../../src/modules/attack-tables/application/cqrs/handlers/get-attack-table.handler.js';
import { ListAttackTablesHandler } from '../../../src/modules/attack-tables/application/cqrs/handlers/list-attack-tables.handler.js';
import { LookupAttackTableHandler } from '../../../src/modules/attack-tables/application/cqrs/handlers/lookup-attack-table.handler.js';
import { GetAttackTableQuery } from '../../../src/modules/attack-tables/application/cqrs/queries/get-attack-table.query.js';
import { LookupAttackTableQuery } from '../../../src/modules/attack-tables/application/cqrs/queries/lookup-attack-table.query.js';
import { parseAttackResult, parseAttackTable } from '../../../src/modules/attack-tables/domain/services/attack-table.parser.js';
import { FileAttackTableRepository } from '../../../src/modules/attack-tables/infrastructure/files/file.attack-table.repository.js';
import { BUNDLED_DIR } from '../../../src/modules/shared/infrastructure/files/table-paths.js';
import { CORE_LAW, tablePaths, tempDir, USER, writeFile } from '../support/tables.js';

// Synthetic tables (spec 033): made-up values with the shape of the Medium tables, no book content.
const WEAPON = ['roll,at1,at2', '173-175,20EP,18DP', '66-172,5,4AP', '1-65,,'].join('\n');
const BALL = ['roll,at1,at2', '123-125,15CH,14CH', '2-122,3,2'].join('\n');

describe('attack tables', () => {
  const dir = tempDir('attack-tables');
  writeFile(path.join(dir, 'attack-tables', 'test-weapon.csv'), WEAPON);
  writeFile(path.join(dir, 'attack-tables', 'test-ball.csv'), BALL);
  const repository = new FileAttackTableRepository(tablePaths(dir));
  const lookup = (id: string, at: number, roll: number) =>
    new LookupAttackTableHandler(repository).execute(new LookupAttackTableQuery(id, at, roll));

  it('reads the cells', () => {
    expect(parseAttackResult('16DP', 3)).toEqual({ armorType: 3, text: '16DP', damage: 16, criticalType: 'P', criticalSeverity: 'D' });
    expect(parseAttackResult('44GL', 1)).toMatchObject({ damage: 44, criticalType: 'L', criticalSeverity: 'G' });
    expect(parseAttackResult('5', 1)).toEqual({ armorType: 1, text: '5', damage: 5, criticalType: null, criticalSeverity: null });
    expect(parseAttackResult('', 1)).toEqual({ armorType: 1, text: '', damage: 0, criticalType: null, criticalSeverity: null });
  });

  it('parses every row with ten armor types', () => {
    const table = parseAttackTable('test-weapon', `${WEAPON}\r\n`);
    expect(table.rows.map(row => [row.rollMin, row.rollMax])).toEqual([
      [173, 175],
      [66, 172],
      [1, 65],
    ]);
    expect(table.rows[0].results).toHaveLength(10);
    expect(table.rows[0].results.map(result => result.armorType)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(table.rows[0].results[2]).toMatchObject({ text: '', damage: 0 });
    expect(parseAttackTable('one', 'roll,at1\n50,3').rows[0]).toMatchObject({ rollMin: 50, rollMax: 50 });
  });

  it('lists the tables found on disk, sorted, with the bundled ones', async () => {
    const ids = await new ListAttackTablesHandler(repository).execute();
    expect(ids).toEqual([...ids].sort());
    expect(ids).toEqual(expect.arrayContaining(['test-ball', 'test-weapon']));
    const bundled = readdirSync(path.join(BUNDLED_DIR, 'attack')).map(file => file.replace(/\.csv$/, ''));
    expect(ids).toEqual(expect.arrayContaining(bundled));
    expect(ids.some(id => /-(small|medium|big)$/.test(id))).toBe(false);
  });

  it('reads a result', async () => {
    await expect(lookup('test-weapon', 2, 100)).resolves.toMatchObject({
      text: '4AP',
      damage: 4,
      criticalType: 'P',
      criticalSeverity: 'A',
    });
    await expect(lookup('test-weapon', 1, 100)).resolves.toMatchObject({ text: '5', damage: 5, criticalType: null });
  });

  it('uses the top row above the last band, and none below the first one', async () => {
    await expect(lookup('test-ball', 1, 150)).resolves.toMatchObject({ text: '15CH' });
    await expect(lookup('test-ball', 1, 1)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects table ids that are not plain names and answers 404 for an unknown table', async () => {
    await expect(lookup('Test_Weapon', 2, 100)).rejects.toMatchObject({ statusCode: 400, code: 'invalid-table-id' });
    await expect(lookup('../test-weapon', 2, 100)).rejects.toMatchObject({ statusCode: 400 });
    await expect(lookup('missing-table', 2, 100)).rejects.toMatchObject({ statusCode: 404, code: 'not-found' });
  });

  it('gives the whole table only with Core Law access', async () => {
    const handler = new GetAttackTableHandler(repository);
    const table = await handler.execute(new GetAttackTableQuery('test-weapon', CORE_LAW));
    expect(table.id).toBe('test-weapon');
    expect(table.rows).toHaveLength(3);
    expect(table.rows[1].results[1]).toEqual({ armorType: 2, text: '4AP', damage: 4, criticalType: 'P', criticalSeverity: 'A' });
    await expect(handler.execute(new GetAttackTableQuery('test-weapon', USER))).rejects.toMatchObject({ statusCode: 403 });
    await expect(handler.execute(new GetAttackTableQuery('missing', ['rmu-admin']))).rejects.toMatchObject({ statusCode: 404 });
    await expect(handler.execute(new GetAttackTableQuery('../x', ['rmu-admin']))).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('bundled attack tables', () => {
  const repository = new FileAttackTableRepository(tablePaths());
  const ids = readdirSync(path.join(BUNDLED_DIR, 'attack')).map(file => file.replace(/\.csv$/, ''));

  it('has the 39 Medium tables of Core Law', async () => {
    expect(ids).toHaveLength(39);
    await expect(repository.list()).resolves.toEqual([...ids].sort());
    expect(readdirSync(path.join(BUNDLED_DIR, 'attack')).every(file => /^[a-z0-9-]+\.csv$/.test(file))).toBe(true);
  });

  it.each(ids)('%s has contiguous bands from 1 and a valid cell for every armor type', async id => {
    const table = (await repository.findById(id))!;
    const bands = [...table.rows].sort((a, b) => a.rollMin - b.rollMin);
    expect(bands[0].rollMin).toBe(1);
    bands.slice(1).forEach((band, i) => expect([id, band.rollMin]).toEqual([id, bands[i].rollMax + 1]));
    for (const row of table.rows) {
      expect(row.results).toHaveLength(10);
      row.results.forEach(result => expect([result.text, /^\d+([A-I][A-Z])?$/.test(result.text)]).toEqual([result.text, true]));
    }
  });
});
