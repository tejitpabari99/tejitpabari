// src/components/RouteMeta.tsx
import { Head } from 'vite-react-ssg';
import { SITE_NAME, DEFAULT_OG_IMAGE, absoluteUrl } from '@/config/site';

interface RouteMetaProps {
  title: string;
  description: string;
  path: string;
  image?: string;
}

export function RouteMeta({ title, description, path, image }: RouteMetaProps) {
  // When a route's own title already IS the site name (the home page passes
  // title={SITE_NAME}), don't append "· SITE_NAME" again - that produced the
  // literal, reported "Tejit Pabari · Tejit Pabari" tab title bug.
  const fullTitle = title === SITE_NAME ? title : `${title} · ${SITE_NAME}`;
  const canonical = absoluteUrl(path);
  const ogImage = absoluteUrl(image ?? DEFAULT_OG_IMAGE);

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
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
}
