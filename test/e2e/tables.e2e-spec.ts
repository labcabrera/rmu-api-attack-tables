import { readFileSync } from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { BUNDLED_DIR } from '../../src/modules/shared/infrastructure/files/table-paths.js';
import { type E2eApp, startApp, type UserName } from './support/app.js';

const bundled = (file: string) => JSON.parse(readFileSync(path.join(BUNDLED_DIR, file), 'utf8')) as unknown;

// The bundled tables through HTTP: the lookups tactical uses, the lists of the shared lib and the whole tables.
describe('Tables (e2e)', () => {
  let e2e: E2eApp;
  const get = (uri: string, user: UserName = 'user') => request(e2e.server).get(uri).set('Authorization', e2e.auth(user));

  beforeAll(async () => {
    e2e = await startApp();
  });

  afterAll(async () => {
    await e2e?.stop();
  });

  describe('attack tables', () => {
    it('lists the 39 Medium tables', async () => {
      const res = await get('/v1/attack-tables').expect(200);
      expect(res.body).toHaveLength(39);
      expect(res.body).toContain('broadsword');
    });

    it('looks up a roll with the response tactical reads', async () => {
      const res = await get('/v1/attack-tables/broadsword/1/175').expect(200);
      expect(res.body).toEqual({ text: '29FS', damage: 29, criticalType: 'S', criticalSeverity: 'F' });
      // The ball tables end at 125: above it, the top row
      const top = (await get('/v1/attack-tables/cold-ball/1/125').expect(200)).body as unknown;
      expect((await get('/v1/attack-tables/cold-ball/1/175').expect(200)).body).toEqual(top);
    });

    it.each([
      ['/v1/attack-tables/broadsword/11/100', 'invalid-armor-type'],
      ['/v1/attack-tables/broadsword/1/176', 'invalid-roll'],
      ['/v1/attack-tables/broadsword/1/abc', 'invalid-roll'],
      ['/v1/attack-tables/Broad_Sword/1/100', 'invalid-table-id'],
      ['/v1/attack-tables/..%2Fbroadsword/1/100', 'invalid-table-id'],
    ])('rejects %s with 400', async (uri, code) => {
      const res = await get(uri).expect(400);
      expect(res.body).toMatchObject({ statusCode: 400, error: 'ValidationError', code });
    });

    it('answers 404 for an unknown table, and for the old route with the attack size', async () => {
      expect((await get('/v1/attack-tables/missing/1/100').expect(404)).body).toMatchObject({ code: 'not-found' });
      await get('/v1/attack-tables/broadsword/medium/1/100').expect(404);
    });

    it('gives the whole table with Core Law access', async () => {
      const res = await get('/v1/attack-tables/broadsword', 'coreLaw').expect(200);
      const body = res.body as { id: string; rows: { rollMin: number; rollMax: number; results: unknown[] }[] };
      expect(body.id).toBe('broadsword');
      expect(body.rows[0]).toMatchObject({ rollMin: 173, rollMax: 175 });
      expect(body.rows[0].results).toHaveLength(10);
      expect(body.rows[0].results[0]).toEqual({ armorType: 1, text: '29FS', damage: 29, criticalType: 'S', criticalSeverity: 'F' });
      await get('/v1/attack-tables/broadsword', 'admin').expect(200);
      expect((await get('/v1/attack-tables/broadsword').expect(403)).body).toMatchObject({ code: 'forbidden' });
    });
  });

  describe('critical tables', () => {
    it('lists the types', async () => {
      const res = await get('/v1/critical-tables').expect(200);
      expect(res.body).toEqual(['G', 'H', 'I', 'K', 'L', 'O', 'P', 'S', 'T', 'U', 'W', 'acid', 'holy', 'steam', 'subdual']);
    });

    it('looks up a roll, with a location and with Z', async () => {
      const entry = (await get('/v1/critical-tables/K/A/1').expect(200)).body as { rollMin: number; location: string };
      expect(entry).toMatchObject({ rollMin: 1, location: 'head' });
      const located = (await get('/v1/critical-tables/P/C/50?location=leg').expect(200)).body as { location: string | null };
      expect([null, 'leg']).toContain(located.location);
      await get('/v1/critical-tables/P/Z/50').expect(200);
    });

    it('rejects an invalid severity, type or roll, and 404 for an unknown type', async () => {
      expect((await get('/v1/critical-tables/P/F/50').expect(400)).body).toMatchObject({ code: 'invalid-severity' });
      expect((await get('/v1/critical-tables/P_x/A/50').expect(400)).body).toMatchObject({ code: 'invalid-table-id' });
      expect((await get('/v1/critical-tables/P/A/101').expect(400)).body).toMatchObject({ code: 'invalid-roll' });
      await get('/v1/critical-tables/missing/A/50').expect(404);
    });

    it('gives every severity of a type, as the files have them, with Core Law access', async () => {
      const res = await get('/v1/critical-tables/subdual', 'coreLaw').expect(200);
      expect(res.body).toEqual({
        type: 'subdual',
        severities: Object.fromEntries(['A', 'B', 'C', 'D', 'E'].map(s => [s, bundled(`critical/subdual-${s}.json`)])),
      });
      await get('/v1/critical-tables/subdual').expect(403);
      await get('/v1/critical-tables/missing', 'coreLaw').expect(404);
    });
  });

  describe('fumble tables', () => {
    it('lists the tables and looks up a roll', async () => {
      expect((await get('/v1/fumble-tables').expect(200)).body).toHaveLength(10);
      const entry = (await get('/v1/fumble-tables/bows/45').expect(200)).body as { rollMin: number; rollMax: number; text: string };
      expect(entry.rollMin).toBeLessThanOrEqual(45);
      expect(entry.rollMax).toBeGreaterThanOrEqual(45);
    });

    it('rejects an invalid id or roll, and 404 for an unknown table', async () => {
      await get('/v1/fumble-tables/Bows/45').expect(400);
      await get('/v1/fumble-tables/bows/0').expect(400);
      await get('/v1/fumble-tables/missing/45').expect(404);
    });

    it('gives the whole table with Core Law access', async () => {
      const res = await get('/v1/fumble-tables/melee-one-hand', 'coreLaw').expect(200);
      expect(res.body).toEqual({ id: 'melee-one-hand', entries: bundled('fumble/melee-one-hand.json') });
      await get('/v1/fumble-tables/melee-one-hand', 'noRole').expect(403);
    });
  });

  describe('spell casting tables without the data folder', () => {
    it('lists the realms and answers 404 for the tables, which are not bundled', async () => {
      expect((await get('/v1/spell-failure-tables').expect(200)).body).toEqual(['channeling', 'essence', 'mentalism']);
      await get('/v1/spellcasting-tables/modifiers').expect(404);
      await get('/v1/spell-failure-tables/essence/force/50').expect(404);
      await get('/v1/spell-failure-tables/essence', 'coreLaw').expect(404);
    });
  });
});
