/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  async rewrites() {
    const backendUrl = process.env.CLOUD_RUN_BACKEND_URL || 'https://scout-dashboard-283427197752.us-central1.run.app'
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
