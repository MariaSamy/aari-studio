import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { pipeline } from 'node:stream/promises';

const publicDir = fileURLToPath(new URL('../dist', import.meta.url));
const dataDir = resolve(process.env.AARI_DATA_DIR || 'data');
const adminToken = process.env.AARI_ADMIN_TOKEN?.trim();
const contact = parseContact(process.env.AARI_MEMBERSHIP_CONTACT_URL);
const designFiles = new Map([
  ['marigold-moth', 'ready-marigold-moth.webp'],
  ['turquoise-papyrus', 'ready-turquoise-papyrus.webp'],
  ['denim-dogwood', 'ready-denim-dogwood.webp'],
  ['indigo-peacock', 'ready-navy.webp'],
  ['rose-jasmine', 'ready-rose.webp'],
  ['plum-ginkgo', 'ready-plum-ginkgo.webp'],
  ['ochre-crane', 'ready-ochre-crane.webp'],
  ['cobalt-diamond', 'ready-cobalt-diamond.webp'],
  ['ivory-nasturtium', 'ready-ivory-nasturtium.webp'],
]);
const membershipPath = '/api/membership';
const monthInSeconds = 30 * 24 * 60 * 60;
const priceInPaise = 9900;
const bodyLimit = 2048;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.vtt': 'text/vtt; charset=utf-8',
};

let db;
if (adminToken && !contact) throw new Error('Set AARI_MEMBERSHIP_CONTACT_URL to enable membership.');
if (contact && (!adminToken || adminToken.length < 32)) {
  throw new Error('Set AARI_ADMIN_TOKEN to a secret of at least 32 characters.');
}
if (contact) {
  if (dataDir === publicDir || dataDir.startsWith(publicDir + sep)) {
    throw new Error('AARI_DATA_DIR must be outside dist.');
  }
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  await Promise.all([...designFiles.values()].map(name => {
    return stat(join(dataDir, 'designs', name)).then(file => {
      if (!file.isFile()) throw new Error('Missing professional design: ' + name);
    });
  }));
  db = new DatabaseSync(join(dataDir, 'memberships.sqlite'));
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS memberships (
      code_hash TEXT PRIMARY KEY,
      payment_reference TEXT NOT NULL UNIQUE,
      amount_paise INTEGER NOT NULL CHECK (amount_paise = 9900),
      issued_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      first_opened_at INTEGER,
      last_opened_at INTEGER,
      open_count INTEGER NOT NULL DEFAULT 0
    ) STRICT;
  `);
}

function parseContact(value) {
  if (!value) return null;
  let result;
  try {
    result = new URL(value);
  } catch {
    return null;
  }
  return ['https:', 'mailto:'].includes(result.protocol) && !result.username && !result.password
    ? result.href
    : null;
}

function json(response, status, data) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(data));
}

async function readJson(request) {
  if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
    throw new Error('Expected JSON.');
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > bodyLimit) throw new Error('Request too large.');
    chunks.push(chunk);
  }
  const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected an object.');
  }
  return value;
}

function codeHash(code) {
  return createHash('sha256').update(code).digest('hex');
}

function bearer(request) {
  return /^Bearer ([^\s]+)$/i.exec(request.headers.authorization || '')?.[1] || '';
}

function isAdmin(request) {
  const provided = createHash('sha256').update(bearer(request)).digest();
  const expected = createHash('sha256').update(adminToken).digest();
  return timingSafeEqual(provided, expected);
}

function findMembership(code, now) {
  if (typeof code !== 'string' || code.length > 40) return undefined;
  const normalized = code.trim().toUpperCase().replaceAll('-', '');
  if (!/^[A-F0-9]{20}$/.test(normalized)) return undefined;
  return db.prepare('SELECT code_hash, expires_at FROM memberships WHERE code_hash = ? AND expires_at > ?')
    .get(codeHash(normalized), now);
}

async function sendFile(request, response, path, cacheControl) {
  const size = (await stat(path)).size;
  const range = request.headers.range;
  const headers = { 'Content-Type': mimeTypes[extname(path)], 'Cache-Control': cacheControl };
  if (!range) {
    response.writeHead(200, { ...headers, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
    if (request.method === 'HEAD') return response.end();
    return pipeline(createReadStream(path), response);
  }
  const bounds = /^bytes=(\d*)-(\d*)$/.exec(range);
  const start = bounds?.[1] ? Number(bounds[1]) : Math.max(0, size - Number(bounds?.[2]));
  const end = bounds?.[1] && bounds[2] ? Math.min(size - 1, Number(bounds[2])) : size - 1;
  if (!bounds || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end) {
    response.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` });
    return response.end();
  }
  response.writeHead(206, {
    ...headers,
    'Content-Length': end - start + 1,
    'Content-Range': `bytes ${start}-${end}/${size}`,
    'Accept-Ranges': 'bytes',
  });
  if (request.method === 'HEAD') return response.end();
  return pipeline(createReadStream(path, { start, end }), response);
}

