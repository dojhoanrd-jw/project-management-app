const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

const headers = (withAuth = true) => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
  }
  return h;
};

const request = async (path: string, options: RequestInit = {}) => {
  const res = await fetch(`${API_URL}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export const api = {
  login: (email: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      headers: headers(false),
      body: JSON.stringify({ email, password }),
    }),

  getDashboard: (period = '1month') =>
    request(`/dashboard/metrics?period=${period}`, {
      headers: headers(),
    }),

  getProjects: () =>
    request('/projects', { headers: headers() }),

  getTasks: () =>
    request('/tasks', { headers: headers() }),

  getMyTasks: () =>
    request('/tasks/me', { headers: headers() }),
};
