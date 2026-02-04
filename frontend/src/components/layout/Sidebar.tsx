'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCreateProject: () => void;
}

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    href: '/projects',
    label: 'Projects',
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    ),
  },
  {
    href: '/tasks',
    label: 'Tasks',
    icon: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse, onCreateProject }: SidebarProps) {
  const pathname = usePathname();

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
          <svg
            className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
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
          <svg className="h-5 w-5 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {!collapsed && <span>Create new project</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className={`mt-10 flex flex-1 flex-col gap-2 ${collapsed ? 'px-3' : 'px-4'}`}>
        {NAV_ITEMS.map((item) => {
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
        {/* Help button */}
        <button
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white cursor-pointer hover:bg-accent-hover transition-colors"
          aria-label="Help"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18.75h.008v.008H12v-.008z" />
          </svg>
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
