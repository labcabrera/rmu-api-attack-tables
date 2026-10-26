const fs = require('fs');
const os = require('os');
const path = require('path');
const spellCastingService = require('../services/spell-casting-service');

// Synthetic fixtures: placeholder text only, no book content.
const result = (text, pp = 'normal') => ({ text, pp });
const row = (rollMin, rollMax, text) => ({
  rollMin,
  rollMax,
  results: {
    elemental: result(`${text} elemental`),
    force: result(`${text} force`, 'none'),
    informational: result(`${text} informational`),
    utility: result(`${text} utility`, 'double'),
  },
});

const writeJson = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data));
};

describe('spell casting tables', () => {
  const original = process.env.RMU_ATTACK_TABLES_DIR;

  beforeAll(() => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rmu-spell-tables-'));
    writeJson(path.join(dir, 'spellcasting-tables', 'modifiers.json'), { columns: ['essence'], hands: { none: { essence: -1 } } });
    writeJson(path.join(dir, 'spell-failure-tables', 'essence.json'), [row(1, 10, 'low'), row(11, 300, 'mid'), row(301, null, 'top')]);
    process.env.RMU_ATTACK_TABLES_DIR = dir;
    spellCastingService.clearCache();
  });

  afterAll(() => {
    if (original === undefined) delete process.env.RMU_ATTACK_TABLES_DIR;
    else process.env.RMU_ATTACK_TABLES_DIR = original;
    spellCastingService.clearCache();
  });

  test('reads the modifiers of table 4-2 from the data folder', () => {
    expect(spellCastingService.findModifiers().hands.none.essence).toBe(-1);
  });

  test('returns the result of the spell type for the roll range', () => {
    expect(spellCastingService.findSpellFailureResult('essence', 'force', 50)).toEqual({
      realm: 'essence',
      type: 'force',
      roll: 50,
      rollMin: 11,
      rollMax: 300,
      text: 'mid force',
      pp: 'none',
    });
  });

  test('reads open-ended rolls: below 1 is the first row and the last row has no upper bound', () => {
    expect(spellCastingService.findSpellFailureResult('essence', 'utility', -12).text).toBe('low utility');
    expect(spellCastingService.findSpellFailureResult('essence', 'elemental', 999).text).toBe('top elemental');
  });

  test('rejects unknown realms and spell types', () => {
    expect(() => spellCastingService.findSpellFailureResult('arcane', 'force', 10)).toThrow(
      expect.objectContaining({ status: 400 })
    );
    expect(() => spellCastingService.findSpellFailureResult('essence', 'healing', 10)).toThrow(
      expect.objectContaining({ status: 400 })
    );
  });

  test('answers 404 when a realm has no table', () => {
    expect(() => spellCastingService.findSpellFailureResult('mentalism', 'force', 10)).toThrow(
      expect.objectContaining({ status: 404 })
    );
  });
});