async function membership(request, response, path) {
  if (path === '/config' && request.method === 'GET') {
    return json(response, 200, db ? { available: true, contact } : { available: false });
  }
  if (!db) return json(response, 503, { error: 'Membership is unavailable.' });
  const now = Math.floor(Date.now() / 1000);
  if (path === '/codes' && request.method === 'POST') {
    if (!isAdmin(request)) return json(response, 401, { error: 'Admin access is required.' });
    const body = await readJson(request);
    const reference = typeof body.reference === 'string' ? body.reference.trim().toUpperCase() : '';
    if (!/^[A-Z0-9-]{6,48}$/.test(reference) || body.amountPaise !== priceInPaise) {
      return json(response, 400, { error: 'Provide the confirmed payment reference and amount of ₹99.' });
    }
    if (db.prepare('SELECT 1 FROM memberships WHERE payment_reference = ?').get(reference)) {
      return json(response, 409, { error: 'An access code has already been issued for this payment.' });
    }
    const code = randomBytes(10).toString('hex').toUpperCase();
    const expiresAt = now + monthInSeconds;
    db.prepare('INSERT INTO memberships (code_hash, payment_reference, amount_paise, issued_at, expires_at) VALUES (?, ?, ?, ?, ?)')
      .run(codeHash(code), reference, priceInPaise, now, expiresAt);
    return json(response, 201, { code: code.match(/.{5}/g).join('-'), expiresAt });
  }
  if (path === '/access' && request.method === 'POST') {
    const { code } = await readJson(request);
    const access = findMembership(code, now);
    if (!access) return json(response, 403, { error: 'Invalid or expired access code.' });
    return json(response, 200, { expiresAt: access.expires_at });
  }
  if (request.method === 'GET' && path.startsWith('/designs/')) {
    const design = designFiles.get(path.slice('/designs/'.length));
    if (!design) return json(response, 404, { error: 'Design not found.' });
    const access = findMembership(bearer(request), now);
    if (!access) return json(response, 403, { error: 'Valid membership is required.' });
    const file = join(dataDir, 'designs', design);
    await stat(file);
    db.prepare(`
      UPDATE memberships
      SET first_opened_at = COALESCE(first_opened_at, ?), last_opened_at = ?, open_count = open_count + 1
      WHERE code_hash = ?
    `).run(now, now, access.code_hash);
    return sendFile(request, response, file, 'private, no-store');
  }
  return json(response, 404, { error: 'Not found.' });
}

const server = createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (path.startsWith(membershipPath + '/')) {
      await membership(request, response, path.slice(membershipPath.length));
      return;
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      json(response, 405, { error: 'Method not allowed.' });
      return;
    }
    const file = resolve(publicDir, '.' + (path === '/' ? '/index.html' : path));
    if (!file.startsWith(publicDir + sep) || !mimeTypes[extname(file)]) {
      json(response, 404, { error: 'Not found.' });
      return;
    }
    await sendFile(request, response, file, 'no-cache');
  } catch (error) {
    if (response.headersSent) {
      response.destroy();
      return;
    }
    if (error.code === 'ENOENT') return json(response, 404, { error: 'Not found.' });
    if (error instanceof SyntaxError || error instanceof URIError ||
        ['Request too large.', 'Expected JSON.', 'Expected an object.'].includes(error.message)) {
      return json(response, 400, { error: 'Invalid request.' });
    }
    console.error('Request failed:', error.code || error.name);
    json(response, 500, { error: 'The service could not complete the request.' });
  }
});

server.listen(Number(process.env.PORT || 8080), '0.0.0.0');
