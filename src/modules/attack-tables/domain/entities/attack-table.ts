/** Armor types of the columns (1 None ... 10 Plate). */
export const ARMOR_TYPES = 10;
/** Highest attack roll the tables accept. */
export const MAX_ATTACK_ROLL = 175;

/** A cell of an attack table: the hits and, when there is one, the critical (`16DP`: 16 hits, a D Puncture critical). */
export interface AttackResult {
  armorType: number;
  text: string;
  damage: number;
  criticalType: string | null;
  criticalSeverity: string | null;
}

/** A roll band (bounds included) with its cell for each armor type, AT 1 to 10. */
export interface AttackTableRow {
  rollMin: number;
  rollMax: number;
  results: AttackResult[];
}

/** A Medium attack table (spec 033), with its rows in the order of the file: from the highest band down. */
export interface AttackTable {
  id: string;
  rows: AttackTableRow[];
}
