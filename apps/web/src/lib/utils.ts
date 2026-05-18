import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

/** Merge Tailwind class names safely. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date string to readable format. */
export function formatDate(date: string | Date, fmt = 'dd MMM yyyy'): string {
  if (!date) return 'N/A';
  return format(new Date(date), fmt);
}

/** Format a date to relative time (e.g. "2 hours ago"). */
export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/** Format a number as a percentage string. */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Get initials from a name. */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Get a color for a progress percentage. */
export function getProgressColor(percent: number): string {
  if (percent >= 90) return 'text-green-600';
  if (percent >= 70) return 'text-blue-600';
  if (percent >= 50) return 'text-amber-600';
  return 'text-red-500';
}

/** Get Tailwind color class for a goal status. */
export function getStatusConfig(status: string) {
  const map: Record<string, { label: string; className: string; dot: string }> = {
    DRAFT:     { label: 'Draft',     className: 'status-draft',     dot: 'bg-slate-400' },
    SUBMITTED: { label: 'Submitted', className: 'status-submitted', dot: 'bg-amber-500' },
    APPROVED:  { label: 'Approved',  className: 'status-approved',  dot: 'bg-green-500' },
    REJECTED:  { label: 'Rejected',  className: 'status-rejected',  dot: 'bg-red-500' },
    LOCKED:    { label: 'Locked',    className: 'status-locked',    dot: 'bg-indigo-500' },
    COMPLETED: { label: 'Completed', className: 'status-completed', dot: 'bg-emerald-500' },
  };
  return map[status] || { label: status, className: 'status-draft', dot: 'bg-slate-400' };
}

/** Get UoM label. */
export function getUoMLabel(uom: string): string {
  const map: Record<string, string> = {
    NUMERIC_MAX: 'Numeric (Max ↑)',
    NUMERIC_MIN: 'Numeric (Min ↓)',
    PERCENTAGE:  'Percentage (%)',
    TIMELINE:    'Timeline (Date)',
    ZERO_BASED:  'Zero-Based',
  };
  return map[uom] || uom;
}

/** Truncate text with ellipsis. */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/** Clamp a number between min and max. */
export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/** Generate avatar URL from name. */
export function getAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff&size=64&bold=true`;
}
