import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { readInt } from '../../../shared/domain/services/table-params.js';
import { JwtAuthGuard } from '../../../shared/infrastructure/security/jwt-auth.guard.js';
import { ApiErrors } from '../../../shared/interfaces/http/api-errors.decorator.js';
import type { AuthenticatedUser } from '../../../shared/interfaces/http/authenticated-request.js';
import { CurrentUser } from '../../../shared/interfaces/http/current-user.decorator.js';
import { GetFumbleTableQuery } from '../../application/cqrs/queries/get-fumble-table.query.js';
import { ListFumbleTablesQuery } from '../../application/cqrs/queries/list-fumble-tables.query.js';
import { LookupFumbleTableQuery } from '../../application/cqrs/queries/lookup-fumble-table.query.js';
import type { FumbleEntry, FumbleTable } from '../../domain/entities/fumble-table.js';
import { FumbleEntryDto, FumbleTableDto, toFumbleEntryDto } from './dto/fumble-table.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('v1/fumble-tables')
@ApiTags('Fumble tables')
export class FumbleTableController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('')
  @ApiOperation({ operationId: 'listFumbleTables', summary: 'List the fumble table ids', description: 'Sorted.' })
  @ApiOkResponse({ type: [String], description: 'Success' })
  @ApiErrors()
  list(): Promise<string[]> {
    return this.queryBus.execute<ListFumbleTablesQuery, string[]>(new ListFumbleTablesQuery());
  }

  @Get(':tableId')
  @ApiOperation({
    operationId: 'getFumbleTable',
    summary: 'Get a whole fumble table',
    description: 'Every row, as the table has it. Requires Core Law access.',
  })
  @ApiOkResponse({ type: FumbleTableDto, description: 'Success' })
  @ApiErrors({ 400: 'Invalid table id', 403: 'The user has no Core Law access', 404: 'Fumble table not found' })
  async getTable(@Param('tableId') tableId: string, @CurrentUser() user: AuthenticatedUser): Promise<FumbleTableDto> {
    const table = await this.queryBus.execute<GetFumbleTableQuery, FumbleTable>(new GetFumbleTableQuery(tableId, user.roles));
    return FumbleTableDto.fromEntity(table);
  }

  @Get(':tableId/:roll')
  @ApiOperation({ operationId: 'lookupFumbleTable', summary: 'Get the result of a fumble roll' })
  @ApiOkResponse({ type: FumbleEntryDto, description: 'Success' })
  @ApiErrors({ 400: 'Invalid table id or roll (1-100)', 404: 'Fumble table not found' })
  async lookup(@Param('tableId') tableId: string, @Param('roll') roll: string): Promise<FumbleEntryDto> {
    const query = new LookupFumbleTableQuery(tableId, readInt(roll, 'roll', 1, 100));
    const entry = await this.queryBus.execute<LookupFumbleTableQuery, FumbleEntry>(query);
    return toFumbleEntryDto(entry);
  }
}
