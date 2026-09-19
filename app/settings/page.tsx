"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { apiGetSettings, apiUpdateSettings } from "@/lib/api-client"
import { CosmicBackground } from "@/components/cosmic-background"
import { AppShell } from "@/components/dashboard/app-shell"
import { Spinner } from "@/components/ui/spinner"
import { Camera, Save, User, FileText, Check } from "lucide-react"

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [displayName, setDisplayName] = useState("")
  const [about, setAbout]             = useState("")
  const [avatarUrl, setAvatarUrl]     = useState<string | null>(null)
  const [avatarFile, setAvatarFile]   = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [loading, setLoading]         = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/")
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user) return
    apiGetSettings().then((data) => {
      setDisplayName(data.display_name ?? "")
      setAbout(data.about ?? "")
      setAvatarUrl(data.avatar_url ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    e.target.value = ""
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const updated = await apiUpdateSettings({
        display_name: displayName.trim(),
        about: about.trim(),
        avatarFile: avatarFile ?? undefined,
      })
      setAvatarUrl(updated.avatar_url)
      setAvatarFile(null)
      setAvatarPreview(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const currentAvatar = avatarPreview ?? avatarUrl

  if (authLoading || !user) {
    return (
      <>
        <CosmicBackground />
        <div className="flex items-center justify-center min-h-screen">
          <Spinner className="w-8 h-8 text-[#8b5cf6]" />
        </div>
      </>
    )
  }

  return (
    <>
      <CosmicBackground />
      <AppShell title="Settings">
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
          <div className="max-w-lg mx-auto space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner className="w-8 h-8 text-[#8b5cf6]" />
              </div>
            ) : (
              <>
                {/* Avatar */}
                <div className="cosmic-card rounded-2xl p-6 space-y-4">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-[#6366f1]" /> Profile Picture
                  </h2>

                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div
                        className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-[#6366f1] to-[#f472b6] flex items-center justify-center cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {currentAvatar ? (
                          <img src={currentAvatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl font-bold text-white">{(displayName || user.displayName)[0]}</span>
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-[#6366f1] flex items-center justify-center shadow-lg hover:bg-[#4f46e5] transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5 text-white" />
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-foreground">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground mt-1">@{user.username}</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 text-xs text-[#6366f1] hover:text-[#818cf8] transition-colors"
                      >
                        Change photo
                      </button>
                    </div>
                  </div>

                  {avatarPreview && (
                    <p className="text-xs text-[#4ade80] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> New photo ready — click Save to apply
                    </p>
                  )}
                </div>

                {/* Display name */}
                <div className="cosmic-card rounded-2xl p-6 space-y-4">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-[#f472b6]" /> Display Name
                  </h2>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name…"
                    maxLength={30}
                    className="cosmic-input w-full px-4 py-3 rounded-xl text-sm"
                  />
                  <p className="text-xs text-muted-foreground">{displayName.length}/30 characters</p>
                </div>

                {/* About */}
                <div className="cosmic-card rounded-2xl p-6 space-y-4">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#8b5cf6]" /> About
                  </h2>
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="Write something about yourself…"
                    rows={4}
                    maxLength={200}
                    className="cosmic-input w-full px-4 py-3 rounded-xl text-sm resize-none"
                  />
                  <p className="text-xs text-muted-foreground">{about.length}/200 characters</p>
                </div>

                {/* Save button */}
                <button
                  onClick={handleSave}
                  disabled={saving || !displayName.trim()}
                  className="cosmic-btn w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
                  ) : saved ? (
                    <><Check className="w-4 h-4" /> Saved!</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Changes</>
                  )}
                </button>

                {saved && (
                  <div className="text-center text-sm text-[#4ade80] flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> Profile updated successfully ✨
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </AppShell>
    </>
  )
}
