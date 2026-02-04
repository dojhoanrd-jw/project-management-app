export interface CurrentUser {
  email: string;
  name: string;
  role: string;
}

export const getCurrentUser = (): CurrentUser | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as CurrentUser;
  } catch {
    return null;
  }
};
