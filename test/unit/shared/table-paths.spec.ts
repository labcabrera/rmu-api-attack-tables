import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BUNDLED_DIR } from '../../../src/modules/shared/infrastructure/files/table-paths.js';
import { tablePaths, tempDir, writeFile, writeJson } from '../support/tables.js';

describe('TablePaths (RMU_ATTACK_TABLES_DIR)', () => {
  const tmp = tempDir('table-paths');
  // data/core-law layout: <dir>/<kind>-tables
  const dataLayout = path.join(tmp, 'data');
  writeJson(path.join(dataLayout, 'critical-tables', 'X-A.json'), [{ rollMin: 1, rollMax: 100 }]);
  writeFile(path.join(dataLayout, 'attack-tables', 'test-weapon.csv'), 'roll,at1\n1-175,7AS\n');
  // tables/ layout: <dir>/<kind>
  const repoLayout = path.join(tmp, 'repo');
  writeJson(path.join(repoLayout, 'critical', 'Y-A.json'), []);

  it('defaults to the bundled tables, also for a blank value', () => {
    expect(tablePaths().root).toBe(BUNDLED_DIR);
    expect(tablePaths(' ').root).toBe(BUNDLED_DIR);
    expect(tablePaths().resolve('critical', 'S-A.json')).toBe(path.join(BUNDLED_DIR, 'critical', 'S-A.json'));
    expect(tablePaths().candidateDirs('fumble')).toEqual([path.join(BUNDLED_DIR, 'fumble'), path.join(BUNDLED_DIR, 'fumble-tables')]);
  });

  it('reads both layouts', () => {
    expect(tablePaths(dataLayout).resolve('critical', 'X-A.json')).toBe(path.join(dataLayout, 'critical-tables', 'X-A.json'));
    expect(tablePaths(repoLayout).resolve('critical', 'Y-A.json')).toBe(path.join(repoLayout, 'critical', 'Y-A.json'));
  });

  it('falls back to the bundled file, and gives null when no folder has it', () => {
    expect(tablePaths(repoLayout).resolve('critical', 'S-A.json')).toBe(path.join(BUNDLED_DIR, 'critical', 'S-A.json'));
    expect(tablePaths(path.join(tmp, 'missing')).resolve('fumble', 'bows.json')).toBe(path.join(BUNDLED_DIR, 'fumble', 'bows.json'));
    expect(tablePaths(dataLayout).resolve('critical', 'missing-A.json')).toBeNull();
  });

  it('lists the files of every folder once, sorted, without the templates', () => {
    const ids = tablePaths(dataLayout).list('attack', '.csv');
    expect(ids).toContain('test-weapon');
    expect(ids).toContain('broadsword');
    expect(ids).toEqual([...ids].sort());
    expect(tablePaths().list('fumble', '.json')).not.toContain('empty-template');
  });

  it('parses a file once and keeps it', () => {
    const paths = tablePaths(dataLayout);
    const first = paths.readJson('critical', 'X-A.json');
    expect(first).toEqual([{ rollMin: 1, rollMax: 100 }]);
    expect(paths.readJson('critical', 'X-A.json')).toBe(first);
    expect(paths.readJson('critical', 'none.json')).toBeNull();
  });

  it('logs the folder in use', () => {
    expect(() => tablePaths().onModuleInit()).not.toThrow();
    expect(() => tablePaths(dataLayout).onModuleInit()).not.toThrow();
    expect(() => tablePaths(path.join(tmp, 'missing')).onModuleInit()).not.toThrow();
  });
});
