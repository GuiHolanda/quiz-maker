/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Next.js output file tracing to include .properties files in the Lambda bundle.
  // Without this, readFile('public/messages/*.properties') silently fails on Vercel.
  outputFileTracingIncludes: {
    '**': ['./public/messages/**'],
  },
};

module.exports = nextConfig;
