import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@dxp/ui', '@dxp/sdk-react'],
};

export default nextConfig;
