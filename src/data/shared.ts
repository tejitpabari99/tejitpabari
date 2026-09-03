// src/data/shared.ts
import { isValidIconName } from '@/components/icons/iconRegistry';

export type Link = { label: string; href: string; icon?: string; primary?: boolean };

export function assertNoUnknownKeys(path: string, data: Record<string, unknown>, allowed: string[]): void {
  for (const key of Object.keys(data)) {
    if (!allowed.includes(key)) {
      throw new Error(
        `${path}: unrecognized frontmatter field "${key}". Allowed fields: ${allowed.join(', ')}. ` +
        `If this is a genuine typo of one of the allowed fields, fix the key name; if it's a new field the schema needs, add it to the allowed list in src/data/${'<collection>'}.ts first.`,
      );
    }
  }
}

export function assertSlugMatchesFilename(path: string, filenameSlug: string, data: Record<string, unknown>): string {
  if (data.slug !== filenameSlug) {
    throw new Error(`${path}: frontmatter "slug: ${data.slug}" does not match filename "${filenameSlug}.md".`);
  }
  return filenameSlug;
}

export function assertRequiredString(path: string, field: string, value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${path}: missing or empty required frontmatter field "${field}".`);
  }
  return value;
}

export function assertTags(path: string, value: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${path}: "tags" must be a non-empty array. Allowed values: ${allowed.join(', ')}.`);
  }
  for (const tag of value) {
    if (!allowed.includes(tag)) {
      throw new Error(`${path}: "tags" contains "${tag}", which is not one of ${allowed.join(', ')}.`);
    }
  }
  return value as string[];
}

export function assertOptionalStatus(path: string, value: unknown, allowed: readonly string[]): string | undefined {
  if (value === undefined) return undefined;
  if (!allowed.includes(value as string)) {
    throw new Error(
      `${path}: "status: ${value}" is not one of ${allowed.join(', ')} (or omit "status" entirely for no pill).`,
    );
  }
  return value as string;
}

export function assertLinks(path: string, value: unknown): Link[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path}: "links" must be an array (use "links: []" for none).`);
  }
  let primaryCount = 0;
  const links = value.map((entry, i) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`${path}: "links[${i}]" must be an object with "label" and "href".`);
    }
    const { label, href, icon, primary } = entry as Record<string, unknown>;
    if (typeof label !== 'string' || !label.trim()) {
      throw new Error(`${path}: "links[${i}].label" is missing or empty.`);
    }
    if (typeof href !== 'string' || !href.trim()) {
      throw new Error(`${path}: "links[${i}].href" is missing or empty.`);
    }
    const link: Link = { label, href };
    if (icon !== undefined) {
      if (typeof icon !== 'string' || !icon.trim()) {
        throw new Error(`${path}: "links[${i}].icon" must be a non-empty string if present.`);
      }
      if (!isValidIconName(icon)) {
        throw new Error(
          `${path}: "links[${i}].icon: ${icon}" is not a recognized icon name. See the ICON_MAP in ` +
          `src/components/icons/iconRegistry.ts for the full list of supported kebab-case names ` +
          `(e.g. "external-link", "globe", "file-text"). If this is a genuine typo, fix it; if you ` +
          `need a new icon, add it to ICON_MAP first.`,
        );
      }
      link.icon = icon;
    }
    if (primary !== undefined) {
      if (primary !== true) {
        throw new Error(`${path}: "links[${i}].primary" must be exactly \`true\` if present, or omitted entirely.`);
      }
      primaryCount += 1;
      link.primary = true;
    }
    return link;
  });
  if (primaryCount > 1) {
    throw new Error(`${path}: more than one link has "primary: true" — exactly one link may be primary (or omit it on all).`);
  }
  return links;
}

// gray-matter's YAML engine (js-yaml) auto-parses an unquoted YYYY-MM-DD
// scalar into a native JS Date, not a string. Every date-shaped field must
// be normalized back to a plain ISO string.
export function normalizeDateField(path: string, field: string, value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  throw new Error(
    `${path}: "${field}" must be an ISO date (YYYY-MM-DD). Got ${JSON.stringify(value)}. ` +
    `If you typed an unquoted date, YAML may have parsed it as a different value — quote it as a string if unsure.`,
  );
}

export function assertAbsoluteUrl(path: string, field: string, value: unknown): string {
  if (typeof value !== 'string' || !/^https?:\/\//.test(value)) {
    throw new Error(`${path}: "${field}" must be an absolute http(s) URL. Got ${JSON.stringify(value)}.`);
  }
  return value;
}

// `techTags` (Project/Research) is the free-form counterpart to `tags`:
// no allowlist, no required entries, purely author-supplied. `undefined`
// (the field omitted entirely) normalizes to [], same as "techTags: []".
export function assertOptionalStringArray(path: string, field: string, value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string' && entry.trim())) {
    throw new Error(
      `${path}: "${field}" must be an array of non-empty strings if present ` +
      `(use "${field}: []", or omit the field entirely, for none).`,
    );
  }
  return value as string[];
}

export function assertImagePath(path: string, value: unknown): string {
  if (typeof value !== 'string' || !(value.startsWith('/') || /^https?:\/\//.test(value))) {
    throw new Error(`${path}: "image" must be a root-relative path ("/images/...") or an absolute http(s) URL.`);
  }
  return value;
}
