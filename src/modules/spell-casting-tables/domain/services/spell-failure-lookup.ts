import { DomainError } from '../../../shared/domain/errors/errors.js';
import type { SpellFailureLookup, SpellFailureTable, SpellType } from '../entities/spell-casting-tables.js';

/** The roll is open-ended and carries the failure modifier: anything below 1 reads the first row. */
export const findSpellFailure = (table: SpellFailureTable, type: SpellType, roll: number): SpellFailureLookup => {
  const value = Math.max(1, roll);
  const row = table.rows.find(item => value >= item.rollMin && (item.rollMax === null || value <= item.rollMax));
  const result = row?.results[type];
  if (!row || !result) {
    throw new DomainError(`Invalid spell failure table data (${table.realm})`, 500, 'invalid-table-data');
  }
  return { realm: table.realm, type, roll, rollMin: row.rollMin, rollMax: row.rollMax, ...result };
};
