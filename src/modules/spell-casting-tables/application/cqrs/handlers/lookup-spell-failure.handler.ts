import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundError } from '../../../../shared/domain/errors/errors.js';
import type { SpellFailureLookup } from '../../../domain/entities/spell-casting-tables.js';
import { readRealm, readSpellType } from '../../../domain/services/spell-casting-params.js';
import { findSpellFailure } from '../../../domain/services/spell-failure-lookup.js';
import { SPELL_CASTING_TABLES_REPOSITORY, type SpellCastingTablesRepository } from '../../ports/spell-casting-tables-repository.port.js';
import { LookupSpellFailureQuery } from '../queries/lookup-spell-failure.query.js';

@QueryHandler(LookupSpellFailureQuery)
export class LookupSpellFailureHandler implements IQueryHandler<LookupSpellFailureQuery, SpellFailureLookup> {
  constructor(@Inject(SPELL_CASTING_TABLES_REPOSITORY) private readonly repository: SpellCastingTablesRepository) {}

  async execute(query: LookupSpellFailureQuery): Promise<SpellFailureLookup> {
    const realm = readRealm(query.realm);
    const type = readSpellType(query.type);
    const table = await this.repository.findFailureTable(realm);
    if (!table) throw new NotFoundError('Spell failure table', realm);
    return findSpellFailure(table, type, query.roll);
  }
}
