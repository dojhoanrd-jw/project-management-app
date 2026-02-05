'use client';

import { useRouter } from 'next/navigation';
import type { Project } from '@/lib/api';
import { useModalState } from '@/hooks';
import { Card, StatusBadge, Button } from '@/components/ui';
import { ChevronLeftIcon, EditIcon, TrashIcon } from '@/components/icons';
import { EditProjectModal, DeleteProjectModal } from './';

interface ProjectHeaderProps {
  project: Project;
  onUpdated: () => void;
}

export default function ProjectHeader({ project, onUpdated }: ProjectHeaderProps) {
  const router = useRouter();
  const modal = useModalState();
  const role = project.currentUserRole;

  return (
    <>
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/projects')}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-text-primary truncate">{project.name}</h2>
              <StatusBadge status={project.progress} />
            </div>
            {project.description && (
              <p className="mt-1 text-sm text-text-secondary">{project.description}</p>
            )}
          </div>
        </div>

        {(role === 'owner' || role === 'project_manager') && (
          <div className="flex items-center gap-2 border-t border-border pt-4">
            <Button size="sm" variant="secondary" onClick={() => modal.setEditing(project)}>
              <span className="flex items-center gap-1.5">
                <EditIcon className="h-4 w-4" />
                Edit Project
              </span>
            </Button>
            {role === 'owner' && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => modal.setDeleting(project)}
              >
                <span className="flex items-center gap-1.5">
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </span>
              </Button>
            )}
          </div>
        )}
      </Card>

      {modal.editing && (
        <EditProjectModal
          project={project}
          isOpen={!!modal.editing}
          onClose={modal.closeEdit}
          onUpdated={onUpdated}
        />
      )}

      {modal.deleting && (
        <DeleteProjectModal
          project={project}
          isOpen={!!modal.deleting}
          onClose={modal.closeDelete}
        />
      )}
    </>
  );
}
