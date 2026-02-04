import { MetricCard } from '@/components/ui';
import type { OverviewResponse } from '../dashboard.types';

const MAX_PROJECTS = 100;
const MAX_HOURS = 1300;
const MAX_RESOURCES = 120;

const ProjectsIcon = (
  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const ClockIcon = (
  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
  </svg>
);

const ResourcesIcon = (
  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

interface DashboardOverviewProps {
  data: OverviewResponse;
}

export default function DashboardOverview({ data }: DashboardOverviewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        icon={ProjectsIcon}
        iconBg="bg-[#d4a373]"
        label="Projects"
        value={data.totalProjects}
        total={MAX_PROJECTS}
        growth={data.growth.projectsCreated.percent}
      />
      <MetricCard
        icon={ClockIcon}
        iconBg="bg-[#6b9bd2]"
        label="Time spent"
        value={data.growth.hoursLogged.current}
        total={MAX_HOURS}
        unit="Hrs"
        growth={data.growth.hoursLogged.percent}
      />
      <MetricCard
        icon={ResourcesIcon}
        iconBg="bg-[#d4b96a]"
        label="Resources"
        value={data.teamResourcesCount}
        total={MAX_RESOURCES}
        growth={data.growth.teamMembers.percent}
      />
    </div>
  );
}
