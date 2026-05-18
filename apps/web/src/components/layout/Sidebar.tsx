'use client';

// ============================================================
// Sidebar Navigation — AtomQuest Portal
// Role-aware navigation with animated active states
// ============================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Target, CheckSquare, ThumbsUp,
  BarChart3, FileText, Activity, Bell, AlertTriangle,
  Settings, Users, Calendar, Share2, LogOut, Zap,
  ChevronLeft, ChevronRight, Lock,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn, getInitials, getAvatarUrl } from '@/lib/utils';
import { useUIStore } from '@/store';
import Image from 'next/image';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  roles: string[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard',     roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
  { href: '/goals',        icon: Target,           label: 'My Goals',      roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
  { href: '/checkins',     icon: CheckSquare,      label: 'Check-Ins',     roles: ['EMPLOYEE'] },
  { href: '/approvals',    icon: ThumbsUp,         label: 'Approvals',     roles: ['MANAGER', 'ADMIN'] },
  { href: '/analytics',   icon: BarChart3,         label: 'Analytics',     roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
  { href: '/reports',     icon: FileText,          label: 'Reports',       roles: ['MANAGER', 'ADMIN'] },
  { href: '/audit',       icon: Activity,          label: 'Audit Trail',   roles: ['MANAGER', 'ADMIN'] },
  { href: '/notifications',icon: Bell,             label: 'Notifications', roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
  { href: '/escalations', icon: AlertTriangle,     label: 'Escalations',   roles: ['MANAGER', 'ADMIN'] },
  { href: '/shared-goals',icon: Share2,            label: 'Shared Goals',  roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
  { href: '/users',       icon: Users,             label: 'User Mgmt',     roles: ['ADMIN'] },
  { href: '/cycles',      icon: Calendar,          label: 'Cycles',        roles: ['ADMIN'] },
];

interface SidebarProps {
  user: { name?: string | null; email?: string | null; role?: string };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const userRole = user.role || 'EMPLOYEE';

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 240 : 72 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex-shrink-0 h-screen bg-[hsl(var(--sidebar-bg))] flex flex-col
                 border-r border-[hsl(var(--sidebar-border))] relative z-20 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[hsl(var(--sidebar-border))]">
        <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg
                       flex items-center justify-center shadow-lg">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="min-w-0"
            >
              <div className="text-white font-bold text-base leading-tight truncate">AtomQuest</div>
              <div className="text-indigo-300/70 text-[10px] truncate">Goal & Performance Portal</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  'nav-item group relative',
                  isActive ? 'nav-item-active' : 'nav-item-inactive',
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-white' : 'text-indigo-300 group-hover:text-white',
                )} />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="truncate text-sm"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full -ml-3"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="p-3 border-t border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
          <img
            src={getAvatarUrl(user.name || 'User')}
            alt={user.name || 'User'}
            className="w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-indigo-500/30"
          />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <div className="text-white text-sm font-medium truncate">{user.name}</div>
                <div className="text-indigo-300/70 text-xs truncate">{userRole}</div>
              </motion.div>
            )}
          </AnimatePresence>
          {sidebarOpen && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-indigo-300/60 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute top-6 -right-3 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200
                   dark:border-slate-700 rounded-full flex items-center justify-center shadow-md
                   text-slate-500 hover:text-slate-700 transition-colors z-10"
      >
        {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}
