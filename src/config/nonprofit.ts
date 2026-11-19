// src/config/nonprofit.ts
//
// All nonprofit-site copy and URLs in one place (SP04 PRD Decision 9).
// No em dashes anywhere in this file (scanned by nonprofit.test.ts).

export const HERO_EYEBROW = 'Nonprofit AI Consulting';
export const HERO_HEADING = 'Tejit Pabari';
export const HERO_TEXT =
  "I audit a nonprofit organization's work, identify where AI fits best, build automations and agents to run the busywork end to end, and teach your team to use AI tools efficiently and safely. Free consultations, no obligation.";

export const BOOK_LABEL = 'Book a consultation';
export const BOOKING_URL = 'https://go.tejitpabari.com/meet-ngo';

export const STATEMENT_HEADING = 'What is a consultation';
export const STATEMENT_TEXT =
  "A consultation is a friendly, no-cost conversation about how your team works today and where AI could help. We look at real tasks, pick one or two worth improving, and agree on a small next step. The aim is practical help you can use right away, and nothing you don't need.";

export const SERVICES_HEADING = 'What Services do I provide';
export const PROJECTS_HEADING = 'All projects';
export const PROJECTS_SUBTITLE = 'Check out my active projects used by Non Profits';

export interface Service {
  slug: string;
  title: string;
  teaser: string;
  body: string;
}

export const SERVICES: readonly Service[] = [
  {
    slug: 'ai-evaluation',
    title: 'AI evaluation',
    teaser: "Find where AI helps, and where it doesn't.",
    body: "I audit your team's work, tools and any AI already in use. Together we list repetitive tasks and prioritize the ones worth automating. I flag privacy and accuracy risks in plain language, and you leave with a clear list of what to try first and what to skip.",
  },
  {
    slug: 'automation-ai-workflows',
    title: 'Automation & AI workflows',
    teaser: 'Hand off the repetitive work.',
    body: "I build automations and AI workflows for repetitive tasks like donor outreach, partner event details, reports and newsletters. You own everything, it runs on tools you already have, and it comes with guides so your team can run it without me.",
  },
  {
    slug: 'ai-adoption',
    title: 'AI Adoption and Policy',
    teaser: 'Help your team feel confident with AI tools.',
    body: "Hands-on workshops on using AI well and knowing its limits, with examples from your own work. I coach your team to get more from the tools you have, help you write an AI policy, and train staff to handle sensitive information safely.",
  },
];

/** Soft per-card tints (Tailwind default palette) with the site's ink/body text colors. */
export const SERVICE_CARD_STYLES = [
  { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-200 text-emerald-950' },
  { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-200 text-amber-950' },
  { bg: 'bg-sky-50', border: 'border-sky-200', badge: 'bg-sky-200 text-sky-950' },
] as const;

export const NONPROFIT_SCHEDULE_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdHGSY4cKp-FFggDBhAkUqhNSSRRdn-MyBJFg170EUUssuupWVItLHs7JxbdvMN5QMWatrxwmeQNJN/pub?gid=779051931&single=true&output=csv';

export const SCHEDULE_HEADING = 'Schedule';
export const SCHEDULE_INTRO = "What I'm working on with nonprofit partners";
export const SCHEDULE_UNAVAILABLE = 'Schedule unavailable, check back soon';

export type ScheduleStatus = 'To do' | 'In progress' | 'Done';

const STATUS_MAP: Record<string, ScheduleStatus> = {
  'in progress': 'In progress',
  'in review': 'In progress',
  waiting: 'In progress',
  'to do': 'To do',
  done: 'Done',
};

/** Case-insensitive, trimmed; anything unknown becomes "To do". */
export function mapStatus(raw: string): ScheduleStatus {
  return STATUS_MAP[raw.trim().toLowerCase()] ?? 'To do';
}

export const STATUS_COLORS: Record<ScheduleStatus, string> = {
  Done: 'bg-green-100 text-green-900',
  'In progress': 'bg-blue-100 text-blue-900',
  'To do': 'bg-gray-100 text-gray-800',
};

export const ROUTE_META = {
  home: {
    title: 'Tejit Pabari | Nonprofit AI Consulting',
    description: 'Free AI consultations, automations and workshops for small nonprofit teams.',
  },
  projects: {
    title: 'Projects | Nonprofit AI Consulting',
    description: 'Automations and AI skills built for nonprofit teams.',
  },
  schedule: {
    title: 'Schedule | Nonprofit AI Consulting',
    description: 'What I am currently working on with nonprofit partners.',
  },
} as const;
