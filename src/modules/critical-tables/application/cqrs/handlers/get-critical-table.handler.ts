import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { checkCoreLawAccess } from '../../../../shared/domain/services/core-law-access.js';
import { checkTableId } from '../../../../shared/domain/services/table-params.js';
import { CRITICAL_SEVERITIES, CRITICAL_TYPE_ID, type CriticalTable } from '../../../domain/entities/critical-table.js';
import { CRITICAL_TABLE_REPOSITORY, type CriticalTableRepository } from '../../ports/critical-table-repository.port.js';
import { GetCriticalTableQuery } from '../queries/get-critical-table.query.js';

@QueryHandler(GetCriticalTableQuery)
export class GetCriticalTableHandler implements IQueryHandler<GetCriticalTableQuery, CriticalTable> {
  constructor(@Inject(CRITICAL_TABLE_REPOSITORY) private readonly repository: CriticalTableRepository) {}

  async execute(query: GetCriticalTableQuery): Promise<CriticalTable> {
    checkCoreLawAccess(query.roles);
    checkTableId(query.type, 'critical table', CRITICAL_TYPE_ID);
    const table: CriticalTable = { type: query.type, severities: {} };
    for (const severity of CRITICAL_SEVERITIES) {
      const entries = await this.repository.findSeverity(query.type, severity);
      if (entries) table.severities[severity] = entries;
    }
    if (Object.keys(table.severities).length === 0) throw new NotFoundError('Critical table', query.type);
    return table;
  }
}
