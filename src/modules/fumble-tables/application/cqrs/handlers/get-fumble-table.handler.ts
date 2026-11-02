import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { checkCoreLawAccess } from '../../../../shared/domain/services/core-law-access.js';
import { checkTableId } from '../../../../shared/domain/services/table-params.js';
import type { FumbleTable } from '../../../domain/entities/fumble-table.js';
import { FUMBLE_TABLE_REPOSITORY, type FumbleTableRepository } from '../../ports/fumble-table-repository.port.js';
import { GetFumbleTableQuery } from '../queries/get-fumble-table.query.js';

@QueryHandler(GetFumbleTableQuery)
export class GetFumbleTableHandler implements IQueryHandler<GetFumbleTableQuery, FumbleTable> {
  constructor(@Inject(FUMBLE_TABLE_REPOSITORY) private readonly repository: FumbleTableRepository) {}

  async execute(query: GetFumbleTableQuery): Promise<FumbleTable> {
    checkCoreLawAccess(query.roles);
    checkTableId(query.id, 'fumble table');
    const table = await this.repository.findById(query.id);
    if (!table) throw new NotFoundError('Fumble table', query.id);
    return table;
  }
}
