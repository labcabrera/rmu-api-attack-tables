/** Every severity of a critical type: rulebook content, so it needs Core Law access. */
export class GetCriticalTableQuery {
  constructor(
    public readonly type: string,
    public readonly roles: string[],
  ) {}
}
