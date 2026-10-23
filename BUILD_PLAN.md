# BUILD_PLAN — FALAISE

Living plan. Update the status block first, keep the task list ordered.

**Status:** storefront + admin complete and running locally · not launched · security remediation
open · hosting undecided.

## Finished

**Storefront** (React SPA, all routes render against live data)

- Home: hero, studio index, print beats, spec details, colourways, editorial, drop, closing, footer
- Shop listing, Product page with gallery + size guide, About, Contact, 404
- Checkout as a three-step Instagram DM summary (no payments, by design)
- Cart drawer + persisted cart state, custom cursor, Lenis smooth scroll with reduced-motion opt-out
- Responsive layout, skip link, alt text, aria labels, per-page meta via `usePageMeta`

**Admin** (`/admin.html`, password-gated)

- Login/session/logout, dashboard overview
- Products: create/edit/delete/duplicate, colours, sizes, per-variant stock
- Collections: create/edit/delete/reorder, visibility
- Site content: 19 editable sections (`site`, `banner`, `hero`, `studio`, `stats`, `print`,
  `colours`, `editorial`, `drop`, `testimonials`, `closing`, `links`, `footer`, `sizing`,
  `shipping`, `faq`, `about`, `order`, `policies`)
- Policy pages: `/privacy`, `/terms`, `/returns`, owner-editable as one `policies` content group,
  linked from the footer (seeded as drafts, not yet reviewed by the owner)
- Inquiries: list, edit status, delete; Stock: per-variant + bulk set/add; Activity + stock logs
- Product CSV export, image upload (JPEG/PNG/WebP, 5 MB, magic-byte checked)

**Backend**

- Express 5 API, SQLite schema + seed (`data/falaise.db`), WAL mode, foreign keys on
- Auth: scrypt hashes, HMAC-signed HttpOnly cookie (12 h), rate limit, same-origin check
- Validation layer with per-field errors; prepared statements throughout
- Static serving of `dist/` in production, Vite middleware in dev; security headers (partial)
- `npm run typecheck` clean; `npm run build` produces `dist/` (~1.4 MB)

**Docs**

- `docs/ADMIN.md` — admin and CMS guide
- `docs/SECURITY-AUDIT.md` — 10 findings with reproductions (1 Critical, 1 High)
- `CLAUDE.md` — agent context
- `BUILD_PLAN.md` — this file

## In progress

- Nothing actively being edited. Two decisions block the next phase:
  1. **Where the API lives** (Vercel cannot host Express + `node:sqlite` + writable uploads).
  2. **How much of the security audit to fix before any public exposure.**

## Missing before launch

- Security remediation (dev-mode file exposure, secret rotation) — see P0
- A host that can run the API and persist the database and uploads
- Automated backups and a tested restore
- HTTPS, `COOKIE_SECURE=1`, `APP_ORIGIN`, `trust proxy`
- Sitemap, admin `Disallow`, real 404 status codes, route-level social meta for non-JS scrapers
- Error monitoring and analytics (none today)
- Automated tests and lint (none today), CI
- Privacy/PII policy for inquiry data, retention decision

## Prioritized tasks

### P0 — before anything is public

1. **Close the dev-mode leak** (`docs/SECURITY-AUDIT.md` CRIT-001): deny `/data`, `/server`,
   `/docs`, `.env`, `package*.json`, `tsconfig.json`, `/node_modules` in front of
   `vite.middlewares`, or move `data/` outside the Vite root.
2. **Rotate credentials**: change the admin password, delete `data/admin-credentials.txt`, replace
   `data/session-secret` (invalidates every issued and forged session).
3. **Choose hosting**: persistent Node host for API + SQLite, or Vercel static + managed Postgres
   and object storage (requires rewriting `server/repo.mjs` and uploads).
4. **Backups**: nightly `sqlite3 .backup`/`VACUUM INTO` of `data/falaise.db` plus
   `data/uploads/`, copied off-host; document and test a restore.
5. **HTTPS hardening**: `COOKIE_SECURE=1`, `APP_ORIGIN`, `app.set('trust proxy', 1)`.

### P1 — launch quality

6. Log failed admin logins (IP + time, never the password); add `SIGTERM` drain on the API host.
7. `public/sitemap.xml`; `robots.txt` should `Disallow: /admin.html`, `/admin-login.html`,
   `/api/`, `/uploads/`; keep `/` and the product page allowed.
8. Real 404s: static hosts return 200 for unknown SPA routes. Add an SPA rewrite for known routes
   and a `404.html` fallback (or a host-level rule) so missing products do not look like pages.
9. Route-level meta for crawlers that do not execute JS (og:title/description/image per product):
   prerender the 5–6 public routes at build time, or serve them server-side.
10. Analytics + error monitoring: privacy-friendly page analytics, JS error and API 5xx capture.
11. Tests: API smoke tests (login, `/api/store`, stock update, upload rejection) and Playwright
    coverage of storefront + admin login; wire into CI with `npm run typecheck`.
12. Lint: add ESLint (`eslint-plugin-react-hooks`, `typescript-eslint`) — there is none today.
13. Accessibility + performance pass: axe on every route, Lighthouse mobile, focus trap and Escape
    handling in the cart drawer, image/font budget (2 woff2 subsets already preloaded).

### P2 — after launch

14. Privacy: the pages exist and are editable, but the retention window and deletion process are
    still owner decisions; purge closed inquiries on a schedule and prune the duplicated names in
    the activity log once that is settled.
15. Content ops: export/import content JSON, stock CSV import, and a "restore previous content"
    snapshot, so a bad edit is reversible without a DB restore.
16. SEO extras: `Product`/`Organization` JSON-LD, per-product OG images, `noindex` on 404.
17. Security depth: CSP + HSTS + Permissions-Policy, re-encode uploads server-side, revoke
    sessions on password change (`jti` or secret rotation), map traversal errors to 404.
18. Observability: `/api/health` should also check the database, not just return `{ok:true}`.

## Definition of done for launch

`docs/SECURITY-AUDIT.md` P0 items closed and re-tested · API reachable over HTTPS with persistent
storage · backups verified by an actual restore · storefront and admin smoke tests green · no
secrets in any archive.
