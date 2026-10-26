import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../shared/infrastructure/security/auth.module.js';
import { SharedModule } from '../shared/shared.module.js';
import { GetSpellFailureTableHandler } from './application/cqrs/handlers/get-spell-failure-table.handler.js';
import { GetSpellcastingModifiersHandler } from './application/cqrs/handlers/get-spellcasting-modifiers.handler.js';
import { LookupSpellFailureHandler } from './application/cqrs/handlers/lookup-spell-failure.handler.js';
import { SPELL_CASTING_TABLES_REPOSITORY } from './application/ports/spell-casting-tables-repository.port.js';
import { FileSpellCastingTablesRepository } from './infrastructure/files/file.spell-casting-tables.repository.js';
import { SpellFailureTablesController } from './interfaces/http/spell-failure-tables.controller.js';
import { SpellcastingTablesController } from './interfaces/http/spellcasting-tables.controller.js';

@Module({
  imports: [CqrsModule, AuthModule, SharedModule],
  controllers: [SpellcastingTablesController, SpellFailureTablesController],
  providers: [
    GetSpellcastingModifiersHandler,
    GetSpellFailureTableHandler,
    LookupSpellFailureHandler,
    { provide: SPELL_CASTING_TABLES_REPOSITORY, useClass: FileSpellCastingTablesRepository },
  ],
})
export class SpellCastingTablesModule {}
