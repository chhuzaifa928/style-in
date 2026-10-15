<div align="center">

# 🛍️ StyleIn<span style="color:#C91A25">.</span>

### High‑fashion streetwear & footwear e‑commerce — with a full Master CMS

*Editorial lookbook storefront · Cash‑on‑Delivery checkout · zero recurring costs · built for Hostinger*

<br/>

![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Node](https://img.shields.io/badge/Node-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)

<br/>

`Warm off‑white canvas` · `Cherry‑red accent` · `Syne + Inter type` · `3D tilt` · `fully responsive`

</div>

---

## ✨ Overview

**StyleIn** is a production‑grade online boutique and content‑management system for a modern streetwear & footwear brand. The storefront is an editorial, lookbook‑style shopping experience; the admin portal lets you run the entire store — catalog, pricing, inventory, media, content, and orders — without touching code or the database.

The whole stack is built to run on **Hostinger Business** Node.js hosting with **Hostinger MySQL**, storing images on local SSD — **no paid image buckets, no serverless vendor lock‑in, no monthly add‑ons.**

> 🧩 **Scales without schema changes** — add Bags, Fragrances, Accessories or any new department from the admin. Products reference categories dynamically; the storefront picks them up automatically.

---

## 🖥️ Storefront

- 🎞️ **Full‑width hero slider** — auto‑scrolling campaign banners (image *or* video), admin‑managed, with a progress bar
- 🪟 **Split lookbook panels** with interactive **3D hover tilt**
- 📰 **Curated rails** — *New Arrivals*, *Best Sellers*, *On Sale* (hand‑pick products per rail from the admin)
- 🏷️ **Smart product cards** — dual pricing (strikethrough vs. bold red), auto‑calculated `‑X% OFF`, multi‑angle hover crossfade, mobile swipe dots
- 📡 **Live inventory cues** — pulsing *“Only X left”* sonar badge, instant *Sold Out* disabling
- ⚡ **Quick‑View modal** with thumbnail gallery & size selector
- 🛒 **Slide‑over cart** with a **free‑delivery progress bar**, and a validated **1‑click Cash‑on‑Delivery checkout**
- 📦 **Order tracking page** — customers check status (Pending → Confirmed → Dispatched → Delivered) with order # + phone
- 📣 Pause‑on‑hover promo marquee · 🔎 live search · ❤️ wishlist · 💬 floating WhatsApp button · 📱 mobile bottom nav & slide‑over menu

## 🛠️ Master Admin Portal `/admin`

- 🔐 **Secure gate** — bcrypt login, HTTP‑only signed session cookie, Edge‑middleware protection, brute‑force rate limiting
- 👕 **Catalog & pricing** — add / edit / archive, compare‑at + selling price with **live discount calc**, apparel/shoe/custom sizes, real‑time **stock tracker** (auto‑decrements on COD orders)
- 🖼️ **Universal media engine** — multi‑photo & video upload, external URL ingestion, set a primary cover, delete with disk + DB cleanup
- 🗂️ **Category tree manager** — add departments on the fly
- 🎛️ **Site‑wide CMS** — hero slider & panels, marquee, phone/WhatsApp/email/address/hours, social links, shipping fees & free‑delivery threshold
- 📋 **Orders queue** — new‑order badge + sound alert, itemized breakdown, status workflow, **1‑click WhatsApp confirmation** with tracking ID
- ↕️ **Merchandising control** — drag‑order products and choose which rails each one appears in

---

## 🔒 Security

Enterprise‑grade controls across every layer — audited and verified:

| Control | Implementation |
|---|---|
| **SQL injection** | 100% parameterized `mysql2` prepared statements · `multipleStatements` off |
| **File uploads** | MIME whitelist **+ magic‑byte** check · 5 MB image / 50 MB video caps · crypto‑UUID filenames (no path traversal) · total‑size quota |
| **XSS** | tag‑stripped inputs · React escaping · no `dangerouslySetInnerHTML` |
| **Auth** | bcrypt · timing‑safe login · HMAC session · middleware on all `/admin` + `/api/admin/*` |
| **CSRF** | SameSite cookie + strict Origin verification on every mutation |
| **Abuse** | proxy‑aware rate limiting + hidden honeypots on checkout/newsletter |
| **Order integrity** | prices re‑read server‑side · stock decremented in a `SELECT … FOR UPDATE` transaction |

---

## 🧰 Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 15** (App Router) + **TypeScript** |
| Styling | **Tailwind CSS** · Syne (display) + Inter (body) |
| Database | **MySQL 8** via `mysql2/promise` (pooled singleton, max 10) |
| Auth | `bcryptjs` + HMAC‑SHA256 signed cookies (Web Crypto) |
| Hosting | Hostinger Business — Next.js `output: 'standalone'`, local SSD media |

## 🎨 Design system

| Token | Value | Use |
|---|---|---|
| Canvas | `#FBFBF9` | warm off‑white page background |
| Surface | `#FFFFFF` | cards & modals |
| Hairline | `#E8E7E3` | dividers & borders |
| Brand | `#C91A25` | sale badges, accents, alerts |
| Ink | `#121212` | primary headings |
| Muted | `#6B6A68` | secondary copy |

---

## 🚀 Quick start (local)

```bash
# 1. Install
npm install

# 2. Configure env (copy and fill in DB_* + SESSION_SECRET)
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # SESSION_SECRET

# 3. Create the database, then import the schema in MySQL
#    (phpMyAdmin / Workbench → run schema.sql against your database)

# 4. Run
npm run dev        # → http://localhost:3000
```

| URL | What |
|---|---|
| `/` | Storefront |
| `/admin` | Admin portal — default login **`admin` / `StyleIn@2026`** ⚠️ *change immediately* |
| `/track` | Customer order tracking |
| `/api/health` | DB connectivity probe |

---

## ☁️ Deploy to Hostinger

1. **Database** — create a MySQL DB in hPanel, import `schema.sql` in phpMyAdmin (one import, no migrations).
2. **Build** — `npm run build`, then assemble `.next/standalone/` + `.next/static` + `public` into one folder and upload it.
3. **Node.js app** — hPanel → Node.js: version 20+, startup file `server.js`, set env vars (`DB_*`, `SESSION_SECRET`, `COOKIE_SECURE=true`, `APP_ORIGIN`).
4. **Persist uploads** — symlink `public/uploads` to a folder outside the build.
5. **Verify** — `/api/health` → `{"ok":true,"db":"up"}`, then change the admin password.

> 📖 Full click‑by‑click instructions live in **[`DEPLOY.md`](./DEPLOY.md)**.

---

## 📁 Project structure

```
schema.sql                 # full DB — paste into phpMyAdmin
migrations/                # incremental SQL for existing databases
next.config.js             # standalone output, security headers, image config
tailwind.config.ts         # editorial palette & motion
scripts/hash-password.js   # generate bcrypt hashes
src/
  middleware.ts            # protects /admin & /api/admin/*
  lib/                     # db pool, auth, session, sanitize, rate-limit, data
  app/
    page.tsx               # storefront
    track/                 # order tracking
    admin/                 # login + dashboard
    api/                   # upload, products, categories, orders, settings, …
  components/              # storefront + admin UI
public/uploads/            # user media (served statically)
```

## 🗄️ Database

`site_settings` · `categories` *(recursive tree)* · `products` · `product_images` *(cascade)* · `orders` · `admin_users` · `newsletter_subscribers`

## 📜 Scripts

```bash
npm run dev      # local dev server
npm run build    # production build (.next/standalone)
npm run start    # run the standalone server.js
node scripts/hash-password.js "NewPassword"   # bcrypt hash for seeding
```

---

<div align="center">

**StyleIn** — crafted by **Chaudhary Huzaifa** 🇵🇰
*Editorial streetwear & kinetic footwear · Cash on Delivery nationwide*

</div>
