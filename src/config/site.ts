// src/config/site.ts
export const SITE_URL = 'https://tejitpabari.com';
export const SITE_NAME = 'Tejit Pabari';

export const DEFAULT_DESCRIPTION =
  'Health-tech builder and software engineer — building Juno, an AI companion ' +
  'for medical appointments, while working full-time on Microsoft Fabric Maps.';

export const DEFAULT_OG_IMAGE = '/og/default.png';

/**
 * Resolves a root-relative path ("/projects/juno", "/og/default.png") to a
 * fully-qualified https://tejitpabari.com/... URL. Already-absolute input
 * (http(s)://...) passes through unchanged — the identical duck-typing
 * assertImagePath (SP02 §4.3) already validates a `Project`/`Research`
 * `image` value against, so nothing calling this ever needs a branch to
 * decide which shape it's holding before calling it.
 */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
