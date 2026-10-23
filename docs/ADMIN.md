# FALAISE — admin dashboard & content system

Admin lives at **`/admin.html`** (login at `/admin-login.html`).
The storefront and the admin read and write the same SQLite database through the
same API, so every save is live on the store on the next request.

---

## 1. Hardcoded-content audit

Everything below was hardcoded in the front page before this change. Each row now
maps to an editable field or record. `Content` groups are edited in **Admin → Site
content**; the rest are records.

### Layout / chrome

| Was hardcoded in | Value | Now editable as |
| --- | --- | --- |
| `Header.tsx` | store city label `Cebu` | `content.site.city` |
| `Header.tsx` | mobile “Order” handle + DM URL | `content.links.handle`, `content.links.instagramDm` |
| `Header.tsx` | announcement strip (new) | `content.banner.enabled`, `.text`, `.linkLabel`, `.linkHref` |
| `Footer.tsx` | wordmark, eyebrow, tagline | `content.footer.*` |
| `Footer.tsx` | link columns (Shop ×4, Studio ×4) | `content.footer.columns[].links[]` |
| `Footer.tsx` | Orders handle + note, message link | `content.footer.orders*`, `content.links.*` |
| `Footer.tsx` | address / hours labels + values | `content.footer.address*`, `.hours*` |
| `Footer.tsx` | copyright line, colophon | `content.footer.copyright`, `.colophon` |
| `Header.tsx` | nav labels Shop / Studio / Contact and their 01–03 numbers | `content.chrome.nav[]` (label, href, index) |
| `Header.tsx` | bag button, mobile-menu headings, “Shop Vol. 01” link | `content.chrome.bagLabel`, `.menuOrdersLabel`, `.menuStudioLabel`, `.shopLinkLabel` |
| `index.html` | page title, description, OG image, favicon | `content.site.metaTitle`, `.metaDescription`, `.ogImage`, `.favicon` |

### Home page (`/`)

| Was hardcoded | Now editable as |
| --- | --- |
| Hero eyebrow, location line, 3-line headline, body | `content.hero.eyebrow`, `.location`, `.headline` |
| Hero primary CTA label + destination | `content.hero.ctaLabel`, `.ctaHref` |
| Hero secondary link label + destination | `content.hero.secondary*` |
| Hero main image, alt, caption, frame note | `content.hero.image`, `.imageAlt`, `.imageCaption`, `.imageNote` |
| Hero inset image, alt, caption, note | `content.hero.inset*` |
| Hero spec list (3 × term/value) | `content.hero.specs[]` |
| Studio index, 2-line heading, 2 paragraphs | `content.studio.index`, `.heading`, `.body` |
| Studio link label + href | `content.studio.link*` |
| Studio 4 stats (value + label) | `content.stats[]` |
| Print section index, image, alt, overlay labels | `content.print.*` |
| Print 3 beats (index, kicker, title, body) | `content.print.beats[]` |
| Print link label + href | `content.print.link*` |
| Colourways index, heading, link, product note | `content.colours.*` |
| Colourways row: code, name, fabric, price | **featured product record** (`code`, `name`, `fabric`, `priceCents`) |
| Colourways cards: name, image, swatch, price | **featured product colours** (`name`, `hex`, `front`, `back`, `detail`) |
| Editorial image, alt, kicker, headline, lede, body | `content.editorial.*` |
| Drop label, 2-line vol headline, lede, body | `content.drop.*` |
| Drop order CTA label + Instagram link | `content.drop.ctaLabel`, `content.links.instagramDm` |
| Closing index, statement, two links | `content.closing.*` |
| Testimonials (new, hidden when empty) | `content.testimonials.items[]` |
| Home meta title/description/OG | `content.site.meta*`, `.ogImage` |

### Products, stock, collections

| Was hardcoded | Now editable as |
| --- | --- |
| Product names, slugs, code, tagline | `products.*` |
| Description, bullet details | `products.description`, `products.details[]` |
| Price `₱1,890` | `products.priceCents` |
| Collection / category | `collections.*` + `products.collectionId` |
| Colour names, hex, 3 photos per colour | `product_colors.*` |
| Sizes (S/M/L/XL) | `products.sizes[]` |
| Stock per colour + size | `variants.stock` (Stock page) |
| Preorder / sold-out state | derived from `products.status` + variant stock |
| Featured flag, drop label | `products.featured`, `products.dropLabel` |
| Fabric / fit / made | `products.fabric`, `.fit`, `.made` |
| Instagram handle + DM URL, repeated in ~7 files | `content.links.handle`, `.instagramDm`, `.instagramUrl` |

