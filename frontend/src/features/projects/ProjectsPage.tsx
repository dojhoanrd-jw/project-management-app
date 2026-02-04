'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type Project } from '@/lib/api';
import { useAlerts } from '@/context/AlertContext';
import { Button, Card, StatusBadge } from '@/components/ui';
import CreateProjectModal from './components/CreateProjectModal';

export default function ProjectsPage() {
  const { showError } = useAlerts();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await api.getProjects();
      setProjects(data.projects);
    } catch {
      showError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="h-8 w-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-light">
            <svg className="h-7 w-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-text-primary">No projects yet</h3>
          <p className="mt-1 max-w-xs text-sm text-text-secondary">
            Create your first project to start tracking tasks and progress.
          </p>
          <Button className="mt-5" onClick={() => setModalOpen(true)}>
            + Create Project
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
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
        onCreated={fetchProjects}
      />
    </div>
  );
}
