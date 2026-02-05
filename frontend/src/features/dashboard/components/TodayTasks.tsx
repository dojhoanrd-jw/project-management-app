'use client';

import { memo, useMemo, useState } from 'react';
import { StatusBadge } from '@/components/ui';
import { CheckIcon } from '@/components/icons';
import type { TaskItem } from '../dashboard.types';

interface TodayTasksProps {
  tasks: TaskItem[];
  categoryCounts: Record<string, number>;
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'important', label: 'Important' },
  { key: 'notes', label: 'Notes' },
  { key: 'link', label: 'Links' },
] as const;

export default memo(function TodayTasks({ tasks, categoryCounts }: TodayTasksProps) {
  const [activeTab, setActiveTab] = useState<string>('all');

  const filtered = useMemo(() => {
    if (activeTab === 'all') return tasks;
    return tasks.filter((t) => t.category === activeTab);
  }, [tasks, activeTab]);

  return (
    <div className="rounded-2xl bg-surface p-5">
      <h3 className="text-lg font-semibold text-text-primary">Today task</h3>

      {/* Tabs */}
      <div className="mt-4 flex gap-6 border-b border-text-secondary/20">
        {TABS.map((tab) => {
          const count = categoryCounts[tab.key] || 0;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-1.5 pb-3 text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                  'bg-[#2B5CE6]/15 text-[#2B5CE6]'
                }`}>
                  {String(count).padStart(2, '0')}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2B5CE6]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div className="mt-4 flex flex-col gap-3">
        {filtered.map((task) => {
          const isDone = task.isCompleted;
          return (
            <div key={task.taskId} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  isDone ? 'bg-accent' : 'border-2 border-text-secondary/30'
                }`}>
                  {isDone && <CheckIcon className="h-4 w-4 text-white" />}
                </span>
                <p className="truncate text-sm text-text-primary">{task.title}</p>
              </div>
              <StatusBadge status={task.status} />
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-text-secondary">No tasks for today.</p>
        )}
      </div>
    </div>
  );
});
