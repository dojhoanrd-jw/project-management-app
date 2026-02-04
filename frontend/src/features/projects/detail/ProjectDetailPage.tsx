'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, type Project, type Task } from '@/lib/api';
import { useAlerts } from '@/context/AlertContext';
import { Card, Button } from '@/components/ui';
import ProjectHeader from './components/ProjectHeader';
import ProjectInfoCards from './components/ProjectInfoCards';
import ProjectTasks from './components/ProjectTasks';
import ProjectMembers from './components/ProjectMembers';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showError } = useAlerts();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const projectId = params.projectId as string;

  const fetchProject = useCallback(async () => {
    try {
      const data = await api.getProject(projectId);
      setProject(data.project);
      setTasks(data.tasks);
    } catch {
      showError('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId, showError]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-24 animate-pulse rounded-2xl bg-surface" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
        <div className="h-16 animate-pulse rounded-2xl bg-surface" />
        <div className="h-48 animate-pulse rounded-2xl bg-surface" />
        <div className="h-64 animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  if (!project) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-lg font-medium text-text-primary">Project not found</h3>
        <Button className="mt-4" onClick={() => router.push('/projects')}>
          Back to Projects
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <ProjectHeader project={project} onUpdated={fetchProject} />
      <ProjectInfoCards project={project} />
      <ProjectMembers project={project} onUpdated={fetchProject} />
      <ProjectTasks projectId={projectId} tasks={tasks} onTaskChanged={fetchProject} />
    </div>
  );
}
