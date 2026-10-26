import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './config/env.schema.js';
import { AttackTablesModule } from './modules/attack-tables/attack-tables.module.js';
import { CriticalTablesModule } from './modules/critical-tables/critical-tables.module.js';
import { FumbleTablesModule } from './modules/fumble-tables/fumble-tables.module.js';
import { AuthModule } from './modules/shared/infrastructure/security/auth.module.js';
import { SharedModule } from './modules/shared/shared.module.js';
import { SpellCastingTablesModule } from './modules/spell-casting-tables/spell-casting-tables.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envSchema,
    }),
    AuthModule,
    SharedModule,
    AttackTablesModule,
    CriticalTablesModule,
    FumbleTablesModule,
    SpellCastingTablesModule,
  ],
})
export class AppModule {}
