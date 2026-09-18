/**
 * scripts/reset-local-data.ts
 *
 * Wipes ALL local app data — chat messages, gallery/movie/avatar uploads,
 * notes, movies — and restores the two dummy accounts:
 *   husband / ChangeMe@123
 *   wife    / ChangeMe@123
 *
 * HOW TO RUN:
 *   npm run reset
 *
 * This only touches your local machine (data/db.json and public/uploads/).
 * There is no cloud service to clean up — this app has none.
 */

import * as fs from "fs"
import * as path from "path"

const root = process.cwd()
const dbPath = path.join(root, "data", "db.json")
const uploadsDir = path.join(root, "public", "uploads")

if (fs.existsSync(dbPath)) {
  fs.rmSync(dbPath)
  console.log("✅  Removed data/db.json")
} else {
  console.log("ℹ️   data/db.json did not exist")
}

if (fs.existsSync(uploadsDir)) {
  for (const bucket of fs.readdirSync(uploadsDir)) {
    const bucketPath = path.join(uploadsDir, bucket)
    if (fs.statSync(bucketPath).isDirectory()) {
      fs.rmSync(bucketPath, { recursive: true, force: true })
      fs.mkdirSync(bucketPath, { recursive: true })
      fs.writeFileSync(path.join(bucketPath, ".gitkeep"), "")
    }
  }
  console.log("✅  Cleared public/uploads/*")
} else {
  console.log("ℹ️   public/uploads did not exist")
}

console.log("\n🎉  Local data reset. A fresh data/db.json (with the two dummy")
console.log("    accounts below) will be created the next time the app starts.\n")
console.log("    husband / ChangeMe@123")
console.log("    wife    / ChangeMe@123")
console.log("\n⚠️  These are dummy placeholder credentials — change them before real use.")
