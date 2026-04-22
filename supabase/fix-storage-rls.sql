-- Run this in Supabase SQL Editor
-- Fixes image display issues by ensuring storage is fully public

-- Drop all existing storage policies first to avoid conflicts
DROP POLICY IF EXISTS "allow_authenticated_uploads_chat" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_uploads_gallery" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_uploads_movies" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_uploads_avatars" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_reads_chat" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_reads_gallery" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_reads_movies" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_reads_avatars" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_deletes_chat" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_deletes_gallery" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_deletes_movies" ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_deletes_avatars" ON storage.objects;

-- Single open policy for reads (fully public — images display for anyone)
CREATE POLICY "storage_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id IN ('chat-attachments', 'gallery', 'movies', 'avatars'));

-- Authenticated users can upload
CREATE POLICY "storage_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('chat-attachments', 'gallery', 'movies', 'avatars'));

-- Authenticated users can update
CREATE POLICY "storage_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id IN ('chat-attachments', 'gallery', 'movies', 'avatars'));

-- Authenticated users can delete
CREATE POLICY "storage_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id IN ('chat-attachments', 'gallery', 'movies', 'avatars'));

-- Also make sure buckets themselves are public
UPDATE storage.buckets SET public = true
WHERE id IN ('chat-attachments', 'gallery', 'movies', 'avatars');
