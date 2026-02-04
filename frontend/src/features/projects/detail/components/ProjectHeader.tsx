'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Project } from '@/lib/api';
import { Card, StatusBadge, Button } from '@/components/ui';
import EditProjectModal from './EditProjectModal';
import DeleteProjectModal from './DeleteProjectModal';

interface ProjectHeaderProps {
  project: Project;
  onUpdated: () => void;
}

export default function ProjectHeader({ project, onUpdated }: ProjectHeaderProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/projects')}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
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

        <div className="flex items-center gap-2 border-t border-border pt-4">
          <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit Project
            </span>
          </Button>
          <Button
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="!bg-red-600 hover:!bg-red-700 !text-white !border-red-600"
          >
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Delete
            </span>
          </Button>
        </div>
      </Card>

      <EditProjectModal
        project={project}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onUpdated={onUpdated}
      />

      <DeleteProjectModal
        project={project}
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
}
