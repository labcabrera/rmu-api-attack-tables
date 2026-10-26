const fs = require('fs');
const path = require('path');

// Tables shipped with the image (tracked in this repository).
const BUNDLED_DIR = path.resolve(__dirname, '../../tables');

// RMU_ATTACK_TABLES_DIR points to a folder with one subfolder per kind. Two layouts are accepted:
//   <dir>/attack, <dir>/critical, <dir>/fumble                     (this repo's tables/)
//   <dir>/attack-tables, <dir>/critical-tables, <dir>/fumble-tables (workspace data/core-law)
// A file missing from the configured folder falls back to the bundled one.
const tablesDir = () => {
  const value = process.env.RMU_ATTACK_TABLES_DIR;
  return value && value.trim() !== '' ? path.resolve(value.trim()) : BUNDLED_DIR;
};

const candidateDirs = (kind) => {
  const root = tablesDir();
  const dirs = [path.join(root, kind), path.join(root, `${kind}-tables`)];
  if (root !== BUNDLED_DIR) {
    dirs.push(path.join(BUNDLED_DIR, kind));
  }
  return dirs;
};

/**
 * Path of a table file of the given kind (attack, critical, fumble). Returns the first existing
 * candidate, or the first candidate when none exists so the caller reports it as not found.
 */
const resolveTableFile = (kind, fileName) => {
  const candidates = candidateDirs(kind).map((dir) => path.join(dir, fileName));
  return candidates.find((file) => fs.existsSync(file)) || candidates[0];
};

module.exports = {
  BUNDLED_DIR,
  tablesDir,
  candidateDirs,
  resolveTableFile,
};
