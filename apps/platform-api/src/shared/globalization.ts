import { formatCurrency, isRTL, resolveLocale } from '@direct/shared-globalization';
import type { FastifyRequest } from 'fastify';

export function getLocaleForRequest(request: FastifyRequest, override?: string) {
  const region = (request.headers['x-region'] as string | undefined) ?? 'US';
  return override ?? resolveLocale(region);
}

export function formatLocalCurrency(amount: number, currency: string, locale: string) {
  return formatCurrency(amount, currency, locale);
}

export function isRightToLeft(locale: string) {
  return isRTL(locale);
}
