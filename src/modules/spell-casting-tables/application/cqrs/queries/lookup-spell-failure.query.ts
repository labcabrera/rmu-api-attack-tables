export class LookupSpellFailureQuery {
  constructor(
    public readonly realm: string,
    public readonly type: string,
    public readonly roll: number,
  ) {}
}
