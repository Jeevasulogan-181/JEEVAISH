# CosmicUs — Setup Guide

This app is **fully local** — there is no cloud service, no account to
create, and no API keys to configure. Everything runs on your machine:

```
Browser → /api/... (Next.js API Routes) → data/db.json + public/uploads/
```

- **Data** lives in a single JSON file at `data/db.json` (auto-created on
  first run).
- **Uploads** (photos, videos, avatars, chat attachments) are written to
  `public/uploads/`.
- Both are gitignored — your data never leaves this machine and never gets
  committed.

---

## Step 1 — Install & run

```bash
npm install
npm run dev
```

That's it. `data/db.json` is created automatically the first time an API
route runs, seeded with two dummy accounts:

```
Login: husband / ChangeMe@123
Login: wife    / ChangeMe@123
```

⚠️ These are placeholder credentials — see "Changing the login" below
before relying on this for anything private.

---

## Resetting all data

To wipe everything (messages, gallery, notes, movies, uploads) and start
fresh with the two dummy accounts again:

```bash
npm run reset
```

This only touches files on your machine — `data/db.json` and
`public/uploads/`.

---

## Changing the login

There's no "change password" UI yet. To set your own password:

1. Run `npm run dev` once so `data/db.json` exists.
2. Stop the server.
3. In a `node` REPL (or a throwaway script), generate a bcrypt hash:
   ```js
   require("bcryptjs").hashSync("your-new-password", 10)
   ```
4. Open `data/db.json` and replace the matching profile's `password_hash`
   with that value.
5. Restart the server.

---

## API Routes

| Method | Route | What it does |
|--------|-------|-------------|
| POST | /api/auth/login | Login, returns access + refresh tokens |
| POST | /api/auth/logout | Logout (stateless — just for symmetry) |
| POST | /api/auth/refresh | Exchange a refresh token for a new access token |
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
| GET | /api/notes | Get all notes with replies |
| POST | /api/notes | Create a note |
| DELETE | /api/notes/[id] | Delete a note |
| POST | /api/notes/[id]/replies | Add a reply |
| DELETE | /api/notes/[id]/replies?replyId= | Delete a reply |
| GET | /api/settings | Get your profile |
| PATCH | /api/settings | Update display name / about / avatar |
