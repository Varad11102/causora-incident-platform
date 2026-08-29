/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: process.env.GITHUB_ACTIONS ? "/causora-incident-platform" : "",
  images: { unoptimized: true },
};

export default nextConfig;
