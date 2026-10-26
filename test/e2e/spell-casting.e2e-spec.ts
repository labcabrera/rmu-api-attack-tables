import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { type E2eApp, startApp } from './support/app.js';

// Synthetic fixtures in a data folder with the data/core-law layout: placeholder text only, no book content.
const result = (text: string) => ({ text, pp: 'normal' });
const ROWS = [1, 51].map(rollMin => ({
  rollMin,
  rollMax: rollMin === 1 ? 50 : null,
  results: {
    elemental: result(`${rollMin} e`),
    force: result(`${rollMin} f`),
    informational: result(`${rollMin} i`),
    utility: result(`${rollMin} u`),
  },
}));

describe('Spell casting tables (e2e)', () => {
  let e2e: E2eApp;

  beforeAll(async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'rmu-spell-e2e-'));
    for (const [folder, file, data] of [
      ['spellcasting-tables', 'modifiers.json', { columns: ['essence'] }],
      ['spell-failure-tables', 'essence.json', ROWS],
    ] as const) {
      mkdirSync(path.join(dir, folder), { recursive: true });
      writeFileSync(path.join(dir, folder, file), JSON.stringify(data));
    }
    e2e = await startApp({ RMU_ATTACK_TABLES_DIR: dir });
  });

  afterAll(async () => {
    await e2e?.stop();
  });

  it('serves the modifiers and a failure result from the data folder', async () => {
    const auth = e2e.auth('user');
    expect((await request(e2e.server).get('/v1/spellcasting-tables/modifiers').set('Authorization', auth).expect(200)).body).toEqual({
      columns: ['essence'],
    });
    const res = await request(e2e.server).get('/v1/spell-failure-tables/essence/force/-20').set('Authorization', auth).expect(200);
    expect(res.body).toEqual({ realm: 'essence', type: 'force', roll: -20, rollMin: 1, rollMax: 50, text: '1 f', pp: 'normal' });
    await request(e2e.server).get('/v1/spell-failure-tables/arcane/force/10').set('Authorization', auth).expect(400);
    await request(e2e.server).get('/v1/spell-failure-tables/essence/healing/10').set('Authorization', auth).expect(400);
    await request(e2e.server).get('/v1/spell-failure-tables/essence/force/1.5').set('Authorization', auth).expect(400);
  });

  it('gives the whole failure table of a realm with Core Law access', async () => {
    const res = await request(e2e.server).get('/v1/spell-failure-tables/essence').set('Authorization', e2e.auth('coreLaw')).expect(200);
    expect(res.body).toEqual({ realm: 'essence', rows: ROWS });
    await request(e2e.server).get('/v1/spell-failure-tables/essence').set('Authorization', e2e.auth('user')).expect(403);
    await request(e2e.server).get('/v1/spell-failure-tables/mentalism').set('Authorization', e2e.auth('admin')).expect(404);
  });

  it('still serves the bundled tables missing from the data folder', async () => {
    await request(e2e.server).get('/v1/fumble-tables/bows/10').set('Authorization', e2e.auth('user')).expect(200);
  });
});
