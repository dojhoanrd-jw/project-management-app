'use client';

import { useState } from 'react';
import { api, type Project } from '@/lib/api';
import { useAlerts } from '@/context/AlertContext';
import { Card, Button } from '@/components/ui';
import AddMemberModal from './AddMemberModal';

interface ProjectMembersProps {
  project: Project;
  onUpdated: () => void;
}

export default function ProjectMembers({ project, onUpdated }: ProjectMembersProps) {
  const { showSuccess, showError } = useAlerts();
  const [addOpen, setAddOpen] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  const members = project.members || [];

  const handleRemove = async (email: string) => {
    setRemovingEmail(email);
    try {
      await api.removeProjectMember(project.projectId, email);
      showSuccess('Member removed');
      onUpdated();
    } catch {
      showError('Failed to remove member');
    } finally {
      setRemovingEmail(null);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">Team Members</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted">{members.length} member{members.length !== 1 ? 's' : ''}</span>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
                Add Member
              </span>
            </Button>
          </div>
        </div>

        <div className="border-t border-border" />

        {members.length === 0 ? (
          <Card className="py-8 text-center">
            <p className="text-sm text-text-secondary">No members in this project yet.</p>
            <p className="mt-1 text-xs text-text-muted">Click &quot;Add Member&quot; to get started.</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <Card key={member.email} padding="sm" className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-light text-sm font-semibold text-accent">
                  {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{member.name}</p>
                  <p className="text-xs text-text-muted capitalize">{member.role.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={() => handleRemove(member.email)}
                  disabled={removingEmail === member.email}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
                  title="Remove member"
                >
                  {removingEmail === member.email ? (
                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AddMemberModal
        project={project}
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onUpdated={onUpdated}
      />
    </>
  );
}
