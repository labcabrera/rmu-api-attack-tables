import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ATTACK_TABLE_REPOSITORY, type AttackTableRepository } from '../../ports/attack-table-repository.port.js';
import { ListAttackTablesQuery } from '../queries/list-attack-tables.query.js';

@QueryHandler(ListAttackTablesQuery)
export class ListAttackTablesHandler implements IQueryHandler<ListAttackTablesQuery, string[]> {
  constructor(@Inject(ATTACK_TABLE_REPOSITORY) private readonly repository: AttackTableRepository) {}

  async execute(): Promise<string[]> {
    return await this.repository.list();
  }
}
