import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GetSpellFailureTableHandler } from '../../../src/modules/spell-casting-tables/application/cqrs/handlers/get-spell-failure-table.handler.js';
import { GetSpellcastingModifiersHandler } from '../../../src/modules/spell-casting-tables/application/cqrs/handlers/get-spellcasting-modifiers.handler.js';
import { LookupSpellFailureHandler } from '../../../src/modules/spell-casting-tables/application/cqrs/handlers/lookup-spell-failure.handler.js';
import { GetSpellFailureTableQuery } from '../../../src/modules/spell-casting-tables/application/cqrs/queries/get-spell-failure-table.query.js';
import { LookupSpellFailureQuery } from '../../../src/modules/spell-casting-tables/application/cqrs/queries/lookup-spell-failure.query.js';
import { FileSpellCastingTablesRepository } from '../../../src/modules/spell-casting-tables/infrastructure/files/file.spell-casting-tables.repository.js';
import { CORE_LAW, tablePaths, tempDir, USER, writeJson } from '../support/tables.js';

// Synthetic fixtures: placeholder text only, no book content.
const result = (text: string, pp = 'normal') => ({ text, pp });
const row = (rollMin: number, rollMax: number | null, text: string) => ({
  rollMin,
  rollMax,
  results: {
    elemental: result(`${text} elemental`),
    force: result(`${text} force`, 'none'),
    informational: result(`${text} informational`),
    utility: result(`${text} utility`, 'double'),
  },
});
const ROWS = [row(1, 10, 'low'), row(11, 300, 'mid'), row(301, null, 'top')];

describe('spell casting tables', () => {
  const dir = tempDir('spell-tables');
  writeJson(path.join(dir, 'spellcasting-tables', 'modifiers.json'), { columns: ['essence'], hands: { none: { essence: -1 } } });
  writeJson(path.join(dir, 'spell-failure-tables', 'essence.json'), ROWS);
  writeJson(path.join(dir, 'spell-failure-tables', 'channeling.json'), [{ rollMin: 1, rollMax: 10, results: {} }]);
  const repository = new FileSpellCastingTablesRepository(tablePaths(dir));
  const lookup = (realm: string, type: string, roll: number) =>
    new LookupSpellFailureHandler(repository).execute(new LookupSpellFailureQuery(realm, type, roll));

  it('reads the modifiers of table 4-2 from the data folder, and 404 without them', async () => {
    await expect(new GetSpellcastingModifiersHandler(repository).execute()).resolves.toMatchObject({ hands: { none: { essence: -1 } } });
    const bundled = new FileSpellCastingTablesRepository(tablePaths());
    await expect(new GetSpellcastingModifiersHandler(bundled).execute()).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns the result of the spell type for the roll range', async () => {
    await expect(lookup('essence', 'force', 50)).resolves.toEqual({
      realm: 'essence',
      type: 'force',
      roll: 50,
      rollMin: 11,
      rollMax: 300,
      text: 'mid force',
      pp: 'none',
    });
  });

  it('reads open-ended rolls: below 1 is the first row and the last row has no upper bound', async () => {
    await expect(lookup('essence', 'utility', -12)).resolves.toMatchObject({ text: 'low utility' });
    await expect(lookup('essence', 'elemental', 999)).resolves.toMatchObject({ text: 'top elemental' });
  });

  it('rejects unknown realms and spell types', async () => {
    await expect(lookup('arcane', 'force', 10)).rejects.toMatchObject({ statusCode: 400, code: 'invalid-realm' });
    await expect(lookup('essence', 'healing', 10)).rejects.toMatchObject({ statusCode: 400, code: 'invalid-spell-type' });
  });

  it('answers 404 when a realm has no table, and 500 for a row without the result', async () => {
    await expect(lookup('mentalism', 'force', 10)).rejects.toMatchObject({ statusCode: 404 });
    await expect(lookup('channeling', 'force', 5)).rejects.toMatchObject({ statusCode: 500, code: 'invalid-table-data' });
  });

  it('gives the whole table of a realm with Core Law access', async () => {
    const handler = new GetSpellFailureTableHandler(repository);
    await expect(handler.execute(new GetSpellFailureTableQuery('essence', CORE_LAW))).resolves.toEqual({ realm: 'essence', rows: ROWS });
    await expect(handler.execute(new GetSpellFailureTableQuery('essence', USER))).rejects.toMatchObject({ statusCode: 403 });
    await expect(handler.execute(new GetSpellFailureTableQuery('mentalism', CORE_LAW))).rejects.toMatchObject({ statusCode: 404 });
    await expect(handler.execute(new GetSpellFailureTableQuery('arcane', CORE_LAW))).rejects.toMatchObject({ statusCode: 400 });
  });
});
