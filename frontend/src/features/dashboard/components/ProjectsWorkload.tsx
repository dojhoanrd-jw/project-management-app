'use client';

import { memo, useMemo } from 'react';
import { ChevronDownIcon } from '@/components/icons';
import { DASHBOARD_PERIOD_OPTIONS, PILL_SELECT_CLASSES } from '@/lib/constants';
import type { WorkloadMember } from '../dashboard.types';

interface ProjectsWorkloadProps {
  members: WorkloadMember[];
  period: string;
  onPeriodChange: (period: string) => void;
}

const MAX_CIRCLES = 6;

function getFirstName(fullName: string) {
  return fullName.split(' ')[0];
}

export default memo(function ProjectsWorkload({ members, period, onPeriodChange }: ProjectsWorkloadProps) {
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
            className={PILL_SELECT_CLASSES}
          >
            {DASHBOARD_PERIOD_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2"><ChevronDownIcon className="h-4 w-4 text-text-secondary pointer-events-none" /></span>
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
});
