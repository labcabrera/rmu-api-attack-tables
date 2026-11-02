export class LookupCriticalTableQuery {
  constructor(
    public readonly type: string,
    public readonly severity: string,
    public readonly roll: number,
    public readonly location?: string,
  ) {}
}
