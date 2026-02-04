'use client';

import { useState } from 'react';
import { api, type Task } from '@/lib/api';
import { ApiError, NetworkError } from '@/lib/errors';
import { useAlerts } from '@/context/AlertContext';
import { Button } from '@/components/ui';
import Modal from '@/components/ui/Modal';

interface DeleteTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteTaskModal({ task, isOpen, onClose, onDeleted }: DeleteTaskModalProps) {
  const { showSuccess, showError } = useAlerts();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.deleteTask(task.taskId, task.projectId);
      showSuccess('Task deleted successfully');
      onDeleted();
      onClose();
    } catch (err) {
      if (err instanceof NetworkError) {
        showError('No connection. Check your internet.');
      } else if (err instanceof ApiError) {
        showError(err.message);
      } else {
        showError('Unexpected error deleting task');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Task" maxWidth="sm">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          Are you sure you want to delete <strong className="text-text-primary">{task.title}</strong>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleDelete} isLoading={loading} className="!bg-red-600 hover:!bg-red-700 !text-white !border-red-600">
            {loading ? 'Deleting...' : 'Delete Task'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
