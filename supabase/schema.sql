-- =====================================================================
-- CosmicUs — Complete Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── MESSAGES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_username  TEXT NOT NULL,
  display_name     TEXT NOT NULL,
  text             TEXT NOT NULL DEFAULT '',
  edited_at        TIMESTAMPTZ,
  attachment_url   TEXT,
  attachment_type  TEXT CHECK (attachment_type IN ('image', 'video')),
  attachment_name  TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages (created_at ASC);

-- ── GALLERY ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url         TEXT NOT NULL,
  caption     TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL CHECK (type IN ('image', 'video')),
  uploaded_by UUID REFERENCES profiles(id),
  liked       BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS gallery_created_at_idx ON gallery_items (created_at DESC);

-- ── MOVIES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS movies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  genre       TEXT,
  added_by    TEXT NOT NULL,
  watched     BOOLEAN DEFAULT FALSE,
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  poster      TEXT,
  video_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── MOVIE SYNC STATE (singleton) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS movie_sync (
  id           INT PRIMARY KEY DEFAULT 1,
  movie_id     UUID REFERENCES movies(id) ON DELETE SET NULL,
  is_playing   BOOLEAN DEFAULT FALSE,
  playback_time FLOAT DEFAULT 0,
  started_by   TEXT,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
-- Insert the single row if it doesn't exist
INSERT INTO movie_sync (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_sync    ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- messages
CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "messages_update" ON messages FOR UPDATE TO authenticated USING (sender_id = auth.uid());
CREATE POLICY "messages_delete" ON messages FOR DELETE TO authenticated USING (sender_id = auth.uid());

-- gallery (both can like/view, only uploader can delete)
CREATE POLICY "gallery_select" ON gallery_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "gallery_insert" ON gallery_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "gallery_update" ON gallery_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "gallery_delete" ON gallery_items FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

-- movies (both can do everything)
CREATE POLICY "movies_all"     ON movies     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "sync_all"       ON movie_sync FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── REALTIME ─────────────────────────────────────────────────────────
-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE gallery_items;
ALTER PUBLICATION supabase_realtime ADD TABLE movies;
ALTER PUBLICATION supabase_realtime ADD TABLE movie_sync;

-- =====================================================================
-- STORAGE BUCKETS
-- After running this SQL, go to Storage tab and create these 4 buckets
-- (all set to PUBLIC):
--   • chat-attachments
--   • gallery
--   • movies
--   • avatars
-- =====================================================================

-- ── CALENDAR EVENTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  date        DATE NOT NULL,
  time        TEXT,
  color       TEXT DEFAULT '#6366f1',
  created_by  UUID REFERENCES profiles(id),
  created_by_name TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS calendar_events_date_idx ON calendar_events (date ASC);
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calendar_select" ON calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "calendar_insert" ON calendar_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "calendar_update" ON calendar_events FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "calendar_delete" ON calendar_events FOR DELETE TO authenticated USING (created_by = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;

-- ── PUSH SUBSCRIPTIONS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_all" ON push_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── COUPLE SETTINGS (anniversary date etc) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS couple_settings (
  id              INT PRIMARY KEY DEFAULT 1,
  together_since  DATE,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO couple_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE couple_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_all" ON couple_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
