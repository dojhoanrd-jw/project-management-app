'use client';

import { api, type Task } from '@/lib/api';
import { useAlerts } from '@/context/AlertContext';
import { handleApiError } from '@/hooks';
import { ConfirmDeleteModal } from '@/components/ui';

interface DeleteTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteTaskModal({ task, isOpen, onClose, onDeleted }: DeleteTaskModalProps) {
  const { showSuccess, showError } = useAlerts();

  const handleConfirm = async () => {
    try {
      await api.deleteTask(task.taskId, task.projectId);
      showSuccess('Task deleted successfully');
      onDeleted();
      onClose();
    } catch (err) {
      handleApiError(err, showError, 'deleting task');
    }
  };

  return (
    <ConfirmDeleteModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Task"
      itemName={task.title}
      onConfirm={handleConfirm}
    />
  );
}
