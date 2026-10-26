import { Injectable } from '@nestjs/common';
import { TABLE_ID } from '../../../shared/domain/services/table-params.js';
import { TablePaths } from '../../../shared/infrastructure/files/table-paths.js';
import type { FumbleTableRepository } from '../../application/ports/fumble-table-repository.port.js';
import type { FumbleEntry, FumbleTable } from '../../domain/entities/fumble-table.js';

/** `fumble/<id>.json` in the tables folders. */
@Injectable()
export class FileFumbleTableRepository implements FumbleTableRepository {
  constructor(private readonly paths: TablePaths) {}

  list(): Promise<string[]> {
    return Promise.resolve(this.paths.list('fumble', '.json').filter(id => TABLE_ID.test(id)));
  }

  findById(id: string): Promise<FumbleTable | null> {
    const entries = this.paths.readJson<FumbleEntry[]>('fumble', `${id}.json`);
    return Promise.resolve(entries ? { id, entries } : null);
  }
}
