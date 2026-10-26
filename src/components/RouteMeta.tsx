// src/components/RouteMeta.tsx
import { Head } from 'vite-react-ssg';
import { SITE_NAME, DEFAULT_OG_IMAGE, absoluteUrl } from '@/config/site';

interface RouteMetaProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  /** Alt text for `og:image`/`twitter:image` — what a screen reader or a
   *  crawler that can't render the image would see instead. Defaults to a
   *  generic "<title> preview image" so every route still emits something
   *  meaningful even when a call site doesn't pass one explicitly; project/
   *  research detail pages pass a more specific one. */
  imageAlt?: string;
  /**
   * `og:type`. Defaults to `"website"` for index/landing routes.
   *
   * NOTE — this reverses `06-sharing-seo-sample-project/PRD.md` §4.2's
   * earlier `[RESOLVED: og:type is always "website", never "article"]`
   * decision, which reasoned that Projects/Research `date` is a sort key
   * first, not an editorially meaningful "published" timestamp. This round's
   * owner request explicitly asks for the `website`/`article` split, so
   * project/research detail (and their `/live` self-hosted) pages now pass
   * `type="article"`. `date` is a REQUIRED frontmatter field on every
   * Project/Research (see src/data/shared.ts's normalizeDateField), so
   * every article-type call site has a real value to source
   * `publishedTime` from — nothing here invents a date.
   */
  type?: 'website' | 'article';
  /** ISO 8601 timestamp for `article:published_time`. Only emitted when
   *  `type="article"` AND this is provided — never fabricated when a call
   *  site has no date to give it. There is no separate "last edited" field
   *  in the content schema, so this component deliberately does not emit
   *  `article:modified_time`: reusing the same value there would falsely
   *  imply a tracked edit history that doesn't exist. */
  publishedTime?: string;
}

export function RouteMeta({
  title,
  description,
  path,
  image,
  imageAlt,
  type = 'website',
  publishedTime,
}: RouteMetaProps) {
  // When a route's own title already IS the site name (the home page passes
  // title={SITE_NAME}), don't append "· SITE_NAME" again - that produced the
  // literal, reported "Tejit Pabari · Tejit Pabari" tab title bug.
  const fullTitle = title === SITE_NAME ? title : `${title} · ${SITE_NAME}`;
  const canonical = absoluteUrl(path);
  const ogImage = absoluteUrl(image ?? DEFAULT_OG_IMAGE);
  const resolvedImageAlt = imageAlt ?? `${fullTitle} preview image`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={resolvedImageAlt} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={resolvedImageAlt} />
    </Head>
  );
}
