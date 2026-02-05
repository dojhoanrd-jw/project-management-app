'use client';

import { useEffect, useState } from 'react';
import { api, type Project, type TeamUser } from '@/lib/api';
import { useAlerts } from '@/context/AlertContext';
import { handleApiError, useFormState } from '@/hooks';
import { PROJECT_STATUS_OPTIONS, PROJECT_PROGRESS_OPTIONS } from '@/lib/constants';
import { Button, Input, Textarea, Select, Modal } from '@/components/ui';

interface EditProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const INITIAL_FORM = {
  name: '',
  description: '',
  status: '',
  progress: '',
  managerId: '',
  dueDate: '',
};

export default function EditProjectModal({ project, isOpen, onClose, onUpdated }: EditProjectModalProps) {
  const { showSuccess, showError } = useAlerts();
  const { form, setForm, errors, setErrors, loading, setLoading, update } = useFormState(INITIAL_FORM);
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
  }, [isOpen, project, setForm, setErrors]);

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

  const validate = (): boolean => {
    const e: Partial<Record<keyof typeof INITIAL_FORM, string>> = {};
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
      handleApiError(err, showError, 'updating project');
    } finally {
      setLoading(false);
    }
  };

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

        <Textarea
          id="edit-desc"
          label="Description"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          rows={3}
          maxLength={500}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            id="edit-status"
            label="Status"
            value={form.status}
            onChange={(e) => update('status', e.target.value)}
            options={PROJECT_STATUS_OPTIONS}
          />

          <Select
            id="edit-progress"
            label="Progress"
            value={form.progress}
            onChange={(e) => update('progress', e.target.value)}
            options={PROJECT_PROGRESS_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            id="edit-manager"
            label="Project Manager"
            value={form.managerId}
            onChange={(e) => update('managerId', e.target.value)}
            disabled={loadingUsers}
            error={errors.managerId}
            placeholder={loadingUsers ? 'Loading...' : 'Select a manager'}
          >
            {users.map((user) => (
              <option key={user.email} value={user.email}>
                {user.name} ({user.role})
              </option>
            ))}
          </Select>

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
