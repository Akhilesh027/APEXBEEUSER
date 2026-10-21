/**
 * Utility functions for generating public, shareable URLs.
 * Ensures that links shared from inside native mobile apps (Capacitor/Android/iOS)
 * or local dev environments never use localhost or internal schemes.
 */

export const getPublicBaseUrl = (): string => {
  // 1. Explicit environment variable override
  const envUrl =
    import.meta.env.VITE_SITE_URL ||
    import.meta.env.VITE_APP_URL ||
    import.meta.env.VITE_PUBLIC_URL;

  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin || '';
    const hostname = window.location.hostname || '';
    const cap = (window as any).Capacitor;
    const isNative = Boolean(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());

    // If native app container, or local dev / IP address
    const isLocalOrContainer =
      isNative ||
      !origin ||
      origin.startsWith('capacitor:') ||
      origin.startsWith('ionic:') ||
      origin.startsWith('file:') ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.');

    if (!isLocalOrContainer) {
      return origin.replace(/\/+$/, '');
    }
  }

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // Official public domain for customer website & web application
  return 'https://apexbee.in';
};

/**
 * Builds a clean, public referral link that recipients can open on any device.
 */
export const buildReferralLink = (referralCode?: string): string => {
  const base = getPublicBaseUrl();
  const code = (referralCode || '').trim();
  return code ? `${base}/register?ref=${encodeURIComponent(code)}` : `${base}/register`;
};

/**
 * Sanitizes an incoming referral link (e.g. from backend or state),
 * replacing any localhost/container URL with the public production domain.
 */
export const sanitizeReferralLink = (link?: string, code?: string): string => {
  if (
    link &&
    !link.includes('localhost') &&
    !link.includes('127.0.0.1') &&
    !link.startsWith('capacitor:') &&
    !link.startsWith('file:') &&
    link.startsWith('http')
  ) {
    return link;
  }
  return buildReferralLink(code);
};

/**
 * Builds a public shareable URL for products, categories, or other pages.
 */
export const buildPublicShareUrl = (path: string, queryParams?: Record<string, string | number | undefined | null>): string => {
  const base = getPublicBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  try {
    const url = new URL(cleanPath, base);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          url.searchParams.set(key, String(val));
        }
      });
    }
    return url.toString();
  } catch {
    return `${base}${cleanPath}`;
  }
};
