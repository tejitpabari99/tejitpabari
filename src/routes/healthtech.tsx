// src/routes/healthtech.tsx
import type { RouteRecord } from 'vite-react-ssg';
import { PageShell } from '@/layout/PageShell';
import { HealthtechHomePage } from '@/pages/healthtech/HealthtechHomePage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { projectsForSite } from '@/data';

export const healthtechRoutes: RouteRecord[] = [
  {
    path: '/',
    element: <PageShell />,
    children: [
      { index: true, element: <HealthtechHomePage /> },
      {
        path: 'projects/:slug',
        element: <ProjectDetailPage />,
        getStaticPaths: () => projectsForSite('healthtech').map((p) => `projects/${p.slug}`),
      },
      { path: '404', element: <NotFoundPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
