'use client';

import { useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { api, type Task, type Project } from '@/lib/api';
import { useAlerts } from '@/context/AlertContext';
import { getCurrentUser } from '@/lib/auth';
import { FILTER_SELECT_CLASSES, formatDate } from '@/lib/constants';
import { useFilterState, useModalState } from '@/hooks';
import { Card, StatusBadge, PriorityBadge, Button, ConfirmDeleteModal, LoadingSpinner, EmptyState, DataTable, ActionButtons } from '@/components/ui';
import type { Column } from '@/components/ui';
import { PlusIcon, TasksIcon } from '@/components/icons';
import { TaskFormModal } from './components';

export default function TasksPage() {
  const { showSuccess } = useAlerts();
  const { mutate } = useSWRConfig();
  const currentUserRole = getCurrentUser()?.role;

  const { data: tasksData, isLoading: loadingTasks } = useSWR<{ tasks: Task[] }>('/tasks');
  const { data: projectsData, isLoading: loadingProjects } = useSWR<{ projects: Project[] }>('/projects');

  const loading = loadingTasks || loadingProjects;
  const tasks = tasksData?.tasks ?? [];
  const projects = projectsData?.projects ?? [];

  const modal = useModalState<Task>();

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

  const { filters, filtered: filteredTasks, updateFilter, clearFilters } = useFilterState(
    tasks,
    { status: 'all', priority: 'all', project: 'all', assignee: 'all' },
    (t, f) => {
      if (f.status !== 'all' && t.status !== f.status) return false;
      if (f.priority !== 'all' && t.priority !== f.priority) return false;
      if (f.project !== 'all' && t.projectId !== f.project) return false;
      if (f.assignee !== 'all' && t.assigneeId !== f.assignee) return false;
      return true;
    },
  );

  const revalidate = () => {
    mutate('/tasks');
    mutate('/projects');
  };

  const handleDelete = async () => {
    if (!modal.deleting) return;
    await api.deleteTask(modal.deleting.taskId, modal.deleting.projectId);
    showSuccess('Task deleted successfully');
    modal.closeDelete();
    revalidate();
  };

  const columns: Column<Task>[] = useMemo(() => [
    {
      header: 'Title',
      render: (task) => <span className="font-medium text-text-primary">{task.title}</span>,
    },
    {
      header: 'Project',
      render: (task) => <span className="text-text-secondary whitespace-nowrap">{task.projectName}</span>,
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Tasks</h2>
          <p className="mt-1 text-sm text-text-secondary">View and manage all tasks across projects</p>
        </div>
        <Button onClick={modal.openCreate}>
          <span className="flex items-center gap-1.5">
            <PlusIcon />
            Add Task
          </span>
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-light">
              <TasksIcon className="h-7 w-7 text-accent" />
            </div>
          }
          title="No tasks yet"
          description="Create your first task to get started."
          action={<Button onClick={modal.openCreate}>+ Create Task</Button>}
        />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className={FILTER_SELECT_CLASSES}>
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="completed">Completed</option>
              <option value="approved">Approved</option>
            </select>

            <select value={filters.priority} onChange={(e) => updateFilter('priority', e.target.value)} className={FILTER_SELECT_CLASSES}>
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select value={filters.project} onChange={(e) => updateFilter('project', e.target.value)} className={FILTER_SELECT_CLASSES}>
              <option value="all">All Projects</option>
              {taskProjects.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>

            <select value={filters.assignee} onChange={(e) => updateFilter('assignee', e.target.value)} className={FILTER_SELECT_CLASSES}>
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
                onClick={clearFilters}
                className="mt-2 text-sm text-accent hover:underline cursor-pointer"
              >
                Clear filters
              </button>
            </Card>
          ) : (
            <DataTable columns={columns} data={filteredTasks} keyExtractor={(t) => t.taskId} />
          )}
        </>
      )}

      {/* Create Task Modal */}
      <TaskFormModal
        isOpen={modal.createOpen}
        onClose={modal.closeCreate}
        onSaved={revalidate}
        projects={projects}
        userRole={currentUserRole}
        mode="create"
      />

      {/* Edit Task Modal */}
      {modal.editing && (
        <TaskFormModal
          isOpen={!!modal.editing}
          onClose={modal.closeEdit}
          onSaved={revalidate}
          projects={projects}
          initialData={modal.editing}
          userRole={currentUserRole}
          mode="edit"
        />
      )}

      {/* Delete Confirmation Modal */}
      {modal.deleting && (
        <ConfirmDeleteModal
          isOpen={!!modal.deleting}
          onClose={modal.closeDelete}
          title="Delete Task"
          itemName={modal.deleting.title}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
