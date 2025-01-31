/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  distDir: ".next",
  output: "export",
  experimental: {
    serverActions: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
