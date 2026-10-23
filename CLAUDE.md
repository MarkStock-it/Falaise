# CLAUDE.md — FALAISE

Persistent context for AI agents working in this repo. Read this first; keep it current.

## What this is

FALAISE is a small streetwear studio in Liloan, Cebu (Philippines) selling a single garment:
**Vol. 01 "Le Tee"**, a heavyweight cotton tee in noir and blanc. There is no card checkout —
orders are placed by Instagram DM to `@thefalaise.ph`, and the site's job is to present the
piece and hand the customer a pre-filled order message.

The repo is two things in one process:

1. **Storefront** — public marketing site (React SPA): home, shop, product, checkout-as-DM-summary,
   about, contact, privacy/terms/returns, 404.
2. **Admin CMS** — `/admin.html` behind a password: products, colours, variants and stock,
   collections, every string on the storefront (content sections), inquiries, stock log, activity log.

Both read and write the same SQLite database through the same Express API, so an admin edit is
live on the storefront at the next request.

## Stack and versions

Declared ranges in `package.json`; installed versions in parentheses (`npm ls --depth=0`).

- Node **>= 22.5** (engines) — required for `node:sqlite`; developed on Node 24.18.1
- React 19.2 (19.3.1), React DOM 19.2 (19.3.1), React Router 7.9.5 (7.18.4)
- Zustand 5.0.8 (5.0.15) for cart + UI state
- Lenis 1.3.11 (1.3.27) for smooth scrolling
- Vite 7.2.2 (7.3.7), TypeScript 5.9.3, `@vitejs/plugin-react` 5.1 (5.2.0)
- Tailwind CSS 4.1.17 (4.3.3) via `@tailwindcss/vite` — CSS-first config, no `tailwind.config.js`
- Express 5.3 for the API and static serving
- `node:sqlite` (`DatabaseSync`) — no ORM, no query builder, synchronous prepared statements
- Node built-ins for crypto: `scrypt` for passwords, HMAC-SHA256 for session tokens

## Folder structure

```
index.html              storefront entry (Vite input "store")
admin.html              admin app entry (Vite input "admin")
admin-login.html        admin login entry (Vite input "adminLogin")
vite.config.ts          three-rollup-input build; React + Tailwind plugins
tsconfig.json           strict, noEmit, bundler resolution, includes only src/
render.yaml             Render blueprint: one Node web service + 1 GB disk at /data
server/
  index.mjs             createApp(): routes, middleware, headers, error handler, start()
  dev.mjs               dev entry: Express + Vite in middlewareMode on PORT (default 8787)
  db.mjs                schema (idempotent), seed-if-empty, content helpers, activity log
  repo.mjs              all read/write queries + product hydration + CSV export
  backup.mjs            catalogue + content export/restore (inquiries and secrets excluded)
  auth.mjs              scrypt hashing, HMAC sessions, cookies, same-origin, rate limit
  validate.mjs          normalizeProduct/Collection/Inquiry/Content, image decode, CONTENT_KEYS
  env.mjs               minimal .env loader (does not override existing env)
  seed.mjs              default content/products/collections used on first boot
  set-password.mjs      CLI: npm run admin:password
src/
  pages/                Home, Shop, Product, Checkout, About, Contact, Policy, NotFound
  components/layout/    Header, Footer, Layout, CustomCursor, SmoothScroll
  components/product/   ProductGallery, SizeGuide
  components/shop/      ProductCard
  components/cart/      CartDrawer
  components/ui/        Button, Reveal
  admin/                AdminApp, api client, contentSchema, ui primitives
  admin/pages/          Dashboard, Products, Collections, Content, Inquiries, Stock, Activity, Backup, Account
  store/                site.tsx (fetches /api/store), cart.ts, ui.ts
  hooks/                usePageMeta, useMediaQuery, useReducedMotion
  lib/                  cn (class merge), scroll helpers
  api/types.ts          shared StoreData/Product/Content types
  data/products.ts      fallback/typing helpers and price formatting
  styles/index.css      Tailwind import + design tokens (--color-paper/ink/mute/line)
public/                 brand SVGs/PNGs, fonts (subset woff2), photos (webp), og image, robots.txt
data/                   runtime state: falaise.db (+wal/shm), uploads/, session-secret,
                        admin-credentials.txt — never committed, never served in production
docs/                   ADMIN.md (admin/CMS guide), DEPLOY.md (hosting on Render),
                        SECURITY-AUDIT.md, OWNER-INTAKE.md (short owner form),
                        archive/OWNER-INTAKE-full.md (old 300-question version)
dist/                   build output (gitignored); served by `npm start`
tools/                  wordmark SVG generator script + source image
```

## Commands

