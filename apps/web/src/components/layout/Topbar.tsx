'use client';

// ============================================================
// Topbar — search, notifications, theme toggle, user menu
// ============================================================

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bell, Moon, Sun, Search, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cn, getAvatarUrl, timeAgo } from '@/lib/utils';
import { useNotificationStore } from '@/store';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/goals':         'My Goals',
  '/checkins':      'Quarterly Check-Ins',
  '/approvals':     'Approval Queue',
  '/analytics':    'Analytics',
  '/reports':      'Reports',
  '/audit':        'Audit Trail',
  '/notifications':'Notifications',
  '/escalations':  'Escalations',
  '/users':        'User Management',
  '/cycles':       'Reporting Cycles',
  '/shared-goals': 'Shared Goals',
};

interface TopbarProps {
  user: { name?: string | null; email?: string | null; role?: string };
}

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const { unreadCount } = useNotificationStore();

  const pageTitle = PAGE_TITLES[pathname] ||
    Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ||
    'AtomQuest';

  // Close menus on outside click
  useEffect(() => {
    const handler = () => { setShowUserMenu(false); setShowNotifMenu(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <header className="h-16 flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100
                       dark:border-slate-800 flex items-center justify-between px-6 z-10">
      {/* Left: page title + breadcrumb */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{pageTitle}</h1>
        <div className="text-xs text-slate-400">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400
                     hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </motion.button>

        {/* Notification bell */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); setShowNotifMenu(!showNotifMenu); setShowUserMenu(false); }}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400
                       hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white
                           text-[9px] flex items-center justify-center font-bold"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </motion.button>

          {showNotifMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 rounded-xl
                         shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs text-indigo-600 font-medium">{unreadCount} unread</span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                <div className="p-3 text-center text-sm text-slate-400 py-8">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <Link href="/notifications" className="text-indigo-600 hover:underline" onClick={() => setShowNotifMenu(false)}>
                    View all notifications →
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); setShowNotifMenu(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100
                       dark:hover:bg-slate-800 transition-colors"
          >
            <img
              src={getAvatarUrl(user.name || 'User')}
              alt={user.name || 'User'}
              className="w-7 h-7 rounded-lg"
            />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                {user.name}
              </div>
              <div className="text-[10px] text-slate-400">{user.role}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </motion.button>

          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-12 w-52 bg-white dark:bg-slate-900 rounded-xl
                         shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
            >
              <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                <div className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</div>
                <div className="text-xs text-slate-400 truncate">{user.email}</div>
              </div>
              <div className="p-1.5 space-y-0.5">
                <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-700
                                   dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <User className="w-4 h-4" /> Profile
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-600
                             hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}
