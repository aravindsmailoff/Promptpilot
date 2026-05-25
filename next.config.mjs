/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:9002', '10.0.2.2:9002'],
    },
  },
};

export default nextConfig;
