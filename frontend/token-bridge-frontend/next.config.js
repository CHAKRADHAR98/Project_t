// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Fix for Solana web3.js and wallet adapter issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };

    // Externalize problematic packages
    if (!isServer) {
      config.externals.push('pino-pretty', 'encoding');
    }

    return config;
  },
  // Enable experimental features if needed
  experimental: {
    esmExternals: 'loose',
  },
  // Transpile Solana packages that might need it
  transpilePackages: [
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-react-ui',
    '@solana/wallet-adapter-wallets',
  ],
  // Disable source maps in production for better performance
  productionBrowserSourceMaps: false,
  // Optimize images
  images: {
    domains: [], // Add any image domains you need
  },
  // Environment variables (optional - you can also use .env.local)
  env: {
    NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
    NEXT_PUBLIC_PROGRAM_ID: process.env.NEXT_PUBLIC_PROGRAM_ID,
    NEXT_PUBLIC_JUPITER_API: process.env.NEXT_PUBLIC_JUPITER_API,
    NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK,
  },
}

module.exports = nextConfig