import type {
  OverviewResponse,
  ProgressResponse,
  ProjectsSummaryResponse,
  TodayTasksResponse,
  WorkloadResponse,
} from '@/features/dashboard/dashboard.types';

export type {
  OverviewResponse,
  ProgressResponse,
  ProjectsSummaryResponse,
  TodayTasksResponse,
  WorkloadResponse,
};

export interface LoginResponse {
  token: string;
  user: { id: string; name: string; email: string; role: string };
}

export interface ProjectMember {
  email: string;
  name: string;
  role: string;
}

export interface Project {
  projectId: string;
  name: string;
  description: string;
  status: string;
  progress: string;
  managerId: string;
  managerName: string;
  dueDate: string;
  totalTasks: number;
  completedTasks: number;
  completionPercent: number;
  totalHours: number;
  members?: ProjectMember[];
  currentUserRole?: string;
  createdAt: string;
}

export interface CreateProjectPayload {
  name: string;
  description: string;
  status: string;
  managerId: string;
  managerName: string;
  dueDate: string;
}

export interface Task {
  taskId: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  status: string;
  priority: string;
  category: string;
  assigneeId: string;
  assigneeName: string;
  estimatedHours: number;
  dueDate: string;
  createdAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  projectId: string;
  status?: string;
  priority?: string;
  category?: string;
  assigneeId: string;
  assigneeName: string;
  estimatedHours: number;
  dueDate: string;
}

export interface TeamUser {
  email: string;
  name: string;
  role: string;
}
