import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';

async function availablePort() {
  const socket = net.createServer().listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const { port } = socket.address();
  await new Promise(resolve => socket.close(resolve));
  return port;
}

test('protects reporting, separates records and retains them across a restart', async () => {
  const data = await mkdtemp(join(tmpdir(), 'aari-reporting-'));
  const port = await availablePort();
  const origin = 'http://127.0.0.1:' + port;
  const key = randomBytes(32).toString('base64url');
  const authorization = 'Basic ' + Buffer.from('owner:' + key).toString('base64');
  let server;
  let diagnostics;
  const get = (route, auth) => fetch(origin + route, { headers: auth ? { Authorization: auth } : {} });
  const post = (route, body, auth, originHeader = origin) => fetch(origin + route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: originHeader, ...(auth ? { Authorization: auth } : {}) },
    body: JSON.stringify(body),
  });
  const summary = async () => {
    const result = await get('/admin/reporting/summary', authorization);
    assert.equal(result.status, 200);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    return result.json();
  };
  async function stop() {
    if (!server || server.exitCode !== null || server.signalCode !== null) return;
    const exited = once(server, 'exit');
    server.kill();
    await exited;
  }
  async function start(enabled = true) {
    diagnostics = '';
    server = spawn(process.execPath, ['server/index.mjs'], {
      env: {
        PATH: process.env.PATH,
        PORT: String(port),
        AARI_REPORTING_OWNER_KEY: enabled ? key : '',
        AARI_REPORTING_DATA_DIR: data,
        AARI_REPORTING_ORIGIN: origin,
      },
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    server.stderr.setEncoding('utf8').on('data', output => { diagnostics += output; });
    for (let index = 0; index < 50; index++) {
      if (server.exitCode !== null) break;
      if (await get('/').then(response => response.ok, () => false)) return;
      await delay(100);
    }
    assert.fail('Server failed to start. ' + diagnostics);
  }
  const browserId = randomUUID();
  const event = '/api/reporting/event';
  const payment = '/admin/reporting/payments';
  const bankEntry = { reference: 'AARI-TEST-8012', amountPaise: 9900, bankCreditMatched: true };
  try {
    await start(false);
    assert.equal((await get('/admin')).status, 404);
    assert.doesNotMatch(await (await get('/reporting-client.js')).text(), /fetch\(/);
    assert.equal((await get('/payment.html')).status, 200);
    await stop();

    await start();
    for (const route of ['/admin', '/admin/reporting.js', '/admin/reporting/summary']) {
      const unauthorized = await get(route);
      assert.equal(unauthorized.status, 401);
      assert.match(unauthorized.headers.get('www-authenticate'), /^Basic /);
    }
    assert.equal((await get('/admin', 'Basic ' + Buffer.from('owner:invalid').toString('base64'))).status, 401);
    assert.match(await (await get('/admin', authorization)).text(), /Owner reporting/);
    assert.match(await (await get('/reporting-client.js')).text(), /aari:training-unlocked/);
    const initial = await summary();
    assert.deepEqual([initial.trackedBrowsers, initial.unverifiedUnlocks, initial.confirmedPayments], [0, 0, 0]);
    assert.equal((await post(event, { browserId, event: 'visit' }, null, 'https://other.invalid')).status, 403);
    assert.equal((await post(event, { browserId: 'invalid', event: 'visit' })).status, 400);
    for (const id of [browserId, browserId, randomUUID()]) {
      assert.equal((await post(event, { browserId: id, event: 'visit' })).status, 204);
    }
    const unlock = { browserId, event: 'unlock', eventId: randomUUID() };
    assert.equal((await post(event, unlock)).status, 204);
    assert.equal((await post(event, unlock)).status, 204);
    const seen = await summary();
    assert.deepEqual([seen.trackedBrowsers, seen.unverifiedUnlocks, seen.confirmedPayments], [2, 1, 0]);

    assert.equal((await post(payment, bankEntry)).status, 401);
    assert.equal((await post(payment, bankEntry, authorization, 'https://other.invalid')).status, 403);
    assert.equal((await post(payment, { ...bankEntry, bankCreditMatched: false }, authorization)).status, 400);
    assert.equal((await post(payment, { ...bankEntry, amountPaise: 100 }, authorization)).status, 400);
    assert.equal((await post(payment, bankEntry, authorization)).status, 201);
    assert.equal((await post(payment, { ...bankEntry, reference: ' aari-test-8012 ' }, authorization)).status, 409);
    const recorded = await summary();
    assert.deepEqual([recorded.trackedBrowsers, recorded.unverifiedUnlocks, recorded.confirmedPayments], [2, 1, 1]);
    assert.equal(recorded.recentPayments[0].referenceSuffix, '8012');
    assert.doesNotMatch(JSON.stringify(recorded), /AARI-TEST-8012/);

    await stop();
    await start();
    assert.deepEqual(await summary(), recorded);
  } finally {
    await stop();
    await rm(data, { recursive: true, force: true });
  }
});