```bash
npm install                 # install
PORT=8787 npm run dev       # Express + Vite middleware dev (alias: npm run dev)
npm run build               # tsc --noEmit && vite build  -> dist/
npm start                   # production: Express serves dist/ + API (node server/index.mjs)
npm run preview             # vite preview (static only; /api/* returns the SPA shell, not JSON)
npm run typecheck           # tsc --noEmit
npm run admin:password      # set the admin password (prompts; 10+ chars)
```

- **Always pass an explicit `PORT`.** This shell exports `PORT=0`, and `server/dev.mjs` honours
  it, so the server binds an ephemeral port and logs `http://127.0.0.1:0`.
- There is **no test script and no linter**. `npm run typecheck` is the only automated check.
- `npm run preview` serves `dist/` without the API. Verified: `GET /api/store` there returns
  **200 `text/html`** (the SPA shell, not a 404), so `fetchStore()` fails at `response.json()`
  and the storefront renders its "store could not be loaded" state. Expect the error screen, not
  products.

## Environment variables

Names only. Values live in `.env` at the repo root (absent by default; `.env.example` documents
them) or in the process environment. `server/env.mjs` loads `.env` without overriding existing
values. `.gitignore` already excludes `.env`.

| Variable | Purpose | Default |
| --- | --- | --- |
| `ADMIN_PASSWORD` | only used on first boot, when the `admin` row does not exist | random password written to `data/admin-credentials.txt` |
| `PORT` | API + storefront port | 8787 |
| `COOKIE_SECURE` | `1` adds `Secure` to the session cookie (HTTPS only) | off |
| `SESSION_SECRET` | pins the cookie-signing key instead of `data/session-secret` | generated file |
| `APP_ORIGIN` | extra allowed Origin for write requests | none |
| `DB_PATH` | alternate SQLite file | `$DATA_DIR/falaise.db` |
| `DATA_DIR` | one writable directory for the database, `session-secret`, `uploads/` and `admin-credentials.txt`; point it at a mounted disk when hosted | `data/` in the repo |
| `HOST` | interface the production server binds (`npm start`) | `127.0.0.1`; containers need `0.0.0.0` |
| `TRUST_PROXY` | trusted proxy hops (`1` behind a TLS proxy) | off |

## Conventions and patterns

**Server**

- ESM `.mjs`, no build step, no TypeScript on the server.
- Every SQL statement is a prepared statement with `?` placeholders. Keep it that way — the only
  dynamic SQL builds a list of `?` from `value.sizes.length` and passes values separately.
- Validate at the edge with `normalize*()` in `server/validate.mjs`; each returns
  `{ok: true, value}` or `{ok: false, errors}` keyed by form field. Route handlers return
  `{ error, fields? }` with 422 on validation failure.
- Money is stored as integer **cents** (`price_cents`); the API returns both `price` (float, pesos)
  and `priceCents`.
- Product status is derived, not stored: `hidden` if `status = 'hidden'`, else `sold_out` when
  total variant stock is 0, else `active`.
- Writes that change inventory or content call `logActivity(...)`; stock changes also write
  `stock_log` with old/new values.
- Admin routes live on the `admin` router so they inherit `sameOrigin` + `requireAuth`; anything
  registered directly on `app` is public by definition.
- Content is stored as one JSON document per key in the `content` table. The key list is fixed in
  `CONTENT_KEYS` (`site`, `banner`, `hero`, `studio`, `stats`, `print`, `colours`, `editorial`,
  `drop`, `testimonials`, `closing`, `links`, `footer`, `sizing`, `shipping`, `faq`, `about`,
  `order`, `policies`, `chrome`, `shop`, `product`, `contact`, `checkout`, `notFound`) — adding a
  key means editing that array. `policies` holds the three legal documents (`privacy`, `terms`,
  `returns`) rendered by `src/pages/Policy.tsx` at `/privacy`, `/terms` and `/returns`, and linked
  from the footer. `chrome` holds the header nav (`chrome.nav[]` with label/href/index), the bag and
  checkout labels, every page kicker and the numbered section labels; the five page groups hold the
  body copy beneath them (`shop`, `product`, `contact`, `checkout`, `notFound`). Between them, no
  visible string on the storefront needs a code change. `ensureContentKeys()` in `db.mjs` inserts a
  new group's default on boot and deep-merges newly added fields into existing groups; stored
  values always win.
- Content copy may use two tokens, filled at render time by `src/lib/tokens.ts`: `%HANDLE%`
  (Instagram handle) and `%CITY%` (studio city).
- Uploads accept a data-URL JSON body (not multipart), are capped at 5 MB, must match
  JPEG/PNG/WebP magic bytes, and are written with a server-generated filename.

**Frontend**

- Function components, named exports, no default exports.
- Data flows through `useSite()` (`src/store/site.tsx`) for storefront content and `useCart()` /
  `useUi()` for local state; components do not fetch `/api/store` themselves.
