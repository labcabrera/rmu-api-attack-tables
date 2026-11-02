import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/infrastructure/security/jwt-auth.guard.js';
import { ApiErrors } from '../../../shared/interfaces/http/api-errors.decorator.js';
import { GetSpellcastingModifiersQuery } from '../../application/cqrs/queries/get-spellcasting-modifiers.query.js';
import type { SpellcastingModifiers } from '../../domain/entities/spell-casting-tables.js';

@UseGuards(JwtAuthGuard)
@Controller('v1/spellcasting-tables')
@ApiTags('Spell casting tables')
export class SpellcastingTablesController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('modifiers')
  @ApiOperation({
    operationId: 'getSpellcastingModifiers',
    summary: 'Get the spell casting modifiers',
    description: 'Spell Law table 4-2, whole, as rmu-api-tactical reads it.',
  })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true }, description: 'Success' })
  @ApiErrors({ 404: 'The table is not in the data folder' })
  getModifiers(): Promise<SpellcastingModifiers> {
    return this.queryBus.execute<GetSpellcastingModifiersQuery, SpellcastingModifiers>(new GetSpellcastingModifiersQuery());
  }
}
