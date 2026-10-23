# FALAISE — backend, data handling & leakage audit

Date: 2026-10-21
Scope: `server/*.mjs`, `src/admin/*`, static/upload serving, session handling, data at rest.
Method: source review plus live requests against the dev server (`npm run dev`, :8787) and a
separate production instance (`node server/index.mjs`, :8788). No data was modified.

## Summary

- Findings: 10 (1 Critical, 1 High, 4 Medium, 4 Low)
- Risk level: Critical
- Confidence: High — every finding below was reproduced against a running instance.

The application code itself is solid for its size: prepared statements everywhere, scrypt
password hashing with a per-hash salt and timing-safe comparison, HMAC-signed session
tokens with expiry, HttpOnly + SameSite cookies, an origin check on writes, magic-byte
upload validation, and React-only rendering (no `innerHTML`). The critical issue is not the
app logic — it is what the **development server** exposes.

## Remediation status (2026-10-23)

Each item was repaired and re-tested against a production-mode build (`NODE_ENV=production`,
`HOST=0.0.0.0`, a data directory outside the repo). The findings below are kept as the original
record.

| Finding | Status | What changed |
| --- | --- | --- |
| CRIT-001 dev server publishes the project root | **Fixed** | A guard ahead of `vite.middlewares` answers 404 for `/data`, `/server`, `/docs`, `/screenshots`, `/tools`, dotfiles, `package*.json`, `tsconfig.json`, `vite.config.ts`, `render.yaml` and `node_modules` outside `.vite`. Verified: those paths 404 while `/` and `/src/main.tsx` still serve. |
| HIGH-002 plaintext password and secret | **Partly closed** | A hosted instance now takes `ADMIN_PASSWORD` and `SESSION_SECRET` from the environment, and the dev guard removes the HTTP route to the files. A generated first-boot password is still printed and written to `data/admin-credentials.txt` so a host without shell access stays usable: set `ADMIN_PASSWORD` instead, and delete the file after signing in. Every archive shared before this date still contains the old secret and password. |
| MED-003 malformed cookie throws and returns 500 | **Fixed** | `decodeURIComponent` is wrapped per pair; `Cookie: fls_admin=%` now returns 200 on `/api/admin/session` and 401 on guarded routes. |
| MED-004 failed logins are not recorded | **Fixed** | Each failure writes a `login` row with the client IP and never the attempted password. |
| MED-005 rate limiting without `trust proxy` | **Fixed by configuration** | `TRUST_PROXY=1` is set in `render.yaml` and documented; `req.ip` and `req.secure` follow the proxy. |
| MED-006 sessions survive password changes | **Fixed** | Tokens carry a fingerprint of the stored password hash and are re-checked per request; a password change ends every other session and re-issues the current one. Verified: the old cookie returns 401, the re-issued one 200. |
| LOW-007 CSV formula injection | **Fixed** | Cells beginning with `=`, `+`, `-`, `@`, tab or CR are prefixed with an apostrophe. Verified with a product named `=HYPERLINK(...)`. |
| LOW-008 missing CSP / HSTS / Permissions-Policy | **Fixed** | Production sends a nonce-based CSP (`script-src 'self' 'nonce-…'`), HSTS and a restrictive Permissions-Policy; responses also carry `frame-ancestors 'none'` and `object-src 'none'`. The storefront's JSON-LD block reads the nonce from a meta tag. |
| LOW-009 9 MB JSON parser before authentication | **Fixed** | 1 MB globally; 9 MB only on `/api/admin/uploads` and `/api/admin/restore`. Verified: a 2 MB login body returns 413, a 2 MB image upload returns 201. |
| LOW-010 traversal attempts surface as 500 | **Fixed** | The error handler maps a `403` from `send` instead of falling through. `/uploads/../data/session-secret` now returns 403. |

Still open, and operational rather than code: rotating the credentials that were in earlier
archives, keeping backups off-site, and the fact that `data/` must never be committed or shared.

## Findings

### [CRIT-001] Dev server publishes the whole project root, including secrets (Critical)

- Location: `server/dev.mjs:1-25`; Vite middleware mounted at `server/index.mjs:319`
- Confidence: High
- Issue: Vite's dev middleware serves any file under the project root at its URL path.
  `createApp()` installs `vite.middlewares` without a path guard, so runtime secrets are
  reachable over HTTP on the dev port.
