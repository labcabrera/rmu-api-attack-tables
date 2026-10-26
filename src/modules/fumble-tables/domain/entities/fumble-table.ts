/** A row of a fumble table, served as the file has it (`effects` are not interpreted here). */
export interface FumbleEntry {
  rollMin: number;
  rollMax: number;
  text: string;
  effects?: Record<string, unknown>[];
}

/** A column of the Core Law fumble tables (melee-one-hand, bows...). */
export interface FumbleTable {
  id: string;
  entries: FumbleEntry[];
}
