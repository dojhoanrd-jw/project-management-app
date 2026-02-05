'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { DASHBOARD_PERIOD_OPTIONS, PILL_SELECT_CLASSES } from '@/lib/constants';
import { Skeleton } from '@/components/ui';
import type {
  OverviewResponse,
  ProgressResponse,
  ProjectsSummaryResponse,
  TodayTasksResponse,
  WorkloadResponse,
} from './dashboard.types';
import {
  DashboardOverview,
  ProjectSummaryTable,
  OverallProgress,
  TodayTasks,
  ProjectsWorkload,
} from './components';

export default function DashboardPage() {
  const [period, setPeriod] = useState('1month');

  const { data: overview, isLoading: l1 } = useSWR<OverviewResponse>(`/dashboard/overview?period=${period}`);
  const { data: progress, isLoading: l2 } = useSWR<ProgressResponse>('/dashboard/progress');
  const { data: projectsSummary, isLoading: l3 } = useSWR<ProjectsSummaryResponse>('/dashboard/projects-summary');
  const { data: todayTasks, isLoading: l4 } = useSWR<TodayTasksResponse>('/dashboard/today-tasks');
  const { data: workload, isLoading: l5 } = useSWR<WorkloadResponse>(`/dashboard/workload?period=${period}`);

  const loading = l1 || l2 || l3 || l4 || l5;

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (!overview || !progress || !projectsSummary || !todayTasks || !workload) return null;

  return (
    <div className="flex flex-col gap-8">
      {/* Header row with period selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-text-primary">Dashboard</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className={PILL_SELECT_CLASSES}
        >
          {DASHBOARD_PERIOD_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Metric cards */}
      <DashboardOverview data={overview} />

      {/* Project summary table + Overall progress */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProjectSummaryTable projects={projectsSummary.projectsSummary} />
        </div>
        <OverallProgress
          totalProjects={progress.totalProjects}
          completedPercent={progress.completedPercent}
          health={progress.projectsHealth}
        />
      </div>

      {/* Today tasks + Projects workload */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TodayTasks tasks={todayTasks.todayTasks} categoryCounts={todayTasks.categoryCounts} />
        </div>
        <ProjectsWorkload members={workload.members} period={period} onPeriodChange={setPeriod} />
      </div>
    </div>
  );
}
