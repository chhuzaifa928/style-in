# 🚀 Deploying StyleIn to Hostinger

Complete, click‑by‑click guide for Hostinger **Business/Cloud** hosting (Node.js
runner + managed MySQL). The storefront runs in Next.js **standalone** mode and
stores media on local SSD — no paid add‑ons.

> **Plan note:** the Node.js app runner lives under **hPanel → Advanced →
> Node.js** and is available on **Business/Cloud** plans. If that menu is
> missing, your plan doesn't include it.

---

## A. Create the production database

1. **hPanel → Databases → MySQL Databases** — create a database and user
   (e.g. `uXXXX_stylein`), set a strong password, grant the user **all
   privileges**. Note the **host** (usually `localhost`), **DB name**,
   **user**, **password**.
2. **hPanel → phpMyAdmin** → open that database → **SQL** tab → paste the
   **entire contents of `schema.sql`** → **Go**.
   - Creates all tables and seeds settings, Clothes/Shoes categories, and the
     default admin. **One import, no migrations needed.**

## B. Build & assemble the upload folder (on your PC)

```bash
npm run build
```

Next produces `.next/standalone/` (with `server.js`). Standalone does **not**
bundle static assets, so assemble a deploy folder:

```
deploy/
├── (everything from .next/standalone/)   ← server.js, node_modules, package.json
├── .next/static/                          ← copied from .next/static
└── public/                                ← copied from public (ensure public/uploads exists)
```

Zip the **contents** of `deploy/` (do **not** include `.env`).

## C. Upload

**hPanel → File Manager** → your app directory
(e.g. `~/domains/your-domain.com/stylein`) → upload the zip → **Extract**.
You should see `server.js`, `.next/`, `node_modules/`, `public/`.

## D. Create the Node.js application

**hPanel → Advanced → Node.js → Create application**

| Field | Value |
|---|---|
| Node.js version | **20.x or newer** |
| Application root | your upload folder (e.g. `stylein`) |
| Application startup file | `server.js` |
| Application URL | your domain / subdomain |

## E. Environment variables

Add these in the Node.js app panel:

| Key | Value |
|---|---|
| `DB_HOST` | `localhost` |
| `DB_PORT` | `3306` |
| `DB_USER` | your DB user (e.g. `uXXXX_stylein`) |
| `DB_PASSWORD` | your DB password |
| `DB_NAME` | your DB name |
| `SESSION_SECRET` | a 64+‑char random hex (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `COOKIE_SECURE` | `true` |
| `APP_ORIGIN` | `https://your-domain.com` |
| `NODE_ENV` | `production` |

> Hostinger sets `PORT` automatically — don't override it.

## F. Keep uploaded media across redeploys (one‑time)

In **hPanel → Advanced → Terminal/SSH**, from the app directory:

```bash
mkdir -p ~/persistent/stylein-uploads
rm -rf public/uploads
ln -s ~/persistent/stylein-uploads public/uploads
```

Now product/hero media survives future redeploys.

## G. Start & verify

1. Click **Restart** in the Node.js panel.
2. `https://your-domain.com/api/health` → `{"ok":true,"db":"up"}`
3. `https://your-domain.com` → storefront loads.
4. `https://your-domain.com/admin` → log in `admin` / `StyleIn@2026`.
5. **Change the admin password immediately** (a red banner reminds you) →
   Settings → Security.
6. Add your categories, products, hero slides, and real contact/WhatsApp info.

---

## 🔁 Redeploying after code changes

Repeat **B → C** (rebuild, re‑zip, re‑upload/extract), then **Restart** the
Node app. Your database and `~/persistent/stylein-uploads` are untouched. Only
run SQL again if a change ships a new file under `migrations/`.

## 🩺 Troubleshooting

| Symptom | Fix |
|---|---|
| `/api/health` → `db: down` | Re‑check `DB_USER` / `DB_PASSWORD` / `DB_NAME` (Hostinger prefixes them with `uXXXX_`). |
| `Cannot find module 'mysql2'` | Rebuild on the latest code — `serverExternalPackages` bundles it into standalone. Re‑upload. |
| Admin login cookie not set | Ensure `COOKIE_SECURE=true` **only** on HTTPS; the site must be served over HTTPS. |
| Uploaded images vanish after redeploy | Set up the `public/uploads` symlink in step **F**. |
| No **Node.js** menu in hPanel | Your plan doesn't include the Node runner — upgrade to Business/Cloud. |
