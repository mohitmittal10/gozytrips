import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  compress: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  serverExternalPackages: [
    'genkit',
    '@genkit-ai/google-genai',
    '@genkit-ai/next',
  ],
  images: {
    qualities: [60, 75],
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
};

export default nextConfig;
