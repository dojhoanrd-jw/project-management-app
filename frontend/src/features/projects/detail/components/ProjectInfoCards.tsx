import type { Project } from '@/lib/api';
import { Card } from '@/components/ui';

interface ProjectInfoCardsProps {
  project: Project;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const INFO_ITEMS = [
  {
    key: 'status',
    label: 'Status',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'manager',
    label: 'Manager',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    key: 'dueDate',
    label: 'Due Date',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    key: 'hours',
    label: 'Total Hours',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
] as const;

function getValue(project: Project, key: string): string {
  switch (key) {
    case 'status': return project.status;
    case 'manager': return project.managerName;
    case 'dueDate': return formatDate(project.dueDate);
    case 'hours': return `${project.totalHours}h`;
    default: return '';
  }
}

export default function ProjectInfoCards({ project }: ProjectInfoCardsProps) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-text-primary">Project Overview</h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {INFO_ITEMS.map((item) => (
          <Card key={item.key} padding="sm" className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-light text-accent">
              {item.icon}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">{item.label}</span>
              <span className="text-sm font-semibold text-text-primary capitalize truncate">{getValue(project, item.key)}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card padding="sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-primary">Overall Progress</span>
          <span className="text-sm font-semibold text-accent">{project.completionPercent}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-border-light">
          <div
            className="h-2.5 rounded-full bg-accent transition-all"
            style={{ width: `${project.completionPercent}%` }}
          />
        </div>
        <div className="mt-2 flex gap-4 text-xs text-text-secondary">
          <span>{project.completedTasks} completed</span>
          <span>{project.totalTasks - project.completedTasks} remaining</span>
          <span>{project.totalTasks} total</span>
        </div>
      </Card>
    </div>
  );
}
