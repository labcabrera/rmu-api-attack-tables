import { Injectable } from '@nestjs/common';
import { TablePaths } from '../../../shared/infrastructure/files/table-paths.js';
import type { SpellCastingTablesRepository } from '../../application/ports/spell-casting-tables-repository.port.js';
import type { Realm, SpellcastingModifiers, SpellFailureRow, SpellFailureTable } from '../../domain/entities/spell-casting-tables.js';

/** `spellcasting/modifiers.json` and `spell-failure/<realm>.json` in the tables folders (not bundled). */
@Injectable()
export class FileSpellCastingTablesRepository implements SpellCastingTablesRepository {
  constructor(private readonly paths: TablePaths) {}

  findModifiers(): Promise<SpellcastingModifiers | null> {
    return Promise.resolve(this.paths.readJson<SpellcastingModifiers>('spellcasting', 'modifiers.json'));
  }

  findFailureTable(realm: Realm): Promise<SpellFailureTable | null> {
    const rows = this.paths.readJson<SpellFailureRow[]>('spell-failure', `${realm}.json`);
    return Promise.resolve(rows ? { realm, rows } : null);
  }
}
