export const supportedLocales = [
  'en-US',
  'pt-BR',
  'es-419',
  'fr-FR',
  'de-DE',
  'ja-JP',
  'zh-CN',
  'ar-SA',
  'hi-IN'
];

export const currencyByRegion: Record<string, string> = {
  BR: 'BRL',
  LATAM: 'USD',
  US: 'USD',
  EU: 'EUR',
  APAC: 'USD'
};

const rtlLocales = new Set(['ar-SA']);

export function resolveLocale(region: string, override?: string) {
  if (override && supportedLocales.includes(override)) {
    return override;
  }
  if (region === 'BR') return 'pt-BR';
  if (region === 'LATAM') return 'es-419';
  if (region === 'EU') return 'fr-FR';
  if (region === 'APAC') return 'ja-JP';
  return 'en-US';
}

export function formatCurrency(value: number, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(value);
}

export function isRTL(locale: string) {
  return rtlLocales.has(locale);
}

export function formatDate(date: Date | string, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(typeof date === 'string' ? new Date(date) : date);
}
