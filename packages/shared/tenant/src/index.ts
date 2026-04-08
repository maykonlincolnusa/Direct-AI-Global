export interface TenantProfile {
  id: string;
  name: string;
  region: 'BR' | 'LATAM' | 'US' | 'EU' | 'APAC';
  locale: string;
  currency: string;
  timezone: string;
  plan: string;
  modules: string[];
}

export const regionDefaults: Record<TenantProfile['region'], Partial<TenantProfile>> = {
  BR: {
    locale: 'pt-BR',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo'
  },
  LATAM: {
    locale: 'es-419',
    currency: 'USD',
    timezone: 'America/Santiago'
  },
  US: {
    locale: 'en-US',
    currency: 'USD',
    timezone: 'America/New_York'
  },
  EU: {
    locale: 'en-GB',
    currency: 'EUR',
    timezone: 'Europe/Berlin'
  },
  APAC: {
    locale: 'en-AU',
    currency: 'USD',
    timezone: 'Asia/Singapore'
  }
};

export function resolveTenant(payload: Partial<TenantProfile> = {}) {
  const id = payload.id ?? cryptoRandomId();
  const region = (payload.region ?? 'US') as TenantProfile['region'];
  const defaults = regionDefaults[region] ?? regionDefaults.US;

  return {
    id,
    name: payload.name ?? `Org-${id.slice(0, 6)}`,
    region,
    locale: payload.locale ?? defaults.locale!,
    currency: payload.currency ?? defaults.currency!,
    timezone: payload.timezone ?? defaults.timezone!,
    plan: payload.plan ?? 'starter',
    modules: payload.modules ?? ['core']
  };
}

function cryptoRandomId() {
  return [...Array(24)]
    .map(() => Math.floor(Math.random() * 36).toString(36))
    .join('');
}
