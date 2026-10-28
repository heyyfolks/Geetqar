/** @type {import('next').NextConfig} */
const nextConfig = {
  // Retired pages from the old design now point at the new home page, so old links and search results keep working.
  async redirects() {
    return [
      { source: '/music', destination: '/#music', permanent: true },
      { source: '/archive', destination: '/#music', permanent: true },
      { source: '/arena', destination: '/', permanent: true },
      { source: '/mood/:path*', destination: '/', permanent: true },
      { source: '/world/:path*', destination: '/#music', permanent: true },
    ]
  },
}

export default nextConfig
