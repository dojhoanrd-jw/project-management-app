'use client';

import { useMemo, useState } from 'react';
import { StatusBadge, ProgressCircle } from '@/components/ui';
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

const DropdownArrow = (
  <svg className="h-4 w-4 text-text-secondary pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const selectClasses = 'appearance-none rounded-full bg-white pl-4 pr-8 py-1.5 text-sm font-medium text-text-primary shadow-sm outline-none cursor-pointer';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProjectSummaryTable({ projects }: ProjectSummaryTableProps) {
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');

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

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (projectFilter !== 'all' && p.name !== projectFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (managerFilter !== 'all' && p.managerName !== managerFilter) return false;
      return true;
    });
  }, [projects, projectFilter, statusFilter, managerFilter]);

  return (
    <div className="rounded-2xl bg-surface p-5">
      {/* Header + filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-text-primary">Project summary</h3>

        <div className="flex flex-wrap items-center gap-2">
          {/* Project filter */}
          <div className="relative">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className={selectClasses}
            >
              <option value="all">Project</option>
              {projectNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{DropdownArrow}</span>
          </div>

          {/* Project manager filter */}
          <div className="relative">
            <select
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value)}
              className={selectClasses}
            >
              <option value="all">Project manager</option>
              {managers.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{DropdownArrow}</span>
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={selectClasses}
            >
              <option value="all">Status</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{DropdownArrow}</span>
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
}
