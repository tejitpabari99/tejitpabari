// src/routes.tsx
import type { RouteRecord } from 'vite-react-ssg';
import { PageShell } from '@/layout/PageShell';
import { HomePage } from '@/pages/HomePage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { ProjectLivePage } from '@/pages/ProjectLivePage';
import { WorkExperiencePage } from '@/pages/WorkExperiencePage';
import { ResearchPage } from '@/pages/ResearchPage';
import { ResearchDetailPage } from '@/pages/ResearchDetailPage';
import { ResearchLivePage } from '@/pages/ResearchLivePage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { TermsPage } from '@/pages/TermsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { projectSlugs } from '@/content/projects';
import { researchSlugs } from '@/content/research';

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <PageShell />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'projects',
        element: <ProjectsPage />,
      },
      {
        path: 'projects/:slug',
        element: <ProjectDetailPage />,
        getStaticPaths: () => projectSlugs.map((slug) => `projects/${slug}`),
      },
      {
        path: 'projects/:slug/live',
        element: <ProjectLivePage />,
        // Every project slug, not just ones with a `live` field - the
        // canonical /live URL is guaranteed to exist for every project
        // (it quietly redirects to the detail page when `live` is
        // absent). See ProjectLivePage's own header comment.
        getStaticPaths: () => projectSlugs.map((slug) => `projects/${slug}/live`),
        // FRAGILITY GUARD (see /privacy, /terms - "no forms"): every
        // self-hosted (live.type === 'self') live page must currently
        // accept ZERO user input. Both legal pages state plainly that this
        // domain has no forms as of their last-updated date. The moment a
        // hosted live page adds an <input>, <textarea>, <form>, a file
        // upload, or anything else a visitor can type into and submit,
        // that claim is false and BOTH src/pages/PrivacyPage.tsx and
        // src/pages/TermsPage.tsx (their "no forms" / "What this site does
        // not do" sections, plus each page's LAST_UPDATED) must be revised
        // BEFORE that page ships, not after. `npm run check:no-forms`
        // (scripts/check-no-forms.sh) is the mechanical check for this -
        // run it before adding any new HOSTED_LIVE_PAGES entry.
      },
      { path: 'work-experience', element: <WorkExperiencePage /> },
      { path: 'research', element: <ResearchPage /> },
      {
        path: 'research/:slug',
        element: <ResearchDetailPage />,
        getStaticPaths: () => researchSlugs.map((slug) => `research/${slug}`),
      },
      {
        path: 'research/:slug/live',
        element: <ResearchLivePage />,
        getStaticPaths: () => researchSlugs.map((slug) => `research/${slug}/live`),
      },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'terms', element: <TermsPage /> },
      // Enumerable static path so vite-react-ssg prerenders dist/404/index.html,
      // which scripts/inject-csp-hashes.mjs's promote404() then copies to
      // dist/404.html for Firebase Hosting's automatic 404 fallback - see
      // .dev/website-revamp-r3/BUGFIX-NOTES.md's Bug 2 Handoff section.
      { path: '404', element: <NotFoundPage /> },
      // Client-side catch-all: after hydration, any unknown path still
      // renders NotFoundPage without a full page reload. Must stay.
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
