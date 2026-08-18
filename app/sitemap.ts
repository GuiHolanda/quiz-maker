import type { MetadataRoute } from 'next';
import { EXAM_LANDING_PAGES } from '@/config/exam-landing-pages';

export default function sitemap(): MetadataRoute.Sitemap {
  const landingPages = EXAM_LANDING_PAGES.map((exam) => ({
    url: `https://www.certifiqueai.com/simulado/${exam.slug}`,
    lastModified: new Date(),
    priority: 0.9,
  }));

  return [
    { url: 'https://www.certifiqueai.com', lastModified: new Date(), priority: 1.0 },
    ...landingPages,
    { url: 'https://www.certifiqueai.com/demo', lastModified: new Date(), priority: 0.9 },
    { url: 'https://www.certifiqueai.com/pricing', lastModified: new Date(), priority: 0.8 },
    { url: 'https://www.certifiqueai.com/register', lastModified: new Date(), priority: 0.7 },
    { url: 'https://www.certifiqueai.com/login', lastModified: new Date(), priority: 0.5 },
    { url: 'https://www.certifiqueai.com/privacy', lastModified: new Date(), priority: 0.3 },
    { url: 'https://www.certifiqueai.com/terms', lastModified: new Date(), priority: 0.3 },
    { url: 'https://www.certifiqueai.com/lgpd', lastModified: new Date(), priority: 0.3 },
    { url: 'https://www.certifiqueai.com/security', lastModified: new Date(), priority: 0.3 },
  ];
}
