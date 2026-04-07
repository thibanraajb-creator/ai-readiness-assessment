# PEOPLElogy AI Readiness Assessment — Deployment Guide

## Prerequisites
- Node.js 18+
- A Supabase project (free tier works)
- A Netlify account (free tier works)

---

## Step 1: Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the Supabase dashboard, go to **SQL Editor**.
3. Paste the entire contents of `supabase-schema.sql` and click **Run**.
4. In **Project Settings → API**, copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **Anon/public key** (long JWT string)

---

## Step 2: Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase values:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## Step 3: Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

---

## Step 4: Deploy to Netlify

### Option A: Netlify CLI (recommended)

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Build the project
npm run build

# Login to Netlify
netlify login

# Deploy (creates a new site)
netlify deploy --prod --dir=dist
```

During `netlify deploy`, set environment variables when prompted, or add them in the Netlify dashboard under **Site Settings → Environment Variables**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Option B: Drag-and-Drop

1. Run `npm run build` — this creates a `dist/` folder.
2. Go to [app.netlify.com](https://app.netlify.com).
3. Drag the `dist/` folder onto the Netlify drop zone.
4. After deploy, go to **Site Settings → Environment Variables** and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Re-trigger the build (or redeploy manually).

### Option C: GitHub Integration

1. Push this repo to GitHub.
2. In Netlify, click **New Site → Import from Git**.
3. Select your repo.
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Add environment variables under **Advanced build settings**.
7. Click **Deploy site**.

---

## Application Routes

| Route        | Description                          | Access      |
|-------------|--------------------------------------|-------------|
| `/`          | Landing page                         | Public      |
| `/survey`    | 5-pillar assessment survey           | Public      |
| `/complete`  | Individual results with radar chart  | After survey|
| `/dashboard` | Organisation-wide dashboard          | Public      |
| `/admin`     | Full admin dashboard                 | PIN: 123456 |

---

## Changing the Admin PIN

The admin PIN is set in `src/pages/Admin.jsx` at the top of the file:

```javascript
const ADMIN_PIN = '123456'
```

Change it to any string you like.

---

## Adding a New Assessment Cycle

In your Supabase SQL Editor:

```sql
INSERT INTO cycles (id, label, start_date, is_active)
VALUES (2, 'Cycle 2 — Q3 2026', '2026-07-01', TRUE);

-- Optionally deactivate the previous cycle
UPDATE cycles SET is_active = FALSE WHERE id = 1;
```

---

## Tech Stack

| Technology          | Purpose                        |
|--------------------|--------------------------------|
| React 18 + Vite     | Frontend framework + build     |
| Tailwind CSS 3      | Utility-first styling          |
| React Router 6      | Client-side routing            |
| Supabase            | Database + Auth backend        |
| Recharts            | Radar, bar, and line charts    |
| jsPDF + html2canvas | PDF report export              |
