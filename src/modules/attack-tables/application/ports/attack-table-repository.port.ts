import type { AttackTable } from '../../domain/entities/attack-table.js';

export const ATTACK_TABLE_REPOSITORY = Symbol('AttackTableRepository');

/** The Medium attack tables, one CSV per table id. */
export interface AttackTableRepository {
  /** Ids of every table, sorted. */
  list(): Promise<string[]>;
  findById(id: string): Promise<AttackTable | null>;
}
