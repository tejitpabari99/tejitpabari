// src/routes.tsx
import type { RouteRecord } from 'vite-react-ssg';
import { PageShell } from '@/layout/PageShell';
import { HomePage } from '@/pages/HomePage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { WorkExperiencePage } from '@/pages/WorkExperiencePage';
import { ResearchPage } from '@/pages/ResearchPage';
import { ResearchDetailPage } from '@/pages/ResearchDetailPage';
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
      { path: 'work-experience', element: <WorkExperiencePage /> },
      { path: 'research', element: <ResearchPage /> },
      {
        path: 'research/:slug',
        element: <ResearchDetailPage />,
        getStaticPaths: () => researchSlugs.map((slug) => `research/${slug}`),
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
