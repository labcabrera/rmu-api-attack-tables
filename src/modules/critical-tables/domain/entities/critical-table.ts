/** Severities with a file per critical type (`<type>-<severity>.json`). */
export const CRITICAL_SEVERITIES = ['A', 'B', 'C', 'D', 'E'] as const;
export type CriticalSeverity = (typeof CRITICAL_SEVERITIES)[number];

/** Severities a roll can be looked up with: Z (Section 9.8) is read from the A table. */
export const LOOKUP_SEVERITIES = [...CRITICAL_SEVERITIES, 'Z'] as const;
export type LookupSeverity = (typeof LOOKUP_SEVERITIES)[number];

/** Letter of the attack tables (K, P...) or name (acid, holy...). */
export const CRITICAL_TYPE_ID = /^[A-Za-z0-9-]+$/;

/**
 * A row of a critical table, served as the file has it: `effects` and the optional `injury` (workspace spec 013) are
 * not interpreted here.
 */
export interface CriticalEntry {
  rollMin: number;
  rollMax: number;
  dmg: number;
  location: string | null;
  message: string;
  effects?: Record<string, unknown>[];
  injury?: Record<string, unknown> | null;
}

/** Every severity of a critical type. A severity without a file is left out. */
export interface CriticalTable {
  type: string;
  severities: Partial<Record<CriticalSeverity, CriticalEntry[]>>;
}
