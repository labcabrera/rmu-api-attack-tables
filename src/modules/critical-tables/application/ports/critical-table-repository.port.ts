import type { CriticalEntry, CriticalSeverity } from '../../domain/entities/critical-table.js';

export const CRITICAL_TABLE_REPOSITORY = Symbol('CriticalTableRepository');

/** The critical tables, one JSON file per type and severity. */
export interface CriticalTableRepository {
  /** Types with at least one severity, sorted. */
  listTypes(): Promise<string[]>;
  findSeverity(type: string, severity: CriticalSeverity): Promise<CriticalEntry[] | null>;
}
