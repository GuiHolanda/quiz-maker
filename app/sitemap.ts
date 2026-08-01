import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://www.certifiqueai.com', lastModified: new Date(), priority: 1.0 },
    { url: 'https://www.certifiqueai.com/pricing', lastModified: new Date(), priority: 0.8 },
    { url: 'https://www.certifiqueai.com/register', lastModified: new Date(), priority: 0.7 },
    { url: 'https://www.certifiqueai.com/login', lastModified: new Date(), priority: 0.5 },
  ];
}
