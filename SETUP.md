# CosmicUs — Setup Guide (Frontend → API → Backend)

Your Supabase URL and anon key are already in `.env.local`. ✅

## Architecture
```
Browser → /api/... (Next.js API Routes) → Supabase
```
The browser never calls Supabase directly. All requests go through API routes.

---

## Step 1 — Add your service_role key to .env.local

Open `.env.local` and replace `your_service_role_key_here` with your actual key.
Get it from: Supabase Dashboard → Project Settings → API → service_role (secret)

---

## Step 2 — Run SQL schema

Supabase Dashboard → SQL Editor → paste `supabase/schema.sql` → Run

---

## Step 3 — Create users

SQL Editor → paste `supabase/create-users.sql` → Run
Should show 2 rows at the bottom (husband + wife).

---

## Step 4 — Fix RLS + Storage policies

SQL Editor → paste `supabase/fix-rls.sql` → Run
SQL Editor → paste `supabase/fix-storage-rls.sql` → Run

---

## Step 5 — Create 4 Storage Buckets

Dashboard → Storage → New bucket (all Public):
- chat-attachments
- gallery  
- movies
- avatars

---

## Step 6 — Start the app

```bash
npm install
npm run dev
```

Login: husband / JEEVASULOGANENTHARA@1031
Login: wife    / JEEVASULOGANENTHARA@1031

---

## API Routes

| Method | Route | What it does |
|--------|-------|-------------|
| POST | /api/auth/login | Login, returns JWT token |
| POST | /api/auth/logout | Logout |
| GET | /api/messages | Get all messages |
| POST | /api/messages | Send a message |
| PATCH | /api/messages/[id] | Edit a message |
| DELETE | /api/messages/[id] | Delete a message |
| GET | /api/gallery | Get all gallery items |
| POST | /api/gallery | Upload a photo/video |
| PATCH | /api/gallery/[id] | Toggle like |
| DELETE | /api/gallery/[id] | Delete item |
| GET | /api/movies | Get all movies |
| POST | /api/movies | Add a movie |
| PATCH | /api/movies/[id] | Update watched/rating |
| DELETE | /api/movies/[id] | Delete movie |
| GET | /api/movie-sync | Get playback sync state |
| PATCH | /api/movie-sync | Update playback sync |