- Evidence (dev, :8787, unauthenticated):
  - `GET /data/admin-credentials.txt` -> 200, `text/plain`, 37 bytes, body starts with
    `Admin password:` — the real password.
  - `GET /data/session-secret` -> 200, 96-character value served, matching the HMAC key.
  - `GET /data/falaise.db` -> 200, 4096 bytes (database header).
  - `GET /server/auth.mjs` -> 200 (server source).
  - `GET /package.json`, `/tsconfig.json`, `/node_modules/express/package.json` -> 200.
  - Production instance (:8788): the same paths return 404 or the SPA shell; `.map` files
    in `dist` = 0. Production is **not** affected.
- Impact: anyone who can reach the dev port gets the admin password and the session signing
  key. With the key, an admin session can be forged without the password: a token signed as
  `HMAC-SHA256(secret, "<expiry>.<nonce>")` returned 200 on `/api/admin/products` and
  `/api/admin/overview`, and `/api/admin/session` replied `{"authenticated":true}`.
  The server binds `127.0.0.1`, so this is local-only today — but `playit` is installed on
  this machine, and any tunnel or reverse proxy to :8787 makes it remote and unauthenticated.
- Fix: put a deny guard in front of the dev middleware (before `vite.middlewares`) that
  blocks `^/(data|server|docs|screenshots)(/|$)` plus `/.env`, `/package*.json`,
  `/tsconfig.json`, `/vite.config.ts`, and `/node_modules` (keeping `/node_modules/.vite`
  if the dependency optimizer needs it), or move `DATA_DIR` outside the Vite root. Better
  still: use `npm run build && npm start` for anything shared.

### [HIGH-002] Admin password and session secret are plaintext, and both are in the backups (High)

- Location: `server/auth.mjs:50-59` (`admin-credentials.txt`), `server/auth.mjs:10-16`
  (`session-secret`)
- Confidence: High
- Issue: the generated password is written to `data/admin-credentials.txt` and never
  removed, even after a password change; the signing secret is a plaintext file. Both, plus
  the SQLite database, are inside `E:\Falaise-source.zip` and the thread copy of
  `falaise-store-source.zip`. `chmod 0o600` is a no-op on Windows, so the files inherit the
  directory ACL (`server/auth.mjs:53-57` acknowledges this).
- Impact: copying or sharing either archive hands over admin access and every customer
  inquiry in the database.
- Fix: delete `data/admin-credentials.txt` after the first sign-in and keep the password in
  a manager; rotate `session-secret` after it has been exposed; exclude `data/` from archives
  or encrypt them.

### [MED-003] Malformed cookie throws and returns 500 (Medium)

- Location: `server/auth.mjs:109-119` (`decodeURIComponent`)
- Confidence: High
- Issue: `Cookie: fls_admin=%` raises `URIError: URI malformed`, which escapes the handler
  and reaches the central error handler as a 500 with a stack trace in the log.
- Evidence: `/api/admin/session` and `/api/admin/products` both returned 500; stderr logged
  `URIError: URI malformed` twice.
- Impact: unauthenticated request-triggered error noise; no data disclosure, no crash.
- Fix: wrap `decodeURIComponent` in try/catch and ignore the malformed pair.

### [MED-004] Failed logins are not recorded (Medium)

- Location: `server/index.mjs:91-105`
- Confidence: High
- Issue: only successful sign-ins call `logActivity('login', ...)`.
- Impact: no way to detect or investigate brute-force attempts; the rate limiter counts them
  in memory only.
- Fix: log failures with IP and time (never the attempted password).

### [MED-005] Rate limiting is per `req.ip` with no `trust proxy` (Medium)

- Location: `server/auth.mjs:170-193`, `server/index.mjs:92`
- Confidence: High
- Issue: the limiter allows 8 attempts per 10 minutes per IP (verified: 8 x 401, then 429).
  Behind a reverse proxy or tunnel every client collapses to one IP, so one attacker locks
  the real admin out for 10 minutes; the map is in memory, so a restart clears it.
- Fix: set `app.set('trust proxy', 1)` behind a proxy, and key on `req.ip` plus a
  per-account counter.

### [MED-006] Sessions survive password changes and cannot be revoked (Medium)

- Location: `server/auth.mjs:7`, `server/set-password.mjs:17`
- Confidence: High
- Issue: tokens are stateless and valid for 12 h; `setPassword()` does not invalidate them,
  as its own message states. Only rotating `data/session-secret` ends all sessions.
