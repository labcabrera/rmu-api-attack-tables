import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { checkCoreLawAccess } from '../../../../shared/domain/services/core-law-access.js';
import { checkTableId } from '../../../../shared/domain/services/table-params.js';
import type { AttackTable } from '../../../domain/entities/attack-table.js';
import { ATTACK_TABLE_REPOSITORY, type AttackTableRepository } from '../../ports/attack-table-repository.port.js';
import { GetAttackTableQuery } from '../queries/get-attack-table.query.js';

@QueryHandler(GetAttackTableQuery)
export class GetAttackTableHandler implements IQueryHandler<GetAttackTableQuery, AttackTable> {
  constructor(@Inject(ATTACK_TABLE_REPOSITORY) private readonly repository: AttackTableRepository) {}

  async execute(query: GetAttackTableQuery): Promise<AttackTable> {
    checkCoreLawAccess(query.roles);
    checkTableId(query.id, 'attack table');
    const table = await this.repository.findById(query.id);
    if (!table) throw new NotFoundError('Attack table', query.id);
    return table;
  }
}
