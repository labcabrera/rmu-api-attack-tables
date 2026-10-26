const fs = require('fs');
const { resolveTableFile } = require('../config/table-paths');

// Spell casting tables of Spell Law (workspace spec 030). The data lives outside this repository:
//   spellcasting/modifiers.json        Table 4-2, SCR modifiers per realm column
//   spell-failure/<realm>.json         Tables 4-4a/b/c, one row per roll range with a result per spell type
const REALMS = ['channeling', 'essence', 'mentalism'];
const SPELL_TYPES = ['elemental', 'force', 'informational', 'utility'];

const cache = new Map();

const readJson = (kind, fileName) => {
  const filePath = resolveTableFile(kind, fileName);
  if (cache.has(filePath)) {
    return cache.get(filePath);
  }
  if (!fs.existsSync(filePath)) {
    throw { status: 404, message: `Table ${kind}/${fileName} not found` };
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  cache.set(filePath, data);
  return data;
};

const findModifiers = () => readJson('spellcasting', 'modifiers.json');

// The roll is open-ended and carries the failure modifier: anything below 1 reads the first row.
const findSpellFailureResult = (realm, type, roll) => {
  if (!REALMS.includes(realm)) {
    throw { status: 400, message: `Invalid realm '${realm}' (${REALMS.join(', ')})` };
  }
  if (!SPELL_TYPES.includes(type)) {
    throw { status: 400, message: `Invalid spell type '${type}' (${SPELL_TYPES.join(', ')})` };
  }
  const value = Math.max(1, roll);
  const rows = readJson('spell-failure', `${realm}.json`);
  const row = rows.find((item) => value >= item.rollMin && (item.rollMax === null || value <= item.rollMax));
  if (!row || !row.results || !row.results[type]) {
    throw { status: 500, message: `Invalid spell failure table data (${realm})` };
  }
  return { realm, type, roll, rollMin: row.rollMin, rollMax: row.rollMax, ...row.results[type] };
};

const clearCache = () => cache.clear();

module.exports = {
  REALMS,
  SPELL_TYPES,
  findModifiers,
  findSpellFailureResult,
  clearCache,
};
