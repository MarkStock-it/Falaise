import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, chmodSync } from 'node:fs'
import { join } from 'node:path'
import { DATA_DIR, db, nowIso } from './db.mjs'

const COOKIE_NAME = 'fls_admin'
const SESSION_TTL_MS = 12 * 60 * 60 * 1000
const SECRET_PATH = join(DATA_DIR, 'session-secret')

function loadSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET
  if (existsSync(SECRET_PATH)) return readFileSync(SECRET_PATH, 'utf8').trim()
  const secret = randomBytes(48).toString('hex')
  writeFileSync(SECRET_PATH, secret, { mode: 0o600 })
  return secret
}

const SECRET = loadSecret()

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

function checkPassword(password, stored) {
  const [scheme, salt, hash] = String(stored).split('$')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  if (candidate.length !== expected.length) return false
  return timingSafeEqual(candidate, expected)
}

export function ensureAdmin() {
  const existing = db.prepare('SELECT password_hash FROM admin WHERE id = 1').get()
  if (existing) return

  let password = process.env.ADMIN_PASSWORD
  let generated = false
  if (!password) {
    password = randomBytes(9).toString('base64url')
    generated = true
  }
  db.prepare('INSERT INTO admin (id, password_hash, updated_at) VALUES (1, ?, ?)').run(
    hashPassword(password),
    nowIso(),
  )

  if (generated) {
    const path = join(DATA_DIR, 'admin-credentials.txt')
    writeFileSync(path, `Admin password: ${password}\n`, { mode: 0o600 })
    try {
      chmodSync(path, 0o600)
    } catch {
      /* Windows ignores POSIX modes; the file is local to the deployment. */
    }
    console.log(`\n  Admin password generated: ${password}`)
    console.log(`  Saved to ${path} — change it with: npm run admin:password\n`)
  }
}

export function setPassword(password) {
  if (typeof password !== 'string' || password.length < 10) {
    throw new Error('Password must be at least 10 characters.')
  }
  const hash = hashPassword(password)
  const existing = db.prepare('SELECT 1 AS ok FROM admin WHERE id = 1').get()
  if (existing) {
    db.prepare('UPDATE admin SET password_hash = ?, updated_at = ? WHERE id = 1').run(hash, nowIso())
  } else {
    db.prepare('INSERT INTO admin (id, password_hash, updated_at) VALUES (1, ?, ?)').run(hash, nowIso())
  }
}

export function verifyPassword(password) {
  const row = db.prepare('SELECT password_hash FROM admin WHERE id = 1').get()
  if (!row) return false
  return checkPassword(String(password ?? ''), row.password_hash)
}

function sign(payload) {
  return createHmac('sha256', SECRET).update(payload).digest('base64url')
}

export function createSessionToken() {
  const expires = Date.now() + SESSION_TTL_MS
  const payload = `${expires}.${randomBytes(12).toString('base64url')}`
  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token) {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [expires, nonce, signature] = parts
  const payload = `${expires}.${nonce}`
  const expected = sign(payload)
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return false
  }
  const expiry = Number(expires)
  return Number.isFinite(expiry) && expiry > Date.now()
}

export function parseCookies(header) {
  const out = {}
  for (const part of String(header ?? '').split(';')) {
    const index = part.indexOf('=')
    if (index === -1) continue
    const key = part.slice(0, index).trim()
    if (!key) continue
    out[key] = decodeURIComponent(part.slice(index + 1).trim())
  }
  return out
}

export function sessionTokenFromRequest(req) {
  return parseCookies(req.headers.cookie)[COOKIE_NAME]
}

export function isAuthenticated(req) {
  return verifySessionToken(sessionTokenFromRequest(req))
}

function cookieAttributes(req) {
  const secure = process.env.COOKIE_SECURE === '1' || req.secure
  return `Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`
}

export function setSessionCookie(req, res, token) {
  res.append(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${Math.floor(
      SESSION_TTL_MS / 1000,
    )}; ${cookieAttributes(req)}`,
  )
}

export function clearSessionCookie(req, res) {
  res.append('Set-Cookie', `${COOKIE_NAME}=; Max-Age=0; ${cookieAttributes(req)}`)
}

/** Reject state-changing requests whose Origin does not match this host. */
export function sameOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const origin = req.headers.origin
  if (!origin) return next()
  try {
    const allowed = new Set([`${req.protocol}://${req.get('host')}`, process.env.APP_ORIGIN].filter(Boolean))
    if (!allowed.has(origin)) {
      return res.status(403).json({ error: 'Cross-origin request rejected.' })
    }
  } catch {
    return res.status(403).json({ error: 'Cross-origin request rejected.' })
  }
  return next()
}

export function requireAuth(req, res, next) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Sign in to continue.' })
  }
  return next()
}

const attempts = new Map()

export function loginAllowed(ip) {
  const entry = attempts.get(ip)
  if (!entry) return true
  if (Date.now() > entry.resetAt) {
    attempts.delete(ip)
    return true
  }
  return entry.count < 8
}

export function recordLoginFailure(ip) {
  const entry = attempts.get(ip)
  if (!entry || Date.now() > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: Date.now() + 10 * 60 * 1000 })
  } else {
    entry.count += 1
  }
}

export function clearLoginFailures(ip) {
  attempts.delete(ip)
}
