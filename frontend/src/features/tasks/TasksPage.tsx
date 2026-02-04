'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, type Task, type Project, type TeamUser } from '@/lib/api';
import { ApiError, NetworkError } from '@/lib/errors';
import { useAlerts } from '@/context/AlertContext';
import { Card, StatusBadge, Button, Input } from '@/components/ui';
import Modal from '@/components/ui/Modal';

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-status-at-risk-bg text-status-at-risk',
  high: 'bg-status-delayed-bg text-status-delayed',
  medium: 'bg-status-ongoing-bg text-status-ongoing',
  low: 'bg-gray-100 text-gray-600',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── Create / Edit form ──────────────────────────────────────────────────────

interface TaskFormData {
  title: string;
  description: string;
  projectId: string;
  status: string;
  priority: string;
  category: string;
  assigneeId: string;
  assigneeName: string;
  estimatedHours: string;
  dueDate: string;
}

const EMPTY_FORM: TaskFormData = {
  title: '', description: '', projectId: '', status: 'todo', priority: 'medium',
  category: 'important', assigneeId: '', assigneeName: '', estimatedHours: '', dueDate: '',
};

function TaskFormModal({
  isOpen, onClose, onSaved, projects, initialData, mode,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  projects: Project[];
  initialData?: Task;
  mode: 'create' | 'edit';
}) {
  const { showSuccess, showError } = useAlerts();
  const [form, setForm] = useState<TaskFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initialData) {
      setForm({
        title: initialData.title,
        description: initialData.description || '',
        projectId: initialData.projectId,
        status: initialData.status,
        priority: initialData.priority,
        category: initialData.category || 'important',
        assigneeId: initialData.assigneeId,
        assigneeName: initialData.assigneeName,
        estimatedHours: String(initialData.estimatedHours),
        dueDate: initialData.dueDate,
      });
    } else {
      setForm(EMPTY_FORM);
    }
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
  }, [isOpen, mode, initialData]);

  const update = (field: keyof TaskFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleAssigneeChange = (email: string) => {
    const user = users.find((u) => u.email === email);
    setForm((prev) => ({ ...prev, assigneeId: email, assigneeName: user?.name || '' }));
    if (errors.assigneeId) setErrors((prev) => ({ ...prev, assigneeId: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof TaskFormData, string>> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.projectId) e.projectId = 'Project is required';
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
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        projectId: form.projectId,
        status: form.status,
        priority: form.priority,
        category: form.category,
        assigneeId: form.assigneeId,
        assigneeName: form.assigneeName,
        estimatedHours: Number(form.estimatedHours),
        dueDate: form.dueDate,
      };

      if (mode === 'edit' && initialData) {
        await api.updateTask(initialData.taskId, payload);
        showSuccess('Task updated successfully');
      } else {
        await api.createTask(payload);
        showSuccess('Task created successfully');
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof NetworkError) {
        showError('No connection. Check your internet.');
      } else if (err instanceof ApiError) {
        showError(err.message);
      } else {
        showError(`Unexpected error ${mode === 'edit' ? 'updating' : 'creating'} task`);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectClasses = 'w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent cursor-pointer';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit Task' : 'Create Task'} maxWidth="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="tf-title"
          label="Title"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          error={errors.title}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tf-desc" className="text-sm font-medium text-text-primary">Description</label>
          <textarea
            id="tf-desc"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tf-project" className="text-sm font-medium text-text-primary">Project</label>
          <select
            id="tf-project"
            value={form.projectId}
            onChange={(e) => update('projectId', e.target.value)}
            disabled={mode === 'edit'}
            className={`${selectClasses} ${errors.projectId ? 'border-status-delayed' : 'border-border'}`}
          >
            <option value="">Select a project</option>
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>{p.name}</option>
            ))}
          </select>
          {errors.projectId && <p className="text-xs text-status-delayed">{errors.projectId}</p>}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tf-status" className="text-sm font-medium text-text-primary">Status</label>
            <select id="tf-status" value={form.status} onChange={(e) => update('status', e.target.value)} className={`${selectClasses} border-border`}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="completed">Completed</option>
              <option value="approved">Approved</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tf-priority" className="text-sm font-medium text-text-primary">Priority</label>
            <select id="tf-priority" value={form.priority} onChange={(e) => update('priority', e.target.value)} className={`${selectClasses} border-border`}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tf-category" className="text-sm font-medium text-text-primary">Category</label>
            <select id="tf-category" value={form.category} onChange={(e) => update('category', e.target.value)} className={`${selectClasses} border-border`}>
              <option value="important">Important</option>
              <option value="notes">Notes</option>
              <option value="link">Links</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tf-assignee" className="text-sm font-medium text-text-primary">Assignee</label>
            <select
              id="tf-assignee"
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
            id="tf-hours"
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
          id="tf-due"
          label="Due Date"
          type="date"
          value={form.dueDate}
          onChange={(e) => update('dueDate', e.target.value)}
          error={errors.dueDate}
          required
        />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" isLoading={loading}>
            {loading ? (mode === 'edit' ? 'Saving...' : 'Creating...') : (mode === 'edit' ? 'Save Changes' : 'Create Task')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { showSuccess, showError } = useAlerts();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tasksData, projectsData] = await Promise.all([
        api.getTasks(),
        api.getProjects(),
      ]);
      setTasks(tasksData.tasks);
      setProjects(projectsData.projects);
    } catch {
      showError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const assignees = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tasks) {
      if (t.assigneeId && !map.has(t.assigneeId)) {
        map.set(t.assigneeId, t.assigneeName);
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [tasks]);

  const taskProjects = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tasks) {
      if (t.projectId && !map.has(t.projectId)) {
        map.set(t.projectId, t.projectName);
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (projectFilter !== 'all' && t.projectId !== projectFilter) return false;
      if (assigneeFilter !== 'all' && t.assigneeId !== assigneeFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, projectFilter, assigneeFilter]);

  const handleDelete = async () => {
    if (!deletingTask) return;
    setDeleteLoading(true);
    try {
      await api.deleteTask(deletingTask.taskId);
      showSuccess('Task deleted successfully');
      setDeletingTask(null);
      fetchData();
    } catch (err) {
      if (err instanceof NetworkError) {
        showError('No connection. Check your internet.');
      } else if (err instanceof ApiError) {
        showError(err.message);
      } else {
        showError('Unexpected error deleting task');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const selectClasses = 'rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent cursor-pointer';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Tasks</h2>
          <p className="mt-1 text-sm text-text-secondary">View and manage all tasks across projects</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Task
          </span>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="h-8 w-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : tasks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-light">
            <svg className="h-7 w-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-text-primary">No tasks yet</h3>
          <p className="mt-1 max-w-xs text-sm text-text-secondary">
            Create your first task to get started.
          </p>
          <Button className="mt-5" onClick={() => setCreateOpen(true)}>+ Create Task</Button>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClasses}>
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="completed">Completed</option>
              <option value="approved">Approved</option>
            </select>

            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className={selectClasses}>
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className={selectClasses}>
              <option value="all">All Projects</option>
              {taskProjects.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>

            <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className={selectClasses}>
              <option value="all">All Assignees</option>
              {assignees.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>

            <span className="text-sm text-text-muted ml-auto">
              {filteredTasks.length} of {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Table */}
          {filteredTasks.length === 0 ? (
            <Card className="py-8 text-center">
              <p className="text-sm text-text-secondary">No tasks match the selected filters.</p>
              <button
                onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setProjectFilter('all'); setAssigneeFilter('all'); }}
                className="mt-2 text-sm text-accent hover:underline cursor-pointer"
              >
                Clear filters
              </button>
            </Card>
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 pr-4 font-semibold text-text-primary">Title</th>
                    <th className="pb-3 pr-4 font-semibold text-text-primary">Project</th>
                    <th className="pb-3 pr-4 font-semibold text-text-primary">Assignee</th>
                    <th className="pb-3 pr-4 font-semibold text-text-primary">Status</th>
                    <th className="pb-3 pr-4 font-semibold text-text-primary">Priority</th>
                    <th className="pb-3 pr-4 font-semibold text-text-primary">Due Date</th>
                    <th className="pb-3 pr-4 font-semibold text-text-primary text-right">Hours</th>
                    <th className="pb-3 font-semibold text-text-primary text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task, idx) => {
                    const priorityStyle = PRIORITY_STYLES[task.priority] || 'bg-gray-100 text-gray-600';
                    return (
                      <tr
                        key={task.taskId}
                        className={idx < filteredTasks.length - 1 ? 'border-b border-border/50' : ''}
                      >
                        <td className="py-3 pr-4">
                          <span className="font-medium text-text-primary">{task.title}</span>
                        </td>
                        <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">{task.projectName}</td>
                        <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">{task.assigneeName}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={task.status} className="!text-[11px]" />
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${priorityStyle}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">{formatDate(task.dueDate)}</td>
                        <td className="py-3 pr-4 text-right text-text-secondary">{task.estimatedHours}h</td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingTask(task)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer"
                              title="Edit task"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeletingTask(task)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                              title="Delete task"
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
        </>
      )}

      {/* Create Task Modal */}
      <TaskFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={fetchData}
        projects={projects}
        mode="create"
      />

      {/* Edit Task Modal */}
      {editingTask && (
        <TaskFormModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSaved={fetchData}
          projects={projects}
          initialData={editingTask}
          mode="edit"
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingTask && (
        <Modal isOpen={!!deletingTask} onClose={() => setDeletingTask(null)} title="Delete Task" maxWidth="sm">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary">
              Are you sure you want to delete <strong className="text-text-primary">{deletingTask.title}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeletingTask(null)} disabled={deleteLoading}>Cancel</Button>
              <Button onClick={handleDelete} isLoading={deleteLoading} className="!bg-red-600 hover:!bg-red-700 !text-white !border-red-600">
                {deleteLoading ? 'Deleting...' : 'Delete Task'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
