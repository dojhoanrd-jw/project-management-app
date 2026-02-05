'use client';

import { memo, useEffect, useState } from 'react';
import { api, type TeamUser } from '@/lib/api';
import { useAlerts } from '@/context/AlertContext';
import { handleApiError, useFormState, useValidation } from '@/hooks';
import { projectRules } from '../validation';
import { PROJECT_STATUS_OPTIONS } from '@/lib/constants';
import { Button, Input, Textarea, Select, Modal } from '@/components/ui';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface ProjectFormData {
  name: string;
  description: string;
  status: string;
  managerId: string;
  dueDate: string;
}

const INITIAL_FORM: ProjectFormData = {
  name: '',
  description: '',
  status: 'active',
  managerId: '',
  dueDate: '',
};

export default memo(function CreateProjectModal({ isOpen, onClose, onCreated }: CreateProjectModalProps) {
  const { showSuccess, showError } = useAlerts();
  const { form, loading, setLoading, update, reset } = useFormState(INITIAL_FORM);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const { errors, validate, clearErrors } = useValidation<ProjectFormData>(projectRules);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(form)) return;

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
      reset();
      onCreated();
      onClose();
    } catch (err) {
      handleApiError(err, showError, 'creating project');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      clearErrors();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Project" maxWidth="md">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          id="project-name"
          label="Project Name"
          placeholder="e.g. Website Redesign"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          error={errors.name}
        />

        <Textarea
          id="project-desc"
          label="Description"
          placeholder="Brief description of the project..."
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          rows={3}
          maxLength={500}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            id="project-status"
            label="Status"
            value={form.status}
            onChange={(e) => update('status', e.target.value)}
            options={PROJECT_STATUS_OPTIONS}
          />

          <Input
            id="project-due"
            label="Due Date"
            type="date"
            value={form.dueDate}
            onChange={(e) => update('dueDate', e.target.value)}
            error={errors.dueDate}
          />
        </div>

        <Select
          id="project-manager"
          label="Project Manager"
          value={form.managerId}
          onChange={(e) => update('managerId', e.target.value)}
          disabled={loadingUsers}
          error={errors.managerId}
          placeholder={loadingUsers ? 'Loading...' : 'Select a project manager'}
        >
          {users.map((user) => (
            <option key={user.email} value={user.email}>
              {user.name} ({user.role})
            </option>
          ))}
        </Select>

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
});
