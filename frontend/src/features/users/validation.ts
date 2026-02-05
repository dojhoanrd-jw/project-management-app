export const userRules = (mode: 'create' | 'edit') => ({
  name: (v: string) => (!v.trim() ? 'Name is required' : undefined),
  email: (v: string) => (mode === 'create' && !v.trim() ? 'Email is required' : undefined),
  password: (v: string) =>
    mode === 'create' && (!v || v.length < 6) ? 'Min 6 characters' : undefined,
});
