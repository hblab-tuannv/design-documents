import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  // Image Optimization requires a server — serve images as-is
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  // LAN origins allowed to reach the dev server, so teammates can preview
  // the docs at http://<your-ip>:3000 — set yours in .env.local (see
  // .env.example); dev-only, no effect on the static export
  allowedDevOrigins:
    process.env.ALLOWED_DEV_ORIGINS?.split(',').map((s) => s.trim()) ?? [],
}

export default withMDX(config)
