/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Uploaded media is served locally from /uploads (public/uploads/...),
    // so no remote image patterns are needed.
    unoptimized: true,
  },
}

export default nextConfig
