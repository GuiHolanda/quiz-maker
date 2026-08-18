import type { MetadataRoute } from 'next';
import { EXAM_LANDING_PAGES } from '@/config/exam-landing-pages';
import { lastModified } from '@/config/page-last-modified';

const BASE_URL = 'https://www.certifiqueai.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const landingPages = EXAM_LANDING_PAGES.map((exam) => ({
    url: `${BASE_URL}/simulado/${exam.slug}`,
    lastModified: lastModified('examLandings'),
    priority: 0.9,
  }));

  // /login and /register are deliberately absent: they are thin, carry no search intent,
  // and an indexed login page only clutters the brand's own results. robots.txt still
  // allows them so they are not treated as hidden, they are just not advertised.
  return [
    { url: BASE_URL, lastModified: lastModified('home'), priority: 1.0 },
    ...landingPages,
    { url: `${BASE_URL}/demo`, lastModified: lastModified('demo'), priority: 0.9 },
    { url: `${BASE_URL}/pricing`, lastModified: lastModified('pricing'), priority: 0.8 },
    { url: `${BASE_URL}/privacy`, lastModified: lastModified('legal'), priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: lastModified('legal'), priority: 0.3 },
    { url: `${BASE_URL}/lgpd`, lastModified: lastModified('legal'), priority: 0.3 },
    { url: `${BASE_URL}/security`, lastModified: lastModified('legal'), priority: 0.3 },
  ];
}
