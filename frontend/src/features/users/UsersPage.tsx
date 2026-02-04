'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, type TeamUser } from '@/lib/api';
import { ApiError, NetworkError } from '@/lib/errors';
import { useAlerts } from '@/context/AlertContext';
import { getCurrentUser } from '@/lib/auth';
import { Card, Button, Input } from '@/components/ui';
import Modal from '@/components/ui/Modal';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  member: 'Member',
};

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-status-at-risk-bg text-status-at-risk',
  project_manager: 'bg-status-ongoing-bg text-status-ongoing',
  member: 'bg-gray-100 text-gray-600',
};

const ROLE_OPTIONS = [
  { key: 'all', label: 'All Roles' },
  { key: 'admin', label: 'Admin' },
  { key: 'project_manager', label: 'Project Manager' },
  { key: 'member', label: 'Member' },
];

// ── User Form Modal ─────────────────────────────────────────────────────────

interface UserFormData {
  email: string;
  name: string;
  role: string;
  password: string;
}

const EMPTY_FORM: UserFormData = {
  email: '', name: '', role: 'member', password: '',
};

function UserFormModal({
  isOpen, onClose, onSaved, initialData, mode,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: TeamUser;
  mode: 'create' | 'edit';
}) {
  const { showSuccess, showError } = useAlerts();
  const [form, setForm] = useState<UserFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initialData) {
      setForm({
        email: initialData.email,
        name: initialData.name,
        role: initialData.role,
        password: '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [isOpen, mode, initialData]);

  const update = (field: keyof UserFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof UserFormData, string>> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (mode === 'create') {
      if (!form.email.trim()) e.email = 'Email is required';
      if (!form.password || form.password.length < 6) e.password = 'Min 6 characters';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === 'edit' && initialData) {
        await api.updateUser(initialData.email, {
          name: form.name.trim(),
          role: form.role,
        });
        showSuccess('User updated successfully');
      } else {
        await api.createUser({
          email: form.email.trim(),
          name: form.name.trim(),
          role: form.role,
          password: form.password,
        });
        showSuccess('User created successfully');
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof NetworkError) {
        showError('No connection. Check your internet.');
      } else if (err instanceof ApiError) {
        showError(err.message);
      } else {
        showError(`Unexpected error ${mode === 'edit' ? 'updating' : 'creating'} user`);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectClasses = 'w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent cursor-pointer';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit User' : 'Create User'} maxWidth="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="user-name"
          label="Name"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          error={errors.name}
          required
        />

        {mode === 'create' && (
          <Input
            id="user-email"
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            error={errors.email}
            required
          />
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="user-role" className="text-sm font-medium text-text-primary">Role</label>
          <select
            id="user-role"
            value={form.role}
            onChange={(e) => update('role', e.target.value)}
            className={`${selectClasses} border-border`}
          >
            <option value="member">Member</option>
            <option value="project_manager">Project Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {mode === 'create' && (
          <Input
            id="user-password"
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            error={errors.password}
            required
          />
        )}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" isLoading={loading}>
            {loading ? (mode === 'edit' ? 'Saving...' : 'Creating...') : (mode === 'edit' ? 'Save Changes' : 'Create User')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { showSuccess, showError } = useAlerts();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<TeamUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setIsAdmin(user?.role === 'admin');
    setAuthChecked(true);
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await api.getAllUsers();
      setUsers(data.users);
    } catch {
      showError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    if (roleFilter === 'all') return users;
    return users.filter((u) => u.role === roleFilter);
  }, [users, roleFilter]);

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      await api.deleteUser(deletingUser.email);
      showSuccess('User deleted successfully');
      setDeletingUser(null);
      fetchUsers();
    } catch (err) {
      if (err instanceof NetworkError) {
        showError('No connection. Check your internet.');
      } else if (err instanceof ApiError) {
        showError(err.message);
      } else {
        showError('Unexpected error deleting user');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const selectClasses = 'rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent cursor-pointer';

  if (!authChecked) {
    return (
      <div className="flex justify-center py-16">
        <svg className="h-8 w-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="py-10 text-center">
        <p className="text-lg font-medium text-text-primary">Access Denied</p>
        <p className="mt-2 text-sm text-text-secondary">You need administrator privileges to access this page.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Users</h2>
          <p className="mt-1 text-sm text-text-secondary">Manage team members and their roles</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add User
          </span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={selectClasses}
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>

        <span className="text-sm text-text-muted ml-auto">
          {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="h-8 w-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : users.length === 0 ? (
        <Card className="py-10 text-center">
          <p className="text-sm text-text-secondary">No users found.</p>
          <p className="mt-1 text-xs text-text-muted">Click &quot;Add User&quot; to create one.</p>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card className="py-8 text-center">
          <p className="text-sm text-text-secondary">No users match the selected filter.</p>
          <button
            onClick={() => setRoleFilter('all')}
            className="mt-2 text-sm text-accent hover:underline cursor-pointer"
          >
            Clear filter
          </button>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 pr-4 font-semibold text-text-primary">Name</th>
                <th className="pb-3 pr-4 font-semibold text-text-primary">Email</th>
                <th className="pb-3 pr-4 font-semibold text-text-primary">Role</th>
                <th className="pb-3 font-semibold text-text-primary text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, idx) => {
                const roleStyle = ROLE_STYLES[user.role] || 'bg-gray-100 text-gray-600';
                return (
                  <tr
                    key={user.email}
                    className={idx < filteredUsers.length - 1 ? 'border-b border-border/50' : ''}
                  >
                    <td className="py-3 pr-4">
                      <span className="font-medium text-text-primary">{user.name}</span>
                    </td>
                    <td className="py-3 pr-4 text-text-secondary">{user.email}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${roleStyle}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer"
                          title="Edit user"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeletingUser(user)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                          title="Delete user"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create Modal */}
      <UserFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={fetchUsers}
        mode="create"
      />

      {/* Edit Modal */}
      {editingUser && (
        <UserFormModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={fetchUsers}
          initialData={editingUser}
          mode="edit"
        />
      )}

      {/* Delete Confirmation */}
      {deletingUser && (
        <Modal isOpen={!!deletingUser} onClose={() => setDeletingUser(null)} title="Delete User" maxWidth="sm">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete <strong>{deletingUser.name}</strong> ({deletingUser.email})?
            This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeletingUser(null)} disabled={deleteLoading}>Cancel</Button>
            <Button
              onClick={handleDelete}
              isLoading={deleteLoading}
              className="!bg-red-600 hover:!bg-red-700 !text-white !border-red-600"
            >
              {deleteLoading ? 'Deleting...' : 'Delete User'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
