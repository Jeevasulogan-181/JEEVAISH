/**
 * lib/local-auth.ts
 * Local, self-signed JWT auth for API routes — no external auth provider.
 * Tokens are signed with a secret that's auto-generated on first run and
 * stored in data/db.json (see lib/local-db.ts), so it stays stable across
 * restarts without any setup.
 */

import jwt from "jsonwebtoken"
import { getJwtSecret } from "./local-db"

const ACCESS_TOKEN_TTL = "2h"
const REFRESH_TOKEN_TTL = "30d"

export interface AccessPayload {
  sub: string
  type: "access"
}
interface RefreshPayload {
  sub: string
  type: "refresh"
}

export function signAccessToken(userId: string): { token: string; expiresAt: number } {
  const secret = getJwtSecret()
  const token = jwt.sign({ sub: userId, type: "access" }, secret, { expiresIn: ACCESS_TOKEN_TTL })
  const { exp } = jwt.decode(token) as { exp: number }
  return { token, expiresAt: exp }
}

export function signRefreshToken(userId: string): string {
  const secret = getJwtSecret()
  return jwt.sign({ sub: userId, type: "refresh" }, secret, { expiresIn: REFRESH_TOKEN_TTL })
}

/** Verify an access token from an Authorization header. Returns the user id, or null. */
export async function verifyToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null
  const token = authHeader.slice(7)
  if (!token) return null

  try {
    const secret = getJwtSecret()
    const payload = jwt.verify(token, secret) as AccessPayload
    if (payload.type !== "access" || !payload.sub) return null
    return payload.sub
  } catch {
    return null
  }
}

/** Verify a refresh token. Returns the user id, or null. */
export function verifyRefreshToken(token: string): string | null {
  try {
    const secret = getJwtSecret()
    const payload = jwt.verify(token, secret) as RefreshPayload
    if (payload.type !== "refresh" || !payload.sub) return null
    return payload.sub
  } catch {
    return null
  }
}
