# 📉 PriceTracker

A full-stack price tracking app that monitors products across Amazon, Flipkart, and more — with daily checks, price history charts, and Gmail alerts when prices drop.

---

## 🧩 Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React + Vite + Recharts |
| Backend | Node.js + Express |
| Database + Auth | Supabase (Postgres) |
| AI | Claude API (Anthropic) |
| Scheduler | node-cron (daily 9AM IST) |
| Alerts | Gmail via Nodemailer |
| Hosting | Render (free tier) |

---

## 🚀 Setup Guide

### Step 1 — Supabase

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Open the SQL Editor and run the contents of `supabase/schema.sql`
3. Copy your **Project URL** and **anon key** (for frontend) and **service role key** (for backend)

---

### Step 2 — Gmail App Password

1. Go to your Google Account → Security → 2-Step Verification (enable it)
2. Then go to **App Passwords** → Generate one for "Mail"
3. Copy the 16-character password

---

### Step 3 — Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Copy it

---

### Step 4 — Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your .env file with all keys
npm install
npm run dev
```

Your backend runs at `http://localhost:3001`

---

### Step 5 — Frontend Setup

```bash
cd frontend
cp .env.example .env
# Fill in your Supabase URL and anon key + backend URL
npm install
npm run dev
```

Your frontend runs at `http://localhost:5173`

---

## 🌐 Deploying to Production

### Backend → Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo, set root directory to `backend`
4. Add all environment variables from `.env`
5. Set start command: `npm start`
6. Deploy!

### Frontend → Vercel or Netlify

1. Go to [vercel.com](https://vercel.com) → Import project
2. Set root directory to `frontend`
3. Add environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL)
4. Deploy!

---

## 📁 Project Structure

```
price-tracker/
├── frontend/          # React web app
├── backend/           # Node.js API + cron jobs
├── supabase/          # Database schema
└── README.md
```

---

## ✨ Features

- 🔗 Paste any product URL — AI extracts name & price automatically
- 📊 Price history charts per product and per site
- 🎯 Set a target price — get alerted when it's hit
- 📉 Daily price checks at 9AM IST (runs even when your laptop is off)
- 📧 Smart AI-written Gmail alerts
- 👤 Multi-user — anyone can sign up and use it
- 🔒 Secure — each user only sees their own data

---

## 🛠 Supported Sites

- Amazon India
- Flipkart
- Croma
- Reliance Digital
- Meesho
- Myntra
- Snapdeal
- More can be added easily

---

## 📝 Environment Variables

### Backend `.env`
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
GEMINI_API_KEY=
GMAIL_USER=
GMAIL_APP_PASSWORD=
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:3001
```
