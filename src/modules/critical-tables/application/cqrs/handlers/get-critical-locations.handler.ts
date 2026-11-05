import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DomainError, NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { CRITICAL_SEVERITIES } from '../../../domain/entities/critical-table.js';
import { type CriticalLocationRange, sameLocationMap, toLocationMap } from '../../../domain/services/critical-locations.js';
import { CRITICAL_TABLE_REPOSITORY, type CriticalTableRepository } from '../../ports/critical-table-repository.port.js';
import { GetCriticalLocationsQuery } from '../queries/get-critical-locations.query.js';

/**
 * The roll → location map, read from every critical table (types and severities). They all share it, so a location is
 * known before the critical type; a table that differs is a data error. The tables never change while the API runs,
 * so the map is read once.
 */
@QueryHandler(GetCriticalLocationsQuery)
export class GetCriticalLocationsHandler implements IQueryHandler<GetCriticalLocationsQuery, CriticalLocationRange[]> {
  private cached?: CriticalLocationRange[];

  constructor(@Inject(CRITICAL_TABLE_REPOSITORY) private readonly repository: CriticalTableRepository) {}

  async execute(): Promise<CriticalLocationRange[]> {
    if (!this.cached) this.cached = await this.read();
    return this.cached;
  }

  private async read(): Promise<CriticalLocationRange[]> {
    let common: CriticalLocationRange[] | undefined;
    let reference = '';
    for (const type of await this.repository.listTypes()) {
      for (const severity of CRITICAL_SEVERITIES) {
        const entries = await this.repository.findSeverity(type, severity);
        if (!entries) continue;
        const map = toLocationMap(entries);
        if (!common) {
          common = map;
          reference = `${type}-${severity}`;
        } else if (!sameLocationMap(common, map)) {
          throw new DomainError(
            `Critical table ${type}-${severity} has a roll → location map different from ${reference}`,
            500,
            'critical-locations-mismatch',
          );
        }
      }
    }
    if (!common) throw new NotFoundError('Critical tables', 'locations');
    return common;
  }
}
