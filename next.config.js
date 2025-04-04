/** @type {import('next').NextConfig} */
const nextConfig = {
    // Performance optimizations
    reactStrictMode: false, // Disable StrictMode in production for better performance
    poweredByHeader: false, // Remove X-Powered-By header for security
    
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
        // Enable image optimization caching
        minimumCacheTTL: 60,
    },
    
    experimental: {
        // Only keep features that are supported in your Next.js version
        scrollRestoration: true,
    },
    
    // Enable standalone output for Docker deployment
    output: 'standalone',

    // Ignore ESLint and TypeScript errors during builds (remove this in production when you've fixed all errors)
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
}

module.exports = nextConfig 