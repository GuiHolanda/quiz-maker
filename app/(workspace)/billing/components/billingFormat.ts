type Locale = 'pt' | 'en';

const LOCALE_TAG: Record<Locale, string> = { pt: 'pt-BR', en: 'en-US' };

export function formatMoney(cents: number, currency: string, language: Locale): string {
  return new Intl.NumberFormat(LOCALE_TAG[language], {
    style: 'currency',
    currency: currency.toUpperCase(),
  })
    .format(cents / 100)
    .replace(/\s/g, '');
}

export function formatDate(iso: string, language: Locale): string {
  return new Date(iso).toLocaleDateString(LOCALE_TAG[language], {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatShortDate(iso: string, language: Locale): string {
  return new Date(iso).toLocaleDateString(LOCALE_TAG[language], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatCount(value: number, language: Locale): string {
  return value.toLocaleString(LOCALE_TAG[language]);
}
