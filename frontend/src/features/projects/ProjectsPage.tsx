'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR, { useSWRConfig } from 'swr';
import { type Project } from '@/lib/api';
import { Button, Card, StatusBadge, LoadingSpinner, EmptyState } from '@/components/ui';
import { FolderIcon } from '@/components/icons';
import { CreateProjectModal } from './components';

export default function ProjectsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { mutate } = useSWRConfig();

  const { data, isLoading } = useSWR<{ projects: Project[] }>('/projects');
  const projectList = data?.projects ?? [];

  const revalidate = () => mutate('/projects');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Projects</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Manage and track all your projects
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ New Project</Button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : projectList.length === 0 ? (
        <EmptyState
          icon={
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-light">
              <FolderIcon className="h-7 w-7 text-accent" />
            </div>
          }
          title="No projects yet"
          description="Create your first project to start tracking tasks and progress."
          action={<Button onClick={() => setModalOpen(true)}>+ Create Project</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectList.map((project) => (
            <Link key={project.projectId} href={`/projects/${project.projectId}`}>
              <Card className="flex flex-col gap-3 transition-shadow hover:shadow-md cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-text-primary leading-snug">
                    {project.name}
                  </h3>
                  <StatusBadge status={project.progress} />
                </div>

                {project.description && (
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="mt-auto flex flex-col gap-2 border-t border-border-light pt-3">
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>Manager: {project.managerName}</span>
                    <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-border-light">
                      <div
                        className="h-1.5 rounded-full bg-accent transition-all"
                        style={{ width: `${project.completionPercent ?? 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-text-secondary">
                      {project.completionPercent ?? 0}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>{project.completedTasks}/{project.totalTasks} tasks</span>
                    <span className={`capitalize ${project.status === 'active' ? 'text-status-completed' : 'text-text-muted'}`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={revalidate}
      />
    </div>
  );
}
