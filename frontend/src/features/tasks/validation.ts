import type { Project } from '@/lib/api';

export const taskRules = (opts: { projects?: Project[]; mode: 'create' | 'edit' }) => ({
  title: (v: string) => (!v.trim() ? 'Title is required' : undefined),
  projectId: (v: string) => (opts.projects && !v ? 'Project is required' : undefined),
  assigneeId: (v: string) => (!v ? 'Assignee is required' : undefined),
  estimatedHours: (v: string) => (!v || Number(v) < 0.5 ? 'Min 0.5 hours' : undefined),
  dueDate: (v: string) => {
    if (!v) return 'Due date is required';
    if (opts.mode === 'create') {
      const today = new Date().toISOString().split('T')[0];
      if (v < today) return 'Due date cannot be in the past';
    }
    return undefined;
  },
});
