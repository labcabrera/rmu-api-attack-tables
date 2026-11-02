import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { readInt } from '../../../shared/domain/services/table-params.js';
import { JwtAuthGuard } from '../../../shared/infrastructure/security/jwt-auth.guard.js';
import { ApiErrors } from '../../../shared/interfaces/http/api-errors.decorator.js';
import type { AuthenticatedUser } from '../../../shared/interfaces/http/authenticated-request.js';
import { CurrentUser } from '../../../shared/interfaces/http/current-user.decorator.js';
import { GetAttackTableQuery } from '../../application/cqrs/queries/get-attack-table.query.js';
import { ListAttackTablesQuery } from '../../application/cqrs/queries/list-attack-tables.query.js';
import { LookupAttackTableQuery } from '../../application/cqrs/queries/lookup-attack-table.query.js';
import { ARMOR_TYPES, type AttackResult, type AttackTable, MAX_ATTACK_ROLL } from '../../domain/entities/attack-table.js';
import { AttackLookupDto, AttackTableDto } from './dto/attack-table.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('v1/attack-tables')
@ApiTags('Attack tables')
export class AttackTableController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('')
  @ApiOperation({ operationId: 'listAttackTables', summary: 'List the attack table ids', description: 'Sorted; Medium tables only.' })
  @ApiOkResponse({ type: [String], description: 'Success' })
  @ApiErrors()
  list(): Promise<string[]> {
    return this.queryBus.execute<ListAttackTablesQuery, string[]>(new ListAttackTablesQuery());
  }

  @Get(':tableId')
  @ApiOperation({
    operationId: 'getAttackTable',
    summary: 'Get a whole attack table',
    description: 'Every row with its ten armor type cells, parsed. Requires Core Law access.',
  })
  @ApiOkResponse({ type: AttackTableDto, description: 'Success' })
  @ApiErrors({ 400: 'Invalid table id', 403: 'The user has no Core Law access', 404: 'Attack table not found' })
  async getTable(@Param('tableId') tableId: string, @CurrentUser() user: AuthenticatedUser): Promise<AttackTableDto> {
    const table = await this.queryBus.execute<GetAttackTableQuery, AttackTable>(new GetAttackTableQuery(tableId, user.roles));
    return AttackTableDto.fromEntity(table);
  }

  @Get(':tableId/:armorType/:roll')
  @ApiOperation({
    operationId: 'lookupAttackTable',
    summary: 'Get the result of an attack roll',
    description: 'Medium table (spec 033): the caller applies the attack size. A roll above the top band reads the top row.',
  })
  @ApiOkResponse({ type: AttackLookupDto, description: 'Success' })
  @ApiErrors({ 400: 'Invalid table id, armor type (1-10) or roll (1-175)', 404: 'Attack table not found' })
  async lookup(
    @Param('tableId') tableId: string,
    @Param('armorType') armorType: string,
    @Param('roll') roll: string,
  ): Promise<AttackLookupDto> {
    const query = new LookupAttackTableQuery(
      tableId,
      readInt(armorType, 'armor type', 1, ARMOR_TYPES),
      readInt(roll, 'roll', 1, MAX_ATTACK_ROLL),
    );
    const result = await this.queryBus.execute<LookupAttackTableQuery, AttackResult>(query);
    return AttackLookupDto.fromEntity(result);
  }
}
