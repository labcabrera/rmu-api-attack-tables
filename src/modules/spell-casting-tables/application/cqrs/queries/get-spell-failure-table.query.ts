/** The whole table of a realm: rulebook content, so it needs Core Law access. */
export class GetSpellFailureTableQuery {
  constructor(
    public readonly realm: string,
    public readonly roles: string[],
  ) {}
}
