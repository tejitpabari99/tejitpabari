// src/config/nonprofit.ts
//
// All nonprofit-site copy and URLs in one place (SP04 PRD Decision 9).
// No em dashes anywhere in this file (scanned by nonprofit.test.ts).

export const HERO_EYEBROW = 'Nonprofit AI Consulting';
export const HERO_HEADING = 'Tejit Pabari';
export const HERO_TEXT =
  'Small nonprofit teams lose hours every week to work a machine could handle: intake and sign-ups, donor and volunteer follow-ups, event and calendar upkeep, grant and impact reporting, records, and inboxes that never empty. I help you get that time back. I audit how your organization works and where AI fits, build automations and agentic AI workflows that run the busywork end to end, and teach your team to use AI tools efficiently and safely. Free consultations, no obligation.';

export const BOOK_LABEL = 'Book a consultation';
export const BOOKING_URL = 'https://go.tejitpabari.com/meet-ngo';

export const STATEMENT_HEADING = 'What a consultation is';
export const STATEMENT_TEXT =
  "A consultation is a friendly, no-cost conversation about how your team works today and where AI could help. We look at real tasks, pick one or two worth improving, and agree on a small next step. The aim is practical help you can use right away, and nothing you don't need.";

export const SERVICES_HEADING = 'Services';
export const PROJECTS_HEADING = 'All projects';

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
    body: 'I review how your team works today, including the tools you already use and any AI already in the mix. Together we list the repetitive tasks and judge which ones are a real fit for AI and which are better left alone. I flag privacy and accuracy risks in plain language so nothing surprises you later. You leave with a short, clear list of what to try first and what to skip.',
  },
  {
    slug: 'automation-ai-workflows',
    title: 'Automation & AI workflows',
    teaser: 'Hand off the repetitive work.',
    body: 'I design automations and agentic AI workflows for tasks that come around again and again, such as emails, event details, personal outreach, reports, and record keeping. A person approves the important steps, so you stay in control of what goes out. We build a first working version together, and you get a simple guide so your team can run and adjust it without me. Start with one task and grow from there.',
  },
  {
    slug: 'ai-adoption',
    title: 'AI adoption',
    teaser: 'Help your team feel confident with AI tools.',
    body: "I run workshops on what AI can and can't do, with hands-on practice using real examples from your work. I also coach your team on tools you already have, like chat assistants and Copilot, so they get more out of them. We cover efficient everyday use and clear rules for handling sensitive information. The goal is a team that uses AI safely and gets time back.",
  },
  {
    slug: 'student-career-mentoring',
    title: 'Student & career mentoring',
    teaser: 'Practical guidance for the next generation.',
    body: 'I mentor students and early-career technologists, especially those from underserved communities. Topics include moving from university to a first job, choosing and finishing projects, and building things on your own. I am also available to mentor or judge at hackathons. Sessions can be one-off, for a group, or ongoing, whichever fits your program.',
  },
];

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
