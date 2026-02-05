'use client';

import { useRouter } from 'next/navigation';
import { api, type Project } from '@/lib/api';
import { useAlerts } from '@/context/AlertContext';
import { handleApiError } from '@/hooks';
import { ConfirmDeleteModal } from '@/components/ui';

interface DeleteProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteProjectModal({ project, isOpen, onClose }: DeleteProjectModalProps) {
  const router = useRouter();
  const { showSuccess, showError } = useAlerts();

  const handleConfirm = async () => {
    try {
      await api.deleteProject(project.projectId);
      showSuccess('Project deleted successfully');
      router.push('/projects');
    } catch (err) {
      handleApiError(err, showError, 'deleting project');
    }
  };

  return (
    <ConfirmDeleteModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Project"
      itemName={project.name}
      onConfirm={handleConfirm}
    />
  );
}
