import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundError } from '../../../../shared/domain/errors/errors.js';
import { checkTableId } from '../../../../shared/domain/services/table-params.js';
import type { AttackResult } from '../../../domain/entities/attack-table.js';
import { findAttackRow } from '../../../domain/services/attack-table.parser.js';
import { ATTACK_TABLE_REPOSITORY, type AttackTableRepository } from '../../ports/attack-table-repository.port.js';
import { LookupAttackTableQuery } from '../queries/lookup-attack-table.query.js';

@QueryHandler(LookupAttackTableQuery)
export class LookupAttackTableHandler implements IQueryHandler<LookupAttackTableQuery, AttackResult> {
  constructor(@Inject(ATTACK_TABLE_REPOSITORY) private readonly repository: AttackTableRepository) {}

  async execute(query: LookupAttackTableQuery): Promise<AttackResult> {
    checkTableId(query.id, 'attack table');
    const table = await this.repository.findById(query.id);
    if (!table) throw new NotFoundError('Attack table', query.id);
    const row = findAttackRow(table, query.roll);
    if (!row) throw new NotFoundError('Attack result for roll', query.roll);
    return row.results[query.armorType - 1];
  }
}
