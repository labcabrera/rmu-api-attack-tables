import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FUMBLE_TABLE_REPOSITORY, type FumbleTableRepository } from '../../ports/fumble-table-repository.port.js';
import { ListFumbleTablesQuery } from '../queries/list-fumble-tables.query.js';

@QueryHandler(ListFumbleTablesQuery)
export class ListFumbleTablesHandler implements IQueryHandler<ListFumbleTablesQuery, string[]> {
  constructor(@Inject(FUMBLE_TABLE_REPOSITORY) private readonly repository: FumbleTableRepository) {}

  async execute(): Promise<string[]> {
    return await this.repository.list();
  }
}
