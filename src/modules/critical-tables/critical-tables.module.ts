import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../shared/infrastructure/security/auth.module.js';
import { SharedModule } from '../shared/shared.module.js';
import { GetCriticalTableHandler } from './application/cqrs/handlers/get-critical-table.handler.js';
import { ListCriticalTypesHandler } from './application/cqrs/handlers/list-critical-types.handler.js';
import { LookupCriticalTableHandler } from './application/cqrs/handlers/lookup-critical-table.handler.js';
import { CRITICAL_TABLE_REPOSITORY } from './application/ports/critical-table-repository.port.js';
import { FileCriticalTableRepository } from './infrastructure/files/file.critical-table.repository.js';
import { CriticalTableController } from './interfaces/http/critical-table.controller.js';

@Module({
  imports: [CqrsModule, AuthModule, SharedModule],
  controllers: [CriticalTableController],
  providers: [
    ListCriticalTypesHandler,
    GetCriticalTableHandler,
    LookupCriticalTableHandler,
    { provide: CRITICAL_TABLE_REPOSITORY, useClass: FileCriticalTableRepository },
  ],
})
export class CriticalTablesModule {}
