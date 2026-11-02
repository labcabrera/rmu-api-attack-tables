import { Injectable } from '@nestjs/common';
import { TABLE_ID } from '../../../shared/domain/services/table-params.js';
import { TablePaths } from '../../../shared/infrastructure/files/table-paths.js';
import type { AttackTableRepository } from '../../application/ports/attack-table-repository.port.js';
import type { AttackTable } from '../../domain/entities/attack-table.js';
import { parseAttackTable } from '../../domain/services/attack-table.parser.js';

/** `attack/<id>.csv` in the tables folders. */
@Injectable()
export class FileAttackTableRepository implements AttackTableRepository {
  constructor(private readonly paths: TablePaths) {}

  list(): Promise<string[]> {
    return Promise.resolve(this.paths.list('attack', '.csv').filter(id => TABLE_ID.test(id)));
  }

  findById(id: string): Promise<AttackTable | null> {
    return Promise.resolve(this.paths.read('attack', `${id}.csv`, text => parseAttackTable(id, text)));
  }
}
