import type { FumbleTable } from '../../domain/entities/fumble-table.js';

export const FUMBLE_TABLE_REPOSITORY = Symbol('FumbleTableRepository');

/** The fumble tables, one JSON file per column. */
export interface FumbleTableRepository {
  /** Ids of every table, sorted. */
  list(): Promise<string[]>;
  findById(id: string): Promise<FumbleTable | null>;
}
