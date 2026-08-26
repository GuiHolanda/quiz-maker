const BASE_URL = 'https://www.certifiqueai.com';

export function alternatesFor(path: string): { canonical: string; languages: Record<string, string> } {
  const canonical = path === '/' ? BASE_URL : `${BASE_URL}${path}`;

  return {
    canonical,
    languages: {
      'pt-BR': canonical,
      'x-default': canonical,
    },
  };
}
