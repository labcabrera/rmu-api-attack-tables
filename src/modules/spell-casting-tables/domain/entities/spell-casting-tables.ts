/** Realms with a spell failure table (Spell Law tables 4-4a/b/c). */
export const REALMS = ['channeling', 'essence', 'mentalism'] as const;
export type Realm = (typeof REALMS)[number];

/** Spell types, one result column each. */
export const SPELL_TYPES = ['elemental', 'force', 'informational', 'utility'] as const;
export type SpellType = (typeof SPELL_TYPES)[number];

/** Spell Law table 4-2 (SCR modifiers per realm column), served as the file has it. */
export type SpellcastingModifiers = Record<string, unknown>;

/** A failure result (`text`, `pp`...), as the file has it. */
export type SpellFailureResult = Record<string, unknown>;

/** A roll band (`rollMax` null is open) with a result per spell type. */
export interface SpellFailureRow {
  rollMin: number;
  rollMax: number | null;
  results: Partial<Record<SpellType, SpellFailureResult>>;
}

export interface SpellFailureTable {
  realm: Realm;
  rows: SpellFailureRow[];
}

/** The result of a failure roll, with its band. */
export type SpellFailureLookup = {
  realm: Realm;
  type: SpellType;
  roll: number;
  rollMin: number;
  rollMax: number | null;
} & SpellFailureResult;
