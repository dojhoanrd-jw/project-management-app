import { useCallback, useState } from 'react';

export function useModalState<T>() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  const openCreate = useCallback(() => setCreateOpen(true), []);
  const closeCreate = useCallback(() => setCreateOpen(false), []);
  const closeEdit = useCallback(() => setEditing(null), []);
  const closeDelete = useCallback(() => setDeleting(null), []);

  return {
    createOpen,
    editing,
    deleting,
    openCreate,
    closeCreate,
    setEditing,
    closeEdit,
    setDeleting,
    closeDelete,
  };
}
