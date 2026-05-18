'use client';

// ============================================================
// Premium Manager Dashboard Component — AtomQuest Portal
// Gated views, dynamic approvals widgets, and charts comparison
// ============================================================

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, ThumbsUp, TrendingUp, AlertTriangle, CheckCircle,
  Clock, XCircle, FileText, Flame, ArrowRight, Activity, ShieldAlert,
  ThumbsDown, CheckCircle2, MessageSquare, Award
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { getApiClient } from '@/lib/api';
import { KPICard } from '@/components/charts/KPICard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { toast } from 'sonner';
import { formatDate, timeAgo, getUoMLabel } from '@/lib/utils';
import Link from 'next/link';

interface Props { token: string; }

export function ManagerDashboard({ token }: Props) {
  const [data, setData] = useState<any>(null);
  const [pendingGoals, setPendingGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const api = getApiClient(token);
      const [analyticsRes, pendingRes] = await Promise.all([
        api.get('/analytics/manager'),
        api.get('/approvals/pending')
      ]);
      setData(analyticsRes.data);
      setPendingGoals(pendingRes.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const handleQuickApprove = async (goalId: string) => {
    setActionLoading(goalId);
    try {
      await getApiClient(token).post(`/approvals/${goalId}`, { action: 'APPROVE', comment: 'Quick approved from Dashboard' });
      toast.success('Goal approved successfully!');
      // Refresh data
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve goal');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSkeleton count={8} />;
  if (error) return <EmptyState icon={AlertTriangle} title="Dashboard error" description={error} action={{ label: 'Retry', href: '/dashboard' }} />;

  const itemV = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 150, damping: 20 } }
  };

  const statusChartData = (data?.goalStatusDistribution || []).map((d: any) => ({
    name: d.status.charAt(0) + d.status.slice(1).toLowerCase(),
    value: d.count,
  }));

  // Smart computed insights for manager overview
  const totalWeight = pendingGoals.reduce((sum, g) => sum + (g.weightage || 0), 0);

  return (
    <motion.div
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      initial="hidden" animate="show" className="space-y-6"
    >
      {/* Premium Glassmorphic Header */}
      <motion.div variants={itemV} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 glass-premium rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Team Overview Center</h1>
            <span className="bg-indigo-500/10 text-indigo-500 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Manager</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review team alignments, OKR statuses, and approval cues</p>
        </div>
        <Link href="/approvals"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700
                     text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-md shadow-indigo-500/20 hover:scale-[1.02]">
          <ThumbsUp className="w-4 h-4" />
          Review Approvals
          {pendingGoals.length > 0 && (
            <span className="ml-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
              {pendingGoals.length}
            </span>
          )}
        </Link>
      </motion.div>

      {/* Modern KPI row */}
      <motion.div variants={itemV} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Team Members" value={data?.teamSize ?? 0} icon={Users} color="blue" />
        <KPICard title="Pending Sheets" value={pendingGoals.length} icon={ThumbsUp}
          color={pendingGoals.length > 0 ? 'amber' : 'green'} description="Awaiting action" />
        <KPICard title="Team Score Avg" value={`${data?.teamCompletionPercent ?? 0}%`}
          icon={TrendingUp} color="indigo" description="Aggregated progress" />
        <KPICard title="Active Risks" value={data?.delayedSubmissions ?? 0} icon={ShieldAlert}
          color={data?.delayedSubmissions > 0 ? 'red' : 'green'} description="Delays detected" />
      </motion.div>

      {/* Inline Approvals Widget Panel */}
      <AnimatePresence>
        {pendingGoals.length > 0 && (
          <motion.div
            variants={itemV}
            exit={{ opacity: 0, height: 0 }}
            className="glass-premium rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-amber-500" /> Inline Quick Approvals Queue
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Approve submitted employee goal sheets instantly with one click</p>
              </div>
              <Link href="/approvals" className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors uppercase tracking-wider">
                Full review list
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingGoals.slice(0, 2).map((goal) => (
                <div key={goal.id} className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100/50 dark:border-slate-800/40 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-indigo-500">{goal.owner?.name}</div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">{goal.title}</h4>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-medium">
                      <span className="bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded">{goal.thrustArea}</span>
                      <span>Target: {goal.target}</span>
                      <span>Weight: {goal.weightage}%</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleQuickApprove(goal.id)}
                    disabled={actionLoading === goal.id}
                    className="flex-shrink-0 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    {actionLoading === goal.id ? (
                      '...'
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual analytics overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Ring Card */}
        <motion.div variants={itemV} className="glass-premium glass-premium-hover rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-6">Aggregated Team Progress</h3>
          <ProgressRing value={data?.teamCompletionPercent ?? 0} size={180} strokeWidth={12} color="#3b82f6" />
          <div className="mt-6 flex gap-6 text-center select-none text-xs">
            <div>
              <div className="text-slate-400">Team Size</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{data?.teamSize ?? 0} members</div>
            </div>
            <div className="w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <div className="text-slate-400">Total Goals</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{data?.goalStatusDistribution?.reduce((s: number, g: any) => s + g.count, 0) ?? 0} active</div>
            </div>
          </div>
        </motion.div>

        {/* Curved Area Timeline Chart */}
        <motion.div variants={itemV} className="glass-premium glass-premium-hover rounded-2xl p-6 lg:col-span-2 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Quarterly Team Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Comparing historical quarterly team completions</p>
            </div>
          </div>

          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.quarterlyTrend || []} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="teamCurveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-10" vertical={false} />
                <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    color: '#f8fafc'
                  }}
                />
                <Area type="monotone" dataKey="completion" stroke="#3b82f6" strokeWidth={3}
                  fill="url(#teamCurveGrad)" dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#ffffff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Goal status distribution and Performers grid */}
      <motion.div variants={itemV} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Goal Distribution Bar Chart */}
        <div className="glass-premium rounded-2xl p-6 relative overflow-hidden">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6">Cycle Goal Distribution</h3>
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} barSize={36} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-10" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    color: '#f8fafc'
                  }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} name="Goals Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers Card */}
        <div className="glass-premium rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white">Top Team Performers</h3>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          {(data?.topPerformers || []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No performance data available yet.</p>
          ) : (
            <div className="space-y-4">
              {(data?.topPerformers || []).map((p: any, i: number) => (
                <div key={p.userId} className="flex items-center gap-4 p-3 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-slate-100/50 dark:border-slate-800/40">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm
                    ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : 'bg-amber-700'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{p.name}</div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-2">
                      <div className="bg-gradient-to-r from-indigo-500 to-violet-600 h-2 rounded-full transition-all duration-700"
                        style={{ width: `${p.completion}%` }} />
                    </div>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums pl-2">
                    {p.completion}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Delayed Escalations Panel */}
      {(data?.escalations?.length > 0) && (
        <motion.div variants={itemV} className="glass-premium rounded-2xl p-6 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" /> Open Team Escalations
            </h3>
            <Link href="/escalations" className="text-xs font-bold text-rose-500 hover:underline uppercase tracking-wider">
              Manage alerts
            </Link>
          </div>
          <div className="space-y-3">
            {data.escalations.slice(0, 3).map((e: any) => (
              <div key={e.id} className="flex items-start gap-3 p-4 bg-rose-500/5 rounded-xl border border-rose-500/10">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">{e.description}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
