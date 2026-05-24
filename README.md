# Marketplace CRM — Setup Guide

A free, cross-device CRM for Facebook Marketplace resellers.
Built with plain HTML/CSS/JS + Supabase (free database) + Vercel (free hosting).

---

## Step 1 — Set up Supabase (free database, ~5 min)

1. Go to https://supabase.com and create a free account
2. Click **New project** → give it a name like "marketplace-crm" → choose a region close to you → set a database password → click **Create project**
3. Wait ~1 minute for the project to spin up
4. In the left sidebar, click **SQL Editor**
5. Paste the entire contents of `supabase-schema.sql` into the editor and click **Run**
6. Go to **Settings → API** (left sidebar)
7. Copy your **Project URL** (looks like `https://xyzxyz.supabase.co`)
8. Copy your **anon / public** key (the long string under "Project API keys")

---

## Step 2 — Add your credentials

Open `config.js` in a text editor and fill in the two values:

```js
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_KEY = 'your-anon-key-here';
```

Save the file.

---

## Step 3 — Deploy to Vercel (free hosting, ~3 min)

1. Go to https://github.com and create a free account if you don't have one
2. Click **+** → **New repository** → name it `marketplace-crm` → **Create repository**
3. Upload all 5 files to the repo:
   - `index.html`
   - `style.css`
   - `app.js`
   - `config.js`
   - `supabase-schema.sql` (optional, just for reference)
4. Go to https://vercel.com → sign in with GitHub → click **Add New → Project**
5. Import your `marketplace-crm` repository → click **Deploy**
6. In ~30 seconds you'll get a URL like `marketplace-crm.vercel.app` 🎉

Open that URL on your phone AND your laptop — data syncs between both in real time.

---

## Files overview

| File | What it does |
|------|-------------|
| `index.html` | App structure and layout |
| `style.css` | All styling |
| `app.js` | All logic — data, charts, sync |
| `config.js` | Your Supabase credentials (fill this in) |
| `supabase-schema.sql` | SQL to create the 3 database tables |

---

## Features

- **Dashboard** — close rate, revenue, deal funnel chart, revenue trend, recent leads
- **Listings** — track items with buy/ask price, auto margin %, source seller, status
- **Leads** — log every inquiry, track stage (new → negotiating → closed/lost), final price
- **Sellers** — keep a rated rolodex of your supply sources
- **Mobile-friendly** — bottom nav on phone, sidebar on desktop
- **Works offline** — falls back to localStorage if Supabase isn't set up yet

---

## Free tier limits (more than enough for personal use)

| Service | Free limit |
|---------|-----------|
| Supabase | 500MB database, unlimited API calls |
| Vercel | 100GB bandwidth/month, unlimited deployments |
