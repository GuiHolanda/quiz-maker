/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Next.js output file tracing to include .properties files in the Lambda bundle.
  // Without this, readFile('public/messages/*.properties') silently fails on Vercel.
  outputFileTracingIncludes: {
    '**': ['./public/messages/**'],
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
