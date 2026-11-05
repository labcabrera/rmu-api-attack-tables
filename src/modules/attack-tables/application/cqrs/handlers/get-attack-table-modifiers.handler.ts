import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { checkTableId } from '../../../../shared/domain/services/table-params.js';
import type { AttackTableModifiers } from '../../../domain/entities/attack-table-modifiers.js';
import { attackTableModifiers } from '../../../domain/services/attack-table-modifiers.js';
import { ATTACK_TABLE_REPOSITORY, type AttackTableRepository } from '../../ports/attack-table-repository.port.js';
import { GetAttackTableModifiersQuery } from '../queries/get-attack-table-modifiers.query.js';

/** Disarm and subdual modifiers of an attack table (workspace spec 079, A7): numbers, open to every user like the lookup. */
@QueryHandler(GetAttackTableModifiersQuery)
export class GetAttackTableModifiersHandler implements IQueryHandler<GetAttackTableModifiersQuery, AttackTableModifiers> {
  constructor(@Inject(ATTACK_TABLE_REPOSITORY) private readonly repository: AttackTableRepository) {}

  async execute(query: GetAttackTableModifiersQuery): Promise<AttackTableModifiers> {
    checkTableId(query.id, 'attack table');
    const ids = await this.repository.list();
    if (!ids.includes(query.id)) throw new NotFoundError('Attack table', query.id);
    return attackTableModifiers(query.id);
  }
}
