'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { ApiError, NetworkError } from '@/lib/errors';
import { useAlerts } from '@/context/AlertContext';
import { Card, Button, Input } from '@/components/ui';
import { getCurrentUser } from '@/lib/auth';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const EMPTY_FORM: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function SettingsPage() {
  const { showSuccess, showError } = useAlerts();
  const currentUser = getCurrentUser();
  const [form, setForm] = useState<PasswordForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordForm, string>>>({});
  const [loading, setLoading] = useState(false);

  const update = (field: keyof PasswordForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof PasswordForm, string>> = {};
    if (!form.currentPassword) e.currentPassword = 'Current password is required';
    if (!form.newPassword || form.newPassword.length < 6) {
      e.newPassword = 'New password must be at least 6 characters';
    }
    if (form.newPassword !== form.confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }
    if (form.currentPassword && form.newPassword && form.currentPassword === form.newPassword) {
      e.newPassword = 'New password must be different from current';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await api.changePassword(form.currentPassword, form.newPassword);
      showSuccess('Password changed successfully');
      setForm(EMPTY_FORM);
    } catch (err) {
      if (err instanceof NetworkError) {
        showError('No connection. Check your internet.');
      } else if (err instanceof ApiError) {
        showError(err.message);
      } else {
        showError('Unexpected error changing password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Settings</h2>
        <p className="mt-1 text-sm text-text-secondary">Manage your account settings</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Info */}
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Profile Information</h3>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Name</p>
              <p className="mt-1 text-sm text-text-primary">{currentUser?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Email</p>
              <p className="mt-1 text-sm text-text-primary">{currentUser?.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Role</p>
              <p className="mt-1 text-sm text-text-primary capitalize">
                {currentUser?.role?.replace('_', ' ') || '—'}
              </p>
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Change Password</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="current-password"
              label="Current Password"
              type="password"
              value={form.currentPassword}
              onChange={(e) => update('currentPassword', e.target.value)}
              error={errors.currentPassword}
              required
            />
            <Input
              id="new-password"
              label="New Password"
              type="password"
              value={form.newPassword}
              onChange={(e) => update('newPassword', e.target.value)}
              error={errors.newPassword}
              required
            />
            <Input
              id="confirm-password"
              label="Confirm New Password"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              required
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
