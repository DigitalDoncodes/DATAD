import { Home, BookOpen, Briefcase, Users, Sun, Wallet, HeartHandshake } from 'lucide-react';

export const WORKSPACES = [
  { key: 'dashboard', label: 'Home', to: '/', icon: Home, end: true },
  { key: 'study', label: 'Study', to: '/study', icon: BookOpen },
  { key: 'career', label: 'Career', to: '/career', icon: Briefcase },
  { key: 'community', label: 'Community', to: '/community', icon: Users },
  { key: 'me', label: 'Life', to: '/me', icon: Sun },
  { key: 'finance', label: 'Finance', to: '/me/finance', icon: Wallet },
  { key: 'wellbeing', label: 'Wellbeing', to: '/me/wellbeing', icon: HeartHandshake },
];

// Secondary tab rows inside each workspace.
export const WORKSPACE_TABS = {
  study: [
    { to: '/study', label: 'Overview', end: true },
    { to: '/study/notes', label: 'Notes' },
    { to: '/study/work', label: 'Work' },
    { to: '/study/resources', label: 'Resources' },
    { to: '/study/focus', label: 'Focus' },
  ],
  career: [
    { to: '/career', label: 'Overview', end: true },
    { to: '/career/companies', label: 'Companies' },
    { to: '/career/opportunities', label: 'Opportunities' },
    { to: '/career/resume', label: 'Resume' },
    { to: '/career/pivot', label: 'Pivot' },
    { to: '/career/stories', label: 'STAR Stories' },
    { to: '/briefing', label: 'Briefing' },
  ],
  community: [
    { to: '/community', label: 'Overview', end: true },
    { to: '/community/feed', label: 'Feed' },
    { to: '/community/announcements', label: 'Announcements' },
    { to: '/community/events', label: 'Events' },
    { to: '/community/directory', label: 'People' },
    { to: '/community/memories', label: 'BatchVault' },
    { to: '/community/marketplace', label: 'Marketplace' },
    { to: '/community/skills', label: 'Skills' },
  ],
  me: [
    { to: '/me', label: 'Overview', end: true },
    { to: '/me/journal', label: 'Journal' },
    { to: '/me/planner', label: 'Planner' },
  ],
  finance: [
    { to: '/me/finance', label: 'Overview', end: true },
    { to: '/me/finance/tracker', label: 'Tracker' },
    { to: '/me/finance/calculator', label: 'Calculator' },
    { to: '/me/finance/learn', label: 'Learn' },
    { to: '/me/finance/roi', label: 'ROI' },
  ],
  wellbeing: [
    { to: '/me/wellbeing', label: 'Breathing', end: true },
    { to: '/me/wellbeing/study', label: 'Study Tips' },
    { to: '/me/wellbeing/memory', label: 'Memory' },
    { to: '/me/wellbeing/routines', label: 'Routines' },
    { to: '/me/wellbeing/support', label: 'Support' },
  ],
};

// Where each upcoming (coming-soon) module lives once it ships.
// All 11 modules have shipped — this map is now empty but kept for future modules.
export const UPCOMING_WORKSPACE = {};

export const upcomingPath = (slug) => `/${UPCOMING_WORKSPACE[slug] || 'me'}/soon/${slug}`;

// Legacy route → new route, so old bookmarks and in-app links keep working.
export const LEGACY_REDIRECTS = {
  '/notes': '/study/notes',
  '/planner': '/me/planner',
  '/finance': '/me/finance',
  '/resume': '/career/resume',
  '/companies': '/career/companies',
  '/albums': '/community/memories',
  '/entertainment': '/community/archive', // bare /community/archive then forwards to Memories
};