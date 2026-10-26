const fs = require('fs');
const path = require('path');
const { BUNDLED_DIR } = require('../config/table-paths');
const fumbleTableService = require('../services/fumble-table-service');

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

const number = (value) => typeof value === 'number' && Number.isFinite(value);
const DICE = /^\d+d\d+$/;

const EFFECTS = {
  additional_critical: { fields: ['severity'], check: (e) => /^[A-E]$/.test(e.severity) },
  bleeding: { fields: ['value'], check: (e) => number(e.value) && e.value > 0 },
  breakage_roll: { fields: ['value'], check: (e) => number(e.value) && e.value <= 0 },
  fatigue: { fields: ['value'], check: (e) => number(e.value) && e.value < 0 },
  hits: { fields: ['value'], check: (e) => DICE.test(e.value) || (number(e.value) && e.value > 0) },
  // Feet, or dice of feet ("2d10")
  knocked_back_distance: { fields: ['value'], check: (e) => DICE.test(e.value) || (number(e.value) && e.value > 0) },
  penalty: { fields: ['value', 'rounds'], check: (e) => number(e.value) && e.value < 0 },
  staggered: { fields: ['rounds', 'value'], check: (e) => number(e.rounds) && number(e.value) && e.value > 0 },
  stunned: { fields: ['rounds', 'value', 'delay'], check: (e) => number(e.rounds) && number(e.value) && e.value < 0 },
};

const validateEntry = (entry) => {
  expect(number(entry.rollMin) && number(entry.rollMax)).toBe(true);
  expect(typeof entry.text).toBe('string');
  (entry.effects || []).forEach((effect) => {
    const schema = EFFECTS[effect.status];
    if (!schema) throw new Error(`Invalid status effect: ${effect.status}`);
    Object.keys(effect)
      .filter((key) => key !== 'status')
      .forEach((key) => expect([effect.status, schema.fields]).toEqual([effect.status, expect.arrayContaining([key])]));
    expect([effect.status, schema.check(effect)]).toEqual([effect.status, true]);
  });
};

describe('bundled fumble tables', () => {
  const original = process.env.RMU_ATTACK_TABLES_DIR;
  beforeAll(() => delete process.env.RMU_ATTACK_TABLES_DIR);
  afterAll(() => {
    if (original !== undefined) process.env.RMU_ATTACK_TABLES_DIR = original;
  });

  it('has every column of Core Law and lists them', () => {
    const files = fs.readdirSync(FUMBLE_DIR).filter((file) => file !== 'empty-template.json');
    expect(files.sort()).toEqual(TABLES.map((t) => `${t}.json`));
    expect(fumbleTableService.listFumbleTables()).toEqual(TABLES);
  });

  it.each(TABLES)('%s covers rolls 1-100 with valid entries', (table) => {
    JSON.parse(fs.readFileSync(path.join(FUMBLE_DIR, `${table}.json`), 'utf8')).forEach(validateEntry);
    for (let roll = 1; roll <= 100; roll++) {
      const result = fumbleTableService.findFumbleResult(table, roll);
      expect([roll, result.rollMin <= roll && roll <= result.rollMax]).toEqual([roll, true]);
    }
  });
});

describe('findFumbleResult', () => {
  it('answers 404 for an unknown table and 400 for an invalid id', () => {
    expect(() => fumbleTableService.findFumbleResult('melee-two-hands', 10)).toThrow(
      expect.objectContaining({ status: 404 }),
    );
    expect(() => fumbleTableService.findFumbleResult('../bows', 10)).toThrow(expect.objectContaining({ status: 400 }));
  });
});
