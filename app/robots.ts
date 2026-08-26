import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing', '/login', '/register'],
        disallow: [
          '/dashboard',
          '/simulados',
          '/exams',
          '/questions',
          '/question-bank',
          '/billing',
          '/admin',
          '/api',
          '/style-guide',
        ],
      },
    ],
    sitemap: 'https://www.certifiqueai.com/sitemap.xml',
  };
}
