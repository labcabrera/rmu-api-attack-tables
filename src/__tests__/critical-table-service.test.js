const fs = require('fs');
const path = require('path');
const { BUNDLED_DIR } = require('../config/table-paths');
const criticalTableService = require('../services/critical-table-service');

// Every bundled critical table (spec 034): 15 tables x severities A-E, read through the service with the
// RMU_ATTACK_TABLES_DIR of the environment ignored.
const CRITICAL_DIR = path.join(BUNDLED_DIR, 'critical');
const TABLES = ['G', 'H', 'I', 'K', 'L', 'O', 'P', 'S', 'T', 'U', 'W', 'acid', 'holy', 'steam', 'subdual'];
const SEVERITIES = ['A', 'B', 'C', 'D', 'E'];
const LOCATIONS = ['head', 'chest', 'abdomen', 'leg', 'arm'];

const number = (value) => typeof value === 'number' && Number.isFinite(value);

// Allowed fields of each effect status, and a check of its values
const EFFECTS = {
  // Spec 034, phase 4: effects the book only gives in the text
  attack_penalty: { fields: ['value', 'rounds'], check: (e) => number(e.value) && e.value < 0 },
  blinded: { fields: ['rounds'] },
  cannot_attack: { fields: ['rounds'], check: (e) => number(e.rounds) },
  cannot_parry: { fields: ['rounds', 'delay'] },
  disarmed: { fields: [] },
  half_activity: { fields: ['rounds', 'delay'] },
  half_movement: { fields: ['rounds'] },
  heal: { fields: ['value', 'applyTo'], check: (e) => number(e.value) && e.value > 0 && e.applyTo === 'source' },
  limb_useless: { fields: ['location', 'rounds'], check: (e) => ['arm', 'leg'].includes(e.location) },
  bleeding: { fields: ['value'], check: (e) => number(e.value) && e.value > 0 },
  breakage_roll: { fields: ['value'], check: (e) => number(e.value) && e.value <= 0 },
  conditional_dying: { fields: ['condition'], check: (e) => typeof e.condition === 'string' },
  dead: { fields: [] },
  dying: { fields: ['rounds', 'duration'], check: (e) => e.rounds === undefined || number(e.rounds) },
  fatigue: { fields: ['value'], check: (e) => number(e.value) && e.value < 0 },
  grappled: { fields: ['value'], check: (e) => number(e.value) && e.value > 0 },
  incapacitated: { fields: ['rounds', 'duration'] },
  knocked_back_distance: { fields: ['value'], check: (e) => number(e.value) && e.value > 0 },
  paralyzed: { fields: ['rounds', 'duration'] },
  penalty: { fields: ['value', 'rounds'], check: (e) => number(e.value) && e.value < 0 },
  prone: { fields: [] },
  staggered: { fields: ['rounds', 'value'], check: (e) => number(e.rounds) && number(e.value) && e.value > 0 },
  stunned: { fields: ['rounds', 'value', 'delay'], check: (e) => number(e.rounds) && number(e.value) && e.value < 0 },
  unconscious: { fields: ['delay', 'delayDuration', 'duration'] },
};

const validateEntry = (entry) => {
  expect(number(entry.rollMin) && number(entry.rollMax)).toBe(true);
  expect(number(entry.dmg) && entry.dmg >= 0).toBe(true);
  expect(LOCATIONS).toContain(entry.location);
  expect(typeof entry.message).toBe('string');
  expect(Array.isArray(entry.effects)).toBe(true);
  entry.effects.forEach((effect) => {
    const schema = EFFECTS[effect.status];
    if (!schema) throw new Error(`Invalid status effect: ${effect.status}`);
    Object.keys(effect)
      .filter((key) => key !== 'status')
      .forEach((key) => expect([effect.status, schema.fields]).toEqual([effect.status, expect.arrayContaining([key])]));
    if (schema.check) expect([effect.status, schema.check(effect)]).toEqual([effect.status, true]);
  });
};

describe('bundled critical tables', () => {
  const original = process.env.RMU_ATTACK_TABLES_DIR;
  beforeAll(() => delete process.env.RMU_ATTACK_TABLES_DIR);
  afterAll(() => {
    if (original !== undefined) process.env.RMU_ATTACK_TABLES_DIR = original;
  });

  it('has every table of Core Law', () => {
    const files = fs.readdirSync(CRITICAL_DIR).filter((file) => file !== 'empty-template.json');
    expect(files.sort()).toEqual(TABLES.flatMap((t) => SEVERITIES.map((s) => `${t}-${s}.json`)).sort());
  });

  describe.each(TABLES)('table %s', (table) => {
    it.each(SEVERITIES)('severity %s covers rolls 1-100 with valid entries', (severity) => {
      const entries = JSON.parse(fs.readFileSync(path.join(CRITICAL_DIR, `${table}-${severity}.json`), 'utf8'));
      expect(entries).toHaveLength(20);
      entries.forEach(validateEntry);
      for (let roll = 1; roll <= 100; roll++) {
        const result = criticalTableService.findCriticalResult(table, severity, roll);
        expect([roll, result.rollMin <= roll && roll <= result.rollMax]).toEqual([roll, true]);
      }
    });
  });
});

describe('findCriticalResult', () => {
  it('returns the entry of roll 1', () => {
    const result = criticalTableService.findCriticalResult('K', 'A', 1);
    expect(result).toMatchObject({ rollMin: 1, rollMax: 1, location: 'head' });
  });

  it('answers 404 for an unknown table', () => {
    expect(() => criticalTableService.findCriticalResult('missing', 'A', 10)).toThrow(
      expect.objectContaining({ status: 404 }),
    );
  });

  it('answers 400 for an invalid table id or severity', () => {
    expect(() => criticalTableService.findCriticalResult('../K', 'A', 10)).toThrow(
      expect.objectContaining({ status: 400 }),
    );
    expect(() => criticalTableService.findCriticalResult('K', 'F', 10)).toThrow(
      expect.objectContaining({ status: 400 }),
    );
  });
});
