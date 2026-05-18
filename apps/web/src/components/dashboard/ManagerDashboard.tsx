'use client';

// ============================================================
// Manager Dashboard Component
// ============================================================

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, ThumbsUp, TrendingUp, AlertTriangle, CheckCircle,
  Clock, XCircle, FileText,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { getApiClient } from '@/lib/api';
import { KPICard } from '@/components/charts/KPICard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProgressRing } from '@/components/charts/ProgressRing';
import Link from 'next/link';

interface Props { token: string; }

export function ManagerDashboard({ token }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getApiClient(token).get('/analytics/manager')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingSkeleton count={8} />;
  if (error) return <EmptyState icon={AlertTriangle} title="Dashboard error" description={error} action={{ label: 'Retry', href: '/dashboard' }} />;

  const itemV = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const statusChartData = (data?.goalStatusDistribution || []).map((d: any) => ({
    name: d.status.charAt(0) + d.status.slice(1).toLowerCase(),
    value: d.count,
  }));

  return (
    <motion.div
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      initial="hidden" animate="show" className="space-y-6"
    >
      <motion.div variants={itemV} className="page-header">
        <div>
          <div className="page-title">Team Dashboard</div>
          <div className="page-subtitle">Manager view · FY 2025-26</div>
        </div>
        <Link href="/approvals"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700
                     text-white text-sm font-semibold rounded-xl transition-colors">
          <ThumbsUp className="w-4 h-4" />
          Review Approvals
          {data?.pendingApprovals > 0 && (
            <span className="ml-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
              {data.pendingApprovals}
            </span>
          )}
        </Link>
      </motion.div>

      {/* KPI row */}
      <motion.div variants={itemV} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Team Size" value={data?.teamSize ?? 0} icon={Users} color="blue" />
        <KPICard title="Pending Approvals" value={data?.pendingApprovals ?? 0} icon={ThumbsUp}
          color={data?.pendingApprovals > 0 ? 'amber' : 'green'} description="Awaiting review" />
        <KPICard title="Team Completion" value={`${data?.teamCompletionPercent ?? 0}%`}
          icon={TrendingUp} color="indigo" />
        <KPICard title="Delayed Submissions" value={data?.delayedSubmissions ?? 0} icon={AlertTriangle}
          color={data?.delayedSubmissions > 0 ? 'red' : 'green'} />
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemV} className="kpi-card flex flex-col items-center justify-center">
          <h3 className="text-slate-500 text-sm font-medium mb-4">Team Completion</h3>
          <ProgressRing value={data?.teamCompletionPercent ?? 0} size={160} />
        </motion.div>

        <motion.div variants={itemV} className="kpi-card lg:col-span-2">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Quarterly Team Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data?.quarterlyTrend || []}>
              <defs>
                <linearGradient id="teamGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc' }} />
              <Area type="monotone" dataKey="completion" stroke="#3b82f6" strokeWidth={2.5}
                fill="url(#teamGrad)" dot={{ fill: '#3b82f6', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Goal status distribution */}
      <motion.div variants={itemV} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="kpi-card">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Goal Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusChartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc' }} />
              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} name="Goals" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top performers */}
        <div className="kpi-card">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Top Performers</h3>
          {(data?.topPerformers || []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No performance data available yet.</p>
          ) : (
            <div className="space-y-3">
              {(data?.topPerformers || []).map((p: any, i: number) => (
                <div key={p.userId} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                    ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : 'bg-amber-700'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{p.name}</div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1">
                      <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${p.completion}%` }} />
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                    {p.completion}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Open escalations */}
      {(data?.escalations?.length > 0) && (
        <motion.div variants={itemV} className="kpi-card border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Open Escalations
            </h3>
            <Link href="/escalations" className="text-sm text-indigo-600 hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {data.escalations.slice(0, 3).map((e: any) => (
              <div key={e.id} className="flex items-start gap-3 p-3 bg-red-50/50 dark:bg-red-900/10 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{e.description}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
