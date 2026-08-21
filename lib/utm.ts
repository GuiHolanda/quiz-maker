import { UTM_COOKIE_KEY, UTM_COOKIE_MAX_AGE_SECONDS } from '@/config/constants';

export interface UtmAttribution {
  readonly utmSource: string | null;
  readonly utmMedium: string | null;
  readonly utmCampaign: string | null;
}

// Pure — a minimal structural type instead of the DOM's URLSearchParams so this also
// accepts a plain Map/object in tests without pulling in a DOM environment.
export function extractUtmParams(searchParams: Pick<URLSearchParams, 'get'>): UtmAttribution | null {
  const utmSource = searchParams.get('utm_source');
  const utmMedium = searchParams.get('utm_medium');
  const utmCampaign = searchParams.get('utm_campaign');

  if (!utmSource && !utmMedium && !utmCampaign) return null;

  return { utmSource, utmMedium, utmCampaign };
}

export function buildUtmCookieValue(attribution: UtmAttribution): string {
  const encoded = encodeURIComponent(JSON.stringify(attribution));

  return `${UTM_COOKIE_KEY}=${encoded}; path=/; max-age=${UTM_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

// Reads either document.cookie's raw value or next/headers' cookies().get()?.value —
// neither auto-decodes, so both sides of the read need this same decode step.
export function parseUtmCookie(raw: string | undefined): UtmAttribution | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<UtmAttribution>;

    if (!parsed.utmSource && !parsed.utmMedium && !parsed.utmCampaign) return null;

    return {
      utmSource: parsed.utmSource ?? null,
      utmMedium: parsed.utmMedium ?? null,
      utmCampaign: parsed.utmCampaign ?? null,
    };
  } catch {
    return null;
  }
}

// First-touch capture: never overwrites a UTM cookie that's already set, so the campaign
// that originally brought the visitor in survives a later visit that carries no UTM at all
// (or a different one — e.g. clicking their own referral link after arriving via an ad).
export function captureUtmFromUrl(searchParams: Pick<URLSearchParams, 'get'>): void {
  if (typeof document === 'undefined') return;
  if (document.cookie.split('; ').some((c) => c.startsWith(`${UTM_COOKIE_KEY}=`))) return;

  const attribution = extractUtmParams(searchParams);

  if (!attribution) return;

  document.cookie = buildUtmCookieValue(attribution);
}

// Client-side read at signup submit time, to attach whatever was captured earlier to the
// credentials POST body. The Google path doesn't need this — auth.ts reads the same cookie
// server-side in events.createUser, since the browser carries it through the OAuth redirect.
export function readUtmCookie(): UtmAttribution | null {
  if (typeof document === 'undefined') return null;

  const prefix = `${UTM_COOKIE_KEY}=`;
  const match = document.cookie.split('; ').find((c) => c.startsWith(prefix));

  return match ? parseUtmCookie(match.slice(prefix.length)) : null;
}
