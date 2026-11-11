import type { CriticalEntry } from '../entities/critical-table.js';

/** A band of critical rolls and the location it hits. */
export interface CriticalLocationRange {
  from: number;
  to: number;
  location: string | null;
}

/** The bands of a critical table and their locations, one per row. */
export const toLocationMap = (entries: CriticalEntry[]): CriticalLocationRange[] =>
  entries.map(entry => ({ from: entry.rollMin, to: entry.rollMax, location: entry.location }));

export const sameLocationMap = (a: CriticalLocationRange[], b: CriticalLocationRange[]): boolean =>
  a.length === b.length && a.every((range, i) => range.from === b[i].from && range.to === b[i].to && range.location === b[i].location);
