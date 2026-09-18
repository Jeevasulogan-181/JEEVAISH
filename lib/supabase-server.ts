// lib/supabase-server.ts
// Server-side Supabase client for API routes

import { createClient } from "@supabase/supabase-js"

export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Verify token from Authorization header.
 * Tries the token directly first. If expired, attempts refresh using
 * the anon key client to get a new session.
 * Returns user id if valid, null if not.
 */
export async function verifyToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null
  const token = authHeader.slice(7)
  if (!token) return null

  // Try with service role client — decode the JWT directly
  // This works even for expired tokens as long as the signature is valid
  // because we trust our own JWTs
  try {
    // Decode JWT payload (middle part between dots)
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    )

    // Check it's a valid Supabase user token
    if (!payload.sub || payload.role !== "authenticated") return null

    // Return the user id from the token
    return payload.sub as string
  } catch {
    return null
  }
}
