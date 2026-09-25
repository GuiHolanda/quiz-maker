import { extractUtmParams, buildUtmCookieValue, parseUtmCookie } from '@/lib/utm';

describe('extractUtmParams', () => {
  it('extracts all three fields when present', () => {
    const params = new URLSearchParams('utm_source=instagram&utm_medium=social&utm_campaign=lancamento');

    expect(extractUtmParams(params)).toEqual({
      utmSource: 'instagram',
      utmMedium: 'social',
      utmCampaign: 'lancamento',
    });
  });

  it('extracts a partial set, leaving missing fields null', () => {
    const params = new URLSearchParams('utm_source=newsletter');

    expect(extractUtmParams(params)).toEqual({ utmSource: 'newsletter', utmMedium: null, utmCampaign: null });
  });

  it('returns null when no utm params are present', () => {
    const params = new URLSearchParams('ref=ABCD1234');

    expect(extractUtmParams(params)).toBeNull();
  });
});

describe('buildUtmCookieValue', () => {
  it('URI-encodes the JSON payload and sets a 30-day max-age', () => {
    const cookie = buildUtmCookieValue({ utmSource: 'instagram', utmMedium: 'social', utmCampaign: null });

    expect(cookie).toContain('certifiqueai_utm=');
    expect(cookie).toContain('max-age=2592000');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain(encodeURIComponent(JSON.stringify({ utmSource: 'instagram', utmMedium: 'social', utmCampaign: null })));
  });
});

describe('parseUtmCookie', () => {
  it('round-trips a value produced by buildUtmCookieValue', () => {
    const attribution = { utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'black-friday' };
    const cookie = buildUtmCookieValue(attribution);
    const raw = cookie.split(';')[0].split('=').slice(1).join('=');

    expect(parseUtmCookie(raw)).toEqual(attribution);
  });

  it('returns null for undefined input', () => {
    expect(parseUtmCookie(undefined)).toBeNull();
  });

  it('returns null for malformed JSON instead of throwing', () => {
    expect(parseUtmCookie('%7Bnot-json')).toBeNull();
  });

  it('returns null when the decoded payload has no utm fields set', () => {
    expect(parseUtmCookie(encodeURIComponent(JSON.stringify({ utmSource: null, utmMedium: null, utmCampaign: null })))).toBeNull();
  });
});
