/**
 * Build URLs for token-based employee ordering.
 *
 * Important: Tokens exist per environment (Preview/Test vs Live). Therefore we must
 * generate links for the current origin, not a hard-coded domain.
 */

export function getAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // Fallback (SSR / tooling). Not used in normal client rendering.
  return 'https://bestellung.pro';
}

export function buildSimpleOrderUrl(token: string): string {
  return `${getAppOrigin()}/simple-order/${token}`;
}
