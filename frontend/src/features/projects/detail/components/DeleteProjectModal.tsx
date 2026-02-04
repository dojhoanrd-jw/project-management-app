'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type Project } from '@/lib/api';
import { ApiError, NetworkError } from '@/lib/errors';
import { useAlerts } from '@/context/AlertContext';
import { Button } from '@/components/ui';
import Modal from '@/components/ui/Modal';

interface DeleteProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteProjectModal({ project, isOpen, onClose }: DeleteProjectModalProps) {
  const router = useRouter();
  const { showSuccess, showError } = useAlerts();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.deleteProject(project.projectId);
      showSuccess('Project deleted successfully');
      router.push('/projects');
    } catch (err) {
      if (err instanceof NetworkError) {
        showError('No connection. Check your internet.');
      } else if (err instanceof ApiError) {
        showError(err.message);
      } else {
        showError('Unexpected error deleting project');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Project" maxWidth="sm">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          Are you sure you want to delete <strong className="text-text-primary">{project.name}</strong>?
          This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            isLoading={loading}
            className="!bg-status-at-risk hover:!bg-red-700"
          >
            {loading ? 'Deleting...' : 'Delete Project'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
