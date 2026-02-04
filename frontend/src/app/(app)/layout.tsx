'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import CreateProjectModal from '@/features/projects/components/CreateProjectModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

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
        <main className="p-4 lg:p-8">{children}</main>
      </div>

      <CreateProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => setCreateModalOpen(false)}
      />
    </div>
  );
}
