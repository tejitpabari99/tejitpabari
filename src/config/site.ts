// src/config/site.ts
export const SITE_URL = 'https://tejitpabari.com';
export const SITE_NAME = 'Tejit Pabari';

export const DEFAULT_DESCRIPTION =
  'Health-tech builder and software engineer. Building Juno, an AI companion ' +
  'for medical appointments, while working full-time on Microsoft Fabric Maps.';

export const DEFAULT_OG_IMAGE = '/og/default.png';

/**
 * Resolves a root-relative path ("/projects/juno", "/og/default.png") to a
 * fully-qualified https://tejitpabari.com/... URL. Already-absolute input
 * (http(s)://...) passes through unchanged — the identical duck-typing
 * assertImagePath (SP02 §4.3) already validates a `Project`/`Research`
 * `image` value against, so nothing calling this ever needs a branch to
 * decide which shape it's holding before calling it.
 *
 * Also normalizes a protocol-relative input ("//host/path") to https://,
 * rather than falling through to the root-relative branch below, which
 * would otherwise treat the leading "//" as a root-relative path and
 * silently produce a malformed "https://tejitpabari.com//host/path" —
 * every value this returns must be a real, single-origin absolute
 * https:// URL, never protocol-relative and never mistakenly rooted on
 * this site's own origin.
 */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith('//')) return `https:${path}`;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
