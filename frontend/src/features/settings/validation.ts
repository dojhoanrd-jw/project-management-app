interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const passwordRules = {
  currentPassword: (v: string) => (!v ? 'Current password is required' : undefined),
  newPassword: (v: string, form: PasswordForm) => {
    if (!v || v.length < 6) return 'New password must be at least 6 characters';
    if (form.currentPassword && v === form.currentPassword)
      return 'New password must be different from current';
    return undefined;
  },
  confirmPassword: (v: string, form: PasswordForm) =>
    v !== form.newPassword ? 'Passwords do not match' : undefined,
};
