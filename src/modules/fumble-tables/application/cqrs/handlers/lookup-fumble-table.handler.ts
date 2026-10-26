import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DomainError, NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { checkTableId } from '../../../../shared/domain/services/table-params.js';
import type { FumbleEntry } from '../../../domain/entities/fumble-table.js';
import { FUMBLE_TABLE_REPOSITORY, type FumbleTableRepository } from '../../ports/fumble-table-repository.port.js';
import { LookupFumbleTableQuery } from '../queries/lookup-fumble-table.query.js';

@QueryHandler(LookupFumbleTableQuery)
export class LookupFumbleTableHandler implements IQueryHandler<LookupFumbleTableQuery, FumbleEntry> {
  constructor(@Inject(FUMBLE_TABLE_REPOSITORY) private readonly repository: FumbleTableRepository) {}

  async execute(query: LookupFumbleTableQuery): Promise<FumbleEntry> {
    checkTableId(query.id, 'fumble table');
    const table = await this.repository.findById(query.id);
    if (!table) throw new NotFoundError('Fumble table', query.id);
    const entry = table.entries.find(item => query.roll >= item.rollMin && query.roll <= item.rollMax);
    // Every table covers 1-100 (tested): a gap is broken data, not a bad request.
    if (!entry) throw new DomainError(`Fumble table ${query.id} has no row for ${query.roll}`, 500, 'invalid-table-data');
    return entry;
  }
}
