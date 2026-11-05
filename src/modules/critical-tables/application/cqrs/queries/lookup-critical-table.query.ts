export class LookupCriticalTableQuery {
  constructor(
    public readonly type: string,
    public readonly severity: string,
    public readonly roll: number,
    public readonly location?: string,
    /** The roll is the unmodified one: a 66 keeps the 66 row even with a location. */
    public readonly natural = false,
  ) {}
}
