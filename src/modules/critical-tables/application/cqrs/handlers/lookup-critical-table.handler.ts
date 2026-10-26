import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundError, ValidationError } from '../../../../shared/domain/errors/errors.js';
import { checkTableId } from '../../../../shared/domain/services/table-params.js';
import { CRITICAL_TYPE_ID, type CriticalEntry, LOOKUP_SEVERITIES, type LookupSeverity } from '../../../domain/entities/critical-table.js';
import { findCriticalEntry } from '../../../domain/services/critical-lookup.js';
import { CRITICAL_TABLE_REPOSITORY, type CriticalTableRepository } from '../../ports/critical-table-repository.port.js';
import { LookupCriticalTableQuery } from '../queries/lookup-critical-table.query.js';

@QueryHandler(LookupCriticalTableQuery)
export class LookupCriticalTableHandler implements IQueryHandler<LookupCriticalTableQuery, CriticalEntry> {
  constructor(@Inject(CRITICAL_TABLE_REPOSITORY) private readonly repository: CriticalTableRepository) {}

  async execute(query: LookupCriticalTableQuery): Promise<CriticalEntry> {
    checkTableId(query.type, 'critical table', CRITICAL_TYPE_ID);
    if (!LOOKUP_SEVERITIES.includes(query.severity as LookupSeverity)) {
      throw new ValidationError(`Invalid critical severity '${query.severity}' (${LOOKUP_SEVERITIES.join(', ')})`, 'invalid-severity');
    }
    const severity = query.severity as LookupSeverity;
    const entries = await this.repository.findSeverity(query.type, severity === 'Z' ? 'A' : severity);
    if (!entries) throw new NotFoundError('Critical table', `${query.type}-${severity}`);
    return findCriticalEntry(entries, severity, query.roll, query.location);
  }
}
