import { createHash, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const amountPaise = 9900;
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const reference = /^[A-Z0-9][A-Z0-9-]{4,46}[A-Z0-9]$/;
const digest = value => createHash('sha256').update(value).digest();
const source = name => new URL(name, import.meta.url);
const pages = new Set(['designs', 'training', 'mixer', 'practice', 'checkout']);
const indiaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });

function reportingOrigin(value, name) {
  const origin = new URL(value);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
  if (origin.origin !== value ||
      (origin.protocol !== 'https:' && !(local && origin.protocol === 'http:'))) {
    throw new Error(name + ' must be an HTTPS origin, or local HTTP.');
  }
  return origin.origin;
}

export async function openReporting(publicDir) {
  const key = process.env.AARI_REPORTING_OWNER_KEY;
  if (!key) return null;
  const publicOrigin = reportingOrigin(process.env.AARI_REPORTING_ORIGIN, 'AARI_REPORTING_ORIGIN');
  const adminOrigin = reportingOrigin(process.env.AARI_REPORTING_ADMIN_ORIGIN ?? publicOrigin, 'AARI_REPORTING_ADMIN_ORIGIN');
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
    ['/admin/reporting.css', './reporting.css', 'text/css; charset=utf-8'],
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
    CREATE TABLE IF NOT EXISTS reporting_views (
      event_id TEXT PRIMARY KEY, browser_id TEXT NOT NULL, section TEXT NOT NULL, viewed_at TEXT NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS reporting_payments (reference_hash TEXT PRIMARY KEY, reference_suffix TEXT NOT NULL,
      amount INTEGER NOT NULL CHECK (amount = 9900), recorded_at TEXT NOT NULL, credit_date TEXT) STRICT;
    CREATE INDEX IF NOT EXISTS reporting_views_time ON reporting_views(viewed_at DESC);
    CREATE INDEX IF NOT EXISTS reporting_unlocks_time ON reporting_unlocks(opened_at DESC);
    CREATE INDEX IF NOT EXISTS reporting_payments_time ON reporting_payments(recorded_at DESC);
  `);
  if (!database.prepare('PRAGMA table_info(reporting_payments)').all().some(column => column.name === 'credit_date')) {
    database.exec('ALTER TABLE reporting_payments ADD COLUMN credit_date TEXT');
  }
  database.prepare('INSERT OR IGNORE INTO reporting_metadata VALUES (1, ?)').run(new Date().toISOString());
  const recordBrowser = database.prepare('INSERT OR IGNORE INTO reporting_browsers VALUES (?, ?)');
  const recordUnlock = database.prepare('INSERT OR IGNORE INTO reporting_unlocks VALUES (?, ?, ?)');
  const recordView = database.prepare('INSERT OR IGNORE INTO reporting_views VALUES (?, ?, ?, ?)');
  const recordPayment = database.prepare(`
    INSERT OR IGNORE INTO reporting_payments (reference_hash, reference_suffix, amount, recorded_at, credit_date)
    VALUES (?, ?, ?, ?, ?)
  `);
  const summary = database.prepare(`
    SELECT started_at AS startedAt,
    (SELECT COUNT(*) FROM reporting_browsers) AS trackedBrowsers,
    (SELECT COUNT(*) FROM reporting_views) AS pageOpens,
    (SELECT COUNT(*) FROM reporting_unlocks) AS unverifiedUnlocks,
    (SELECT COUNT(*) FROM reporting_payments) AS confirmedPayments,
    (SELECT COALESCE(SUM(amount), 0) FROM reporting_payments) AS confirmedAmountPaise
    FROM reporting_metadata WHERE id = 1
  `);
  const recent = database.prepare(`
    SELECT reference_suffix AS referenceSuffix, amount AS amountPaise, credit_date AS creditDate, recorded_at AS recordedAt
    FROM reporting_payments ORDER BY recorded_at DESC, reference_hash LIMIT 20
  `);
  const bySection = database.prepare(`
    SELECT section, COUNT(*) AS opens, COUNT(DISTINCT browser_id) AS browsers
    FROM reporting_views GROUP BY section ORDER BY section
  `);
  const activity = database.prepare(`
    SELECT 'view' AS kind, section, viewed_at AS occurredAt FROM reporting_views
    UNION ALL SELECT 'unlock', NULL, opened_at FROM reporting_unlocks
    UNION ALL SELECT 'payment', NULL, recorded_at FROM reporting_payments
    ORDER BY occurredAt DESC, kind, section LIMIT 20
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
    if (event) {
      response.setHeader('Vary', 'Origin');
      if (request.headers.origin !== publicOrigin) {
        json(response, 403, { error: 'This action requires the Aari Studio site origin.' });
        return true;
      }
      response.setHeader('Access-Control-Allow-Origin', publicOrigin);
      if (request.method === 'OPTIONS') {
        response.setHeader('Access-Control-Allow-Methods', 'POST');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        response.writeHead(204);
        response.end();
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
      json(response, 200, {
        ...summary.get(), bySection: bySection.all(), recentPayments: recent.all(), recentActivity: activity.all(),
      });
      return true;
    }
    const payment = path === '/admin/reporting/payments';
    if ((!event && !payment) || request.method !== 'POST') {
      json(response, 404, { error: 'Not found.' });
      return true;
    }
    if (payment && (request.headers.origin !== adminOrigin || request.headers['sec-fetch-site'] === 'cross-site')) {
      json(response, 403, { error: 'Record payments from the owner dashboard.' });
      return true;
    }
    const body = await readJson(request);
    const now = new Date().toISOString();
    if (payment) {
      const value = typeof body.reference === 'string' ? body.reference.trim().toUpperCase() : '';
      const creditDate = body.creditDate;
      if (!reference.test(value) || body.amountPaise !== amountPaise || body.bankCreditMatched !== true) {
        json(response, 400, { error: 'Enter the reference and confirm the incoming ₹99 credit.' });
      } else if (!validCreditDate(creditDate, now)) {
        json(response, 400, { error: 'Enter a valid bank credit date up to today.' });
      } else if (recordPayment.run(digest(value).toString('hex'), value.slice(-4), amountPaise, now, creditDate).changes) {
        json(response, 201, { status: 'recorded' });
      } else {
        json(response, 409, { error: 'That payment has already been recorded.' });
      }
      return true;
    }
    const trackedView = body.event === 'visit' && body.section !== undefined;
    if (typeof body.browserId !== 'string' || !uuid.test(body.browserId) ||
        !['visit', 'unlock'].includes(body.event) ||
        (trackedView && !pages.has(body.section)) ||
        ((trackedView || body.event === 'unlock') && (typeof body.eventId !== 'string' || !uuid.test(body.eventId)))) {
      json(response, 400, { error: 'Invalid reporting event.' });
      return true;
    }
    database.exec('BEGIN IMMEDIATE');
    try {
      recordBrowser.run(body.browserId, now);
      if (trackedView) recordView.run(body.eventId, body.browserId, body.section, now);
      if (body.event === 'unlock') recordUnlock.run(body.browserId, body.eventId, now);
      database.exec('COMMIT');
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
    response.writeHead(204);
    response.end();
    return true;
  };
}

function validCreditDate(date, now) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date + 'T00:00:00Z');
  const parts = Object.fromEntries(indiaDate.formatToParts(new Date(now)).map(part => [part.type, part.value]));
  const today = `${parts.year}-${parts.month.padStart(2, '0')}-${parts.day.padStart(2, '0')}`;
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().startsWith(date) && date <= today;
}
