'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import {
  DashboardIcon,
  FolderIcon,
  TasksIcon,
  UsersIcon,
  SettingsIcon,
  ChevronLeftIcon,
  PlusIcon,
  HelpIcon,
} from '@/components/icons';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCreateProject: () => void;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { href: '/projects', label: 'Projects', icon: <FolderIcon /> },
  { href: '/tasks', label: 'Tasks', icon: <TasksIcon /> },
  { href: '/users', label: 'Users', adminOnly: true, icon: <UsersIcon /> },
  { href: '/settings', label: 'Settings', icon: <SettingsIcon /> },
];

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse, onCreateProject }: SidebarProps) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setIsAdmin(user?.role === 'admin');
  }, []);

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if ('adminOnly' in item && item.adminOnly) return isAdmin;
    return true;
  });

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-60';

  const navContent = (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo + Collapse toggle */}
      <div className={`relative mt-2 flex h-16 items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-5'}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
          <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
          </svg>
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold text-sidebar-text-active">PM</span>
        )}
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3.5 top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white text-text-secondary shadow-md transition-colors hover:bg-surface-hover cursor-pointer lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeftIcon className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Create new project button */}
      <div className={`mt-8 ${collapsed ? 'px-3' : 'px-4'}`}>
        <button
          onClick={onCreateProject}
          className={`
            flex w-full items-center gap-3 rounded-full bg-white py-2.5 text-sm font-medium
            text-text-primary shadow-sm transition-colors hover:bg-surface-hover cursor-pointer
            ${collapsed ? 'justify-center px-0' : 'px-4'}
          `}
        >
          <PlusIcon className="h-5 w-5 shrink-0 text-accent" />
          {!collapsed && <span>Create new project</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className={`mt-10 flex flex-1 flex-col gap-2 ${collapsed ? 'px-3' : 'px-4'}`}>
        {visibleNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={`
                flex items-center gap-3 rounded-full py-2.5 text-sm font-medium transition-all
                ${collapsed ? 'justify-center px-0' : 'px-4'}
                ${isActive
                  ? 'bg-white text-accent shadow-sm'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
                }
              `}
            >
              {item.icon}
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className={`mb-4 flex flex-col gap-2 ${collapsed ? 'items-center px-3' : 'px-4'}`}>
        <button
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white cursor-pointer hover:bg-accent-hover transition-colors"
          aria-label="Help"
        >
          <HelpIcon />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 hidden h-screen transition-all duration-200 lg:block ${sidebarWidth}`}
      >
        {navContent}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <aside className="fixed left-0 top-0 h-screen w-60 animate-slide-in">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
