'use client';

import { memo, useMemo } from 'react';
import { StatusBadge, ProgressCircle } from '@/components/ui';
import { ChevronDownIcon } from '@/components/icons';
import { formatDate, PILL_SELECT_CLASSES } from '@/lib/constants';
import { useFilterState } from '@/hooks';
import type { ProjectSummary } from '../dashboard.types';

interface ProjectSummaryTableProps {
  projects: ProjectSummary[];
}

const STATUS_LABELS: Record<string, string> = {
  active: 'On going',
  on_track: 'On going',
  completed: 'Completed',
  at_risk: 'At risk',
  delayed: 'Delayed',
  paused: 'Paused',
  in_review: 'In review',
};

export default memo(function ProjectSummaryTable({ projects }: ProjectSummaryTableProps) {
  const { filters, filtered, updateFilter } = useFilterState(
    projects,
    { project: 'all', status: 'all', manager: 'all' },
    (p, f) => {
      if (f.project !== 'all' && p.name !== f.project) return false;
      if (f.status !== 'all' && p.status !== f.status) return false;
      if (f.manager !== 'all' && p.managerName !== f.manager) return false;
      return true;
    },
  );

  const projectNames = useMemo(
    () => [...new Set(projects.map((p) => p.name))],
    [projects],
  );

  const managers = useMemo(
    () => [...new Set(projects.map((p) => p.managerName))],
    [projects],
  );

  const statuses = useMemo(
    () => [...new Set(projects.map((p) => p.status))],
    [projects],
  );

  return (
    <div className="rounded-2xl bg-surface p-5">
      {/* Header + filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-text-primary">Project summary</h3>

        <div className="flex flex-wrap items-center gap-2">
          {/* Project filter */}
          <div className="relative">
            <select
              value={filters.project}
              onChange={(e) => updateFilter('project', e.target.value)}
              className={PILL_SELECT_CLASSES}
            >
              <option value="all">Project</option>
              {projectNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2"><ChevronDownIcon className="h-4 w-4 text-text-secondary pointer-events-none" /></span>
          </div>

          {/* Project manager filter */}
          <div className="relative">
            <select
              value={filters.manager}
              onChange={(e) => updateFilter('manager', e.target.value)}
              className={PILL_SELECT_CLASSES}
            >
              <option value="all">Project manager</option>
              {managers.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2"><ChevronDownIcon className="h-4 w-4 text-text-secondary pointer-events-none" /></span>
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className={PILL_SELECT_CLASSES}
            >
              <option value="all">Status</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2"><ChevronDownIcon className="h-4 w-4 text-text-secondary pointer-events-none" /></span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-text-secondary/20 text-text-primary">
              <th className="pb-3 font-bold">Name</th>
              <th className="pb-3 font-bold">Project manager</th>
              <th className="pb-3 font-bold">Due date</th>
              <th className="pb-3 font-bold">Status</th>
              <th className="pb-3 font-bold text-center">Progress</th>
            </tr>
          </thead>
          <tbody className="text-text-primary">
            {filtered.map((project) => (
              <tr key={project.projectId}>
                <td className="py-4 pr-4">{project.name}</td>
                <td className="py-4 pr-4">{project.managerName}</td>
                <td className="py-4 pr-4">{formatDate(project.dueDate)}</td>
                <td className="py-4 pr-4">
                  <StatusBadge status={project.status} />
                </td>
                <td className="py-4 text-center">
                  <ProgressCircle percent={project.completionPercent} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-text-secondary">
                  No projects match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
});