**Still in code (deliberately):** navigation labels and the Bag button, the page
kickers (`Contact / 03`), the skip link, and the sold-out / wrong-colour labels on
product cards. They are structural, not marketing copy — the words that describe
the garment itself all live in the groups listed above and in
[“Copy that used to live in JSX”](#copy-that-used-to-live-in-jsx).

---

## 2. Stack + data schema

The project already had **Node 24 + Express 5 + Vite/React 19 + Tailwind 4**, with
no backend beyond a static server. Nothing new was installed for storage.

**Storage: `node:sqlite`** (built into Node 24) at `data/falaise.db`, WAL mode,
foreign keys on. Justification:

1. No external database service to buy, deploy or back up separately — the file
   travels with the app and is a one-file copy.
2. It is synchronous and in-process, so admin writes and storefront reads hit the
   same data with zero cache-invalidation code.
3. It runs unchanged on any Node host (VPS, Railway, Fly, a laptop); swapping to
   Postgres later is a repository-layer change, not a UI rewrite.

API: `/api` (public reads, inquiry intake) and `/api/admin/*` (session-protected
writes), same Express process that serves the built SPA and `/uploads`.

### Schema (all in `server/db.mjs`)

| Table | Purpose / keys |
| --- | --- |
| `content` | `key` (site, banner, hero, studio, stats, print, colours, editorial, drop, testimonials, closing, links, footer) → JSON `value`, `updated_at` |
| `collections` | `id`, `name`, `slug`, `description`, `position`, `visible` |
| `products` | `id`, `slug`, `name`, `code`, `tagline`, `description`, `details` JSON, `sizes` JSON, `price_cents`, `collection_id`, `status` (active/hidden/sold_out), `featured`, `drop_label`, `fabric`, `fit`, `made`, `position`, timestamps |
| `product_colors` | `id`, `product_id`, `name`, `hex`, `front`, `back`, `detail`, `position` |
| `variants` | `id`, `product_id`, `color_id`, `size`, `stock` — `CHECK (stock >= 0)`, unique per product/colour/size |
| `stock_log` | `variant_id`, `product_id`, `product_name`, `color_name`, `size`, `old_stock`, `new_stock`, `reason`, `created_at` |
| `activity` | `action`, `entity`, `entity_id`, `summary`, `created_at` (dashboard feed) |
| `inquiries` | `id`, `name`, `contact`, `message`, `product`, `status` (new/read/replied/closed), timestamps |
| `admin` | single row: scrypt `password_hash` |

Validation (`server/validate.mjs`): names/descriptions trimmed and length-capped,
price ≥ 0 integer cents, stock integer 0–99999, slugs generated and de-duplicated,
collection/status enums enforced, image uploads limited to JPEG/PNG/WebP/AVIF/GIF
and 8 MB, decoded by magic bytes before writing. Errors return `422` with
per-field messages, which the admin forms render inline.

---

## 3. Auth — what and why

**Method: single-operator password with a server-side session cookie.**

- Password stored as **scrypt** hash (`N=16384, r=8, p=1`, 16-byte salt, 64-byte key)
  in the `admin` table. Change it in the admin at **Account → Password** (current
  password required, 10+ characters); `npm run admin:password -- '<new>'` remains
  the fallback when nobody is signed in, and is what the first boot writes to
  `data/admin-credentials.txt`.
- Login `POST /api/auth/login` verifies with `timingSafeEqual`, then sets an
  `HttpOnly`, `SameSite=Lax` cookie holding `expiry.hmacSHA256(expiry)` signed with
  a per-install secret in `data/session-secret` (32 random bytes, `0600`).
  TTL 12 hours. `Secure` is added when `COOKIE_SECURE=1` (set it behind HTTPS).
- `/admin.html` is **redirected to `/admin-login.html` at the server** unless the
  cookie verifies; `/admin-login.html` bounces back when it does. So the admin HTML
  is never served publicly, not merely hidden by a client-side route.
- Every `/api/admin/*` route runs the same check, returns `401` otherwise, and
  mutating requests require `Origin`/`Sec-Fetch-Site` to be same-origin (`403`).
- Login is throttled to **8 attempts per 10 minutes per IP**; failures are generic
  and constant-time-ish. No public signup, no password reset endpoint.
- Cookies are not accepted over `GET /admin.html` for cross-site requests, so a
  CSRF form post cannot mint a session; writes are double-guarded by the origin check.

**Why not OAuth / a hosted identity provider:** the store has exactly one operator
and no external users. Adding an IdP would mean another account, another outage
surface and another secret to hold, for a login that is a password. Server-side
session gating is also required for `/admin.html` itself, which an SPA-only guard
cannot provide if the HTML is public. If more staff accounts are needed later, the
`admin` table grows to a users table and the same cookie logic stays.

> The first-boot password is in `data/admin-credentials.txt` (git-ignored). Rotate
> it at **Account → Password** in the admin, or with
> `npm run admin:password -- '<new password>'` if you are locked out. Session
> tokens carry a fingerprint of the stored password hash, so a change ends every
> other session at once while the browser that made it stays signed in. Rotating
> `SESSION_SECRET` additionally ends that one.

---

## 4. File structure

```
server/
  index.mjs        Express app: API, auth gate, uploads, SPA fallback
  auth.mjs         scrypt hashing, cookie signing, throttle, middleware
  db.mjs           node:sqlite connection, schema, seed, activity log
  repo.mjs         queries: products, variants, stock log, collections, content, inquiries
  validate.mjs     field validation + magic-byte image decoding
  seed.mjs         first-run demo catalogue
  set-password.mjs CLI: npm run admin:password -- '<password>'
  dev.mjs          vite middleware dev server

src/
  admin/           separate entry (admin.html → main.tsx → AdminApp.tsx)
    AdminApp.tsx   shell, nav, auth state, mobile section select
    api.ts         typed fetch wrapper, 401 → login, field errors
    contentSchema.ts  field definitions + defaults for every content group
    ui.tsx         Field, Input, Textarea, Toggle, ImageInput, Modal, Toast, etc.
    format.ts      money / date / slug helpers
    pages/         Dashboard, Products, Stock, Collections, Content, Inquiries, Activity
  store/site.tsx   SiteProvider: one fetch of /api/site shared by storefront + cart
  pages/           Home, Shop, Product, About, Contact, Checkout, Policy, NotFound
  data/products.ts types + helpers (formatPrice, isSoldOut, availableSizes)

docs/ADMIN.md      this file
data/              SQLite db, uploads/, session secret, credentials (git-ignored)
```

Admin pages, left to right: **Dashboard** (low stock, sold out, counts, recent
activity, inquiries), **Products** (search/filter, create/edit/duplicate/delete,
per-colour images, sizes, stock matrix, featured, status), **Stock** (search,
filter low/out, ±1/±5 and direct input, bulk restock modal, full change log),
**Collections** (CRUD, reorder, visibility), **Site content** (every group above
with image uploads, add/remove list rows), **Inquiries** (status workflow, reply by
email/DM, delete), **Activity** (audit trail). Every list has search, filters,
loading skeletons, empty states and error retry; deletes open a confirm dialog.
“View store” opens `/` in a new tab.

---

## 5. Test checklist (run against the production build)

| # | Test | Result |
| --- | --- | --- |
| 1 | `POST /api/admin/products` with name only | `422` per-field errors (`name`, `priceCents`, `slug`) |
| 2 | Create “Test Tee” via admin → appears on `/shop` and `/product/<slug>` | ✅ |
| 3 | Set a new variant's stock 0 → 7 on Stock page → PDP add-to-bag enables, log records `0 → 7` (reason `manual`) | ✅ |
| 4 | Set status `hidden` → product disappears from Shop and home colourways | ✅ |
| 5 | Decrease stock to 0 → card shows Sold out, PDP disables sizes and add-to-bag | ✅ |
| 6 | Bulk restock S/M/L to 12 → variants updated in one transaction, logged as `bulk` | ✅ |
| 7 | Duplicate product → new slug `test-tee-copy`, stock cloned, both listed | ✅ |
| 8 | Delete with confirm → gone from admin and store, `activity` row written | ✅ |
| 9 | `/admin.html` in a fresh profile → `302 /admin-login.html`; wrong password → generic error | ✅ |
| 10 | `POST /api/admin/stock` without cookie → `401`; with foreign `Origin` → `403` | ✅ |
| 11 | Banner text save → ink strip renders on every page, header/layout offset by 36px | ✅ |
| 12 | Hero headline save → `/` shows new copy without a rebuild | ✅ |
| 13 | Testimonial add → section appears; remove last → section hidden | ✅ |
| 14 | CSV export → `text/csv`, one row per colour/size with stock | ✅ |
| 15 | Upload 9 MB `.png` → `413`; upload `.svg`/`.txt` → `422` | ✅ |
| 16 | Admin at 390 px width → section select replaces tabs, no horizontal scroll, stock buttons ≥ 40 px | ✅ |
| 17 | Storefront at 390 px → no overflow, no console errors | ✅ |

Run locally: `npm install && npm run build && npm start` → <http://localhost:8787>
(the database seeds itself on first boot). Dev with HMR: `npm run dev`.
Push a real revalidation through the running server at any time with
`node .tmp/verify3.mjs` (14 endpoint checks, cleans up after itself).

---

## Copy that used to live in JSX

Five more groups were added so seasonal copy no longer needs a rebuild. They follow the same
Content tab pattern as the first thirteen. A sixth, `policies`, holds the three legal pages
(`/privacy`, `/terms`, `/returns`) as editable documents. A seventh, `chrome`, holds the header
nav (label, link and number per item) plus every page kicker, numbered section label and the
small labels in the bag and checkout.

| Group | Renders on | Notes |
| --- | --- | --- |
| `sizing` | product size drawer | One row per size; the drawer shows only sizes the product has. |
| `shipping` | product page policy block, bag shipping line, product cards | Bullets accept `%CITY%` and `%HANDLE%`; `stockLabel` is the "in stock / ships in…" line. |
| `faq` | contact page | Hidden entirely when `questions` is empty. |
| `about` | `/about` | Hero, manifesto, process passes, facts table. |
| `order` | bag and contact steps, pre-filled DM | `dmIntro` / `dmOutro` wrap the generated line items. |
| `policies` | `/privacy`, `/terms`, `/returns`, footer policy links | One heading, intro and repeatable numbered sections per document. Link labels come from each document's heading. |
| `chrome` | header nav, bag drawer, checkout labels, page kickers, numbered section labels, 404 | `chrome.nav` is the header menu (label / link / number). Every other field is a single label, prefixed in the admin by the page it appears on. |
| `shop` | `/shop` construction block and empty catalogue | `%COLLECTION%` becomes the collection name; `%HANDLE%` becomes the Instagram DM link. |
| `product` | product gallery note and the “worn” section | `lookLabel` prefixes the look numbers; `frontLabel` / `backLabel` caption the views. |
| `contact` | `/contact` hero, the two explainer blocks, contact rows, notes and closing line | Order steps come from `order`; questions from `faq`. |
| `checkout` | `/checkout` headline, order note, empty-bag state, clipboard help | Three empty-bag lines for no product, one product, several. `%HANDLE%` is filled in. |
| `notFound` | 404 headline and paragraph | The kicker, corner label and tagline stay in `chrome`. |

Adding a field to an existing group is safe: `ensureContentKeys()` deep-merges defaults into
stored rows on boot, and stored values always win. Adding a *group* means adding it to
`CONTENT_KEYS`, `DEFAULT_CONTENT`, `SiteContent` and `CONTENT_GROUPS`.

---

## Backup and restore

**Admin -> Backup** exports one JSON file and restores it.

| Action | Endpoint | What it touches |
| --- | --- | --- |
| Download | `GET /api/admin/backup` | reads `products`, `product_colors`, `variants`, `collections`, `content` |
| Restore | `POST /api/admin/restore` | replaces exactly those five tables, inside one transaction |

Excluded on purpose: `inquiries` (customer personal data), `admin` (password hash),
`stock_log` and `activity` (append-only history), plus the session secret. A restore therefore
never destroys the DM inbox or the audit trail, and the file is safe to move between machines.

**Admin -> Backup -> Full archive** downloads `GET /api/admin/backup/archive`: a gzipped tar
containing `falaise.db`, every file in `uploads/` and a `manifest.json`. It is built from a
`VACUUM INTO` snapshot, so the database is consistent even though the shop never stops. This
is the file to keep off-site: unlike the JSON export it *does* contain inquiries, the admin
hash and the images, so treat it as private, and restore it by stopping the service and
replacing `falaise.db` and `uploads/` inside the data directory.

Restore validates before writing: app marker, version, unique ids and slugs, every colour and
variant pointing at a record that exists in the file, no duplicate colour+size variant, content
keys restricted to `CONTENT_KEYS`, and 200 kB per content section. Any failure returns `422`
with a reason; a mid-write failure rolls the transaction back. Success writes a `restore` row
to the activity log.
