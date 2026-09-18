// lib/supabase.ts
// Supabase client — used ONLY for Realtime subscriptions (WebSocket)
// All DB reads/writes go through /api/... routes instead

import { createClient } from "@supabase/supabase-js"

let _client: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: "cosmicus-auth",
        },
        realtime: {
          params: { eventsPerSecond: 10 },
        },
      }
    )
  }
  return _client
}

// Call this after login so Realtime WebSocket is authenticated
export async function setRealtimeSession(accessToken: string) {
  const sb = getSupabase()
  // Set the session so realtime subscriptions are authenticated
  await sb.auth.setSession({
    access_token: accessToken,
    refresh_token: "", // not needed for realtime
  })
}

export type Profile = {
  id: string
  username: string
  display_name: string
  avatar_url?: string
  created_at: string
}

export const BUCKETS = {
  chatAttachments: "chat-attachments",
  gallery: "gallery",
  movies: "movies",
  avatars: "avatars",
} as const
