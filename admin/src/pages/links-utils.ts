export const SHORT_HOST = 'go.tejitpabari.com';

// Multi-segment slugs ("juno/pitch-deck") are used as-is: the real slash slug, never the Firestore doc id.
export const shortDisplay = (slug: string) => `${SHORT_HOST}/${slug}`;
export const shortUrl = (slug: string) => `https://${SHORT_HOST}/${slug}`;

export const isExpired = (expiresAt?: string | null) => !!expiresAt && new Date(expiresAt) < new Date();

export const parseTags = (s: string) =>
  s
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

export function hostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}
