/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Statikus HTML/CSS/JS export - Cloudflare Pages statikusan szolgálja
  trailingSlash: true,
  images: { unoptimized: true },
};

module.exports = nextConfig;
