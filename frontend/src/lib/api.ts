import { ApiError, NetworkError } from './errors';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

const buildHeaders = (withAuth = true): Record<string, string> => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
  }
  return h;
};

function handleUnauthorized(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new NetworkError();
  }

  if (res.status === 401) {
    handleUnauthorized();
    throw new ApiError('Session expired', 401);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new ApiError('Server error', res.status);
    data = null;
  }

  if (!res.ok) {
    const body = data as Record<string, string> | null;
    throw new ApiError(
      body?.error || body?.message || 'Request failed',
      res.status,
      body?.code,
    );
  }

  return data as T;
}

import type {
  OverviewResponse,
  ProgressResponse,
  ProjectsSummaryResponse,
  TodayTasksResponse,
  WorkloadResponse,
} from '@/features/dashboard/dashboard.types';

interface LoginResponse {
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

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      headers: buildHeaders(false),
      body: JSON.stringify({ email, password }),
    }),

  getDashboardOverview: (period = '1month') =>
    request<OverviewResponse>(`/dashboard/overview?period=${period}`, {
      headers: buildHeaders(),
    }),

  getDashboardProgress: () =>
    request<ProgressResponse>('/dashboard/progress', {
      headers: buildHeaders(),
    }),

  getDashboardProjectsSummary: () =>
    request<ProjectsSummaryResponse>('/dashboard/projects-summary', {
      headers: buildHeaders(),
    }),

  getDashboardTodayTasks: () =>
    request<TodayTasksResponse>('/dashboard/today-tasks', {
      headers: buildHeaders(),
    }),

  getDashboardWorkload: (period = '1month') =>
    request<WorkloadResponse>(`/dashboard/workload?period=${period}`, {
      headers: buildHeaders(),
    }),

  getProjects: () =>
    request<{ projects: Project[] }>('/projects', { headers: buildHeaders() }),

  createProject: (data: CreateProjectPayload) =>
    request<{ project: Project }>('/projects', {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data),
    }),

  getProject: (projectId: string) =>
    request<{ project: Project; tasks: Task[] }>(`/projects/${projectId}`, {
      headers: buildHeaders(),
    }),

  updateProject: (projectId: string, data: Partial<CreateProjectPayload>) =>
    request<{ project: Project }>(`/projects/${projectId}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(data),
    }),

  deleteProject: (projectId: string) =>
    request<{ message: string }>(`/projects/${projectId}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    }),

  getUsers: () =>
    request<{ users: TeamUser[] }>('/users', { headers: buildHeaders() }),

  getAllUsers: () =>
    request<{ users: TeamUser[] }>('/users?all=true', { headers: buildHeaders() }),

  addProjectMember: (projectId: string, member: ProjectMember) =>
    request<{ project: Project }>(`/projects/${projectId}/members`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(member),
    }),

  removeProjectMember: (projectId: string, memberEmail: string) =>
    request<{ project: Project }>(
      `/projects/${projectId}/members/${encodeURIComponent(memberEmail)}`,
      { method: 'DELETE', headers: buildHeaders() },
    ),

  getTasks: () =>
    request<{ tasks: Task[] }>('/tasks', { headers: buildHeaders() }),

  getMyTasks: () =>
    request('/tasks/me', { headers: buildHeaders() }),

  createTask: (data: CreateTaskPayload) =>
    request<{ task: Task }>('/tasks', {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data),
    }),

  updateTask: (taskId: string, data: Partial<CreateTaskPayload>) =>
    request<{ task: Task }>(`/tasks/${taskId}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(data),
    }),

  deleteTask: (taskId: string, projectId: string) =>
    request<{ message: string }>(`/tasks/${taskId}?projectId=${encodeURIComponent(projectId)}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    }),

  createUser: (data: { email: string; name: string; role: string; password: string }) =>
    request<{ user: TeamUser }>('/users', {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data),
    }),

  updateUser: (email: string, data: { name?: string; role?: string }) =>
    request<{ user: TeamUser }>(`/users/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(data),
    }),

  deleteUser: (email: string) =>
    request<{ message: string }>(`/users/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};
