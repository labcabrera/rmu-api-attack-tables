const fs = require('fs');
const os = require('os');
const path = require('path');
const { BUNDLED_DIR, tablesDir, resolveTableFile } = require('../config/table-paths');
const criticalTableService = require('../services/critical-table-service');
const fumbleTableService = require('../services/fumble-table-service');
const attackTableService = require('../services/attack-table-service');

// Synthetic fixtures: placeholder text only, no book content.
const criticalTable = (message, injury) => [
  {
    rollMin: 1,
    rollMax: 100,
    dmg: 3,
    location: 'arm',
    effects: [{ status: 'penalty', value: -10 }],
    ...(injury ? { injury } : {}),
    message,
  },
];

const writeJson = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data));
};

describe('RMU_ATTACK_TABLES_DIR', () => {
  const original = process.env.RMU_ATTACK_TABLES_DIR;
  let dataLayout;
  let repoLayout;

  beforeAll(() => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rmu-attack-tables-'));

    // data/core-law layout: <dir>/<kind>-tables
    dataLayout = path.join(tmp, 'data');
    writeJson(
      path.join(dataLayout, 'critical-tables', 'X-A.json'),
      criticalTable('data layout', { type: 'bone', secondary: ['muscle-tendon'], flags: ['limb-loss'] })
    );
    writeJson(path.join(dataLayout, 'fumble-tables', 'test-fumble.json'), [
      { rollMin: 1, rollMax: 100, effects: [], text: 'data layout fumble' },
    ]);
    fs.mkdirSync(path.join(dataLayout, 'attack-tables'));
    fs.writeFileSync(path.join(dataLayout, 'attack-tables', 'test-weapon-medium.csv'), 'roll,at1\n1-175,7AS\n');

    // tables/ layout: <dir>/<kind>
    repoLayout = path.join(tmp, 'repo');
    writeJson(path.join(repoLayout, 'critical', 'Y-A.json'), criticalTable('repo layout'));
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.RMU_ATTACK_TABLES_DIR;
    } else {
      process.env.RMU_ATTACK_TABLES_DIR = original;
    }
  });

  it('defaults to the bundled tables', () => {
    delete process.env.RMU_ATTACK_TABLES_DIR;
    expect(tablesDir()).toBe(BUNDLED_DIR);
    expect(resolveTableFile('critical', 'S-A.json')).toBe(path.join(BUNDLED_DIR, 'critical', 'S-A.json'));
  });

  it('treats an empty value as unset', () => {
    process.env.RMU_ATTACK_TABLES_DIR = ' ';
    expect(tablesDir()).toBe(BUNDLED_DIR);
  });

  it('reads <dir>/<kind>-tables and returns the injury field', () => {
    process.env.RMU_ATTACK_TABLES_DIR = dataLayout;
    const result = criticalTableService.findCriticalResult('X', 'A', 50);
    expect(result.message).toBe('data layout');
    expect(result.injury).toEqual({ type: 'bone', secondary: ['muscle-tendon'], flags: ['limb-loss'] });
  });

  it('reads <dir>/<kind>', () => {
    process.env.RMU_ATTACK_TABLES_DIR = repoLayout;
    const result = criticalTableService.findCriticalResult('Y', 'A', 50);
    expect(result.message).toBe('repo layout');
    expect(result.injury).toBeUndefined();
  });

  it('falls back to the bundled table when the file is missing', () => {
    process.env.RMU_ATTACK_TABLES_DIR = repoLayout;
    expect(resolveTableFile('critical', 'S-A.json')).toBe(path.join(BUNDLED_DIR, 'critical', 'S-A.json'));
    expect(criticalTableService.findCriticalResult('S', 'A', 50)).toHaveProperty('message');
  });

  it('still reports unknown tables as not found', () => {
    process.env.RMU_ATTACK_TABLES_DIR = dataLayout;
    expect(() => criticalTableService.findCriticalResult('missing', 'A', 10)).toThrow(
      expect.objectContaining({ status: 404 })
    );
  });

  it('uses the directory for fumble and attack tables', async () => {
    process.env.RMU_ATTACK_TABLES_DIR = dataLayout;
    expect(fumbleTableService.findFumbleResult('test-fumble', 10).text).toBe('data layout fumble');
    await expect(attackTableService.findAttackResult('test-weapon', 'medium', 1, 100)).resolves.toBe('7AS');
  });

  it('falls back to the bundled tables when the directory does not exist', () => {
    process.env.RMU_ATTACK_TABLES_DIR = path.join(os.tmpdir(), 'rmu-attack-tables-missing-dir');
    expect(resolveTableFile('fumble', 'bows.json')).toBe(path.join(BUNDLED_DIR, 'fumble', 'bows.json'));
  });
});
