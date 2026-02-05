'use client';

import { useMemo } from 'react';
import type { Task, ProjectMember } from '@/lib/api';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, FILTER_SELECT_CLASSES, formatDate } from '@/lib/constants';
import { useFilterState, useModalState } from '@/hooks';
import { Card, Button, StatusBadge, PriorityBadge, EmptyState, DataTable, ActionButtons } from '@/components/ui';
import type { Column } from '@/components/ui';
import { PlusIcon } from '@/components/icons';
import { TaskFormModal } from '@/features/tasks/components';
import DeleteTaskModal from './DeleteTaskModal';

interface ProjectTasksProps {
  projectId: string;
  tasks: Task[];
  members: ProjectMember[];
  onTaskChanged: () => void;
  userRole?: string;
}

const INITIAL_FILTERS = { status: 'all', priority: 'all' };

const taskFilterFn = (t: Task, f: Record<string, string>) => {
  if (f.status !== 'all' && t.status !== f.status) return false;
  if (f.priority !== 'all' && t.priority !== f.priority) return false;
  return true;
};

export default function ProjectTasks({ projectId, tasks, members, onTaskChanged, userRole }: ProjectTasksProps) {
  const { filters, filtered: filteredTasks, updateFilter, clearFilters } = useFilterState(tasks, INITIAL_FILTERS, taskFilterFn);
  const modal = useModalState<Task>();

  const columns: Column<Task>[] = useMemo(() => [
    {
      header: 'Title',
      render: (task) => <span className="font-medium text-text-primary">{task.title}</span>,
    },
    {
      header: 'Assignee',
      render: (task) => <span className="text-text-secondary whitespace-nowrap">{task.assigneeName}</span>,
    },
    {
      header: 'Status',
      render: (task) => <StatusBadge status={task.status} className="!text-[11px]" />,
    },
    {
      header: 'Priority',
      render: (task) => <PriorityBadge priority={task.priority} />,
    },
    {
      header: 'Due Date',
      render: (task) => <span className="text-text-secondary whitespace-nowrap">{formatDate(task.dueDate)}</span>,
    },
    {
      header: 'Hours',
      headerClassName: 'pb-3 pr-4 font-semibold text-text-primary text-right',
      render: (task) => <span className="block text-right text-text-secondary">{task.estimatedHours}h</span>,
    },
    {
      header: 'Actions',
      headerClassName: 'pb-3 font-semibold text-text-primary text-right',
      render: (task) => (
        <ActionButtons
          onEdit={() => modal.setEditing(task)}
          onDelete={() => modal.setDeleting(task)}
          editLabel="Edit task"
          deleteLabel="Delete task"
        />
      ),
    },
  ], [modal]);

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">Tasks</h3>
          <Button size="sm" onClick={modal.openCreate}>
            <span className="flex items-center gap-1.5">
              <PlusIcon />
              Add Task
            </span>
          </Button>
        </div>

        <div className="border-t border-border" />

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className={FILTER_SELECT_CLASSES}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(e) => updateFilter('priority', e.target.value)}
            className={FILTER_SELECT_CLASSES}
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
          <EmptyState
            title="No tasks yet"
            description="Click &quot;Add Task&quot; to get started."
            action={<Button size="sm" onClick={modal.openCreate}>+ Add Task</Button>}
          />
        ) : filteredTasks.length === 0 ? (
          <Card className="py-8 text-center">
            <p className="text-sm text-text-secondary">No tasks match the selected filters.</p>
            <button
              onClick={clearFilters}
              className="mt-2 text-sm text-accent hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </Card>
        ) : (
          <DataTable columns={columns} data={filteredTasks} keyExtractor={(t) => t.taskId} />
        )}
      </div>

      <TaskFormModal
        mode="create"
        projectId={projectId}
        members={members}
        isOpen={modal.createOpen}
        onClose={modal.closeCreate}
        onSaved={onTaskChanged}
        userRole={userRole}
      />

      {modal.editing && (
        <TaskFormModal
          mode="edit"
          projectId={projectId}
          members={members}
          isOpen={!!modal.editing}
          onClose={modal.closeEdit}
          onSaved={onTaskChanged}
          initialData={modal.editing}
          userRole={userRole}
        />
      )}

      {modal.deleting && (
        <DeleteTaskModal
          task={modal.deleting}
          isOpen={!!modal.deleting}
          onClose={modal.closeDelete}
          onDeleted={onTaskChanged}
        />
      )}
    </>
  );
}
