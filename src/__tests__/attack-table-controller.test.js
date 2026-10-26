const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const express = require('express');
const attackTableRouter = require('../routes/attack-table-controller');
const { BUNDLED_DIR } = require('../config/table-paths');

// Synthetic tables (spec 033): made-up values with the shape of the Medium tables, no book content.
const WEAPON = ['roll,at1,at2', '173-175,20EP,18DP', '66-172,5,4AP', '1-65,,'].join('\n');
const BALL = ['roll,at1,at2', '123-125,15CH,14CH', '1-122,3,2'].join('\n');

describe('attack tables API', () => {
  const original = process.env.RMU_ATTACK_TABLES_DIR;
  let server;
  let baseUrl;

  const get = (uri) =>
    new Promise((resolve, reject) => {
      http
        .get(`${baseUrl}${uri}`, (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          // Express answers unknown routes with HTML
          res.on('end', () =>
            resolve({
              status: res.statusCode,
              body: res.headers['content-type']?.includes('json') ? JSON.parse(body) : body,
            }),
          );
        })
        .on('error', reject);
    });

  beforeAll((done) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rmu-attack-tables-api-'));
    fs.mkdirSync(path.join(dir, 'attack-tables'));
    fs.writeFileSync(path.join(dir, 'attack-tables', 'test-weapon.csv'), WEAPON);
    fs.writeFileSync(path.join(dir, 'attack-tables', 'test-ball.csv'), BALL);
    process.env.RMU_ATTACK_TABLES_DIR = dir;

    const app = express();
    app.use('/v1/attack-tables', attackTableRouter);
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}/v1/attack-tables`;
      done();
    });
  });

  afterAll((done) => {
    if (original === undefined) {
      delete process.env.RMU_ATTACK_TABLES_DIR;
    } else {
      process.env.RMU_ATTACK_TABLES_DIR = original;
    }
    server.close(done);
  });

  it('lists the tables found on disk, sorted, with the bundled ones', async () => {
    const res = await get('');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([...res.body].sort());
    expect(res.body).toEqual(expect.arrayContaining(['test-ball', 'test-weapon']));
    const bundled = fs.readdirSync(path.join(BUNDLED_DIR, 'attack')).map((file) => file.replace(/\.csv$/, ''));
    expect(res.body).toEqual(expect.arrayContaining(bundled));
    expect(res.body.some((id) => /-(small|medium|big)$/.test(id))).toBe(false);
  });

  it('reads a result without attack size', async () => {
    const res = await get('/test-weapon/2/100');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      text: '4AP',
      damage: 4,
      criticalType: 'P',
      criticalSeverity: 'A',
    });
    expect((await get('/test-weapon/1/100')).body).toEqual({
      text: '5',
      damage: 5,
      criticalType: null,
      criticalSeverity: null,
    });
  });

  it('uses the top row above the last band of the table', async () => {
    const res = await get('/test-ball/1/150');
    expect(res.status).toBe(200);
    expect(res.body.text).toBe('15CH');
  });

  it('no longer accepts the attack size in the path', async () => {
    expect((await get('/test-weapon/medium/2/100')).status).toBe(404);
  });

  it('rejects table ids that are not plain names', async () => {
    expect((await get('/Test_Weapon/2/100')).status).toBe(400);
    expect((await get('/..%2Ftest-weapon/2/100')).status).toBe(400);
  });

  it('answers 404 for an unknown table', async () => {
    expect((await get('/missing-table/2/100')).status).toBe(404);
  });

  it('serves every bundled table as a Medium table', () => {
    const files = fs.readdirSync(path.join(BUNDLED_DIR, 'attack'));
    expect(files).toHaveLength(39);
    expect(files.every((file) => /^[a-z0-9-]+\.csv$/.test(file))).toBe(true);
  });
});
