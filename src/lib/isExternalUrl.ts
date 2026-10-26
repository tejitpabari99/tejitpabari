// src/lib/isExternalUrl.ts

/**
 * True for absolute http(s) URLs pointing off-site. Root-relative paths
 * are internal and must stay in the same tab/router.
 */
export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
