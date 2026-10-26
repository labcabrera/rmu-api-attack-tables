import type { AttackResult, AttackTable, AttackTableRow } from '../entities/attack-table.js';
import { ARMOR_TYPES } from '../entities/attack-table.js';

const CRITICAL_CELL = /^(\d+)([A-Z])([A-Z])$/;

/** Reads a cell: `12` is 12 hits; `16DP` is 16 hits and a D severity critical of type P (severities go up to I). */
export const parseAttackResult = (text: string, armorType: number): AttackResult => {
  const cell = text.trim();
  const critical = CRITICAL_CELL.exec(cell);
  if (critical) {
    return { armorType, text: cell, damage: Number(critical[1]), criticalType: critical[3], criticalSeverity: critical[2] };
  }
  const damage = Number.parseInt(cell, 10);
  return { armorType, text: cell, damage: Number.isNaN(damage) ? 0 : damage, criticalType: null, criticalSeverity: null };
};

/** Parses the CSV of a table: a `roll` column with the bands (`173-175`) and the columns `at1` to `at10`. */
export const parseAttackTable = (id: string, csv: string): AttackTable => {
  const [header, ...lines] = csv
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  const columns = header.split(',');
  const rollColumn = columns.indexOf('roll');
  const atColumns = Array.from({ length: ARMOR_TYPES }, (_, i) => columns.indexOf(`at${i + 1}`));
  const rows = lines.map((line): AttackTableRow => {
    const cells = line.split(',');
    const [rollMin, rollMax] = cells[rollColumn].split('-').map(Number);
    return {
      rollMin,
      rollMax: rollMax ?? rollMin,
      results: atColumns.map((column, i) => parseAttackResult(cells[column] ?? '', i + 1)),
    };
  });
  return { id, rows };
};

/** The row of a roll; above the top band (the ball tables end at 125) the top row applies. Null below the first band. */
export const findAttackRow = (table: AttackTable, roll: number): AttackTableRow | null => {
  const band = table.rows.find(row => roll >= row.rollMin && roll <= row.rollMax);
  if (band) return band;
  const top = table.rows.reduce<AttackTableRow | null>((max, row) => (!max || row.rollMax > max.rollMax ? row : max), null);
  return top && roll > top.rollMax ? top : null;
};
