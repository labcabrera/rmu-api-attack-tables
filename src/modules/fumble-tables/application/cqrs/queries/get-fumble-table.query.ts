/** The whole table: rulebook content, so it needs Core Law access. */
export class GetFumbleTableQuery {
  constructor(
    public readonly id: string,
    public readonly roles: string[],
  ) {}
}
