// src/routes/nonprofit.tsx
import type { RouteRecord } from 'vite-react-ssg';
import { PageShell } from '@/layout/PageShell';
import { NonprofitHomePage } from '@/pages/nonprofit/NonprofitHomePage';
import { NonprofitProjectsPage } from '@/pages/nonprofit/NonprofitProjectsPage';
import { SchedulePage } from '@/pages/nonprofit/SchedulePage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { projectsForSite } from '@/data';

export const nonprofitRoutes: RouteRecord[] = [
  {
    path: '/',
    element: <PageShell />,
    children: [
      { index: true, element: <NonprofitHomePage /> },
      { path: 'projects', element: <NonprofitProjectsPage /> },
      {
        path: 'projects/:slug',
        element: <ProjectDetailPage />,
        getStaticPaths: () => projectsForSite('nonprofit').map((p) => `projects/${p.slug}`),
      },
      { path: 'schedule', element: <SchedulePage /> },
      { path: '404', element: <NotFoundPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
