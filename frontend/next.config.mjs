const isProd = process.env.NODE_ENV === 'production'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'export',
  // Only use basePath in production (GitHub Pages), locally use root
  basePath: isProd ? '/v0-website-creation-x9' : undefined,

}

export default nextConfig
