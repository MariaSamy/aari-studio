import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { pipeline } from 'node:stream/promises';

const publicDir = fileURLToPath(new URL('../dist', import.meta.url));
const dataDir = resolve(process.env.AARI_DATA_DIR || 'data');
const adminToken = process.env.AARI_ADMIN_TOKEN?.trim();
const contact = parseContact(process.env.AARI_MEMBERSHIP_CONTACT_URL);
const manualUpi = process.env.AARI_MANUAL_UPI_ENABLED === '1';
const keyId = process.env.RAZORPAY_KEY_ID?.trim();
const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
const razorpayEnabled = Boolean(keyId && keySecret &&
  (keyId.startsWith('rzp_live_') ||
    (keyId.startsWith('rzp_test_') && process.env.AARI_PAYMENT_TEST_MODE === '1')));
const qrPath = '/payments/qr_codes';
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
if ((manualUpi || (contact && !razorpayEnabled)) && (!adminToken || adminToken.length < 32)) {
  throw new Error('Set AARI_ADMIN_TOKEN to a secret of at least 32 characters.');
}
if (manualUpi || razorpayEnabled || contact) {
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
    CREATE TABLE IF NOT EXISTS upi_checkouts (
      checkout_hash TEXT PRIMARY KEY,
      qr_id TEXT NOT NULL UNIQUE,
      closes_at INTEGER NOT NULL,
      checked_at INTEGER NOT NULL DEFAULT 0,
      payment_id TEXT UNIQUE,
      payment_reference TEXT
    ) STRICT;
    CREATE TABLE IF NOT EXISTS manual_upi_approvals (
      payment_reference TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      claim_hash TEXT UNIQUE
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

function normalizeReference(value) {
  const reference = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return /^[A-Z0-9][A-Z0-9-]{4,46}[A-Z0-9]$/.test(reference) ? reference : '';
}

async function approveDirectPayment(request, response, now) {
  if (!isAdmin(request)) return json(response, 401, { error: 'Admin access is required.' });
  const body = await readJson(request);
  const reference = normalizeReference(body.reference);
  if (!reference || body.amountPaise !== priceInPaise) {
    return json(response, 400, { error: 'Confirm a credited payment of ₹99 and enter its reference.' });
  }
  if (db.prepare('SELECT 1 FROM memberships WHERE payment_reference = ?').get(reference)) {
    return json(response, 409, { error: 'This payment reference has already been used.' });
  }
  const result = db.prepare('INSERT OR IGNORE INTO manual_upi_approvals (payment_reference, expires_at) VALUES (?, ?)')
    .run(reference, now + monthInSeconds);
  return result.changes
    ? json(response, 201, { status: 'approved' })
    : json(response, 409, { error: 'This payment reference was already approved.' });
}

let manualWindow = 0;
let manualChecks = 0;

async function claimDirectPayment(request, response, now) {
  const { reference: rawReference, code } = await readJson(request);
  const reference = normalizeReference(rawReference);
  if (!reference || typeof code !== 'string' || !/^[A-F0-9]{20}$/.test(code)) {
    return json(response, 400, { error: 'Enter the UPI payment reference from your receipt.' });
  }
  const minute = Math.floor(now / 60);
  if (minute !== manualWindow) {
    manualWindow = minute;
    manualChecks = 0;
  }
  if (manualChecks >= 180) return json(response, 429, { error: 'Please try again shortly.' });
  manualChecks += 1;

  const approval = db.prepare('SELECT expires_at, claim_hash FROM manual_upi_approvals WHERE payment_reference = ?')
    .get(reference);
  if (!approval) return json(response, 202, { status: 'pending' });
  const hash = codeHash(code);
  if (approval.expires_at <= now || (approval.claim_hash && approval.claim_hash !== hash)) {
    return json(response, 409, { error: 'This payment has expired or was already used.' });
  }
  if (!approval.claim_hash) {
    try {
      db.exec('BEGIN IMMEDIATE');
      db.prepare('INSERT INTO memberships (code_hash, payment_reference, amount_paise, issued_at, expires_at) VALUES (?, ?, ?, ?, ?)')
        .run(hash, reference, priceInPaise, now, approval.expires_at);
      db.prepare('UPDATE manual_upi_approvals SET claim_hash = ? WHERE payment_reference = ?').run(hash, reference);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      if (error.errcode === 1555 || error.errcode === 2067) {
        return json(response, 409, { error: 'This payment has already been used.' });
      }
      throw error;
    }
  }
  return json(response, 200, { expiresAt: approval.expires_at });
}

async function razorpay(path, data) {
  const response = await fetch('https://api.razorpay.com/v1' + path, {
    method: data ? 'POST' : 'GET',
    headers: {
      Authorization: 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64'),
      ...(data ? { 'Content-Type': 'application/json' } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    redirect: 'error',
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Payment provider returned HTTP ' + response.status);
  return response.json();
}

let qrWindow = 0;
let qrCount = 0;

async function startUpiCheckout(request, response, now) {
  await readJson(request);
  const minute = Math.floor(now / 60);
  if (minute !== qrWindow) {
    qrWindow = minute;
    qrCount = 0;
  }
  if (qrCount >= 30) return json(response, 429, { error: 'Try again in a minute.' });
  qrCount += 1;
  const qr = await razorpay(qrPath, {
    type: 'upi_qr',
    name: 'Aari Studio',
    usage: 'single_use',
    fixed_amount: true,
    payment_amount: priceInPaise,
    description: '30 days of Aari Studio professional designs',
    close_by: now + 20 * 60,
  });
  const image = new URL(qr.image_url);
  const trusted = ['razorpay.com', 'rzp.io', 'rzp.page'].some(host =>
    image.hostname === host || image.hostname.endsWith('.' + host));
  if (!/^qr_[A-Za-z0-9]+$/.test(qr.id) || !trusted ||
      !['http:', 'https:'].includes(image.protocol) || image.username || image.password || image.port ||
      !Number.isSafeInteger(qr.close_by) || qr.close_by <= now ||
      qr.payment_amount !== priceInPaise || qr.usage !== 'single_use' || qr.fixed_amount !== true) {
    throw new Error('Unexpected payment QR response.');
  }
  image.protocol = 'https:';
  const checkout = randomBytes(10).toString('hex').toUpperCase();
  db.prepare('INSERT INTO upi_checkouts (checkout_hash, qr_id, closes_at) VALUES (?, ?, ?)')
    .run(codeHash(checkout), qr.id, qr.close_by);
  return json(response, 201, { checkout, qrImage: image.href, closesAt: qr.close_by });
}

async function verifyUpiCheckout(request, response, now) {
  const { checkout, reference } = await readJson(request);
  if (typeof checkout !== 'string' || !/^[A-F0-9]{20}$/.test(checkout) ||
      typeof reference !== 'string' || !/^\d{12}$/.test(reference)) {
    return json(response, 400, { error: 'Enter the 12-digit UPI reference.' });
  }
  const hash = codeHash(checkout);
  const order = db.prepare('SELECT * FROM upi_checkouts WHERE checkout_hash = ?').get(hash);
  if (!order) return json(response, 404, { error: 'Payment session not found.' });
  if (order.payment_id) {
    const access = order.payment_reference === reference && findMembership(checkout, now);
    return access ? json(response, 200, { expiresAt: access.expires_at })
      : json(response, 409, { error: 'This payment cannot open the collection.' });
  }
  const check = db.prepare('UPDATE upi_checkouts SET checked_at = ? WHERE checkout_hash = ? AND checked_at <= ?')
    .run(now, hash, now - 5);
  if (!check.changes) return json(response, 429, { error: 'Try again in a few seconds.' });
  const result = await razorpay(qrPath + '/' + order.qr_id + '/payments?count=10');
  const payment = result.items.find(item =>
    /^pay_[A-Za-z0-9]+$/.test(item.id) &&
    item.method === 'upi' && item.status === 'captured' && item.amount === priceInPaise &&
    item.currency === 'INR' && item.amount_refunded === 0 &&
    item.acquirer_data?.rrn === reference && Number.isSafeInteger(item.created_at));
  if (!payment) return json(response, 202, { status: 'unconfirmed' });
  const expiresAt = payment.created_at + monthInSeconds;
  if (expiresAt <= now) return json(response, 410, { error: 'This payment is past its membership period.' });
  db.exec('BEGIN');
  try {
    const seen = db.prepare('SELECT checkout_hash FROM upi_checkouts WHERE payment_id = ?').get(payment.id);
    if (seen && seen.checkout_hash !== hash) {
      db.exec('ROLLBACK');
      return json(response, 409, { error: 'This payment was already used.' });
    }
    if (!seen) {
      db.prepare('UPDATE upi_checkouts SET payment_id = ?, payment_reference = ? WHERE checkout_hash = ?')
        .run(payment.id, reference, hash);
      db.prepare('INSERT INTO memberships (code_hash, payment_reference, amount_paise, issued_at, expires_at) VALUES (?, ?, ?, ?, ?)')
        .run(hash, payment.id, priceInPaise, payment.created_at, expiresAt);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return json(response, 200, { expiresAt });
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
    return json(response, 200, { available: Boolean(db), upi: Boolean(db && razorpayEnabled), manualUpi });
  }
  if (!db) return json(response, 503, { error: 'Membership is unavailable.' });
  const now = Math.floor(Date.now() / 1000);
  if (manualUpi && request.method === 'POST') {
    if (path === '/manual/approve') return approveDirectPayment(request, response, now);
    if (path === '/manual/claim') return claimDirectPayment(request, response, now);
  }
  if (razorpayEnabled && request.method === 'POST') {
    if (path === '/upi/start') return startUpiCheckout(request, response, now);
    if (path === '/upi/verify') return verifyUpiCheckout(request, response, now);
  }
  if (path === '/codes' && request.method === 'POST') {
    if (!adminToken || adminToken.length < 32 || !isAdmin(request)) {
      return json(response, 401, { error: 'Admin access is required.' });
    }
    const body = await readJson(request);
    const reference = typeof body.reference === 'string' ? body.reference.trim().toUpperCase() : '';
    if (!/^[A-Z0-9-]{6,48}$/.test(reference) || body.amountPaise !== priceInPaise) {
      return json(response, 400, { error: 'Provide the confirmed payment reference and amount of ₹99.' });
    }
    if (db.prepare('SELECT 1 FROM memberships WHERE payment_reference = ?').get(reference) ||
        db.prepare('SELECT 1 FROM manual_upi_approvals WHERE payment_reference = ?').get(reference)) {
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
    if (manualUpi && request.method === 'GET' && path === '/admin/payments') {
      const page = fileURLToPath(new URL('./payments.html', import.meta.url));
      return await sendFile(request, response, page, 'no-store');
    }
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
