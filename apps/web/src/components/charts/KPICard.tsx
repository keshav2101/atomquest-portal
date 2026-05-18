'use client';

// ============================================================
// Reusable KPI Card Component
// ============================================================

import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type Color = 'indigo' | 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'emerald';
type Trend = 'up' | 'down' | 'neutral';

const colorMap: Record<Color, { icon: string; bg: string; text: string }> = {
  indigo:  { icon: 'text-indigo-600 dark:text-indigo-400',  bg: 'bg-indigo-50 dark:bg-indigo-900/20',  text: 'text-indigo-600' },
  blue:    { icon: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-600' },
  green:   { icon: 'text-green-600 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-900/20',   text: 'text-green-600' },
  amber:   { icon: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-600' },
  red:     { icon: 'text-red-600 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-600' },
  violet:  { icon: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600' },
  emerald: { icon: 'text-emerald-600 dark:text-emerald-400',bg: 'bg-emerald-50 dark:bg-emerald-900/20',text: 'text-emerald-600' },
};

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: Color;
  trend?: Trend;
  trendValue?: string;
  description?: string;
  loading?: boolean;
}

export function KPICard({
  title, value, icon: Icon, color = 'indigo', trend, trendValue, description, loading,
}: KPICardProps) {
  const colors = colorMap[color];

  if (loading) {
    return (
      <div className="kpi-card">
        <div className="skeleton h-4 w-24 mb-3" />
        <div className="skeleton h-8 w-16 mb-2" />
        <div className="skeleton h-3 w-20" />
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="kpi-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">{value}</p>
          {description && (
            <p className="text-xs text-slate-400 mt-1">{description}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs font-medium',
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400',
            )}>
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              {trend === 'neutral' && <Minus className="w-3 h-3" />}
              {trendValue && <span>{trendValue}</span>}
            </div>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3', colors.bg)}>
          <Icon className={cn('w-5 h-5', colors.icon)} />
        </div>
      </div>
    </motion.div>
  );
}
