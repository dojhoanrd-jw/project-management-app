'use client';

import { useEffect, useState } from 'react';
import { api, type Project, type TeamUser } from '@/lib/api';
import { ApiError, NetworkError } from '@/lib/errors';
import { useAlerts } from '@/context/AlertContext';
import { Button, Input } from '@/components/ui';
import Modal from '@/components/ui/Modal';

interface EditProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

interface FormData {
  name: string;
  description: string;
  status: string;
  progress: string;
  managerId: string;
  dueDate: string;
}

export default function EditProjectModal({ project, isOpen, onClose, onUpdated }: EditProjectModalProps) {
  const { showSuccess, showError } = useAlerts();
  const [form, setForm] = useState<FormData>({
    name: '',
    description: '',
    status: '',
    progress: '',
    managerId: '',
    dueDate: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
      progress: project.progress,
      managerId: project.managerId,
      dueDate: project.dueDate,
    });
    setErrors({});
  }, [isOpen, project]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function fetchUsers() {
      setLoadingUsers(true);
      try {
        const data = await api.getUsers();
        if (!cancelled) setUsers(data.users);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    }

    fetchUsers();
    return () => { cancelled = true; };
  }, [isOpen]);

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
      await api.updateProject(project.projectId, {
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
        managerId: form.managerId,
        managerName: selectedManager?.name || project.managerName,
        dueDate: form.dueDate,
      });
      showSuccess('Project updated successfully');
      onUpdated();
      onClose();
    } catch (err) {
      if (err instanceof NetworkError) {
        showError('No connection. Check your internet.');
      } else if (err instanceof ApiError) {
        showError(err.message);
      } else {
        showError('Unexpected error updating project');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectClasses = 'w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent cursor-pointer';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Project" maxWidth="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="edit-name"
          label="Project Name"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          error={errors.name}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-desc" className="text-sm font-medium text-text-primary">
            Description
          </label>
          <textarea
            id="edit-desc"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-status" className="text-sm font-medium text-text-primary">
              Status
            </label>
            <select
              id="edit-status"
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              className={`${selectClasses} border-border`}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-progress" className="text-sm font-medium text-text-primary">
              Progress
            </label>
            <select
              id="edit-progress"
              value={form.progress}
              onChange={(e) => update('progress', e.target.value)}
              className={`${selectClasses} border-border`}
            >
              <option value="on_track">On Track</option>
              <option value="at_risk">At Risk</option>
              <option value="delayed">Delayed</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-manager" className="text-sm font-medium text-text-primary">
              Project Manager
            </label>
            <select
              id="edit-manager"
              value={form.managerId}
              onChange={(e) => update('managerId', e.target.value)}
              disabled={loadingUsers}
              className={`${selectClasses} ${errors.managerId ? 'border-status-delayed' : 'border-border'}`}
            >
              <option value="">
                {loadingUsers ? 'Loading...' : 'Select a manager'}
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

          <Input
            id="edit-due"
            label="Due Date"
            type="date"
            value={form.dueDate}
            onChange={(e) => update('dueDate', e.target.value)}
            error={errors.dueDate}
            required
          />
        </div>

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
