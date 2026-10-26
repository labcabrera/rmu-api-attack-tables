import { Injectable } from '@nestjs/common';
import { TablePaths } from '../../../shared/infrastructure/files/table-paths.js';
import type { CriticalTableRepository } from '../../application/ports/critical-table-repository.port.js';
import { CRITICAL_SEVERITIES, CRITICAL_TYPE_ID, type CriticalEntry, type CriticalSeverity } from '../../domain/entities/critical-table.js';

const FILE_NAME = /^(.+)-([A-E])$/;

/** `critical/<type>-<severity>.json` in the tables folders. */
@Injectable()
export class FileCriticalTableRepository implements CriticalTableRepository {
  constructor(private readonly paths: TablePaths) {}

  listTypes(): Promise<string[]> {
    const types = this.paths
      .list('critical', '.json')
      .map(name => FILE_NAME.exec(name))
      .filter((match): match is RegExpExecArray => !!match && CRITICAL_SEVERITIES.includes(match[2] as CriticalSeverity))
      .map(match => match[1])
      .filter(type => CRITICAL_TYPE_ID.test(type));
    return Promise.resolve([...new Set(types)].sort());
  }

  findSeverity(type: string, severity: CriticalSeverity): Promise<CriticalEntry[] | null> {
    return Promise.resolve(this.paths.readJson<CriticalEntry[]>('critical', `${type}-${severity}.json`));
  }
}
