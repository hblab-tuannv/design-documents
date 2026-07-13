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
}

export default withMDX(config)
