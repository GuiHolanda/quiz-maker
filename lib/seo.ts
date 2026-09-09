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

// JSON.stringify does not escape "<", so a value containing "</script>" would close the
// tag and turn structured data into an injection point. Today every schema is built from
// repo-controlled constants and the bundled .properties file, so nothing is reachable by
// an attacker — this keeps that true if a schema ever draws on the database.
export function jsonLd(schema: unknown): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c');
}
