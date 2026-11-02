import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundError } from '../../../../shared/domain/errors/errors.js';
import type { SpellcastingModifiers } from '../../../domain/entities/spell-casting-tables.js';
import { SPELL_CASTING_TABLES_REPOSITORY, type SpellCastingTablesRepository } from '../../ports/spell-casting-tables-repository.port.js';
import { GetSpellcastingModifiersQuery } from '../queries/get-spellcasting-modifiers.query.js';

@QueryHandler(GetSpellcastingModifiersQuery)
export class GetSpellcastingModifiersHandler implements IQueryHandler<GetSpellcastingModifiersQuery, SpellcastingModifiers> {
  constructor(@Inject(SPELL_CASTING_TABLES_REPOSITORY) private readonly repository: SpellCastingTablesRepository) {}

  async execute(): Promise<SpellcastingModifiers> {
    const modifiers = await this.repository.findModifiers();
    if (!modifiers) throw new NotFoundError('Spell casting table', 'modifiers');
    return modifiers;
  }
}
