'use client';

import { useMemo, useState } from 'react';
import type { Task } from '@/lib/api';
import { Card, Button, StatusBadge } from '@/components/ui';
import CreateTaskModal from './CreateTaskModal';
import EditTaskModal from './EditTaskModal';
import DeleteTaskModal from './DeleteTaskModal';

interface ProjectTasksProps {
  projectId: string;
  tasks: Task[];
  onTaskChanged: () => void;
}

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

const STATUS_OPTIONS = [
  { key: 'all', label: 'All Statuses' },
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'in_review', label: 'In Review' },
  { key: 'completed', label: 'Completed' },
  { key: 'approved', label: 'Approved' },
];

const PRIORITY_OPTIONS = [
  { key: 'all', label: 'All Priorities' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

export default function ProjectTasks({ projectId, tasks, onTaskChanged }: ProjectTasksProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, priorityFilter]);

  const selectClasses = 'rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent cursor-pointer';

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">Tasks</h3>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Task
            </span>
          </Button>
        </div>

        <div className="border-t border-border" />

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClasses}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={selectClasses}
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>

          <span className="text-sm text-text-muted ml-auto">
            {filteredTasks.length} of {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        {tasks.length === 0 ? (
          <Card className="py-10 text-center">
            <p className="text-sm text-text-secondary">No tasks yet for this project.</p>
            <p className="mt-1 text-xs text-text-muted">Click &quot;Add Task&quot; to get started.</p>
          </Card>
        ) : filteredTasks.length === 0 ? (
          <Card className="py-8 text-center">
            <p className="text-sm text-text-secondary">No tasks match the selected filters.</p>
            <button
              onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); }}
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
      </div>

      <CreateTaskModal
        projectId={projectId}
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={onTaskChanged}
      />

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onUpdated={onTaskChanged}
        />
      )}

      {deletingTask && (
        <DeleteTaskModal
          task={deletingTask}
          isOpen={!!deletingTask}
          onClose={() => setDeletingTask(null)}
          onDeleted={onTaskChanged}
        />
      )}
    </>
  );
}
