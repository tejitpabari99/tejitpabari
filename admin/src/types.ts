// Shapes of Firestore documents (see docs/firestore-schema.md) for TS callers
// of the ported JS data layer in ./lib.

export interface Idea {
  slug: string;
  title: string;
  content: string;
  tags: string[];
  status: string;
  ranked: boolean;
  rank?: number | null;
  scores?: Record<string, number>;
  created?: unknown;
  updated?: unknown;
}

export interface Link {
  slug: string;
  url: string;
  tags?: string[];
  expires?: unknown;
  created?: unknown;
}

export interface Criterion {
  id: string;
  label: string;
  weight: number;
  invert: boolean;
}

export interface Settings {
  pages: { path: string; guest: boolean }[];
  criteria: Criterion[];
}
