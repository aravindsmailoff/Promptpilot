
import type {NextConfig} from 'next';

const nextConfig: any = {
  output: process.env.NODE_ENV === 'development' ? undefined : 'export',
  devIndicators: false,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:9002', '10.0.2.2:9002'],
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://placehold.co https://images.unsplash.com https://picsum.photos; connect-src 'self' https://oauth2.googleapis.com https://gmail.googleapis.com http://127.0.0.1:8001 http://127.0.0.1:11434 http://127.0.0.1:8000; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
  webpack: (config: any, { isServer, webpack }: any) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        https: false,
        http: false,
        url: false,
        path: false,
        stream: false,
        crypto: false,
        os: false,
      };

      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:/,
          (resource: any) => {
            resource.request = resource.request.replace(/^node:/, '');
          }
        )
      );
    }
    return config;
  },
};

export default nextConfig;

