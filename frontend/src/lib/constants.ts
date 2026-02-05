// ── Styles ───────────────────────────────────────────────────────────
export const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-status-at-risk-bg text-status-at-risk',
  high: 'bg-status-delayed-bg text-status-delayed',
  medium: 'bg-status-ongoing-bg text-status-ongoing',
  low: 'bg-gray-100 text-gray-600',
};

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  member: 'Member',
};

export const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-status-at-risk-bg text-status-at-risk',
  project_manager: 'bg-status-ongoing-bg text-status-ongoing',
  member: 'bg-gray-100 text-gray-600',
};

// ── Filter option arrays (with "all" option) ─────────────────────────
export const STATUS_OPTIONS = [
  { key: 'all', label: 'All Statuses' },
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'in_review', label: 'In Review' },
  { key: 'completed', label: 'Completed' },
  { key: 'approved', label: 'Approved' },
];

export const PRIORITY_OPTIONS = [
  { key: 'all', label: 'All Priorities' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

export const ROLE_OPTIONS = [
  { key: 'all', label: 'All Roles' },
  { key: 'admin', label: 'Admin' },
  { key: 'project_manager', label: 'Project Manager' },
  { key: 'member', label: 'Member' },
];

// ── Form option arrays (for Select components in modals) ─────────────
export const TASK_STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'completed', label: 'Completed' },
];

export const TASK_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const TASK_CATEGORY_OPTIONS = [
  { value: 'important', label: 'Important' },
  { value: 'notes', label: 'Notes' },
  { value: 'link', label: 'Links' },
];

export const PROJECT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
];

export const PROJECT_PROGRESS_OPTIONS = [
  { value: 'on_track', label: 'On Track' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'completed', label: 'Completed' },
];

export const DASHBOARD_PERIOD_OPTIONS = [
  { value: '7days', label: 'Last 7 days' },
  { value: '1month', label: 'Last month' },
  { value: '3months', label: 'Last 3 months' },
  { value: '6months', label: 'Last 6 months' },
  { value: '1year', label: 'Last year' },
];

// ── Page titles ──────────────────────────────────────────────────────
export const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/tasks': 'Tasks',
  '/users': 'Users',
  '/settings': 'Settings',
};

// ── Shared CSS classes ───────────────────────────────────────────────
export const FILTER_SELECT_CLASSES =
  'rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent cursor-pointer';

export const PILL_SELECT_CLASSES =
  'appearance-none rounded-full bg-white pl-4 pr-8 py-1.5 text-sm font-medium text-text-primary shadow-sm outline-none cursor-pointer';

// ── Helpers ──────────────────────────────────────────────────────────
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
