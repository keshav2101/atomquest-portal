'use client';

// ============================================================
// Employee Dashboard Component
// ============================================================

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target, CheckCircle, Clock, TrendingUp, AlertCircle, Lock, FileText, Bell,
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { getApiClient } from '@/lib/api';
import { KPICard } from '@/components/charts/KPICard';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { GoalStatusBadge } from '@/components/goals/GoalStatusBadge';
import { formatDate, timeAgo } from '@/lib/utils';
import Link from 'next/link';

interface Props { token: string; }

export function EmployeeDashboard({ token }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const api = getApiClient(token);
    api.get('/analytics/employee')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingSkeleton count={8} />;
  if (error) return (
    <EmptyState
      icon={AlertCircle}
      title="Failed to load dashboard"
      description={error}
      action={{ label: 'Retry', href: '/dashboard' }}
    />
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Page header */}
      <motion.div variants={itemVariants} className="page-header">
        <div>
          <div className="page-title">My Dashboard</div>
          <div className="page-subtitle">FY 2025-26 · Q4 in progress</div>
        </div>
        <Link
          href="/goals/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700
                     text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-500/30"
        >
          <Target className="w-4 h-4" /> New Goal
        </Link>
      </motion.div>

      {/* KPI cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Overall Progress"
          value={`${data?.completionPercent ?? 0}%`}
          icon={TrendingUp}
          color="indigo"
          trend={data?.completionPercent >= 70 ? 'up' : 'neutral'}
          description="Weighted avg"
        />
        <KPICard
          title="Total Goals"
          value={data?.totalGoals ?? 0}
          icon={Target}
          color="blue"
          description={`${data?.approvedGoals} approved`}
        />
        <KPICard
          title="Pending Check-ins"
          value={data?.pendingCheckins ?? 0}
          icon={Clock}
          color={data?.pendingCheckins > 0 ? 'amber' : 'green'}
          description="Active quarter"
        />
        <KPICard
          title="Notifications"
          value={data?.recentNotifications?.filter((n: any) => !n.isRead).length ?? 0}
          icon={Bell}
          color="violet"
          description="Unread"
        />
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress ring */}
        <motion.div variants={itemVariants} className="kpi-card flex flex-col items-center justify-center">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-4">Goal Completion</h3>
          <ProgressRing value={data?.completionPercent ?? 0} size={160} />
          <div className="mt-4 text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {data?.completionPercent ?? 0}%
            </div>
            <div className="text-sm text-slate-400 mt-1">Overall progress</div>
          </div>
        </motion.div>

        {/* Quarterly trend */}
        <motion.div variants={itemVariants} className="kpi-card lg:col-span-2">
          <h3 className="text-slate-700 dark:text-slate-300 font-semibold mb-4">Quarterly Progress Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data?.quarterlyTrend || []}>
              <defs>
                <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc' }}
                formatter={(v: any) => [`${v}%`, 'Progress']}
              />
              <Area
                type="monotone"
                dataKey="completion"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#colorCompletion)"
                dot={{ fill: '#6366f1', r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Goal status breakdown */}
      <motion.div variants={itemVariants} className="kpi-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">Goal Status Overview</h3>
          <Link href="/goals" className="text-sm text-indigo-600 hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Draft', count: data?.draftGoals ?? 0, color: 'bg-slate-100 text-slate-700', icon: FileText },
            { label: 'Submitted', count: data?.submittedGoals ?? 0, color: 'bg-amber-50 text-amber-700', icon: Clock },
            { label: 'Approved', count: data?.approvedGoals ?? 0, color: 'bg-green-50 text-green-700', icon: CheckCircle },
            { label: 'Locked', count: 0, color: 'bg-indigo-50 text-indigo-700', icon: Lock },
          ].map((item) => (
            <div key={item.label} className={`${item.color} rounded-xl p-4 text-center`}>
              <item.icon className="w-5 h-5 mx-auto mb-2 opacity-70" />
              <div className="text-2xl font-bold">{item.count}</div>
              <div className="text-xs font-medium mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent notifications */}
      {data?.recentNotifications?.length > 0 && (
        <motion.div variants={itemVariants} className="kpi-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Notifications</h3>
            <Link href="/notifications" className="text-sm text-indigo-600 hover:underline">See all →</Link>
          </div>
          <div className="space-y-3">
            {data.recentNotifications.slice(0, 4).map((notif: any) => (
              <div key={notif.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors
                ${!notif.isRead ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0
                  ${notif.isRead ? 'bg-slate-300' : 'bg-indigo-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{notif.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{notif.message}</div>
                </div>
                <div className="text-xs text-slate-400 flex-shrink-0">{timeAgo(notif.createdAt)}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
