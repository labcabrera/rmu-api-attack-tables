import type { CriticalEntry, LookupSeverity } from '../entities/critical-table.js';

/** What a lookup gives when no row matches the location. */
export const NO_EFFECT: CriticalEntry = {
  rollMin: 0,
  rollMax: 0,
  dmg: 0,
  effects: [],
  location: null,
  message: 'Critical has no effect using the given location',
};

const entryAt = (entries: CriticalEntry[], roll: number, location: string | null | undefined): CriticalEntry | null => {
  for (const entry of entries) {
    if (roll >= entry.rollMin && roll <= entry.rollMax) {
      if (!location) return entry;
      // 66 is the special result of the table, which never moves to the attack location.
      if (entry.location === location && roll !== 66) return entry;
    }
  }
  return null;
};

/**
 * The row of a critical roll. With a location, the first row of that location at or below the roll. `entries` are the
 * rows of the severity, or of A for Z: a Z critical takes the A row just below the one the roll falls in (two below
 * on 67-…), on the same location.
 */
export const findCriticalEntry = (entries: CriticalEntry[], severity: LookupSeverity, roll: number, location?: string): CriticalEntry => {
  let from = roll;
  let where: string | null | undefined = location;
  if (severity === 'Z') {
    const rolled = entryAt(entries, roll, null);
    from = rolled ? (rolled.rollMin !== 67 ? rolled.rollMin - 1 : roll - 2) : roll;
    where = rolled?.location ?? null;
  }
  for (let value = from; value >= 1; value--) {
    const entry = entryAt(entries, value, where);
    if (entry) return entry;
  }
  return NO_EFFECT;
};
