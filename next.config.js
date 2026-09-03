/** @type {import('next').NextConfig} */
const nextConfig = {
  // Os pacotes de ícone são barrels enormes; sem isto o dev recompila todos a cada mudança
  // e o bundle de produção depende do tree-shaking acertar sozinho.
  experimental: {
    optimizePackageImports: [
      '@fortawesome/free-solid-svg-icons',
      '@fortawesome/free-regular-svg-icons',
      '@fortawesome/free-brands-svg-icons',
      '@tabler/icons-react',
    ],
  },
  // Force Next.js output file tracing to include .properties files in the Lambda bundle.
  // Without this, readFile('public/messages/*.properties') silently fails on Vercel.
  outputFileTracingIncludes: {
    '**': ['./public/messages/**'],
  },
  // Baseline response headers. The marketing surface is fully public, so it is the
  // part of the app an attacker reaches without any credential.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Clickjacking: nothing in this app is meant to be framed. frame-ancestors is
          // the modern control; X-Frame-Options covers browsers that ignore it.
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Frame-Options', value: 'DENY' },
          // Stops MIME sniffing turning an uploaded or proxied asset into script.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Keeps full URLs (which carry ids and query params) off third-party sites.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: '*.wikimedia.org' },
      { protocol: 'https', hostname: 'framerusercontent.com' },
      { protocol: 'https', hostname: 'www.cfp.net' },
      { protocol: 'https', hostname: 'www.anbima.com.br' },
      { protocol: 'https', hostname: 'www.ancord.org.br' },
    ],
  },
};

module.exports = nextConfig;
