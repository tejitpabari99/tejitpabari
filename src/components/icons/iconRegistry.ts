// src/components/icons/iconRegistry.ts
//
// The single source of truth for which icon names content frontmatter may
// use (a `links[].icon` value, kebab-case, e.g. "external-link"). Kept as a
// plain .ts module (no JSX) so src/data/shared.ts (a non-React, content-parse
// module) can import `isValidIconName` for validation without pulling React
// component code into its own concerns - DynamicIcon.tsx imports this same
// map for rendering.
//
// Deliberately a hand-curated subset of lucide-react's ~1500 icons, not the
// full `import * as LucideIcons from 'lucide-react'` set: named imports here
// stay tree-shakeable (only the icons actually referenced end up in the
// bundle), the resolution stays synchronous (required for SSG prerender -
// lucide-react/dynamicIconImports.mjs's per-icon dynamic `import()` would not
// be), and a hand-picked list is easier to keep "vast enough for a portfolio
// site" without accidentally exposing lucide-react's non-icon exports.
//
// NOTE: lucide-react does not ship brand/logo icons (no "chrome", "github",
// "linkedin", "twitter", etc. - the project dropped those years ago in favor
// of pointing users at simple-icons). Three of those gaps ("chrome",
// "github", "linkedin") are filled below with this repo's own hand-rolled
// icon components instead (GitHubIcon.tsx, LinkedInIcon.tsx, ChromeIcon.tsx)
// - see IconComponent below for why a plain function component can sit in
// the same ICON_MAP as lucide-react's ForwardRefExoticComponent icons.
import type { ComponentType } from 'react';
import { GitHubIcon } from './GitHubIcon';
import { LinkedInIcon } from './LinkedInIcon';
import { ChromeIcon } from './ChromeIcon';
import {
  ExternalLink,
  Globe,
  FileText,
  BookOpen,
  Mail,
  Link,
  Link2,
  Code,
  Code2,
  Terminal,
  Database,
  Cloud,
  Lock,
  ShieldCheck,
  Star,
  Heart,
  Bookmark,
  Newspaper,
  Presentation,
  GraduationCap,
  Microscope,
  FlaskConical,
  Dna,
  Stethoscope,
  BarChart,
  BarChart2,
  Video,
  Image,
  Download,
  Play,
  Smartphone,
  Monitor,
  Package,
  GitBranch,
  GitFork,
  Layers,
  Zap,
  Target,
  Award,
  Users,
  Briefcase,
  MapPin,
  Map,
  Calendar,
  Clock,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  FileCode,
  Rocket,
  Sparkles,
  Wrench,
  Settings,
  Send,
  Puzzle,
  AppWindow,
  MonitorSmartphone,
  Notebook,
  FlaskRound,
  HeartPulse,
  Activity,
  MessageSquare,
  Blocks,
  Boxes,
  Server,
  Cpu,
  Brain,
  ScrollText,
  FileBadge,
  FileCheck,
  Building2,
  School,
  FolderGit2,
  LineChart,
  TrendingUp,
  Compass,
  Home,
  User,
  Phone,
  AtSign,
  Hash,
  Tag,
  Tags,
  Info,
  HelpCircle,
  CircleCheck,
  BadgeCheck,
} from 'lucide-react';

// The common shape every ICON_MAP entry must satisfy: lucide-react's
// LucideIcon (a ForwardRefExoticComponent accepting the full SVGProps
// surface, of which `className` and `aria-hidden` are a subset) alongside
// this repo's own hand-rolled icon components (GitHubIcon.tsx etc., plain
// function components typed as `{ className?: string }`). DynamicIcon.tsx
// always calls `createElement(Icon, { className, 'aria-hidden': true })`
// regardless of which kind of icon it resolved to - both component shapes
// accept that exact prop set (a hand-rolled icon's narrower prop type is
// structurally a supertype of `{ className?, 'aria-hidden'? }`, so it's
// assignable here without a wrapper), so no separate branching is needed
// at render time. `ComponentType<P>` (not a hand-rolled union) is what
// lets createElement's own overloads resolve P correctly - a raw union of
// LucideIcon and a plain function type defeats overload resolution.
export interface IconComponentProps {
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

export type IconComponent = ComponentType<IconComponentProps>;

// Keys are exactly what content frontmatter writes as `icon: <name>`.
export const ICON_MAP: Record<string, IconComponent> = {
  // Hand-rolled brand icons - see the NOTE above import block.
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  chrome: ChromeIcon,
  'external-link': ExternalLink,
  globe: Globe,
  'file-text': FileText,
  'book-open': BookOpen,
  mail: Mail,
  link: Link,
  'link-2': Link2,
  code: Code,
  'code-2': Code2,
  terminal: Terminal,
  database: Database,
  cloud: Cloud,
  lock: Lock,
  'shield-check': ShieldCheck,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  newspaper: Newspaper,
  presentation: Presentation,
  'graduation-cap': GraduationCap,
  microscope: Microscope,
  'flask-conical': FlaskConical,
  dna: Dna,
  stethoscope: Stethoscope,
  'bar-chart': BarChart,
  'bar-chart-2': BarChart2,
  video: Video,
  image: Image,
  download: Download,
  play: Play,
  smartphone: Smartphone,
  monitor: Monitor,
  package: Package,
  'git-branch': GitBranch,
  'git-fork': GitFork,
  layers: Layers,
  zap: Zap,
  target: Target,
  award: Award,
  users: Users,
  briefcase: Briefcase,
  'map-pin': MapPin,
  map: Map,
  calendar: Calendar,
  clock: Clock,
  'arrow-right': ArrowRight,
  'arrow-up-right': ArrowUpRight,
  'chevron-right': ChevronRight,
  'file-code': FileCode,
  rocket: Rocket,
  sparkles: Sparkles,
  wrench: Wrench,
  settings: Settings,
  send: Send,
  puzzle: Puzzle,
  'app-window': AppWindow,
  'monitor-smartphone': MonitorSmartphone,
  notebook: Notebook,
  'flask-round': FlaskRound,
  'heart-pulse': HeartPulse,
  activity: Activity,
  'message-square': MessageSquare,
  blocks: Blocks,
  boxes: Boxes,
  server: Server,
  cpu: Cpu,
  brain: Brain,
  'scroll-text': ScrollText,
  'file-badge': FileBadge,
  'file-check': FileCheck,
  'building-2': Building2,
  school: School,
  'folder-git-2': FolderGit2,
  'line-chart': LineChart,
  'trending-up': TrendingUp,
  compass: Compass,
  home: Home,
  user: User,
  phone: Phone,
  'at-sign': AtSign,
  hash: Hash,
  tag: Tag,
  tags: Tags,
  info: Info,
  'help-circle': HelpCircle,
  'circle-check': CircleCheck,
  'badge-check': BadgeCheck,
};

export const ICON_NAMES: readonly string[] = Object.keys(ICON_MAP).sort();

export function isValidIconName(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(ICON_MAP, name);
}

export function resolveIcon(name: string): IconComponent | undefined {
  return ICON_MAP[name];
}
