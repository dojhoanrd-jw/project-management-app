'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { ErrorBoundary } from '@/components/ui';
import CreateProjectModal from '@/features/projects/components/CreateProjectModal';
import { storage } from '@/lib/storage';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    const token = storage.getToken();
    if (!token) {
      router.replace('/');
      return;
    }
    setAuthenticated(true);
  }, [router]);

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        onCreateProject={() => setCreateModalOpen(true)}
      />
      <div className={`transition-all duration-200 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-60'}`}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-8">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>

      <CreateProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => { setCreateModalOpen(false); mutate('/projects'); }}
      />
    </div>
  );
}
