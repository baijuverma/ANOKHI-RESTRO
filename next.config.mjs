
/** @type {import('next').NextConfig} */
const nextConfig = {
    // Add custom webpack config if needed for @react-pdf/renderer
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        return config;
    },
    reactStrictMode: false,
    swcMinify: true,
    experimental: {
        serverComponentsExternalPackages: ['@react-pdf/renderer'],
    },
};

export default nextConfig;
