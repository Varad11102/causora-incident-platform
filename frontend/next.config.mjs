/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: { unoptimized: true },
  async rewrites() {
    return [{
      source: "/api/:path*",
      destination: `${process.env.INTERNAL_API_BASE_URL ?? "http://localhost:8082"}/api/:path*`,
    }];
  },
};

export default nextConfig;
