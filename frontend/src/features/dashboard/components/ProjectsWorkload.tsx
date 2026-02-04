'use client';

import { useMemo } from 'react';
import type { WorkloadMember } from '../dashboard.types';

interface ProjectsWorkloadProps {
  members: WorkloadMember[];
  period: string;
  onPeriodChange: (period: string) => void;
}

const PERIODS = [
  { value: '7days', label: 'Last 7 days' },
  { value: '1month', label: 'Last month' },
  { value: '3months', label: 'Last 3 months' },
  { value: '6months', label: 'Last 6 months' },
  { value: '1year', label: 'Last year' },
] as const;

const MAX_CIRCLES = 6;

const DropdownArrow = (
  <svg className="h-4 w-4 text-text-secondary pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

function getFirstName(fullName: string) {
  return fullName.split(' ')[0];
}

export default function ProjectsWorkload({ members, period, onPeriodChange }: ProjectsWorkloadProps) {
  const { columns, maxCount } = useMemo(() => {
    const cols = members.map((m) => ({
      id: m.assigneeId,
      name: m.assigneeName,
      count: m.taskCount,
    }));

    const max = cols.reduce((m, c) => Math.max(m, c.count), 0);
    return { columns: cols, maxCount: max };
  }, [members]);

  if (columns.length === 0) {
    return (
      <div className="rounded-2xl bg-surface p-5">
        <h3 className="text-lg font-semibold text-text-primary">Projects Workload</h3>
        <p className="mt-8 text-center text-sm text-text-secondary">No workload data available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Projects Workload</h3>
        <div className="relative">
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="appearance-none rounded-full bg-white pl-4 pr-8 py-1.5 text-sm font-medium text-text-primary shadow-sm outline-none cursor-pointer"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{DropdownArrow}</span>
        </div>
      </div>

      {/* Columns chart */}
      <div className="mt-6 flex items-end justify-center gap-3">
        {columns.map((col) => {
          const totalCircles = maxCount > 0
            ? Math.max(1, Math.round((col.count / maxCount) * MAX_CIRCLES))
            : 1;
          const emptyCircles = totalCircles - 1;
          const isMax = col.count === maxCount && col.count > 0;

          return (
            <div key={col.id} className="flex flex-col items-center gap-1.5">
              {/* Filled circle with number on top */}
              {col.count > 0 && (
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${
                    isMax ? 'bg-accent' : 'bg-text-primary'
                  }`}
                >
                  {String(col.count).padStart(2, '0')}
                </div>
              )}

              {/* Empty circles below */}
              {Array.from({ length: emptyCircles }, (_, i) => (
                <div
                  key={i}
                  className="h-9 w-9 rounded-full border-2 border-text-secondary/25"
                />
              ))}

              {/* Name */}
              <p className="mt-1 text-[10px] text-text-secondary truncate w-9 text-center">
                {getFirstName(col.name)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
