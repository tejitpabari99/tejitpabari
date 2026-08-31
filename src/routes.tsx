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
      { path: 'projects', element: <ProjectsPage /> },
      {
        path: 'projects/:slug',
        element: <ProjectDetailPage />,
        getStaticPaths: () => projectSlugs.map((slug) => `projects/${slug}`),
      },
      {
        path: 'projects/:slug/live',
        element: <ProjectLivePage />,
        getStaticPaths: () => projectSlugs.map((slug) => `projects/${slug}/live`),
        // FRAGILITY GUARD (see /privacy, /terms — "no forms"): every hosted (i.e.
        // non-redirect) /projects/<slug>/live page must currently accept ZERO user
        // input. Both legal pages state plainly that this domain has no forms as
        // of their last-updated date. The moment a hosted /live project adds an
        // <input>, <textarea>, <form>, a file upload, or anything else a visitor
        // can type into and submit, that claim is false and BOTH
        // src/pages/PrivacyPage.tsx and src/pages/TermsPage.tsx (their "no forms" /
        // "What this site does not do" sections, plus each page's LAST_UPDATED)
        // must be revised BEFORE that project ships, not after. `npm run
        // check:no-forms` (scripts/check-no-forms.sh, SP04's PRD 04 §4.8) is the
        // mechanical check for this — run it before adding any new
        // HOSTED_LIVE_PAGES entry. See PRD 05 §4.7, PRD 04 §4.7/§4.8.
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
