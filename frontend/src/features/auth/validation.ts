export const loginRules = {
  email: (v: string) => (!v.trim() ? 'Email is required' : undefined),
  password: (v: string) => (!v ? 'Password is required' : undefined),
};
