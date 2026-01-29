/**
 * Build URLs for token-based employee ordering.
 *
 * Important: Tokens exist per environment (Preview/Test vs Live). Therefore we must
 * generate links for the current origin, not a hard-coded domain.
 */

export function getAppOrigin(): string {
  if (typeof window === 'undefined' || !window.location) {
    // Fallback (SSR / tooling). Not used in normal client rendering.
    return 'https://bestellung.lovable.app';
  }

  const { origin, hostname } = window.location;

  // When running inside the Lovable editor preview iframe, the app is hosted on
  // *.lovableproject.com which is not intended to be shared publicly. We can
  // deterministically derive the public preview URL from the subdomain.
  // Example:
  //   https://<projectId>.lovableproject.com -> https://id-preview--<projectId>.lovable.app
  if (hostname.endsWith('.lovableproject.com')) {
    const projectId = hostname.split('.')[0];
    return `https://id-preview--${projectId}.lovable.app`;
  }

  // Default: use the current origin (published domain, custom domain, local dev, etc.)
  return origin;
}

export function buildSimpleOrderUrl(token: string): string {
  return `${getAppOrigin()}/simple-order/${token}`;
}
