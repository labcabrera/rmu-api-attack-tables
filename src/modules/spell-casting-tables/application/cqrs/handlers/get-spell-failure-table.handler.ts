import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { checkCoreLawAccess } from '../../../../shared/domain/services/core-law-access.js';
import type { SpellFailureTable } from '../../../domain/entities/spell-casting-tables.js';
import { readRealm } from '../../../domain/services/spell-casting-params.js';
import { SPELL_CASTING_TABLES_REPOSITORY, type SpellCastingTablesRepository } from '../../ports/spell-casting-tables-repository.port.js';
import { GetSpellFailureTableQuery } from '../queries/get-spell-failure-table.query.js';

@QueryHandler(GetSpellFailureTableQuery)
export class GetSpellFailureTableHandler implements IQueryHandler<GetSpellFailureTableQuery, SpellFailureTable> {
  constructor(@Inject(SPELL_CASTING_TABLES_REPOSITORY) private readonly repository: SpellCastingTablesRepository) {}

  async execute(query: GetSpellFailureTableQuery): Promise<SpellFailureTable> {
    checkCoreLawAccess(query.roles);
    const realm = readRealm(query.realm);
    const table = await this.repository.findFailureTable(realm);
    if (!table) throw new NotFoundError('Spell failure table', realm);
    return table;
  }
}
