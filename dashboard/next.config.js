/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export' ELTAVOLITVA - @cloudflare/next-on-pages nem kompatibilis ezzel
  // A CF Pages build: npx @cloudflare/next-on-pages@1
  trailingSlash: true,
  images: { unoptimized: true },
};

module.exports = nextConfig;
