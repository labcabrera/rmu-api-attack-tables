import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../shared/infrastructure/security/auth.module.js';
import { SharedModule } from '../shared/shared.module.js';
import { GetFumbleTableHandler } from './application/cqrs/handlers/get-fumble-table.handler.js';
import { ListFumbleTablesHandler } from './application/cqrs/handlers/list-fumble-tables.handler.js';
import { LookupFumbleTableHandler } from './application/cqrs/handlers/lookup-fumble-table.handler.js';
import { FUMBLE_TABLE_REPOSITORY } from './application/ports/fumble-table-repository.port.js';
import { FileFumbleTableRepository } from './infrastructure/files/file.fumble-table.repository.js';
import { FumbleTableController } from './interfaces/http/fumble-table.controller.js';

@Module({
  imports: [CqrsModule, AuthModule, SharedModule],
  controllers: [FumbleTableController],
  providers: [
    ListFumbleTablesHandler,
    GetFumbleTableHandler,
    LookupFumbleTableHandler,
    { provide: FUMBLE_TABLE_REPOSITORY, useClass: FileFumbleTableRepository },
  ],
})
export class FumbleTablesModule {}