- Styling is Tailwind utilities over CSS custom properties (`bg-paper`, `text-ink`, `text-mute`,
  `border-line`, `shell` container). No component library, no inline style objects except
  dynamic values.
- Every page calls `usePageMeta({ title, description, image?, type? })`; it updates title,
  description, OG/Twitter tags, canonical and `og:url` on the client.
- Accessibility baseline already in place: real `<button>`/`<a>`, `alt` text, skip link,
  `aria-*` labels, `prefers-reduced-motion` respected via Lenis and `useReducedMotion`. Keep it.
- Never introduce `dangerouslySetInnerHTML`; React escaping is the XSS defence.

## Deployment

The chosen host is **Render**, one web service with a 1 GB disk mounted at `/data`
(`render.yaml`); see `docs/DEPLOY.md`. Because everything writable sits under `DATA_DIR`, the
same layout works on Railway or Fly. The service is single-instance by design: a second
instance would open a second, empty disk. Not deployed yet.

## Vercel deployment notes

**Read this before touching deployment: the app as written cannot run on Vercel.**

- Framework preset: **Vite**. Build command: **`npm run build`**. Output directory: **`dist`**.
- `npm run build` runs `tsc --noEmit && vite build`, producing `index.html`, `admin.html`,
  `admin-login.html` plus `assets/`, `brand/`, `fonts/`, `og/`, `photos/`, `prints/`.
- Vercel serves that output as static files. The Express server, the SQLite database
  (`node:sqlite`, a local file) and `data/uploads` have **no equivalent** on Vercel's serverless
  runtime: no writable persistent filesystem, no long-lived process. `/api/store` will 404, and
  because `useSite()` treats a failed fetch as a hard error, the storefront renders its error
  screen instead of products.
- Env vars to set in the Vercel dashboard are only meaningful once an API exists there:
  `ADMIN_PASSWORD`, `SESSION_SECRET`, `COOKIE_SECURE`, `APP_ORIGIN`. `PORT` is provided by the
  platform; `DB_PATH` describes a local file and does not apply.
- Node version: Vercel must run Node **22.5+** (`engines.node`), otherwise `node:sqlite` import
  fails.
- Realistic options: (a) host the API on a persistent Node host (VPS, Fly, Render, Railway) and
  point the Vercel-built frontend at it, or (b) keep Vercel static-only and migrate the data layer
  to managed Postgres plus object storage, rewriting `server/repo.mjs` and uploads. Static-only
  Vercel is fine for design previews, not for the live shop.
- If a custom domain is used, set `APP_ORIGIN` to it and `COOKIE_SECURE=1` behind HTTPS.

## Known issues and don't-touch areas

- **`docs/SECURITY-AUDIT.md` is current and unfixed.** The headline issue: `npm run dev` serves the
  whole project root through Vite, so `/data/admin-credentials.txt`, `/data/session-secret` and
  `/data/falaise.db` are downloadable on the dev port, and the leaked secret allows forging an
  admin session. Do not expose the dev port through a tunnel until this is fixed.
- Treat the current admin password and `data/session-secret` as compromised; rotate both.
- **Never commit** `data/` (database, WAL, secrets, uploads), `.env`, or `dist/`.
- **Don't rename** `CONTENT_KEYS` values or `content.*` field paths: `src/admin/contentSchema.ts`
  and the storefront components are wired to them and existing DB rows would silently stop
  rendering.
- **Don't change** the price-unit convention (cents in DB), the derived-status rule, or the
  `variants` uniqueness `(product_id, color_id, size)`.
- `server/index.mjs` passes `{ dotfiles: 'allow' }` to `sendFile` for `dist` because the Windows
  workspace path can contain dot-directories. Removing it breaks admin pages on this machine.
- `server/auth.mjs` writes `admin-credentials.txt` with `mode 0o600`; Windows ignores POSIX modes,
  so the file is only as protected as its folder ACL.
- `node:sqlite` is still flagged experimental on some Node releases; treat schema changes as
  migrations (additive `CREATE TABLE IF NOT EXISTS`, never destructive).

## Current status and next steps

Storefront and admin are functionally complete and verified running from `E:\Falaise`
(`npm run typecheck` clean, `/api/store` 200, all routes render). One Render service with a
disk is prepared (`render.yaml`, `docs/DEPLOY.md`) but **not deployed**: there is no live
instance, no off-site backup and no analytics. Immediate next steps: deploy on Render, rotate
the password and session secret on that instance, remediate `docs/SECURITY-AUDIT.md`
(dev-mode leak), then add sitemap/robots hardening, error monitoring and a launch checklist.
See `BUILD_PLAN.md` for the ordered list.
