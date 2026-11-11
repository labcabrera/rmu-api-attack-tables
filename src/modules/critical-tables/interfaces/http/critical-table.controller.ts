import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { readBoolean, readInt } from '../../../shared/domain/services/table-params.js';
import { JwtAuthGuard } from '../../../shared/infrastructure/security/jwt-auth.guard.js';
import { ApiErrors } from '../../../shared/interfaces/http/api-errors.decorator.js';
import type { AuthenticatedUser } from '../../../shared/interfaces/http/authenticated-request.js';
import { CurrentUser } from '../../../shared/interfaces/http/current-user.decorator.js';
import { GetCriticalLocationsQuery } from '../../application/cqrs/queries/get-critical-locations.query.js';
import { GetCriticalTableQuery } from '../../application/cqrs/queries/get-critical-table.query.js';
import { ListCriticalTypesQuery } from '../../application/cqrs/queries/list-critical-types.query.js';
import { LookupCriticalTableQuery } from '../../application/cqrs/queries/lookup-critical-table.query.js';
import type { CriticalEntry, CriticalTable } from '../../domain/entities/critical-table.js';
import type { CriticalLocationRange } from '../../domain/services/critical-locations.js';
import {
  CriticalEntryDto,
  CriticalLocationRangeDto,
  CriticalTableDto,
  toCriticalEntryDto,
  toCriticalLocationRangeDto,
} from './dto/critical-table.dto.js';

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

  // Before ':type', which would take 'locations' as a type.
  @Get('locations')
  @ApiOperation({
    operationId: 'getCriticalLocations',
    summary: 'Get the roll → location map of the critical tables',
    description: 'Every critical table shares it (Section 7.2), so the location of a roll is known before the critical type.',
  })
  @ApiOkResponse({ type: [CriticalLocationRangeDto], description: 'Success' })
  @ApiErrors()
  async locations(): Promise<CriticalLocationRangeDto[]> {
    const ranges = await this.queryBus.execute<GetCriticalLocationsQuery, CriticalLocationRange[]>(new GetCriticalLocationsQuery());
    return ranges.map(toCriticalLocationRangeDto);
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
  @ApiQuery({
    name: 'natural',
    required: false,
    type: Boolean,
    description: 'The roll is the unmodified one: a 66 keeps the special 66 row even with a location (Section 9.7)',
  })
  @ApiOkResponse({ type: CriticalEntryDto, description: 'Success' })
  @ApiErrors({ 400: 'Invalid critical type, severity, roll (1-100) or natural', 404: 'Critical table not found' })
  async lookup(
    @Param('type') type: string,
    @Param('severity') severity: string,
    @Param('roll') roll: string,
    @Query('location') location?: string,
    @Query('natural') natural?: string,
  ): Promise<CriticalEntryDto> {
    const query = new LookupCriticalTableQuery(
      type,
      severity,
      readInt(roll, 'roll', 1, 100),
      location || undefined,
      readBoolean(natural, 'natural'),
    );
    const entry = await this.queryBus.execute<LookupCriticalTableQuery, CriticalEntry>(query);
    return toCriticalEntryDto(entry);
  }
}
