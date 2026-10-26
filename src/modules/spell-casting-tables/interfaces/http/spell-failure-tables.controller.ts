import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { readInt } from '../../../shared/domain/services/table-params.js';
import { JwtAuthGuard } from '../../../shared/infrastructure/security/jwt-auth.guard.js';
import { ApiErrors } from '../../../shared/interfaces/http/api-errors.decorator.js';
import type { AuthenticatedUser } from '../../../shared/interfaces/http/authenticated-request.js';
import { CurrentUser } from '../../../shared/interfaces/http/current-user.decorator.js';
import { GetSpellFailureTableQuery } from '../../application/cqrs/queries/get-spell-failure-table.query.js';
import { LookupSpellFailureQuery } from '../../application/cqrs/queries/lookup-spell-failure.query.js';
import { REALMS, type SpellFailureLookup, type SpellFailureTable } from '../../domain/entities/spell-casting-tables.js';
import { SpellFailureTableDto } from './dto/spell-casting-tables.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('v1/spell-failure-tables')
@ApiTags('Spell casting tables')
export class SpellFailureTablesController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('')
  @ApiOperation({ operationId: 'listSpellFailureRealms', summary: 'List the realms with a spell failure table' })
  @ApiOkResponse({ type: [String], description: 'Success' })
  @ApiErrors()
  listRealms(): string[] {
    return [...REALMS];
  }

  @Get(':realm')
  @ApiOperation({
    operationId: 'getSpellFailureTable',
    summary: 'Get the whole spell failure table of a realm',
    description: 'Spell Law tables 4-4a/b/c, as the data has them. Requires Core Law access.',
  })
  @ApiOkResponse({ type: SpellFailureTableDto, description: 'Success' })
  @ApiErrors({ 400: 'Invalid realm', 403: 'The user has no Core Law access', 404: 'The table is not in the data folder' })
  async getTable(@Param('realm') realm: string, @CurrentUser() user: AuthenticatedUser): Promise<SpellFailureTableDto> {
    const table = await this.queryBus.execute<GetSpellFailureTableQuery, SpellFailureTable>(
      new GetSpellFailureTableQuery(realm, user.roles),
    );
    return SpellFailureTableDto.fromEntity(table);
  }

  @Get(':realm/:type/:roll')
  @ApiOperation({
    operationId: 'lookupSpellFailure',
    summary: 'Get a spell failure result',
    description: 'The roll is the modified open-ended roll: below 1 reads the first row.',
  })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true }, description: 'Success' })
  @ApiErrors({ 400: 'Invalid realm, spell type or roll', 404: 'The table is not in the data folder' })
  lookup(@Param('realm') realm: string, @Param('type') type: string, @Param('roll') roll: string): Promise<SpellFailureLookup> {
    const query = new LookupSpellFailureQuery(realm, type, readInt(roll, 'roll'));
    return this.queryBus.execute<LookupSpellFailureQuery, SpellFailureLookup>(query);
  }
}
