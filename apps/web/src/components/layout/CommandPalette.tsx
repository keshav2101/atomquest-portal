'use client';

// ============================================================
// Global Command Palette — Linear & Vercel Inspired UX
// Triggered globally via Cmd+K or Ctrl+K
// ============================================================

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Target, ThumbsUp, BarChart3, FileText,
  Activity, Bell, AlertTriangle, Users, Calendar,
  Share2, Zap, HelpCircle, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  shortcut?: string[];
  action: () => void;
  category: 'Pages' | 'Actions' | 'Help';
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setActiveIndex(0);
      setQuery('');
    }
  }, [open]);

  const commands: CommandItem[] = [
    {
      id: 'dashboard',
      title: 'Go to Dashboard',
      description: 'View your overall stats, progress trend and metrics',
      icon: Zap,
      shortcut: ['G', 'D'],
      action: () => { router.push('/dashboard'); setOpen(false); },
      category: 'Pages'
    },
    {
      id: 'goals',
      title: 'View My Goals',
      description: 'Browse, filter and update your active OKRs',
      icon: Target,
      shortcut: ['G', 'G'],
      action: () => { router.push('/goals'); setOpen(false); },
      category: 'Pages'
    },
    {
      id: 'checkins',
      title: 'Quarterly Check-Ins',
      description: 'Start or update your Q4 progress report sheet',
      icon: Activity,
      shortcut: ['G', 'C'],
      action: () => { router.push('/checkins'); setOpen(false); },
      category: 'Pages'
    },
    {
      id: 'approvals',
      title: 'Approvals Queue',
      description: 'Review pending goal approvals (Managers/Admin)',
      icon: ThumbsUp,
      shortcut: ['G', 'A'],
      action: () => { router.push('/approvals'); setOpen(false); },
      category: 'Pages'
    },
    {
      id: 'analytics',
      title: 'Goal Analytics & Charts',
      description: 'Explore team completion heatmaps and radar charts',
      icon: BarChart3,
      action: () => { router.push('/analytics'); setOpen(false); },
      category: 'Pages'
    },
    {
      id: 'reports',
      title: 'Export Reports',
      description: 'Download goals and performance logs as CSV',
      icon: FileText,
      action: () => { router.push('/reports'); setOpen(false); },
      category: 'Actions'
    },
    {
      id: 'audit',
      title: 'System Audit Logs',
      description: 'View enterprise-grade event stream and history',
      icon: Activity,
      action: () => { router.push('/audit'); setOpen(false); },
      category: 'Pages'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Open recent inbox activities and manager alerts',
      icon: Bell,
      action: () => { router.push('/notifications'); setOpen(false); },
      category: 'Pages'
    },
    {
      id: 'users',
      title: 'Manage Portal Users',
      description: 'Admin view: Edit role mappings and team structures',
      icon: Users,
      action: () => { router.push('/users'); setOpen(false); },
      category: 'Pages'
    },
    {
      id: 'cycles',
      title: 'Configure Reporting Cycles',
      description: 'Admin view: Set up quarterly timelines and gates',
      icon: Calendar,
      action: () => { router.push('/cycles'); setOpen(false); },
      category: 'Pages'
    },
    {
      id: 'shared-goals',
      title: 'Departmental Shared Goals',
      description: 'See alignable targets across the company',
      icon: Share2,
      action: () => { router.push('/shared-goals'); setOpen(false); },
      category: 'Pages'
    },
    {
      id: 'create-goal',
      title: 'Create a New Goal...',
      description: 'Launch the beautiful interactive multi-step wizard',
      icon: Target,
      shortcut: ['C', 'G'],
      action: () => {
        setOpen(false);
        // Dispatch custom event to trigger wizard launch globally
        window.dispatchEvent(new CustomEvent('launch-goal-wizard'));
      },
      category: 'Actions'
    },
    {
      id: 'escalations',
      title: 'Goal Escalations Tracker',
      description: 'Monitor targets that are at risk or delayed',
      icon: AlertTriangle,
      action: () => { router.push('/escalations'); setOpen(false); },
      category: 'Pages'
    },
    {
      id: 'help-docs',
      title: 'Search Help Documentation',
      description: 'Learn how weights and UoMs calculate overall scores',
      icon: HelpCircle,
      action: () => { window.open('https://atomberg.com', '_blank'); setOpen(false); },
      category: 'Help'
    }
  ];

  const filtered = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const categories = ['Pages', 'Actions', 'Help'] as const;

  // Handle keyboard list navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[activeIndex]) {
          filtered[activeIndex].action();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filtered, activeIndex]);

  // Keep active item scrolled into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  return (
    <>
      {/* Global Shortcut Help Key */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-10 px-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-full shadow-2xl flex items-center gap-2 text-xs font-semibold hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search actions</span>
        <div className="flex gap-0.5 ml-1">
          <span className="keycap !bg-slate-800 dark:!bg-slate-200 !text-slate-200 dark:!text-slate-800 !border-slate-700 dark:!border-slate-300">⌘</span>
          <span className="keycap !bg-slate-800 dark:!bg-slate-200 !text-slate-200 dark:!text-slate-800 !border-slate-700 dark:!border-slate-300">K</span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <div className="flex min-h-screen items-start justify-center p-4 pt-[12vh]">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                className="w-full max-w-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl overflow-hidden flex flex-col z-10"
              >
                {/* Search Header */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200/50 dark:border-slate-800/50">
                  <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setActiveIndex(0);
                    }}
                    placeholder="Type a command or page name..."
                    className="w-full bg-transparent border-none text-sm text-slate-950 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  />
                  <div className="flex items-center gap-0.5">
                    <span className="keycap">esc</span>
                  </div>
                </div>

                {/* Commands List */}
                <div ref={listRef} className="max-h-[360px] overflow-y-auto p-2 space-y-2">
                  {filtered.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-30 animate-pulse" />
                      <span>No matching commands found.</span>
                    </div>
                  ) : (
                    categories.map((category) => {
                      const categoryCommands = filtered.filter((cmd) => cmd.category === category);
                      if (categoryCommands.length === 0) return null;

                      return (
                        <div key={category} className="space-y-1">
                          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {category}
                          </div>
                          {categoryCommands.map((cmd) => {
                            const absoluteIndex = filtered.indexOf(cmd);
                            const isSelected = activeIndex === absoluteIndex;

                            return (
                              <button
                                key={cmd.id}
                                data-active={isSelected}
                                onClick={cmd.action}
                                onMouseEnter={() => setActiveIndex(absoluteIndex)}
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150",
                                  isSelected
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 -translate-x-0.5"
                                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                )}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                    isSelected
                                      ? "bg-white/20 text-white"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                  )}>
                                    <cmd.icon className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold truncate leading-none mb-1">
                                      {cmd.title}
                                    </div>
                                    <div className={cn(
                                      "text-xs truncate leading-none",
                                      isSelected ? "text-indigo-100" : "text-slate-400"
                                    )}>
                                      {cmd.description}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {cmd.shortcut ? (
                                    cmd.shortcut.map((key, i) => (
                                      <span
                                        key={i}
                                        className={cn(
                                          "keycap text-[9px]",
                                          isSelected && "!bg-white/20 !border-white/10 !text-white"
                                        )}
                                      >
                                        {key}
                                      </span>
                                    ))
                                  ) : (
                                    isSelected && (
                                      <motion.div
                                        initial={{ opacity: 0, x: -4 }}
                                        animate={{ opacity: 1, x: 0 }}
                                      >
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </motion.div>
                                    )
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer hints */}
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400 font-medium select-none">
                  <div className="flex items-center gap-1.5">
                    <span>Use arrows</span>
                    <span className="keycap">↑</span>
                    <span className="keycap">↓</span>
                    <span>to navigate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Press</span>
                    <span className="keycap">enter</span>
                    <span>to select</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
