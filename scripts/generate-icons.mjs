// One-off icon generator — rasterizes scripts/icon-source*.svg into every
// PNG size the PWA manifest / favicons / apple touch icon need.
// Run with: node scripts/generate-icons.mjs
import sharp from "sharp"
import fs from "fs"
import path from "path"

const root = process.cwd()
const iconsDir = path.join(root, "public", "icons")
fs.mkdirSync(iconsDir, { recursive: true })

const standard = path.join(root, "scripts", "icon-source.svg")
const maskable = path.join(root, "scripts", "icon-source-maskable.svg")

const jobs = [
  { src: standard, out: path.join(iconsDir, "icon-192.png"), size: 192 },
  { src: standard, out: path.join(iconsDir, "icon-512.png"), size: 512 },
  { src: maskable, out: path.join(iconsDir, "icon-512-maskable.png"), size: 512 },
  { src: standard, out: path.join(iconsDir, "apple-touch-icon.png"), size: 180 },
  { src: standard, out: path.join(root, "app", "icon.png"), size: 256 },
  { src: standard, out: path.join(root, "app", "apple-icon.png"), size: 180 },
]

for (const job of jobs) {
  await sharp(job.src).resize(job.size, job.size).png().toFile(job.out)
  console.log(`✅  ${path.relative(root, job.out)} (${job.size}x${job.size})`)
}

console.log("\nDone.")
