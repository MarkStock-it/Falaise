# FALAISE — Owner intake (short form)



**Time:** about 15 minutes. Answer what you know and leave the rest blank.

**Blank means "keep what is live today."** Nothing changes unless you write something.
Write after each `→`. `OK` = correct as shown. `?` = you don't know — don't guess, a wrong shipping promise is worse than no promise.

**Never write in this file:** the admin password, GCash or bank numbers, customer data. Password goes in your password manager; account details go in the DM only.

---

## 1. The twelve that unblock launch

| # | Question | Live today | Your answer |
|---|---|---|---|
| 1 | Retail price per tee, in pesos | `₱1,890` (one price for both colours) | → |
| 2 | Real stock per colour and size — see the grid below | invented | → |
| 3 | Where you ship, and how long it takes | "PH delivery in 2–4 working days. Worldwide rates quoted on request." | → |
| 4 | Payment methods, **names only** (GCash, Maya, BPI, BDO, COD…) | not stated anywhere | → |
| 5 | Returns: window + condition | "unworn, unwashed, within 14 days; we cover postage only if faulty" | → |
| 6 | Size chart measured flat — see the table below | invented | → |
| 7 | Registered business name (footer / copyright) | `© 2026 Falaise Studio` (invented) | → |
| 8 | Domain you own or want | none | → |
| 9 | Instagram handle | `@thefalaise.ph` | → |
| 10 | Email / phone / Viber to publish, if any (optional) | hidden | → |
| 11 | Which host runs the API (needs a persistent Node host + writable disk — Vercel alone cannot) | undecided | → |
| 12 | Admin password set with `npm run admin:password`? **yes / no only** | — | → |

**Stock grid** — real counts. `0` flips the size to sold out automatically; all zeros marks the whole product sold out.

| Colour | S | M | L | XL |
|---|---|---|---|---|
| **Noir** | 4 | 9 | 3 | 0 |
| **Blanc** | 0 | 6 | 7 | 2 |

**Size chart** — width (armpit to armpit), length (shoulder seam to hem), sleeve (shoulder to sleeve end). Measurements are in inches today; say so if you'd rather switch to cm.

| Size | Width | Length | Sleeve | Your correction, if any |
|---|---|---|---|---|
| S | 19 | 24 | 8.5 | → |
| M | 20 | 25 | 9 | → |
| L | 21 | 26 | 9.5 | → |
| XL | 22 | 27 | 10 | → |

---

## 2. Decisions only you can make

One line each. The **Default** column is what happens if you leave the row blank.

| # | Question | Default | Your answer |
|---|---|---|---|
| 2.1 | Vol. 01 is a one-time run, or will sizes be reprinted? | one-time `Limited run` | → |
| 2.2 | Add XXS or XXL? | S–XL only | → |
| 2.3 | Show "only 2 left" to customers? | no counts shown — customers only see in stock / sold out | → |
| 2.4 | Cash on delivery, or prepaid only? | no COD | → |
| 2.5 | Deposit for large or international orders? (% or flat) | none | → |
| 2.6 | How long do you hold stock for an unpaid order? | not stated | → |
| 2.7 | Privacy / terms / returns pages — edit the drafts, or pull them down? | draft pages live at `/privacy`, `/terms`, `/returns`, marked as drafts | → |
| 2.8 | How long should customer inquiries be kept? | forever | → |
| 2.9 | Who besides you may read inquiries? | only the admin login | → |
| 2.10 | Any analytics or error monitoring wanted? | none — you'd hear about failures from customers | → |
| 2.11 | 2–4 real customer quotes we may publish (quote + initial + e.g. "M / Cebu")? | section stays hidden; never invented | → |
| 2.12 | A second, read-only admin login for whoever packs orders? | one account, full access | → |

---

## 3. Copy: no answers needed unless it is wrong

All storefront words are editable at **`/admin.html` → Content** — 25 groups: Identity & SEO, Banner, Hero, Studio, Stats, Details & print, Colourways, Editorial, Drop, Testimonials, Closing, Order & contact links, Footer, Size guide, Shipping & returns, Contact FAQ, Studio page, Order steps, Policies, Navigation & labels, Shop page, Product page, Contact page, Checkout page, Not found page.

They are written in the studio's voice by someone who is not you. Skim them and flag only what is **factually false about the garment** — the tone can wait.

Three things need a decision, not a skim:

1. **The back print contradicts itself.** The product copy says the back reads *"Rise above the ordinary"*; every other page says *"Rompre avec l'ordinaire"*. Which is on the shirt? → ______________
2. **The name story.** "Falaise is French for the edge of a cliff" is used as the brand rationale. True? → yes / no, and if no, where did the name come from? → ______________
3. **Two claims to confirm or kill:** heavyweight cotton, garment-washed · made in Liloan, Cebu → ______________

Still hardcoded in code (needs a developer, not this sheet): header nav labels and page kickers like `Contact / 03`. Tell me if those should change. The `In stock / ships in …` label now lives under **Shipping & returns**.

---

## 4. Files still needed

The current imagery is stand-in. Tick what you can supply; filenames or "later" is enough.

| Slot | In use now | Yours |
|---|---|---|
| Noir — front / back / detail | 3 placeholder photos | → |
| Blanc — front / back / detail | 3 placeholder photos | → |
| Hero main + inset, editorial, print detail | placeholders | → |
| Social share image (1200×630) | placeholder | → |
| Logo, SVG or high-res PNG | wordmark generated from the name | → |
| Favicon | placeholder | → |

---

## 5. What happens to these answers

- **1–2** go into Products, Stock and Content at `/admin.html` — live immediately, no rebuild. You can also type them in yourself.
- **Policy pages** (2.7) already exist as drafts; amending them is a Content edit, not a build.
- **Photos** are uploads once you have them.
- **Nothing here is a secret**, and nothing here needs to be answered in one sitting. Send back what you have.

The old field-by-field version is kept at [archive/OWNER-INTAKE-full.md](archive/OWNER-INTAKE-full.md) if a specific string ever needs checking — you don't need to read it.

*Anything the site should stop claiming? One line: → ______________*
