'use client';

import { useEffect, useState } from 'react';
import { api, type TeamUser } from '@/lib/api';
import { ApiError, NetworkError } from '@/lib/errors';
import { useAlerts } from '@/context/AlertContext';
import { Button, Input } from '@/components/ui';
import Modal from '@/components/ui/Modal';

interface CreateTaskModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface FormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  assigneeId: string;
  assigneeName: string;
  estimatedHours: string;
  dueDate: string;
}

const INITIAL: FormData = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  category: 'important',
  assigneeId: '',
  assigneeName: '',
  estimatedHours: '',
  dueDate: '',
};

export default function CreateTaskModal({ projectId, isOpen, onClose, onCreated }: CreateTaskModalProps) {
  const { showSuccess, showError } = useAlerts();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(INITIAL);
    setErrors({});
    let cancelled = false;
    async function fetchUsers() {
      setLoadingUsers(true);
      try {
        const data = await api.getAllUsers();
        if (!cancelled) setUsers(data.users);
      } catch { /* silent */ } finally {
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

  const handleAssigneeChange = (email: string) => {
    const user = users.find((u) => u.email === email);
    setForm((prev) => ({ ...prev, assigneeId: email, assigneeName: user?.name || '' }));
    if (errors.assigneeId) setErrors((prev) => ({ ...prev, assigneeId: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.assigneeId) e.assigneeId = 'Assignee is required';
    if (!form.estimatedHours || Number(form.estimatedHours) < 0.5) e.estimatedHours = 'Min 0.5 hours';
    if (!form.dueDate) e.dueDate = 'Due date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await api.createTask({
        title: form.title.trim(),
        description: form.description.trim(),
        projectId,
        status: form.status,
        priority: form.priority,
        category: form.category,
        assigneeId: form.assigneeId,
        assigneeName: form.assigneeName,
        estimatedHours: Number(form.estimatedHours),
        dueDate: form.dueDate,
      });
      showSuccess('Task created successfully');
      onCreated();
      onClose();
    } catch (err) {
      if (err instanceof NetworkError) {
        showError('No connection. Check your internet.');
      } else if (err instanceof ApiError) {
        showError(err.message);
      } else {
        showError('Unexpected error creating task');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectClasses = 'w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent cursor-pointer';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task" maxWidth="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="task-title"
          label="Title"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          error={errors.title}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-desc" className="text-sm font-medium text-text-primary">Description</label>
          <textarea
            id="task-desc"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent resize-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-status" className="text-sm font-medium text-text-primary">Status</label>
            <select id="task-status" value={form.status} onChange={(e) => update('status', e.target.value)} className={`${selectClasses} border-border`}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-priority" className="text-sm font-medium text-text-primary">Priority</label>
            <select id="task-priority" value={form.priority} onChange={(e) => update('priority', e.target.value)} className={`${selectClasses} border-border`}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-category" className="text-sm font-medium text-text-primary">Category</label>
            <select id="task-category" value={form.category} onChange={(e) => update('category', e.target.value)} className={`${selectClasses} border-border`}>
              <option value="important">Important</option>
              <option value="notes">Notes</option>
              <option value="link">Links</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-assignee" className="text-sm font-medium text-text-primary">Assignee</label>
            <select
              id="task-assignee"
              value={form.assigneeId}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              disabled={loadingUsers}
              className={`${selectClasses} ${errors.assigneeId ? 'border-status-delayed' : 'border-border'}`}
            >
              <option value="">{loadingUsers ? 'Loading...' : 'Select assignee'}</option>
              {users.map((u) => (
                <option key={u.email} value={u.email}>{u.name}</option>
              ))}
            </select>
            {errors.assigneeId && <p className="text-xs text-status-delayed">{errors.assigneeId}</p>}
          </div>
          <Input
            id="task-hours"
            label="Estimated Hours"
            type="number"
            min="0.5"
            step="0.5"
            value={form.estimatedHours}
            onChange={(e) => update('estimatedHours', e.target.value)}
            error={errors.estimatedHours}
            required
          />
        </div>

        <Input
          id="task-due"
          label="Due Date"
          type="date"
          value={form.dueDate}
          onChange={(e) => update('dueDate', e.target.value)}
          error={errors.dueDate}
          required
        />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" isLoading={loading}>{loading ? 'Creating...' : 'Create Task'}</Button>
        </div>
      </form>
    </Modal>
  );
}
