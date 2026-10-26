import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { AUDIENCE, ISSUER } from './support/jwks.js';
import { type E2eApp, startApp, USERS } from './support/app.js';

// What every endpoint shares: health, authentication against the local JWKS, the OpenAPI document and the HTTP
// headers. The tables are in tables.e2e-spec.ts; the request limit and CORS origins in http.e2e-spec.ts.
describe('AppModule (e2e)', () => {
  let e2e: E2eApp;

  beforeAll(async () => {
    e2e = await startApp();
  });

  afterAll(async () => {
    await e2e?.stop();
  });

  it('GET /v1/health is up without a token', async () => {
    const res = await request(e2e.server).get('/v1/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });

  it('accepts a valid token without any group', async () => {
    await request(e2e.server).get('/v1/attack-tables').set('Authorization', e2e.auth('noRole')).expect(200);
  });

  it.each([
    ['no token', undefined],
    ['a malformed token', 'Bearer not-a-jwt'],
    ['an expired token', { exp: Math.floor(Date.now() / 1000) - 60 }],
    ['a token from another issuer', { iss: `${ISSUER}-other` }],
    ['a token for another audience', { aud: `${AUDIENCE}-other` }],
  ])('rejects %s with 401', async (_, token) => {
    const call = request(e2e.server).get('/v1/attack-tables/broadsword/5/100');
    if (typeof token === 'string') call.set('Authorization', token);
    else if (token) call.set('Authorization', `Bearer ${e2e.jwks.token({ ...USERS.user, ...token })}`);
    const res = await call.expect(401);
    expect(res.body).toMatchObject({ statusCode: 401, error: 'UnauthorizedException', path: '/v1/attack-tables/broadsword/5/100' });
  });

  it.each([
    '/v1/attack-tables',
    '/v1/critical-tables',
    '/v1/critical-tables/P',
    '/v1/fumble-tables/bows/10',
    '/v1/spellcasting-tables/modifiers',
    '/v1/spell-failure-tables',
  ])('%s needs a token', async path => {
    await request(e2e.server).get(path).expect(401);
  });

  it('every OpenAPI operation has a unique operationId', () => {
    const document = SwaggerModule.createDocument(e2e.app, new DocumentBuilder().build());
    const ids = Object.values(document.paths).flatMap(methods =>
      Object.values(methods as Record<string, { operationId?: string }>)
        .map(operation => operation?.operationId)
        .filter((id): id is string => typeof id === 'string'),
    );
    expect(ids.length).toBeGreaterThanOrEqual(13);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  it('answers with the helmet security headers and no CORS headers', async () => {
    const res = await request(e2e.server).get('/v1/health').set('Origin', 'http://evil.test').expect(200);
    expect(res.headers).toMatchObject({ 'x-content-type-options': 'nosniff', 'x-frame-options': 'SAMEORIGIN' });
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('answers an unknown route, and the old root, with 404 in the error format', async () => {
    const res = await request(e2e.server).get('/v1/unknown').set('Authorization', e2e.auth('admin')).expect(404);
    expect(res.body).toMatchObject({ statusCode: 404, code: 'not-found', path: '/v1/unknown' });
    await request(e2e.server).get('/').expect(404);
  });
});
