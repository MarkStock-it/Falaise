# FALAISE — Owner Information Sheet

**What this is:** every value currently hardcoded, seeded, or invented in the Falaise codebase, written as a question you can answer. Fill it in and hand it back — or type the answers straight into `/admin.html` where a field already exists.

**Who fills it in:** the owner (or whoever knows the pricing, shipping and stock reality).
**Date started:** ____________  **Returned by:** ____________

---

## Part 0 — How to use this

There are three kinds of items in here. Each one is tagged:

| Tag | Meaning |
|---|---|
| **[ADMIN]** | Already editable. You can change it yourself at `/admin.html` → **Content** or **Products**. No developer needed. |
| **[DOC]** | Not editable yet. You answer here, and it becomes a code change (usually a small one). |
| **[BUILD]** | Doesn't exist yet. Needs to be designed and built before it can be answered. |
| **[SECRET]** | Never write this in this file. Instructions are in Part 1. |

**Rules for filling this in**

1. Answer in the space after `→`. Blank means "leave as-is".
2. If something marked **[ADMIN]** is already correct, write `OK`.
3. If you don't know, write `?` — do not guess. A wrong shipping promise on the site is worse than no promise.
4. This file is inside the repo. **Never put the admin password, GCash number, or bank details in it.** See Part 1 and Part 4.
5. Short answers are fine. One line each.

