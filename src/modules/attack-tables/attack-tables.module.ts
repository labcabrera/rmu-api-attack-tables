import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../shared/infrastructure/security/auth.module.js';
import { SharedModule } from '../shared/shared.module.js';
import { GetAttackTableHandler } from './application/cqrs/handlers/get-attack-table.handler.js';
import { ListAttackTablesHandler } from './application/cqrs/handlers/list-attack-tables.handler.js';
import { LookupAttackTableHandler } from './application/cqrs/handlers/lookup-attack-table.handler.js';
import { ATTACK_TABLE_REPOSITORY } from './application/ports/attack-table-repository.port.js';
import { FileAttackTableRepository } from './infrastructure/files/file.attack-table.repository.js';
import { AttackTableController } from './interfaces/http/attack-table.controller.js';

@Module({
  imports: [CqrsModule, AuthModule, SharedModule],
  controllers: [AttackTableController],
  providers: [
    ListAttackTablesHandler,
    GetAttackTableHandler,
    LookupAttackTableHandler,
    { provide: ATTACK_TABLE_REPOSITORY, useClass: FileAttackTableRepository },
  ],
})
export class AttackTablesModule {}
