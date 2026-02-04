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
    request('/projects', { headers: buildHeaders() }),

  getTasks: () =>
    request('/tasks', { headers: buildHeaders() }),

  getMyTasks: () =>
    request('/tasks/me', { headers: buildHeaders() }),
};
