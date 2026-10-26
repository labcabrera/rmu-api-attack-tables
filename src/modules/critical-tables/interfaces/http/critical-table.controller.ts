import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { readInt } from '../../../shared/domain/services/table-params.js';
import { JwtAuthGuard } from '../../../shared/infrastructure/security/jwt-auth.guard.js';
import { ApiErrors } from '../../../shared/interfaces/http/api-errors.decorator.js';
import type { AuthenticatedUser } from '../../../shared/interfaces/http/authenticated-request.js';
import { CurrentUser } from '../../../shared/interfaces/http/current-user.decorator.js';
import { GetCriticalTableQuery } from '../../application/cqrs/queries/get-critical-table.query.js';
import { ListCriticalTypesQuery } from '../../application/cqrs/queries/list-critical-types.query.js';
import { LookupCriticalTableQuery } from '../../application/cqrs/queries/lookup-critical-table.query.js';
import type { CriticalEntry, CriticalTable } from '../../domain/entities/critical-table.js';
import { CriticalEntryDto, CriticalTableDto, toCriticalEntryDto } from './dto/critical-table.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('v1/critical-tables')
@ApiTags('Critical tables')
export class CriticalTableController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('')
  @ApiOperation({ operationId: 'listCriticalTypes', summary: 'List the critical types', description: 'Sorted.' })
  @ApiOkResponse({ type: [String], description: 'Success' })
  @ApiErrors()
  list(): Promise<string[]> {
    return this.queryBus.execute<ListCriticalTypesQuery, string[]>(new ListCriticalTypesQuery());
  }

  @Get(':type')
  @ApiOperation({
    operationId: 'getCriticalTable',
    summary: 'Get every severity of a critical type',
    description: 'The rows of severities A to E, as the tables have them. Requires Core Law access.',
  })
  @ApiOkResponse({ type: CriticalTableDto, description: 'Success' })
  @ApiErrors({ 400: 'Invalid critical type', 403: 'The user has no Core Law access', 404: 'Critical type not found' })
  async getTable(@Param('type') type: string, @CurrentUser() user: AuthenticatedUser): Promise<CriticalTableDto> {
    const table = await this.queryBus.execute<GetCriticalTableQuery, CriticalTable>(new GetCriticalTableQuery(type, user.roles));
    return CriticalTableDto.fromEntity(table);
  }

  @Get(':type/:severity/:roll')
  @ApiOperation({
    operationId: 'lookupCriticalTable',
    summary: 'Get the result of a critical roll',
    description: 'Severity A-E, or Z (Section 9.8). With a location, the first row of that location at or below the roll.',
  })
  @ApiQuery({ name: 'location', required: false, type: String, description: 'head, chest, abdomen, arm or leg' })
  @ApiOkResponse({ type: CriticalEntryDto, description: 'Success' })
  @ApiErrors({ 400: 'Invalid critical type, severity or roll (1-100)', 404: 'Critical table not found' })
  async lookup(
    @Param('type') type: string,
    @Param('severity') severity: string,
    @Param('roll') roll: string,
    @Query('location') location?: string,
  ): Promise<CriticalEntryDto> {
    const query = new LookupCriticalTableQuery(type, severity, readInt(roll, 'roll', 1, 100), location || undefined);
    const entry = await this.queryBus.execute<LookupCriticalTableQuery, CriticalEntry>(query);
    return toCriticalEntryDto(entry);
  }
}
