import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureHttp } from '../../../src/bootstrap/http.js';
import { AUDIENCE, ISSUER, LocalJwks } from './jwks.js';

export type Server = Parameters<typeof request>[0];

/** The users of the suite, by the Keycloak groups in their token. */
export const USERS = {
  admin: { sub: 'e2e-admin', groups: ['rmu-admin'] },
  user: { sub: 'e2e-user', groups: ['rmu-user'] },
  coreLaw: { sub: 'e2e-core-law', groups: ['rmu-user', 'rmu-core-law'] },
  noRole: { sub: 'e2e-guest', groups: [] as string[] },
} as const;

export type UserName = keyof typeof USERS;

export type E2eApp = {
  app: NestExpressApplication;
  server: Server;
  jwks: LocalJwks;
  /** `Bearer <token>` of one of the USERS. */
  auth: (user: UserName) => string;
  stop: () => Promise<void>;
};

/**
 * Boots the whole AppModule as main.ts does (configureHttp) against a local JWKS. There is no database: the tables are
 * the bundled ones, or those of RMU_ATTACK_TABLES_DIR in `env`. AppModule is imported after setting the environment,
 * because ConfigModule.forRoot() reads it (and .env) when the module is evaluated. Each spec file runs in its own
 * process, so `env` overrides do not leak into other files.
 */
export async function startApp(
  env: Record<string, string> = {},
  /** Extra setup before init, such as the OpenAPI routes. */
  setup: (app: NestExpressApplication) => void = () => undefined,
): Promise<E2eApp> {
  const jwks = new LocalJwks();
  await jwks.start();
  Object.assign(process.env, {
    RMU_ATTACK_TABLES_DIR: '',
    RMU_IAM_JWK_URI: jwks.uri,
    RMU_IAM_ISSUER_URI: ISSUER,
    RMU_IAM_AUDIENCE: AUDIENCE,
    RMU_THROTTLE_LIMIT: '0',
    RMU_CORS_ORIGINS: '',
    ...env,
  });

  const { AppModule } = await import('../../../src/app.module.js');
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: ['error'] });
  configureHttp(app);
  setup(app);
  await app.init();

  return {
    app,
    server: app.getHttpServer() as Server,
    jwks,
    auth: user => `Bearer ${jwks.token(USERS[user])}`,
    stop: async () => {
      await app.close();
      await jwks.stop();
    },
  };
}
