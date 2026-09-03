// src/routes.tsx
import type { RouteRecord } from 'vite-react-ssg';
import { PageShell } from '@/layout/PageShell';
import type { RouteHandle } from '@/layout/chromeMode';
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
        handle: { chrome: 'back-only' } satisfies RouteHandle,
      },
      {
        path: 'projects/:slug',
        element: <ProjectDetailPage />,
        getStaticPaths: () => projectSlugs.map((slug) => `projects/${slug}`),
        handle: { chrome: 'back-only' } satisfies RouteHandle,
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
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
