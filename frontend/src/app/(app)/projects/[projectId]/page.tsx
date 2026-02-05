import ProjectDetailPage from '@/features/projects/detail/ProjectDetailPage';

export function generateStaticParams() {
  return [{ projectId: '_' }];
}

export default function Page() {
  return <ProjectDetailPage />;
}
