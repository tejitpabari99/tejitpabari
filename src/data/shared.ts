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

// Round 3.1 restoration of the /live subsystem (deleted whole-cloth in
// r3-01-schema-icons-content, a0c8883, then brought back in a revised form
// per the owner's later sign-off — see
// .dev/website-revamp-r3/CONTENT-AUTHORING.md's "The `live` field"
// section for the full user-facing contract). Every project/research entry
// gets a canonical, stable `/projects/<slug>/live` (or
// `/research/<slug>/live`) URL, always, regardless of whether this
// optional frontmatter field is present at all:
//   - "live" omitted entirely -> the route quietly redirects to the
//     entry's own detail page. This validator has nothing to check in
//     that case (the redirect is implemented in src/routes.tsx +
//     vite.config.ts's live-redirects plugin, not here) — a shared /live
//     link must never dead-end.
//   - type: external -> redirects to an owner-supplied absolute href.
//   - type: self -> renders an owner-written React page, looked up by
//     `page` in src/pages/live/registry.ts's HOSTED_LIVE_PAGES.
// `label`/`icon` are left OPTIONAL (undefined, not defaulted) on the
// returned value here on purpose — round 3.2 (owner: "it is not a live
// button, the button doesn't say live") moved the "Live"/"globe" defaults
// out of parse-time validation and into src/lib/resolveLiveLinks.ts's
// inheritance chain (explicit live.label/icon > the matching/primary/first
// links[] entry's label/icon > "Live"/"globe" as the last resort). This
// validator only needs to prove label/icon are well-formed IF present; it
// has no way to know here whether links[] will end up supplying something
// better to inherit, so baking a default in at this layer would make that
// inheritance impossible to implement downstream.
export type LiveConfig =
  | { type: 'external'; href: string; label?: string; icon?: string }
  | { type: 'self'; page: string; label?: string; icon?: string };

// `hostedPageKeys` is passed in (rather than imported directly here) so
// this validator stays parameterized/testable the same way assertTags and
// assertOptionalStatus already are with their own `allowed` arrays — the
// real caller (src/data/projects.ts / research.ts) passes
// `Object.keys(HOSTED_LIVE_PAGES)` from src/pages/live/registry.ts. This
// is also what makes "page not present in the registry" fail at
// content-parse/build time rather than only at render: ProjectLivePage
// would otherwise be the first place a typo'd `page` value surfaces, and
// only for a visitor who actually hits that one route.
export function assertOptionalLive(path: string, value: unknown, hostedPageKeys: readonly string[]): LiveConfig | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${path}: "live" must be a mapping with at least a "type" key (or omit "live" entirely for none). Got ${JSON.stringify(value)}.`);
  }

  const { type, href, page, label, icon, ...rest } = value as Record<string, unknown>;
  const unknownKeys = Object.keys(rest);
  if (unknownKeys.length > 0) {
    throw new Error(
      `${path}: "live" has unrecognized key(s): ${unknownKeys.join(', ')}. Allowed keys: type, label, icon, and ` +
      `either href (type: external) or page (type: self).`,
    );
  }

  if (type !== 'external' && type !== 'self') {
    throw new Error(`${path}: "live.type" must be "external" or "self". Got ${JSON.stringify(type)}.`);
  }

  let resolvedLabel: string | undefined;
  if (label !== undefined) {
    if (typeof label !== 'string' || !label.trim()) {
      throw new Error(`${path}: "live.label" must be a non-empty string if present.`);
    }
    resolvedLabel = label;
  }

  let resolvedIcon: string | undefined;
  if (icon !== undefined) {
    if (typeof icon !== 'string' || !icon.trim()) {
      throw new Error(`${path}: "live.icon" must be a non-empty string if present.`);
    }
    if (!isValidIconName(icon)) {
      throw new Error(
        `${path}: "live.icon: ${icon}" is not a recognized icon name. See the ICON_MAP in ` +
        `src/components/icons/iconRegistry.ts for the full list of supported kebab-case names ` +
        `(e.g. "globe", "external-link"). If this is a genuine typo, fix it; if you need a new ` +
        `icon, add it to ICON_MAP first.`,
      );
    }
    resolvedIcon = icon;
  }

  if (type === 'external') {
    if (page !== undefined) {
      throw new Error(`${path}: "live.page" is only valid for "type: self" — this entry has "type: external", which uses "href" instead. Remove one or the other.`);
    }
    const validHref = assertAbsoluteUrl(path, 'live.href', href);
    return { type: 'external', href: validHref, label: resolvedLabel, icon: resolvedIcon };
  }

  // type === 'self'
  if (href !== undefined) {
    throw new Error(`${path}: "live.href" is only valid for "type: external" — this entry has "type: self", which uses "page" instead. Remove one or the other.`);
  }
  if (typeof page !== 'string' || !page.trim()) {
    throw new Error(`${path}: "live.page" is missing or empty (required when "live.type" is "self").`);
  }
  if (!hostedPageKeys.includes(page)) {
    throw new Error(
      `${path}: "live.page: ${page}" is not registered in src/pages/live/registry.ts's HOSTED_LIVE_PAGES ` +
      `(currently: ${hostedPageKeys.length > 0 ? hostedPageKeys.join(', ') : '(empty)'}). Add a ` +
      `'${page}': YourComponent entry there first, or fix the typo.`,
    );
  }
  return { type: 'self', page, label: resolvedLabel, icon: resolvedIcon };
}
