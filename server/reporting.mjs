import { createHash, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const amountPaise = 9900;
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const reference = /^[A-Z0-9][A-Z0-9-]{4,46}[A-Z0-9]$/;
const digest = value => createHash('sha256').update(value).digest();
const source = name => new URL(name, import.meta.url);

export async function openReporting(publicDir) {
  const key = process.env.AARI_REPORTING_OWNER_KEY;
  if (!key) return null;
  const origin = new URL(process.env.AARI_REPORTING_ORIGIN);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
  if (origin.origin !== process.env.AARI_REPORTING_ORIGIN ||
      (origin.protocol !== 'https:' && !(local && origin.protocol === 'http:'))) {
    throw new Error('AARI_REPORTING_ORIGIN must be the site origin with HTTPS, or local HTTP.');
  }
  const dataDirectory = process.env.AARI_REPORTING_DATA_DIR;
  if (!dataDirectory || !isAbsolute(dataDirectory)) {
    throw new Error('Set AARI_REPORTING_DATA_DIR to an absolute directory on durable storage.');
  }
  const relativeDirectory = relative(publicDir, resolve(dataDirectory));
  if (!relativeDirectory || (!relativeDirectory.startsWith('..' + sep) && relativeDirectory !== '..')) {
    throw new Error('AARI_REPORTING_DATA_DIR must be outside dist.');
  }
  if (!/^[A-Za-z0-9_-]{43,128}$/.test(key)) {
    throw new Error('Set AARI_REPORTING_OWNER_KEY to a random base64url secret of at least 32 bytes.');
  }
  const ownerDigest = digest(Buffer.from('owner:' + key));
  const files = new Map(await Promise.all([
    ['/admin', './reporting.html', 'text/html; charset=utf-8'],
    ['/admin/reporting.js', './reporting-admin.js', 'text/javascript; charset=utf-8'],
    ['/reporting-client.js', './reporting-client.js', 'text/javascript; charset=utf-8'],
  ].map(async ([path, file, type]) => [path, { type, bytes: await readFile(source(file)) }])));
  await mkdir(dataDirectory, { recursive: true, mode: 0o700 });
  const database = new DatabaseSync(join(dataDirectory, 'reporting.sqlite'));
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 3000;
    CREATE TABLE IF NOT EXISTS reporting_metadata (id INTEGER PRIMARY KEY CHECK (id = 1), started_at TEXT NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS reporting_browsers (id TEXT PRIMARY KEY, seen_at TEXT NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS reporting_unlocks (browser_id TEXT NOT NULL, event_id TEXT NOT NULL, opened_at TEXT NOT NULL,
      PRIMARY KEY (browser_id, event_id)) STRICT;
    CREATE TABLE IF NOT EXISTS reporting_payments (reference_hash TEXT PRIMARY KEY, reference_suffix TEXT NOT NULL,
      amount INTEGER NOT NULL CHECK (amount = 9900), recorded_at TEXT NOT NULL) STRICT;
  `);
  database.prepare('INSERT OR IGNORE INTO reporting_metadata VALUES (1, ?)').run(new Date().toISOString());
  const recordBrowser = database.prepare('INSERT OR IGNORE INTO reporting_browsers VALUES (?, ?)');
  const recordUnlock = database.prepare('INSERT OR IGNORE INTO reporting_unlocks VALUES (?, ?, ?)');
  const recordPayment = database.prepare('INSERT OR IGNORE INTO reporting_payments VALUES (?, ?, ?, ?)');
  const summary = database.prepare(`
    SELECT started_at AS startedAt,
    (SELECT COUNT(*) FROM reporting_browsers) AS trackedBrowsers,
    (SELECT COUNT(*) FROM reporting_unlocks) AS unverifiedUnlocks,
    (SELECT COUNT(*) FROM reporting_payments) AS confirmedPayments
    FROM reporting_metadata WHERE id = 1
  `);
  const recent = database.prepare(`
    SELECT reference_suffix AS referenceSuffix, recorded_at AS recordedAt
    FROM reporting_payments ORDER BY recorded_at DESC, reference_hash LIMIT 10
  `);

  function authenticated(request) {
    const encoded = /^Basic ([A-Za-z0-9+/]+={0,2})$/i.exec(request.headers.authorization ?? '')?.[1];
    return Boolean(encoded && timingSafeEqual(digest(Buffer.from(encoded, 'base64')), ownerDigest));
  }

  return async function reporting(request, response, path, readJson, json) {
    const admin = path === '/admin' || path.startsWith('/admin/reporting');
    const event = path === '/api/reporting/event';
    if (!admin && !event && path !== '/reporting-client.js') return false;
    response.setHeader('Cache-Control', 'no-store');
    if (admin) {
      response.setHeader('X-Robots-Tag', 'noindex, nofollow');
      response.setHeader('Referrer-Policy', 'no-referrer');
      response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
      if (!authenticated(request)) {
        response.setHeader('WWW-Authenticate', 'Basic realm="Aari Studio owner"');
        json(response, 401, { error: 'Owner authentication required.' });
        return true;
      }
    }
    const file = files.get(path);
    if (file && request.method === 'GET') {
      response.setHeader('Content-Type', file.type);
      response.end(file.bytes);
      return true;
    }
    if (path === '/admin/reporting/summary' && request.method === 'GET') {
      json(response, 200, { ...summary.get(), recentPayments: recent.all() });
      return true;
    }
    const payment = path === '/admin/reporting/payments';
    if ((!event && !payment) || request.method !== 'POST') {
      json(response, 404, { error: 'Not found.' });
      return true;
    }
    if (request.headers.origin !== origin.origin || request.headers['sec-fetch-site'] === 'cross-site') {
      json(response, 403, { error: 'This action requires the Aari Studio site origin.' });
      return true;
    }
    const body = await readJson(request);
    const now = new Date().toISOString();
    if (payment) {
      const value = typeof body.reference === 'string' ? body.reference.trim().toUpperCase() : '';
      if (!reference.test(value) || body.amountPaise !== amountPaise || body.bankCreditMatched !== true) {
        json(response, 400, { error: 'Enter the reference and confirm the incoming ₹99 credit.' });
      } else if (recordPayment.run(digest(value).toString('hex'), value.slice(-4), amountPaise, now).changes) {
        json(response, 201, { status: 'recorded' });
      } else {
        json(response, 409, { error: 'That payment has already been recorded.' });
      }
      return true;
    }
    if (typeof body.browserId !== 'string' || !uuid.test(body.browserId) ||
        !['visit', 'unlock'].includes(body.event) ||
        (body.event === 'unlock' && (typeof body.eventId !== 'string' || !uuid.test(body.eventId)))) {
      json(response, 400, { error: 'Invalid reporting event.' });
      return true;
    }
    recordBrowser.run(body.browserId, now);
    if (body.event === 'unlock') recordUnlock.run(body.browserId, body.eventId, now);
    response.writeHead(204);
    response.end();
    return true;
  };
}
