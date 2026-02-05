'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { IconButton } from '@/components/ui';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { PAGE_TITLES } from '@/lib/constants';
import {
  MenuIcon,
  SearchIcon,
  BellIcon,
  ChevronDownIcon,
  LogoutIcon,
} from '@/components/icons';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setUserName(user?.name || '');
    setUserRole(user?.role || '');
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const title = PAGE_TITLES[pathname] || 'Dashboard';

  const handleLogout = () => {
    storage.clearSession();
    router.push('/');
  };

  const initials = userName
    ? userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between bg-bg px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover lg:hidden cursor-pointer"
          aria-label="Toggle menu"
        >
          <MenuIcon />
        </button>
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search bar */}
        <div className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm sm:flex">
          <SearchIcon className="h-4 w-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search for anything..."
            className="w-44 bg-transparent text-sm text-text-primary placeholder:text-text-secondary outline-none"
          />
        </div>

        <IconButton icon={<BellIcon />} label="Notifications" />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 shadow-sm transition-colors hover:bg-surface-hover cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-tight text-text-primary">{userName}</p>
              <p className="text-xs leading-tight text-text-secondary capitalize">{userRole.replace('_', ' ')}</p>
            </div>
            <ChevronDownIcon className={`h-4 w-4 text-text-secondary transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white py-1 shadow-lg">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <LogoutIcon className="h-4 w-4 text-text-secondary" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