- Impact: a stolen session stays valid after remediation.
- Fix: rotate the secret inside `setPassword()`, or store a per-session version or jti.

### [LOW-007] CSV formula injection in the product export (Low)

- Location: `server/repo.mjs:512-515`
- Issue: cells beginning with `=`, `+`, `-` or `@` are not prefixed, so a product name can
  become a spreadsheet formula when the export is opened in Excel.
- Fix: prefix such cells with an apostrophe.

### [LOW-008] Missing CSP / HSTS / Permissions-Policy; cookie omits Secure by default (Low)

- Location: `server/index.mjs:69-74`, `server/auth.mjs:129-132`
- Present: `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`.
  Absent: `Content-Security-Policy`, `Strict-Transport-Security`, `Permissions-Policy`.
  `Secure` appears only when `COOKIE_SECURE=1` or `req.secure`; there is no `trust proxy`,
  so behind an HTTPS proxy `req.secure` stays false — set the environment variable.

### [LOW-009] 9 MB JSON parser runs before authentication (Low)

- Location: `server/index.mjs:75`
- Issue: unauthenticated requests can make the server buffer and parse a 9 MB body.
- Fix: mount a smaller limit globally and the larger one only on `/api/admin/uploads`.

### [LOW-010] Traversal attempts surface as 500 instead of 403/404 (Low)

- Location: `server/index.mjs:347-356`
- Evidence: `/uploads/../data/session-secret` and encoded variants all returned 500
  (`ForbiddenError: Forbidden` from `send`), with a stack trace logged. No file was served:
  `/uploads/` returned 404 and directory listing is off.
- Fix: map `error.status` to the response status instead of falling through to 500.

## Verified good

- SQL injection: every query is parameterised; the only dynamic SQL builds `?` placeholders
  from `value.sizes.length` (`server/repo.mjs:181-185`) and passes the values separately.
- Passwords: scrypt, 16-byte random salt per hash, `timingSafeEqual` comparison.
- Sessions: HMAC-SHA256, 48-byte secret, expiry checked, length check before compare,
  `HttpOnly`, `SameSite=Lax`, `Path=/`, 12 h `Max-Age`.
- CSRF: `SameSite=Lax` plus the `sameOrigin` middleware; a forged `Origin` write returned 403
  before reaching auth.
- AuthZ: every admin route sits behind `requireAuth` (`server/index.mjs:118-120, 282`);
  `/admin.html` redirects (302) when signed out; admin APIs return 401 without a cookie and
  401 with a forged signature.
- Public API: `/api/store` publishes no `totalStock`, no `manualStatus`, and no hidden
  products.
- Uploads: auth-only, 5 MB cap, data-URL regex, JPEG/PNG/WebP magic-byte check,
  server-generated filename, `nosniff`, no SVG, no directory listing, traversal blocked.
- Frontend: zero `dangerouslySetInnerHTML` / `innerHTML` / `eval`; the session lives in an
  HttpOnly cookie, never in `localStorage`.
- No hardcoded credentials or API keys in `src/`, `server/` or `package.json`.
- `.gitignore` already excludes `.env`, the database and WAL, `session-secret`,
  `admin-credentials.txt` and uploads, so a `git init` would not commit secrets.

## Data handling

- At rest: one SQLite file in WAL mode, unencrypted. It holds the admin scrypt hash,
  content, products and stock, the activity log, and `inquiries` (name, contact, message —
  PII).
- Retention: deleting an inquiry removes the row, but the value can persist in
  `falaise.db-wal` and in any earlier archive. There is no purge or export workflow.
- Activity log: customer names are embedded in summaries (`Created inquiry from "…"`), so PII
  is duplicated into a second table that is never pruned.
- Backups: both zips contain `data/`, including credentials, secret and database.

## Priority

1. Rotate the admin password and delete `data/admin-credentials.txt`.
2. Rotate `data/session-secret` (this invalidates every issued session, including any forged
   one).
3. Add the dev-mode deny guard (CRIT-001), or stop using `npm run dev` on a reachable port.
4. Guard `decodeURIComponent` (MED-003) and log failed logins (MED-004).
5. Set `COOKIE_SECURE=1` and `trust proxy` when served over HTTPS; add CSP.
6. Build archives without `data/`.
