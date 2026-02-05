'use client';

import { usePathname, useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { type Project, type Task } from '@/lib/api';
import { useTranslation } from '@/context/I18nContext';
import { Card, Button } from '@/components/ui';
import { ProjectHeader, ProjectInfoCards, ProjectTasks, ProjectMembers } from './components';

export default function ProjectDetailPage() {
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  // useParams() returns '_' in static export — read from actual URL instead
  const projectId = pathname.split('/').pop() || '';

  const { data, isLoading } = useSWR<{ project: Project; tasks: Task[] }>(
    projectId && projectId !== '_' ? `/projects/${projectId}` : null
  );

  const revalidate = () => mutate(`/projects/${projectId}`);

  if (isLoading || !projectId || projectId === '_') {
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

  if (!data) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-lg font-medium text-text-primary">{t('projectDetail.notFound')}</h3>
        <Button className="mt-4" onClick={() => router.push('/projects')}>
          {t('projectDetail.backToProjects')}
        </Button>
      </Card>
    );
  }

  const { project, tasks } = data;

  return (
    <div className="flex flex-col gap-8">
      <ProjectHeader project={project} onUpdated={revalidate} />
      <ProjectInfoCards project={project} />
      <ProjectMembers project={project} onUpdated={revalidate} />
      <ProjectTasks projectId={projectId} tasks={tasks} members={project.members || []} onTaskChanged={revalidate} userRole={project.currentUserRole} />
    </div>
  );
}
