'use client';

import { useEffect, useState } from 'react';
import { api, type Project, type TeamUser } from '@/lib/api';
import { useAlerts } from '@/context/AlertContext';
import { handleApiError } from '@/hooks';
import { Button, Select, Modal } from '@/components/ui';

interface AddMemberModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function AddMemberModal({ project, isOpen, onClose, onUpdated }: AddMemberModalProps) {
  const { showSuccess, showError } = useAlerts();
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function fetchUsers() {
      setLoadingUsers(true);
      try {
        const data = await api.getAllUsers();
        if (!cancelled) setUsers(data.users);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    }

    fetchUsers();
    setSelectedEmail('');
    return () => { cancelled = true; };
  }, [isOpen]);

  const existingEmails = new Set((project.members || []).map((m) => m.email));
  const availableUsers = users.filter((u) => !existingEmails.has(u.email));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail) return;

    const user = users.find((u) => u.email === selectedEmail);
    if (!user) return;

    setLoading(true);
    try {
      await api.addProjectMember(project.projectId, {
        email: user.email,
        name: user.name,
        role: user.role,
      });
      showSuccess('Member added successfully');
      onUpdated();
      onClose();
    } catch (err) {
      handleApiError(err, showError, 'adding member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Team Member" maxWidth="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          id="member-select"
          label="Select Member"
          value={selectedEmail}
          onChange={(e) => setSelectedEmail(e.target.value)}
          disabled={loadingUsers}
          placeholder={loadingUsers ? 'Loading users...' : 'Select a team member'}
        >
          {availableUsers.map((user) => (
            <option key={user.email} value={user.email}>
              {user.name} — {user.role.replace('_', ' ')}
            </option>
          ))}
        </Select>
        {!loadingUsers && availableUsers.length === 0 && (
          <p className="text-xs text-text-muted">All users are already members of this project.</p>
        )}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} disabled={!selectedEmail}>
            {loading ? 'Adding...' : 'Add Member'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
