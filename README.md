# StyleIn — Streetwear & Footwear Boutique + Master CMS

A production-grade, high-fashion e-commerce platform and admin CMS built with
**Next.js 15 (App Router) + TypeScript + Tailwind CSS**, backed by **MySQL**
(`mysql2/promise`), designed to run on **Hostinger Business Web Hosting** in
Node.js standalone mode with **zero recurring third-party costs** (images are
stored on Hostinger's SSD under `public/uploads`).

---

## ✨ What's inside

| Layer | Highlights |
|-------|-----------|
| **Storefront** (`/`) | Sticky header + mega tabs, promo marquee (pause-on-hover), lookbook hero split, PLP with category filter & sort, product cards with dual pricing & auto `-X% OFF`, multi-angle hover crossfade + mobile swipe dots, low-stock sonar badge, out-of-stock disabling, quick-view modal, slide-over cart with free-shipping progress bar, COD 1-click checkout, mobile bottom nav & slide-over menu, live search. |
| **Admin** (`/admin`) | bcrypt login, HTTP-only signed session cookie, products CRUD with live discount calc, apparel/shoe/custom sizes, stock tracker, multi-photo upload + external URL + primary cover + delete, category tree manager, site-wide CMS (marquee, contact, socials, fees), orders queue with status workflow. |
| **Security** | Parameterized queries everywhere, MIME-whitelist + magic-byte + 5MB upload checks, UUID filenames (no path traversal), input sanitization, rate-limited login, SameSite + origin CSRF defense, middleware route protection. |

Default admin credentials (seeded): **`admin` / `StyleIn@2026`** — change immediately after first login (Settings → Security).

---

## 🗂 Project structure

```
schema.sql                 ← paste into phpMyAdmin
next.config.js             ← output: 'standalone', images.unoptimized
tailwind.config.ts         ← editorial palette & motion
scripts/hash-password.js   ← generate bcrypt hashes
src/
  middleware.ts            ← protects /admin & /api/admin/*
  lib/                     ← db pool, auth, session, sanitize, rate-limit, data
  app/
    page.tsx               ← storefront (server component → <Storefront/>)
    admin/                 ← login + dashboard
    api/                   ← upload, products, categories, orders, settings, admin
  components/              ← storefront + admin UI
public/uploads/            ← user-uploaded product images (served statically)
```

---

## 🧑‍💻 Local development

```bash
cp .env.example .env         # fill in DB_* + SESSION_SECRET
npm install
npm run dev                  # http://localhost:3000
```

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 🚀 Deploy to Hostinger (hPanel) — step by step

### 1. Create the MySQL database
1. hPanel → **Databases → MySQL Databases**.
2. Create a database (e.g. `uXXXX_stylein`), a DB user, and a strong password.
   Grant the user **all privileges** on that database.
3. Note the **host** (usually `localhost`), **DB name**, **user**, **password**.

### 2. Import the schema
1. hPanel → **Databases → phpMyAdmin** → open your database.
2. Open the **SQL** tab, paste the entire contents of `schema.sql`, click **Go**.
3. This creates all tables and seeds `site_settings`, the `Clothes`/`Shoes`
   categories, and the default `admin` user.

### 3. Build locally, then upload
Hostinger runs the app in standalone mode. Build on your machine:

```bash
npm install
npm run build
```

This produces `.next/standalone/` (containing `server.js`). Standalone does
**not** bundle static assets automatically, so assemble a deploy folder:

```bash
# from the project root
cp -r .next/standalone/.  deploy/
cp -r .next/static        deploy/.next/static
cp -r public              deploy/public
```

Now `deploy/` contains `server.js`, `.next/`, `node_modules`, `public/`.
Zip the **contents** of `deploy/` and upload via hPanel **File Manager** (or
SFTP/Git) into your app directory, e.g. `~/domains/your-domain.com/stylein`.

> Prefer Git? Push this repo, then on the server run `npm ci && npm run build`
> if your plan provides shell/Node — otherwise the upload method above is the
> reliable path on shared Business hosting.

### 4. Create the Node.js application
1. hPanel → **Advanced → Node.js** (Setup Node.js App).
2. **Node.js version:** select **20.x or newer** (the app requires Node ≥ 20).
3. **Application root:** the folder you uploaded to (e.g. `stylein`).
4. **Application startup file:** `server.js`.
5. **Application URL:** your domain or subdomain.

### 5. Environment variables
In the Node.js app panel, add each variable from `.env.example`:

| Key | Value |
|-----|-------|
| `DB_HOST` | `localhost` |
| `DB_PORT` | `3306` |
| `DB_USER` | your DB user |
| `DB_PASSWORD` | your DB password |
| `DB_NAME` | your DB name |
| `SESSION_SECRET` | a 64+ char random hex string |
| `COOKIE_SECURE` | `true` (HTTPS) |
| `APP_ORIGIN` | `https://your-domain.com` |
| `NODE_ENV` | `production` |
| `PORT` | the port Hostinger assigns (often injected automatically) |

### 6. Uploads folder & symlink
Product images are written to `public/uploads` and served as static files.

- Ensure `public/uploads` exists and is **writable** (chmod `755`).
- Because the standalone server serves from its own `public/`, keep uploads
  **inside the running app's `public/uploads`**. If you deploy new builds
  frequently, make uploads survive redeploys by pointing the app's
  `public/uploads` at a persistent folder with a symlink:

```bash
# one-time: create a persistent store outside the build
mkdir -p ~/persistent/stylein-uploads

# in the deployed app directory, replace public/uploads with a symlink
rm -rf public/uploads
ln -s ~/persistent/stylein-uploads public/uploads
```

Now every redeploy keeps previously uploaded images.

### 7. Start & verify
1. Click **Restart** (or Start) in the Node.js app panel.
2. Visit `https://your-domain.com/api/health` → should return `{"ok":true,"db":"up"}`.
3. Visit `https://your-domain.com` for the storefront.
4. Visit `https://your-domain.com/admin` → log in with `admin` / `StyleIn@2026`.
5. **Settings → Security → change the admin password immediately.**
6. Add your categories, products, photos, and site content from the admin.

---

## 🔐 Security checklist (all implemented)

- **SQL injection:** every query uses `mysql2` prepared statements with `?`
  placeholders; `multipleStatements` is disabled. No string concatenation.
- **File uploads:** MIME whitelist (`jpeg`/`png`/`webp`) **and** magic-byte
  signature check, 5MB cap, crypto-UUID filenames (client name discarded →
  no path traversal), written `0644` under `public/uploads` and served as
  static assets only.
- **XSS:** all CMS text, phone numbers, and descriptions are sanitized (angle
  brackets stripped, control chars removed, length-bounded) before insert;
  React escapes on render; `dangerouslySetInnerHTML` is never used.
- **Auth:** bcrypt hashing; login compares against a dummy hash for unknown
  users to keep timing uniform; signed HMAC-SHA256 session in an HTTP-only,
  `SameSite=Lax`, `Secure` cookie; Edge middleware guards `/admin` and
  `/api/admin/*`; per-route `requireAdmin()` guards all mutations.
- **Brute force:** login is rate-limited (8 attempts / 10 min per IP).
- **CSRF:** `SameSite` cookie + strict Origin/Referer verification on every
  mutating request.
- **Order integrity:** checkout re-reads prices from the DB (ignores client
  prices) and decrements stock inside a `SELECT … FOR UPDATE` transaction.

---

## 🧩 Scaling to new departments

No schema redesign needed. Add **Bags**, **Fragrances**, **Accessories**, etc.
from **Admin → Categories**; products reference categories by id and the
storefront tabs/filters pick them up automatically.

---

## 🛠 Scripts

```bash
npm run dev     # local dev server
npm run build   # production build (.next/standalone)
npm run start   # run the standalone server.js
node scripts/hash-password.js "NewPassword"   # bcrypt hash for seeding
```
