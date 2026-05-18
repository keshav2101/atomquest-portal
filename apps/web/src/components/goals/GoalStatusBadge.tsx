'use client';

import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  DRAFT:     { label: 'Draft',     className: 'status-badge status-draft',     dot: 'bg-slate-400' },
  SUBMITTED: { label: 'Submitted', className: 'status-badge status-submitted', dot: 'bg-amber-500' },
  APPROVED:  { label: 'Approved',  className: 'status-badge status-approved',  dot: 'bg-green-500' },
  REJECTED:  { label: 'Rejected',  className: 'status-badge status-rejected',  dot: 'bg-red-500' },
  LOCKED:    { label: 'Locked',    className: 'status-badge status-locked',    dot: 'bg-indigo-500' },
  COMPLETED: { label: 'Completed', className: 'status-badge status-completed', dot: 'bg-emerald-500' },
};

export function GoalStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'status-badge status-draft', dot: 'bg-slate-400' };
  return (
    <span className={config.className}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}
