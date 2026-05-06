/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip type-checking during build (run tsc --noEmit separately)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Image domains
  images: {
    domains: [
      'api.mapbox.com',
      'tiles.mapbox.com',
      'lh3.googleusercontent.com',
    ],
  },
  // Required for Three.js / React Three Fiber
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  // Webpack: handle Node.js built-ins used by CSV parser (fs, path)
  // These are only used in API routes (server-side), never in client bundles
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
