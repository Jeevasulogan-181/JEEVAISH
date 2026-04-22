"use client"

import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, type ReactNode,
} from "react"
import { apiLogin, apiLogout, setToken, getToken } from "./api-client"
import { getSupabase } from "./supabase"

export interface AuthUser {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isLoading: boolean
}

const USER_KEY = "cosmicus-user"

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const initialised               = useRef(false)

  useEffect(() => {
    if (initialised.current) return
    initialised.current = true

    try {
      const token     = getToken()
      const savedUser = localStorage.getItem(USER_KEY)

      if (token && savedUser) {
        const u = JSON.parse(savedUser) as AuthUser
        setUser(u)
        console.log("[CosmicUs] Session restored:", u.username)
      }
    } catch {
      setToken(null)
      localStorage.removeItem(USER_KEY)
    }

    setIsLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      console.log("[CosmicUs] API login:", username)
      const res = await apiLogin(username, password)

      // Store token + refresh token + expiry
      setToken(res.token, res.refreshToken, res.expiresAt)
      localStorage.setItem(USER_KEY, JSON.stringify(res.user))

      setUser(res.user)
      console.log("[CosmicUs] Login success:", res.user.displayName)
      return true
    } catch (e) {
      console.error("[CosmicUs] Login error:", e)
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    try { await apiLogout() } catch { /* ignore */ }
    setToken(null)
    setUser(null)
    localStorage.removeItem(USER_KEY)
    try { await getSupabase().auth.signOut() } catch { /* ignore */ }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
