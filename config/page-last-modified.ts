// Real content dates for the sitemap's <lastmod>.
//
// Google only honours lastmod when it is consistently accurate, and learns to ignore it
// for a whole site when it is not — so `new Date()` at build time was worse than useless:
// it claimed every page changed on every deploy.
//
// These dates are maintained by hand on purpose. Deriving them from git file history
// conflates a content rewrite with a metadata tweak — an SEO edit to a `<title>` would
// bump the date as if the copy had changed. Bump an entry when the page's *content*
// changes, not when you touch its frontmatter or fix a lint warning.
//
// Landing pages share one date because they are all generated from
// config/exam-landing-pages.ts.

export const PAGE_LAST_MODIFIED = {
  // CTA copy reworked when the demo entry points landed (#54).
  home: '2026-08-18',
  // Everything below was written in the marketing overhaul (#52) and has not changed
  // in substance since.
  demo: '2026-08-17',
  pricing: '2026-08-17',
  examLandings: '2026-08-17',
  legal: '2026-08-17',
  simuladoHub: '2026-08-26',
} as const;

export function lastModified(key: keyof typeof PAGE_LAST_MODIFIED): Date {
  return new Date(PAGE_LAST_MODIFIED[key]);
}
