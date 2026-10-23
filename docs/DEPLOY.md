# Hosting FALAISE on Render

The shop is one Node process: the storefront, the `/api/*` routes, the admin at
`/admin.html` and `/uploads/*`. Everything it writes — the SQLite database, the
session secret and the images uploaded from the admin — lives under one
directory, `DATA_DIR`, so the host only needs a single persistent disk. Nothing
needs a terminal on the visitor's side: once this is deployed, all storefront
and stock changes happen in the admin panel from any browser.

Chosen host: **Render**, Starter web service with a 1 GB disk. Roughly
**$7/month + $0.25/GB of disk ≈ $7.25/month**, region Singapore (closest to
Cebu). Alternatives with the same shape are noted at the end.

`render.yaml` in the repo root is the blueprint; it already sets the build
command, disk mount and environment variables.

## 1. Before you create the service

- The repo must be on GitHub with this branch merged (or pick this branch when
  creating the blueprint). Render deploys the repo's default branch by default,
  and `render.yaml` has to be present on the branch it builds.
- Do **not** use a Free instance. Free services have no disk and sleep after 15
  minutes, so the database, the session secret and every upload are wiped on
  restart. The disk is what makes the shop work.
- Keep `data/` out of git and out of any archive you hand to a client. It holds
  the database, the admin password file and the session signing key.

## 2. Create the service

1. Render dashboard → **New → Blueprint**.
2. Connect `MarkStock-it/Falaise` and choose the branch that has `render.yaml`.
3. Render reads the blueprint and asks for `ADMIN_PASSWORD`. Enter a long
   password (12+ characters) and keep it in a password manager. This value is
   used only when the database is first created; changing it later in the
   dashboard has no effect.
4. **Apply**. The build runs `npm ci --include=dev && npm run build`, then
   `npm start`. The first boot creates `/data/falaise.db`, seeds the default
   content, products and collections, and generates the admin password hash.
5. When the service reports live, open `https://<service>.onrender.com/api/health`
   (expect `{"ok":true,...}`) and then `/admin.html`, and sign in with the
   password from step 3.

If the health check never passes, check the deploy log first. The usual causes
are a build that skipped the client build (no `dist/`, so the server answers
"Store not built") and an app listening on loopback instead of the platform
port — `HOST=0.0.0.0` and `PORT` are handled by `server/index.mjs`, so do not
override them.

## 3. Environment variables

`render.yaml` sets these; change them in the dashboard if needed.

| Variable | Value | Why |
| --- | --- | --- |
| `DATA_DIR` | `/data` | Puts the database, session secret and uploads on the disk. |
| `COOKIE_SECURE` | `1` | Marks the admin session cookie `Secure` over HTTPS. |
| `TRUST_PROXY` | `1` | Trusts Render's TLS proxy so `req.protocol` is `https`, `req.secure` is true, and the Origin check on admin writes matches. Without it every admin save returns 403 behind HTTPS, and the login throttle sees one IP. |
| `ADMIN_PASSWORD` | set at creation | First boot only. |
| `SESSION_SECRET` | generated | Pins the cookie signing key. Rotating it signs every admin out. |
| `NODE_VERSION` | `24` | `node:sqlite` needs Node 22.5 or newer. |

`APP_ORIGIN` is only needed if the site is served from an origin that does not
match the request host. With a custom domain on Render, the Origin check already
compares against the incoming host, so normally leave it unset.

## 4. Custom domain

Render → service → **Settings → Custom Domains**, add the domain, and point the
DNS record at Render. Certificates are issued automatically. Then set
`COOKIE_SECURE=1` (already on) and, if the domain does not match the request
host for any reason, add `APP_ORIGIN=https://thedomain`.

## 5. Passwords and secrets

- **Change the admin password:** sign in and open **Admin → Account → Password**.
  It asks for the current password and the new one twice, and needs no shell. If
  you are locked out, the fallback is service → **Shell** →
  `npm run admin:password -- 'the new password'` (10+ characters); the value lands
  in the shell history, so run `history -c` afterwards. Either way, sessions that
  are already signed in keep working until they expire (12 hours).
- **Sign everyone out / rotate the signing key:** edit `SESSION_SECRET` in the
  dashboard and save. Any forged or stolen session dies with it.
