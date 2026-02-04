'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAlerts } from '@/context/AlertContext';
import type {
  OverviewResponse,
  ProgressResponse,
  ProjectsSummaryResponse,
  TodayTasksResponse,
  WorkloadResponse,
} from './dashboard.types';
import DashboardOverview from './components/DashboardOverview';
import ProjectSummaryTable from './components/ProjectSummaryTable';
import OverallProgress from './components/OverallProgress';
import TodayTasks from './components/TodayTasks';
import ProjectsWorkload from './components/ProjectsWorkload';

const PERIODS = [
  { value: '7days', label: 'Last 7 days' },
  { value: '1month', label: 'Last month' },
  { value: '3months', label: 'Last 3 months' },
  { value: '6months', label: 'Last 6 months' },
  { value: '1year', label: 'Last year' },
] as const;

interface DashboardData {
  overview: OverviewResponse;
  progress: ProgressResponse;
  projectsSummary: ProjectsSummaryResponse;
  todayTasks: TodayTasksResponse;
  workload: WorkloadResponse;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState('1month');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlerts();

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      setLoading(true);
      try {
        const [overview, progress, projectsSummary, todayTasks, workload] =
          await Promise.all([
            api.getDashboardOverview(period),
            api.getDashboardProgress(),
            api.getDashboardProjectsSummary(),
            api.getDashboardTodayTasks(),
            api.getDashboardWorkload(period),
          ]);

        if (!cancelled) {
          setData({ overview, progress, projectsSummary, todayTasks, workload });
        }
      } catch (err) {
        if (!cancelled) {
          showAlert('error', err instanceof Error ? err.message : 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboard();
    return () => { cancelled = true; };
  }, [period, showAlert]);

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl bg-surface lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl bg-surface" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-72 animate-pulse rounded-2xl bg-surface lg:col-span-2" />
          <div className="h-72 animate-pulse rounded-2xl bg-surface" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-8">
      {/* Header row with period selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-text-primary">Dashboard</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="appearance-none rounded-full bg-white px-4 py-1.5 pr-8 text-sm font-medium text-text-primary shadow-sm outline-none cursor-pointer"
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Metric cards */}
      <DashboardOverview data={data.overview} />

      {/* Project summary table + Overall progress */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProjectSummaryTable projects={data.projectsSummary.projectsSummary} />
        </div>
        <OverallProgress
          totalProjects={data.progress.totalProjects}
          completedPercent={data.progress.completedPercent}
          health={data.progress.projectsHealth}
        />
      </div>

      {/* Today tasks + Projects workload */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TodayTasks tasks={data.todayTasks.todayTasks} categoryCounts={data.todayTasks.categoryCounts} />
        </div>
        <ProjectsWorkload members={data.workload.members} period={period} onPeriodChange={setPeriod} />
      </div>
    </div>
  );
}
