'use client';

import { useEffect, useState } from 'react';
import { api, type TeamUser } from '@/lib/api';
import { ApiError, NetworkError } from '@/lib/errors';
import { useAlerts } from '@/context/AlertContext';
import { Button, Input } from '@/components/ui';
import Modal from '@/components/ui/Modal';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface FormData {
  name: string;
  description: string;
  status: 'active' | 'paused';
  managerId: string;
  dueDate: string;
}

const initialForm: FormData = {
  name: '',
  description: '',
  status: 'active',
  managerId: '',
  dueDate: '',
};

export default function CreateProjectModal({ isOpen, onClose, onCreated }: CreateProjectModalProps) {
  const { showSuccess, showError } = useAlerts();
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function fetchUsers() {
      setLoadingUsers(true);
      try {
        const data = await api.getUsers();
        if (!cancelled) setUsers(data.users);
      } catch {
        if (!cancelled) showError('Failed to load team members');
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    }

    fetchUsers();
    return () => { cancelled = true; };
  }, [isOpen, showError]);

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) e.name = 'Project name is required';
    if (!form.managerId) e.managerId = 'Project manager is required';
    if (!form.dueDate) e.dueDate = 'Due date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedManager = users.find((u) => u.email === form.managerId);

    setLoading(true);
    try {
      await api.createProject({
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
        managerId: form.managerId,
        managerName: selectedManager?.name || '',
        dueDate: form.dueDate,
      });
      showSuccess('Project created successfully');
      setForm(initialForm);
      setErrors({});
      onCreated();
      onClose();
    } catch (err) {
      if (err instanceof NetworkError) {
        showError('No connection. Check your internet.');
      } else if (err instanceof ApiError) {
        showError(err.message);
      } else {
        showError('Unexpected error creating project');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm(initialForm);
      setErrors({});
      onClose();
    }
  };

  const selectClasses = `w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent cursor-pointer`;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Project" maxWidth="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="project-name"
          label="Project Name"
          placeholder="e.g. Website Redesign"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          error={errors.name}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="project-desc" className="text-sm font-medium text-text-primary">
            Description
          </label>
          <textarea
            id="project-desc"
            placeholder="Brief description of the project..."
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-status" className="text-sm font-medium text-text-primary">
              Status
            </label>
            <select
              id="project-status"
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              className={`${selectClasses} border-border`}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          <Input
            id="project-due"
            label="Due Date"
            type="date"
            value={form.dueDate}
            onChange={(e) => update('dueDate', e.target.value)}
            error={errors.dueDate}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="project-manager" className="text-sm font-medium text-text-primary">
            Project Manager
          </label>
          <select
            id="project-manager"
            value={form.managerId}
            onChange={(e) => update('managerId', e.target.value)}
            disabled={loadingUsers}
            className={`${selectClasses} ${errors.managerId ? 'border-status-delayed' : 'border-border'}`}
          >
            <option value="">
              {loadingUsers ? 'Loading...' : 'Select a project manager'}
            </option>
            {users.map((user) => (
              <option key={user.email} value={user.email}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>
          {errors.managerId && (
            <p className="text-xs text-status-delayed">{errors.managerId}</p>
          )}
        </div>

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
