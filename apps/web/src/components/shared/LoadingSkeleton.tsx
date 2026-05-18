'use client';

// ============================================================
// Loading Skeleton Component
// ============================================================

import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  count?: number;
  className?: string;
  type?: 'card' | 'table' | 'list';
}

export function LoadingSkeleton({ count = 4, className, type = 'card' }: LoadingSkeletonProps) {
  if (type === 'table') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="skeleton h-10 w-full" />
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton h-14 w-full" />
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl">
            <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
            <div className="skeleton h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-4 w-24" />
        </div>
        <div className="skeleton h-10 w-28 rounded-xl" />
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800">
            <div className="skeleton h-4 w-24 mb-3" />
            <div className="skeleton h-8 w-16 mb-2" />
            <div className="skeleton h-3 w-20" />
          </div>
        ))}
      </div>
      {/* Content cards */}
      {Array.from({ length: Math.max(1, count - 4) }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800">
          <div className="skeleton h-5 w-40 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="skeleton h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