**If you only have ten minutes**, skip to [Part 9 — The short version](#part-9--the-short-version-minimum-viable-answers). It covers the twelve things that block launch.

---

## Part 1 — Access & admin password  [SECRET]

The admin panel at `/admin.html` is protected by a single password. It is stored **hashed** in the database (scrypt), so nobody — including me — can read it back out. What exists on disk is `data/admin-credentials.txt`, written once on first boot in plain text. That file is a leak waiting to happen and should be deleted.

**How the password is set**

```bash
npm run admin:password      # prompts: "New admin password (10+ characters)"
```

- Minimum 10 characters. Use a passphrase, not a word.
- Setting it here changes it immediately in the database.
- It does **not** invalidate sessions already logged in. If you think the password leaked, also rotate `data/session-secret` (deleting that file makes the server generate a new one, which logs every existing session out).

**Question 1.1** — Who should hold the admin password?

→ ______________________________________________

**Question 1.2** — Has the current password ever been shared over chat, email, or a screenshot? (If yes, rotate it — the dev server currently exposes that file on localhost.)

→ ______________________________________________

**Question 1.3** — Do you want a second, read-only admin login (e.g. for a staff member who packs orders but shouldn't change prices)? **[BUILD]** — the app currently has exactly one account, with full access.

→ Yes / No / Later

**Never in this file:** the password itself. Record it in a password manager. If you want me to set it for you, run the command yourself and tell me only "done".

---

## Part 2 — Identity & contact

Currently seeded with placeholder-ish values. The Instagram handle is real; the rest needs confirming.

### 2.1 Store identity  [ADMIN → Content → Identity & SEO]

| # | Question | Currently on the site | Your answer |
|---|---|---|---|
| 2.1.1 | Exact store name as it should be displayed (all caps?) | `FALAISE` | → |
| 2.1.2 | Tagline, one line | `Rompre avec l'ordinaire.` | → |
| 2.1.3 | City / location label | `Liloan, Cebu` | → |
| 2.1.4 | Browser tab title (60 chars max, shown in Google) | `FALAISE — Rompre avec l'ordinaire` | → |
| 2.1.5 | Search-result description (150–160 chars) | "One tee. Two colours. FALAISE Vol. 01 is a heavyweight cotton tee, boxy and cropped…" | → |

### 2.2 Contact channels  [ADMIN → Content → Order & contact links]

| # | Question | Currently | Your answer |
|---|---|---|---|
| 2.2.1 | Instagram handle | `@thefalaise.ph` | → |
| 2.2.2 | Instagram profile URL | `https://instagram.com/thefalaise.ph` | → |
| 2.2.3 | Direct-message URL (the `ig.me` link the order button opens) | `https://ig.me/m/thefalaise.ph` | → |
| 2.2.4 | Email address to publish (optional — currently hidden) | *(empty)* | → |
| 2.2.5 | Phone / Viber / WhatsApp to publish (optional) | *(none)* | → |
| 2.2.6 | Full street address, if you want it public | only `Liloan, Cebu` | → |
| 2.2.7 | Business hours, as you want them written | `Always open` | → |
| 2.2.8 | Which channel is the *primary* order channel? (all copy assumes Instagram DM) | Instagram DM | → |

### 2.3 Non-Instagram links

| # | Question | Currently | Your answer |
|---|---|---|---|
| 2.3.1 | Facebook page, TikTok, Shopee, Lazada — any to link? (none are wired up) | *(none)* | → |
| 2.3.2 | Should there be a newsletter / waitlist signup? **[BUILD]** — no email capture exists anywhere | *(none)* | Yes / No |

---

## Part 3 — Products, pricing & stock

This is the section that most needs real numbers. **Every price and stock figure on the live site today is seed data I invented.** Price `₱1,890` was a placeholder; stock counts (4 / 9 / 3 / 0 / 0 / 6 / 7 / 2) are fiction.

### 3.1 The piece  [ADMIN → Products → Le Tee]

| # | Question | Currently | Your answer |
|---|---|---|---|
| 3.1.1 | Product name | `Le Tee` | → |
| 3.1.2 | Product code / SKU prefix | `001` | → |
| 3.1.3 | Tagline, one line | `Rise above the ordinary.` | → |
| 3.1.4 | Long description (2–4 sentences, shown on the product page) | "One tee, cut boxy and cropped at the waist…" | → |
| 3.1.5 | Drop / volume label | `VOL. 01` | → |
| 3.1.6 | Fabric description | `Heavyweight cotton` | → |
| 3.1.7 | Fit description | `Boxy crop / true to size` | → |
| 3.1.8 | "Made" line | `Limited run / Cebu` | → |

**3.1.9 — Bullet spec list** (`details`). Currently five invented bullets. Give the real ones, in order; 3–6 is ideal.

```
1. → 
2. → 
3. → 
4. → 
5. → 
```

### 3.2 Price

| # | Question | Currently | Your answer |
|---|---|---|---|
| 3.2.1 | Retail price per tee, in pesos | `₱1,890` | → |
| 3.2.2 | Same price for noir and blanc? (the app stores **one** price per product, not per colour) | same | → |
| 3.2.3 | Any size surcharge (e.g. XL costs more)? **[BUILD]** — not supported, one price for all sizes | none | → |
| 3.2.4 | Was / compare-at price to show as struck-through? **[BUILD]** — no field exists | none | → |
| 3.2.5 | Bundle price (e.g. both colours)? **[BUILD]** | none | → |
| 3.2.6 | Wholesale / reseller price and minimum quantity (kept private, or published?) | none | → |
| 3.2.7 | Does the displayed price include VAT / is the studio VAT-registered? | unknown | → |
| 3.2.8 | Currency — confirm the site should show `₱` with `en-PH` formatting | `₱1,890` | → |
| 3.2.9 | Are prices negotiable in DM, or fixed? | implied fixed | → |

### 3.3 Variants & stock  [ADMIN → Stock]

Current grid (all invented). Give **real counts per colour + size**. Use `0` for sold out — the site flips the size to "sold out" automatically and marks the whole product sold out when every cell is 0.

| Colour | S | M | L | XL | Notes (restock date, etc.) |
|---|---|---|---|---|---|
| **Noir** (hex currently `#161616`) | → | → | → | → | → |
| **Blanc** (hex currently `#e8e3d7`) | → | → | → | → | → |

| # | Question | Currently | Your answer |
|---|---|---|---|
| 3.3.1 | Are the colour names right? (`Noir`, `Blanc`) | Noir / Blanc | → |
| 3.3.2 | Exact hex for each colourway, if you know them | `#161616` / `#e8e3d7` | → |
| 3.3.3 | Size range — confirm S–XL unisex | S, M, L, XL | → |
| 3.3.4 | Is there an XXS or XXL? **[BUILD]** — sizes are per product, editable, but the size chart only has S–XL rows | none | → |
| 3.3.5 | Restock plan: is Vol. 01 a one-time run, or will sizes be reprinted? | `Limited run` | → |
| 3.3.6 | Low-stock warning threshold (site logs stock changes at this level) | `3 units` | → |
| 3.3.7 | Should low stock be *shown* to customers ("only 2 left")? **[BUILD]** — stock is never sent to the storefront | hidden | → |

### 3.4 Collections

| # | Question | Currently | Your answer |
|---|---|---|---|
| 3.4.1 | Collection name | `Vol. 01` | → |
| 3.4.2 | Collection description | `One tee, two colours, one run.` | → |
| 3.4.3 | Is there a Vol. 02 planned? Name + timing (this decides whether the site needs a multi-collection shop page) | none | → |

---

## Part 4 — Shipping, payment & returns

> **Read this before answering.** The site currently *promises* things you may not be able to keep: "PH delivery in 2–4 working days", "worldwide rates quoted on request", "returns within 14 days", "we cover return shipping if faulty". Those promises are on the product page and in the Contact FAQ today. Either confirm them or correct them — this is the section with actual legal and customer-service consequences.

### 4.1 Shipping  [DOC — these lines are hardcoded in `Product.tsx`]

| # | Question | Currently promised | Your answer |
|---|---|---|---|
| 4.1.1 | Where do you ship? (PH only / PH + intl / specific countries) | PH + worldwide quoted | → |
| 4.1.2 | Dispatch lead time — how many days from confirmed payment to courier handover? | not stated | → |
| 4.1.3 | Delivery estimate within the Philippines | 2–4 working days | → |
| 4.1.4 | Delivery estimate for provincial / remote | "a day longer" | → |
| 4.1.5 | International: flat rate, by weight, or quoted per order? | quoted per order | → |
| 4.1.6 | If flat rate: how much, to where? | — | → |
| 4.1.7 | Courier(s) you actually use (J&T, LBC, Ninja Van, Lalamove, Grab, PH Post) | not stated | → |
| 4.1.8 | Free shipping threshold, if any | none | → |
| 4.1.9 | Packaging: what does it arrive in? (part of the brand story — worth one line) | not stated | → |
| 4.1.10 | Do you ship to PO boxes / pick-up points? | not stated | → |
| 4.1.11 | Store pickup available? Where, and by appointment? | not stated | → |
| 4.1.12 | Who pays shipping on a return? | studio if faulty, else customer | → |
| 4.1.13 | Do you combine shipping for multiple items? | not stated | → |

### 4.2 Payment — **do not write account numbers here**

Payment never happens on the site; it happens in the DM thread. So the site only needs to say **which methods exist**, never the numbers.

| # | Question | Currently | Your answer |
|---|---|---|---|
| 4.2.1 | Accepted methods — list the names only (GCash, Maya, BPI, BDO, cash on delivery, etc.) | not stated anywhere | → |
| 4.2.2 | Is cash on delivery offered? | no | → |
| 4.2.3 | Deposit required for orders / for international? (% or flat) | no | → |
| 4.2.4 | How long do you hold stock for an unpaid order? | not stated | → |
| 4.2.5 | Any payment instructions the *customer* should read on the site (generic wording, no numbers)? | none | → |

**Where the actual account details live:** in the DM, and in your password manager. If you want them stored in the project, they belong in `.env` (gitignored), never in `docs/` or the database. Tell me if you want that set up.

### 4.3 Returns & exchanges  [DOC — `Product.tsx` + `Contact.tsx` FAQ]

| # | Question | Currently promised | Your answer |
|---|---|---|---|
| 4.3.1 | Return window | 14 days from delivery | → |
| 4.3.2 | Condition required | unworn, unwashed, tags on | → |
| 4.3.3 | Exchanges offered for wrong size? | not stated | → |
| 4.3.4 | Refund method (cash, transfer, store credit) | not stated | → |
| 4.3.5 | Sale / final-sale items excluded? | not stated | → |
| 4.3.6 | Faulty item process — photo first, then what? | studio covers postage | → |
| 4.3.7 | Is there a written returns policy page? **[BUILD]** — no policy pages exist on the site at all | none | → |

---

## Part 5 — Sizing & product detail

### 5.1 Size chart  [DOC — hardcoded in `SizeGuide.tsx` as inches]

Currently these numbers are invented. Measure a real tee, laid flat. Width = armpit to armpit; length = shoulder seam to hem; sleeve = shoulder to sleeve end.

| Size | Width (in) | Length (in) | Sleeve (in) | Your answer (if these are wrong) |
|---|---|---|---|---|
| S | 19 | 24 | 8.5 | → |
| M | 20 | 25 | 9 | → |
| L | 21 | 26 | 9.5 | → |
| XL | 22 | 27 | 10 | → |

| # | Question | Currently | Your answer |
|---|---|---|---|
| 5.1.1 | Unit shown — inches, or centimetres? | inches | → |
| 5.1.2 | Fit advice line (shown above the table) | "Boxy crop fit — take your usual size, or size up for more length…" | → |
| 5.1.3 | Should the chart be per-colour (if noir and blanc run differently)? **[BUILD]** — one chart for the product | shared | → |
| 5.1.4 | Do you have a model / fit reference? (height + size worn, e.g. "5'9", wearing M") **[BUILD]** — no field for it | none | → |

### 5.2 Care instructions  [DOC — in the Contact FAQ]

| # | Question | Currently | Your answer |
|---|---|---|---|
| 5.2.1 | Wash instructions | "Wash cold, inside out, with like colours…" | → |
| 5.2.2 | Drying | "Do not tumble dry hot; hang or lay flat" | → |
| 5.2.3 | Ironing | "Do not iron directly over the back print" | → |
| 5.2.4 | Any shrinking to warn about (garment-washed?) | "washed once before it arrives" | → |

### 5.3 FAQ  [DOC — four questions hardcoded in `Contact.tsx`]

These four answers are on the site right now as if they were yours. Confirm each, or replace.

| # | Question on site | Your answer |
|---|---|---|
| 5.3.1 | "How does Le Tee fit?" | → |
| 5.3.2 | "Where do you ship, and how long does it take?" | → |
| 5.3.3 | "How should I care for the print?" | → |
| 5.3.4 | "Can I return or exchange a tee?" | → |
| 5.3.5 | Any question to **add**? (e.g. "Is it unisex?", "Do you restock?") | → |

---

## Part 6 — Editorial copy

Every word below is currently written by me in the studio's voice. It reads well, but it is not yours. Mark each `OK` to keep it, or rewrite.

### 6.1 Home — hero  [ADMIN → Content → Hero]

| Field | Currently | Your answer |
|---|---|---|
| Eyebrow | `Vol. 01 / Le Tee` | → |
| Headline (3 lines) | `Rompre` / `avec` / `l'ordinaire.` | → |
| Intro paragraph | "One heavyweight cotton tee, cut boxy and cropped…" | → |
| Primary button | `Shop Le Tee` → `/product/le-tee` | → |
| Secondary link | `The studio` → `/about` | → |
| Spec strip | `Cut: Boxy crop / S–XL` · `Cloth: Heavyweight cotton` · `Colour: Noir + Blanc` | → |

### 6.2 Home — studio section  [ADMIN → Content → Studio section]

| Field | Currently | Your answer |
|---|---|---|
| Section label | `01 / The studio` | → |
| Heading | `One tee.` / `Cut once.` | → |
| Paragraph 1 | "FALAISE is a small studio working from Liloan, Cebu…" | → |
| Paragraph 2 | "There is no seasonal calendar and no second silhouette…" | → |
| Link | `Read the studio notes` → `/about` | → |

### 6.3 Home — stat strip  [ADMIN → Content → Stat strip]

| # | Value | Label | Your answer |
|---|---|---|---|
| 1 | `01` | piece in Vol. 01 | → |
| 2 | `02` | colours, one cut | → |
| 3 | `01` | screen print, by hand | → |
| 4 | `S–XL` | unisex sizing | → |

### 6.4 Home — details / print  [ADMIN → Content → Details & print]

Three "beats" (cut / mark / back), plus captions. Confirm or rewrite each `title` and `body`.

| Beat | Currently | Your answer |
|---|---|---|
| 01 — The cut | "Boxy, cropped, done." | → |
| 02 — The mark | "Small at the chest." | → |
| 03 — The back | "Rompre avec l'ordinaire." | → |

### 6.5 Home — colourways  [ADMIN → Content → Colourways]

| Field | Currently | Your answer |
|---|---|---|
| Heading | `Two colours` | → |
| Product note | `Boxy crop / S–XL` | → |

### 6.6 Home — editorial band  [ADMIN → Content → Editorial band]

| Field | Currently | Your answer |
|---|---|---|
| Kicker | `The edge / Vol. 01` | → |
| Headline | `The edge is the point.` | → |
| Lede | "Falaise, French for cliff. The place where the ordinary stops." | → |
| Body | "Vol. 01 takes its name from the edge…" | → |

**Important:** is the name-origin story true? "Falaise = French for cliff" is the brand rationale written across the site. Confirm it, because if the name came from somewhere else, that paragraph is fiction.

→ ______________________________________________

### 6.7 Home — drop / order CTA  [ADMIN → Content → Drop & order CTA]

| Field | Currently | Your answer |
|---|---|---|
| Eyebrow | `The drop` | → |
| Headline | `Vol.` / `01` | → |
| Lede | "One tee. Two colours. One run…" | → |
| Body | "Send the colour and size in an Instagram message…" | → |
| Button | `Order on Instagram` | → |

### 6.8 Testimonials  [ADMIN → Content → Testimonials]

Currently **empty** — the section hides itself. Do you have 2–4 real customer quotes with permission to publish? (Quote, first name or initial, detail like "M / Cebu".) Never invent these.

```
1. → 
2. → 
3. → 
```

### 6.9 Closing note  [ADMIN → Content → Closing note]

| Field | Currently | Your answer |
|---|---|---|
| Statement | `Break with the ordinary, then wear it in.` | → |
| Primary link | `Shop Vol. 01` | → |
| Secondary link | `Ask a question` → `/contact` | → |

### 6.10 Footer  [ADMIN → Content → Footer]

| Field | Currently | Your answer |
|---|---|---|
| Tagline | `One tee. Two colours. Cut once, worn until it knows you.` | → |
| Message link label | `Message @thefalaise.ph` | → |
| Orders note | "Message us on Instagram to order…" | → |
| Address | `Liloan, Cebu` | → |
| Hours | `Always open` | → |
| Copyright | `© 2026 Falaise Studio` — correct legal name? | → |
| Colophon | `Independent / Liloan, Cebu` | → |

### 6.11 About page  [DOC — hardcoded in `About.tsx`]

Three pillars (Pattern / Print / Run), a spec table (City, Volume, Piece, Colourways, Sizes, Fit, Print), and the hero line "Wear it until it knows you." All mine. Confirm as a block, or rewrite.

→ ______________________________________________

### 6.12 Announcement banner  [ADMIN → Content → Announcement banner]

Currently **off**. It's the strip above the header — use it for a restock, a shipping pause, or a drop date.

| Field | Currently | Your answer |
|---|---|---|
| Show it? | off | → |
| Text | `Vol. 01 — Le Tee in noir and blanc.` | → |
| Link label + URL | *(empty)* | → |

### 6.13 Header navigation  [DOC — hardcoded in `Header.tsx`]

The top nav is three fixed links: `Shop / 01`, `Studio / 02`, `Contact / 03`. If you ever add a page (journal, stockists, size guide), the nav needs a code change. Anything you want added now?

→ ______________________________________________

### 6.14 Order-step copy  [DOC — `Checkout.tsx`, `Contact.tsx`]

The three-step "how ordering works" text, and the pre-filled DM template the buyer copies:

```
Hi FALAISE — I would like to order:

2 × Le Tee — Noir / M — ₱3,780

Subtotal: ₱3,780
Please confirm stock, shipping and payment.
```

| # | Question | Your answer |
|---|---|---|
| 6.14.1 | Keep this DM wording? Any line to add (e.g. "My name is…", "Deliver to…")? | → |
| 6.14.2 | Should the template ask for the buyer's name and address up front, to save a round trip? | → |
| 6.14.3 | Step 3 currently says "we confirm stock, shipping and payment, then send the total". Accurate? | → |

---

## Part 7 — Legal, tax & privacy

There are **no legal pages on this site at all** — no privacy policy, no terms, no returns policy page. That is fine for a design preview and not fine once real inquiries arrive, because the admin panel collects names, contact details and messages.

| # | Question | Status | Your answer |
|---|---|---|---|
| 7.1 | Registered business name (for the footer / copyright) | `Falaise Studio` (invented) | → |
| 7.2 | DTI / SEC registration number — publish it, or keep private? | none | → |
| 7.3 | BIR / VAT status — do you issue official receipts? | unknown | → |
| 7.4 | Privacy policy: do you want one written? **[BUILD]** | missing | Yes / No / Later |
| 7.5 | Terms of sale page? **[BUILD]** | missing | Yes / No / Later |
| 7.6 | Returns policy page? **[BUILD]** | missing | Yes / No / Later |
| 7.7 | How long should customer inquiries be kept before deletion? (they're stored indefinitely today, and duplicated into the activity log) | forever | → |
| 7.8 | Who may read customer inquiries besides you? | only admin login | → |
| 7.9 | Data-deletion contact, if someone asks to be erased | none | → |
| 7.10 | Cookie / analytics consent banner needed? (depends on 8.4) | none | → |

---

## Part 8 — Assets, SEO & analytics

### 8.1 Images  [ADMIN → Content → any image field, and Products → colours]

The current photos are stand-ins. Real files needed:

| Slot | Current file | Do you have a replacement? (filename) |
|---|---|---|
| Hero main (noir, back) | `/photos/noir-back.webp` | → |
| Hero inset (blanc, front) | `/photos/blanc-front.webp` | → |
| Print detail | `/photos/print-detail.webp` | → |
| Editorial band | `/photos/editorial-seaside.webp` | → |
| Noir — front / back / detail | 3 files | → |
| Blanc — front / back / detail | 3 files | → |
| Social share image (1200×630) | `/og/falaise-og.jpg` | → |
| Favicon | `/favicon.png` | → |
| Footer wordmark (SVG) | `/brand/falaise-wordmark-paper.svg` | → |

| # | Question | Your answer |
|---|---|---|
| 8.1.1 | Do you have a logo file (SVG or high-res PNG)? Where is it? | → |
| 8.1.2 | Photo credit / photographer to name anywhere? | → |
| 8.1.3 | Is it OK to keep using the current imagery until real photos exist? | → |

### 8.2 Domain & hosting

| # | Question | Your answer |
|---|---|---|
| 8.2.1 | Domain name you own or want (e.g. `falaise.ph`) | → |
| 8.2.2 | Is it registered already? Where? | → |
| 8.2.3 | Which host are we using? (this app needs a persistent Node host + a writable disk — Vercel alone cannot run it) | → |
| 8.2.4 | Do you already pay for any hosting? | → |

### 8.3 Search & social preview

| # | Question | Currently | Your answer |
|---|---|---|---|
| 8.3.1 | Preferred link-preview title | `FALAISE — Rompre avec l'ordinaire` | → |
| 8.3.2 | Preferred link-preview description | "One tee. Two colours…" | → |
| 8.3.3 | Should `/admin.html` be blocked from Google? (it's allowed today) | allowed | → |
| 8.3.4 | Do you want a sitemap submitted to Search Console? **[BUILD]** — none exists | none | → |

### 8.4 Analytics & tracking

| # | Question | Currently | Your answer |
|---|---|---|---|
| 8.4.1 | Any analytics wanted? (Plausible, Vercel Analytics, GA4, none) | none | → |
| 8.4.2 | Meta pixel / TikTok pixel for retargeting? | none | → |
| 8.4.3 | Error monitoring (so you hear about API failures before customers do)? | none | → |
| 8.4.4 | Do you need order/conversion tracking, given orders close in DM? (answer would be "DM link clicks") | none | → |

---

## Part 9 — The short version (minimum viable answers)

If filling everything is too slow, answer these twelve. They unblock launch; the rest can follow.

1. Retail price in pesos: → ______________
2. Real stock, per colour per size (S/M/L/XL): → ______________
3. Where do you ship, and how many days? → ______________
4. Which payment methods, by name only? → ______________
5. Return window and conditions: → ______________
6. Full size chart in inches or cm (width / length / sleeve): → ______________
7. Registered business name for the footer: → ______________
8. Domain name: → ______________
9. Instagram handle correct as `@thefalaise.ph`? → ______________
10. Email and phone to publish, if any: → ______________
11. Which host will run the API? → ______________
12. Admin password set via `npm run admin:password`? (yes/no only) → ______________

---

## Part 10 — What happens to your answers

| Your answers in | Turn into |
|---|---|
| Part 2, 6.1–6.10 | Admin → **Content** updates. I can enter them for you; you can also do it yourself in ten minutes with no rebuild. |
| Part 3 | Admin → **Products** / **Stock**. Price, specs, colours, per-size counts. |
| Part 4, 5 | Code change: the shipping / returns / care / FAQ text is hardcoded in `Product.tsx` and `Contact.tsx`. Best fix is to move these into the Content tab so you can edit them without me — that's the real "remove the hardcoding" work. |
| Part 5.1 | Size chart moves from `SizeGuide.tsx` into a Content field, same reason. |
| Part 6.11 | About page moves into Content, or stays a one-off edit. |
| Part 7 | New pages: privacy, terms, returns. Needs building. |
| Part 8 | Assets uploaded via Admin; domain and host configured outside the repo. |
| Part 1 | Never in this file. Set by command; recorded in your password manager. |

**The structural point:** today a meaningful amount of customer-facing copy lives in JSX, not in the database. Answering this sheet fixes the *content*. Making the site fully owner-editable — so next season needs no developer — is a separate, worthwhile change: extending `CONTENT_KEYS` with the shipping, returns, size-chart, FAQ and about blocks.

---

## Appendix A — Everything the site asserts that nobody verified

Treat this as a list of claims to confirm or kill. Each is live right now.

| Claim on the site | Where | True? |
|---|---|---|
| Price is ₱1,890 | product + bag + DM summary | → |
| Noir has 4/9/3/0 in S/M/L/XL | stock table | → |
| Blanc has 0/6/7/2 in S/M/L/XL | stock table | → |
| Heavyweight cotton, garment-washed | product details | → |
| Boxy crop, dropped shoulder, unisex S–XL | product + size guide | → |
| Back print reads "Rompre avec l'ordinaire" | everywhere; description says "Rise above the ordinary" | → **note: these two disagree** |
| Chest mark is an F monogram | print section | → |
| Made in Cebu | About, product meta | → |
| PH delivery 2–4 working days | product page, FAQ | → |
| Worldwide shipping quoted on request | product page, FAQ | → |
| 14-day returns, unworn with tags | product page, FAQ | → |
| Studio covers return postage if faulty | FAQ | → |
| "Always open" hours | contact, footer | → |
| Registered as "Falaise Studio", © 2026 | footer | → |
| Falaise means "cliff" in French | editorial band | → |
| The studio is in Liloan, Cebu | hero, about, footer | → |

One real inconsistency already visible: the product description says the back print reads **"Rise above the ordinary"**, while every other page says **"Rompre avec l'ordinaire"**. Decide which the garment actually says.

---

## Appendix B — Already editable, no developer needed

For reference, so you know what you can change yourself today at `/admin.html`:

**Products** — name, slug, code, tagline, description, detail bullets, price, drop, fabric, fit, made, status (active / hidden), featured flag, collection, colours (name, hex, three photos each), sizes, per-variant stock.

**Collections** — name, slug, description, position, visibility.

**Content** — 13 groups: Identity & SEO, Announcement banner, Hero, Studio, Stat strip, Details & print, Colourways, Editorial band, Drop & order CTA, Testimonials, Closing note, Order & contact links, Footer. Every field listed in Part 6 lives here.

**Inquiries** — status tracking only. There is no public inquiry form on the site; inquiries are entered from the admin side.

**Stock** — every variant count, with an audit trail of who changed what and when.

---

*End of sheet. Fill what you can, leave the rest blank, and hand it back.*
