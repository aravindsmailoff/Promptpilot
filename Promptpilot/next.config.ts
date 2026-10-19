
import type {NextConfig} from 'next';

const nextConfig: any = {
  devIndicators: false,
  serverExternalPackages: ['officeparser'],
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', 'ogl', 'lenis', '@theatre/core'],

  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:9002', '10.0.2.2:9002', '172.27.154.118:9002', '192.168.29.57:9002', '10.154.239.118:9002'],
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
      {
        protocol: 'https',
        hostname: 'fastly.picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.picsum.photos',
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
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://promptpilot-77e36.firebaseapp.com https://www.gstatic.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://placehold.co https://images.unsplash.com https://picsum.photos https://*.picsum.photos https://fastly.picsum.photos; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://promptpilot-77e36.firebaseapp.com https://oauth2.googleapis.com https://gmail.googleapis.com http://127.0.0.1:8001 http://127.0.0.1:8002 http://127.0.0.1:11434 http://127.0.0.1:8000 http://localhost:8001 http://localhost:8002 http://localhost:9002 http://192.168.29.57:9002 http://192.168.29.57:8001 http://192.168.29.57:8002 http://192.168.29.57:11434 http://192.168.29.57:8000 http://172.27.154.118:9002 http://172.27.154.118:8001 http://172.27.154.118:8002 http://172.27.154.118:11434 http://172.27.154.118:8000 http://10.154.239.118:9002 http://10.154.239.118:8001 http://10.154.239.118:8002 http://10.154.239.118:11434 http://10.154.239.118:8000; frame-src 'self' https://promptpilot-77e36.firebaseapp.com https://*.firebaseapp.com; frame-ancestors 'none';",
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

