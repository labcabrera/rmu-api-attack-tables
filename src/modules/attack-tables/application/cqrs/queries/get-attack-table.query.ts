/** The whole table: rulebook content, so it needs Core Law access. */
export class GetAttackTableQuery {
  constructor(
    public readonly id: string,
    public readonly roles: string[],
  ) {}
}
