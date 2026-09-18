-- Run this in Supabase SQL Editor to add Calendar + Push tables
-- (Only needed if you already ran schema.sql before — skip if running fresh)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── CALENDAR EVENTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  description     TEXT,
  date            DATE NOT NULL,
  time            TEXT,
  color           TEXT DEFAULT '#6366f1',
  created_by      UUID REFERENCES profiles(id),
  created_by_name TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS calendar_events_date_idx ON calendar_events (date ASC);
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "calendar_select" ON calendar_events;
DROP POLICY IF EXISTS "calendar_insert" ON calendar_events;
DROP POLICY IF EXISTS "calendar_update" ON calendar_events;
DROP POLICY IF EXISTS "calendar_delete" ON calendar_events;
CREATE POLICY "calendar_select" ON calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "calendar_insert" ON calendar_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "calendar_update" ON calendar_events FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "calendar_delete" ON calendar_events FOR DELETE TO authenticated USING (created_by = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;

-- ── PUSH SUBSCRIPTIONS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_all" ON push_subscriptions;
CREATE POLICY "push_all" ON push_subscriptions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Verify
SELECT 'calendar_events' as table_name, count(*) FROM calendar_events
UNION ALL
SELECT 'push_subscriptions', count(*) FROM push_subscriptions;
