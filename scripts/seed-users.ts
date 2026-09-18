/**
 * scripts/seed-users.ts
 *
 * Creates JEEVA (husband) and VAISHNEVI (wife) in Supabase Auth + profiles table.
 *
 * HOW TO RUN:
 *   1. Add your service_role key to .env.local:
 *      SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
 *   2. npx tsx scripts/seed-users.ts
 *   3. Remove SUPABASE_SERVICE_ROLE_KEY from .env.local when done.
 */

import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx < 0) continue
    const k = trimmed.slice(0, eqIdx).trim()
    const v = trimmed.slice(eqIdx + 1).trim()
    if (k) process.env[k] = v
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("\n❌  Missing env vars. Add to .env.local:")
  console.error("    NEXT_PUBLIC_SUPABASE_URL=https://dkpzgebjiortxzmmropt.supabase.co")
  console.error("    SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (from Project Settings → API → service_role)\n")
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const USERS = [
  { username: "husband", displayName: "JEEVA",    email: "husband@cosmicus.app", password: "JEEVASULOGANENTHARA@1031" },
  { username: "wife",    displayName: "VAISHNEVI", email: "wife@cosmicus.app",    password: "JEEVASULOGANENTHARA@1031" },
]

async function run() {
  for (const u of USERS) {
    console.log(`\n── ${u.username} (${u.displayName}) ──────────────`)

    // 1. Create or find auth user
    let userId: string | null = null

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    })

    if (createErr) {
      if (createErr.message.toLowerCase().includes("already")) {
        const { data: list } = await admin.auth.admin.listUsers()
        const found = list?.users.find((x) => x.email === u.email)
        if (found) {
          userId = found.id
          // Make sure password is correct
          await admin.auth.admin.updateUserById(userId, { password: u.password })
          console.log("  ↻  Auth user already exists — password synced")
        } else {
          console.error("  ❌  Could not find existing user"); continue
        }
      } else {
        console.error("  ❌  Create error:", createErr.message); continue
      }
    } else {
      userId = created.user.id
      console.log("  ✅  Auth user created:", userId)
    }

    // 2. Upsert profile row
    const { error: profileErr } = await admin.from("profiles").upsert(
      { id: userId, username: u.username, display_name: u.displayName },
      { onConflict: "id" }
    )

    if (profileErr) {
      console.error("  ❌  Profile error:", profileErr.message)
    } else {
      console.log("  ✅  Profile ready for", u.displayName)
    }
  }

  console.log("\n🎉  All done!")
  console.log("    husband / JEEVASULOGANENTHARA@1031  →  JEEVA")
  console.log("    wife    / JEEVASULOGANENTHARA@1031  →  VAISHNEVI")
}

run().catch(console.error)
