-- =====================================================================
-- CosmicUs — Add Notes, Replies, Settings
-- Run in: Supabase SQL Editor → New query → Run
-- =====================================================================

-- ── Add 'about' column to profiles ───────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS about TEXT;

-- ── NOTES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes (created_at DESC);
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes_select" ON notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "notes_insert" ON notes FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "notes_delete" ON notes FOR DELETE TO authenticated USING (author_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE notes;

-- ── NOTE REPLIES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS note_replies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id     UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS replies_note_id_idx ON note_replies (note_id);
ALTER TABLE note_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "replies_select" ON note_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "replies_insert" ON note_replies FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "replies_delete" ON note_replies FOR DELETE TO authenticated USING (author_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE note_replies;

-- Verify
SELECT 'notes' as tbl, count(*) FROM notes
UNION ALL SELECT 'note_replies', count(*) FROM note_replies;
