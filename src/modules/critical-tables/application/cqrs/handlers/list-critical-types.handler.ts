import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CRITICAL_TABLE_REPOSITORY, type CriticalTableRepository } from '../../ports/critical-table-repository.port.js';
import { ListCriticalTypesQuery } from '../queries/list-critical-types.query.js';

@QueryHandler(ListCriticalTypesQuery)
export class ListCriticalTypesHandler implements IQueryHandler<ListCriticalTypesQuery, string[]> {
  constructor(@Inject(CRITICAL_TABLE_REPOSITORY) private readonly repository: CriticalTableRepository) {}

  async execute(): Promise<string[]> {
    return await this.repository.listTypes();
  }
}
