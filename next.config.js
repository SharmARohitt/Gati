/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip type-checking during build
  typescript: { ignoreBuildErrors: true },
  // Skip ESLint during build
  eslint: { ignoreDuringBuilds: true },

  // Image domains
  images: {
    domains: ['api.mapbox.com', 'tiles.mapbox.com', 'lh3.googleusercontent.com'],
  },

  // Required for Three.js
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],

  // Webpack: handle Node.js built-ins (fs/path used by CSV parser in API routes only)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
