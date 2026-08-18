// Next merges metadata shallowly: a page that declares its own `openGraph` replaces the
// root object wholesale, so it silently loses the inherited `images`. Every page that
// sets an openGraph block must spread this in, or its link previews render blank on
// Facebook, LinkedIn and WhatsApp.
export const OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'CertifiqueAI — questões com IA para certificações e concursos públicos',
} as const;

export const OG_IMAGES = [OG_IMAGE];
