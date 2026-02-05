'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { api, type TeamUser } from '@/lib/api';
import { useAlerts } from '@/context/AlertContext';
import { getCurrentUser } from '@/lib/auth';
import { ROLE_LABELS, ROLE_STYLES, ROLE_OPTIONS, FILTER_SELECT_CLASSES } from '@/lib/constants';
import { useFilterState, useModalState } from '@/hooks';
import { Card, Button, ConfirmDeleteModal, LoadingSpinner, EmptyState, DataTable, ActionButtons } from '@/components/ui';
import type { Column } from '@/components/ui';
import { PlusIcon } from '@/components/icons';
import { UserFormModal } from './components';

export default function UsersPage() {
  const { showSuccess } = useAlerts();
  const { mutate } = useSWRConfig();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setIsAdmin(user?.role === 'admin');
    setAuthChecked(true);
  }, []);

  const { data: usersData, isLoading } = useSWR<{ users: TeamUser[] }>('/users?all=true');
  const userList = usersData?.users ?? [];

  const modal = useModalState<TeamUser>();

  const { filters, filtered: filteredUsers, updateFilter, clearFilters } = useFilterState(
    userList,
    { role: 'all' },
    (u, f) => f.role === 'all' || u.role === f.role,
  );

  const revalidate = () => mutate('/users?all=true');

  const handleDelete = async () => {
    if (!modal.deleting) return;
    await api.deleteUser(modal.deleting.email);
    showSuccess('User deleted successfully');
    modal.closeDelete();
    revalidate();
  };

  const columns: Column<TeamUser>[] = useMemo(() => [
    {
      header: 'Name',
      render: (user) => <span className="font-medium text-text-primary">{user.name}</span>,
    },
    {
      header: 'Email',
      render: (user) => <span className="text-text-secondary">{user.email}</span>,
    },
    {
      header: 'Role',
      render: (user) => {
        const style = ROLE_STYLES[user.role] || 'bg-gray-100 text-gray-600';
        return (
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${style}`}>
            {ROLE_LABELS[user.role] || user.role}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      headerClassName: 'pb-3 font-semibold text-text-primary text-right',
      render: (user) => (
        <ActionButtons
          onEdit={() => modal.setEditing(user)}
          onDelete={() => modal.setDeleting(user)}
          editLabel="Edit user"
          deleteLabel="Delete user"
        />
      ),
    },
  ], [modal]);

  if (!authChecked) {
    return <LoadingSpinner />;
  }

  if (!isAdmin) {
    return (
      <Card className="py-10 text-center">
        <p className="text-lg font-medium text-text-primary">Access Denied</p>
        <p className="mt-2 text-sm text-text-secondary">You need administrator privileges to access this page.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Users</h2>
          <p className="mt-1 text-sm text-text-secondary">Manage team members and their roles</p>
        </div>
        <Button onClick={modal.openCreate}>
          <span className="flex items-center gap-1.5">
            <PlusIcon />
            Add User
          </span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.role}
          onChange={(e) => updateFilter('role', e.target.value)}
          className={FILTER_SELECT_CLASSES}
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>

        <span className="text-sm text-text-muted ml-auto">
          {filteredUsers.length} of {userList.length} user{userList.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : userList.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Click &quot;Add User&quot; to create one."
          action={<Button onClick={modal.openCreate}>+ Add User</Button>}
        />
      ) : filteredUsers.length === 0 ? (
        <Card className="py-8 text-center">
          <p className="text-sm text-text-secondary">No users match the selected filter.</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-sm text-accent hover:underline cursor-pointer"
          >
            Clear filter
          </button>
        </Card>
      ) : (
        <DataTable columns={columns} data={filteredUsers} keyExtractor={(u) => u.email} />
      )}

      {/* Create Modal */}
      <UserFormModal
        isOpen={modal.createOpen}
        onClose={modal.closeCreate}
        onSaved={revalidate}
        mode="create"
      />

      {/* Edit Modal */}
      {modal.editing && (
        <UserFormModal
          isOpen={!!modal.editing}
          onClose={modal.closeEdit}
          onSaved={revalidate}
          initialData={modal.editing}
          mode="edit"
        />
      )}

      {/* Delete Confirmation */}
      {modal.deleting && (
        <ConfirmDeleteModal
          isOpen={!!modal.deleting}
          onClose={modal.closeDelete}
          title="Delete User"
          itemName={modal.deleting.name}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