- The first-boot password is not written anywhere on Render when
  `ADMIN_PASSWORD` is set. If it is left empty, the server prints the generated
  password in the logs and writes `/data/admin-credentials.txt`; delete that
  file from the shell after signing in.

## 6. Backups

Admin → **Backup** exports the catalogue and all content as one JSON file. It
deliberately excludes inquiries, the admin hash and, because it is JSON, the
uploaded images. Keep a copy after every significant round of edits.

What that leaves out, and how to cover it:

- **Inquiries** (customer names and messages) only exist in the database. Read
  or reply to them in Admin → Inquiries, and copy anything long-lived into your
  own records.
- **Uploaded images** live at `/data/uploads`. Keep the original files on your
  machine; re-uploading from the admin restores them.
- **The whole database:** Render does not snapshot disks, and the JSON export
  is the supported way to get data out. If you want a dated safety copy on the
  disk itself, run `cp /data/falaise.db /data/backup-$(date +%F).db` in the
  shell; that protects against a bad edit but is not an off-site backup. The
  storefront's images and copy can always be rebuilt from this repo and your
  original photo files.

## 7. Running it for clients

One repo, one Render service, one disk per client. Create a second Blueprint
instance (or "Duplicate" the service) and give it its own `ADMIN_PASSWORD`,
its own domain and its own disk. Do not point two services at one database: the
disk-backed design is single-instance by construction.

Per client, the handover checklist is: custom domain attached, password set and
stored, `SESSION_SECRET` generated (not copied), backup exported once the
content is final, and the client told that all edits happen at
`https://domain/admin.html` — no terminal, no local run. If you keep the admin
password, the client uses the storefront only; if they get it, they can change it
themselves at Account → Password.

## 8. Costs and limits to keep in mind

- Starter compute $7/month + 1 GB disk $0.25/month. Bandwidth is included.
- Disk-backed services deploy with a short interruption, not zero downtime.
- Uploads are capped at 5 MB per image and 9 MB per request; that is the admin
  upload path, not page weight.
- SQLite runs in WAL mode: `/data/falaise.db-wal` and `-shm` must stay next to
  the database. Do not copy only the `.db` file while the service is running if
  you need the newest writes.
- Render's Free plan cannot hold this app's data. A free service also cold-starts
  after sleeping, which is fine for a design demo and wrong for a shop.

### Free instances and the keep-alive ping

A Free service spins down after 15 idle minutes. `.github/workflows/keep-alive.yml`
requests `/api/health` every five minutes to keep it awake: set the base URL once as
an Actions **repository variable** named `APP_URL` (Settings → Secrets and variables
→ Actions → Variables), for example `https://falaise.onrender.com`, with no trailing
slash. It retries cold starts and fails the run if the health check does not report
`"ok":true`. Ping `/api/health`, not `/`, which would rebuild the whole catalogue
every five minutes.

The workflow only runs from the **default branch**, GitHub can start scheduled runs
late, and it disables the schedule after 60 days without repository activity. Each
run bills at least one minute, so a private repository would use roughly 8,600 of
its 2,000 free minutes a month; on a private repo use UptimeRobot (free plan: 5-minute
checks) or cron-job.org instead. None of this makes a Free instance safe for a client:
without the disk, every edit and upload is still lost on the next restart.

## 9. Alternatives with the same disk model

- **Railway** — Hobby $5/month including $5 of usage, 5 GB volume, GitHub or
  Dockerfile deploys, `PORT` injected, bind `0.0.0.0`. Same env vars
  (`DATA_DIR`, `COOKIE_SECURE=1`, `TRUST_PROXY=1`, `SESSION_SECRET`,
  `ADMIN_PASSWORD`), mount the volume at `/data`.
- **Fly.io** — no platform fee, a 256 MB machine plus a 1 GB volume is roughly
  $3.84/month; needs `fly.toml` with `internal_port` and `HOST=0.0.0.0`.
- **VPS** (Hetzner, DigitalOcean) — cheapest at scale, but you own the OS
  updates, TLS and restarts. Not worth it for one small shop.

Anything without a persistent disk (Vercel, Netlify, Render Free, DigitalOcean
App Platform) will lose every edit on the next deploy.
