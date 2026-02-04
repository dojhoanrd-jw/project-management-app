export interface ProjectSummary {
  projectId: string;
  name: string;
  status: string;
  progress: string;
  dueDate: string;
  managerName: string;
  totalTasks: number;
  completedTasks: number;
  completionPercent: number;
}

export interface ProjectsHealth {
  on_track: number;
  at_risk: number;
  delayed: number;
  completed: number;
}

export interface GrowthMetric {
  current: number;
  previous: number;
  percent: number;
}

export interface TaskItem {
  taskId: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  projectName: string;
  dueDate: string;
  assigneeName: string;
  isCompleted: boolean;
}

export interface WorkloadMember {
  assigneeId: string;
  assigneeName: string;
  taskCount: number;
}

export interface OverviewResponse {
  period: string;
  totalProjects: number;
  teamResourcesCount: number;
  growth: {
    projectsCreated: GrowthMetric;
    hoursLogged: GrowthMetric;
    teamMembers: GrowthMetric;
  };
}

export interface ProgressResponse {
  totalProjects: number;
  completedPercent: number;
  projectsHealth: ProjectsHealth;
}

export interface ProjectsSummaryResponse {
  projectsSummary: ProjectSummary[];
}

export interface TodayTasksResponse {
  todayTasks: TaskItem[];
  categoryCounts: Record<string, number>;
}

export interface WorkloadResponse {
  members: WorkloadMember[];
}
