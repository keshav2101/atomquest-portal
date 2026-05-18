'use client';

// ============================================================
// Premium Employee Dashboard Component — AtomQuest Portal
// Feature-packed, fully responsive, glassmorphic UX
// ============================================================

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, CheckCircle, Clock, TrendingUp, AlertCircle, Lock, FileText, Bell,
  Brain, Sparkles, Zap, Award, Flame, ArrowRight, HelpCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getApiClient } from '@/lib/api';
import { KPICard } from '@/components/charts/KPICard';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate, timeAgo } from '@/lib/utils';
import Link from 'next/link';

interface Props { token: string; }

export function EmployeeDashboard({ token }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAiTip, setShowAiTip] = useState(true);

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
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 150 } },
  };

  // Dynamically compute AI productivity recommendations based on goal metrics
  const getAiRecommendations = () => {
    const recs = [];
    if ((data?.draftGoals ?? 0) > 0) {
      recs.push({
        text: `You have ${data.draftGoals} draft OKR${data.draftGoals > 1 ? 's' : ''}. Submit them to your manager soon for cycle locking.`,
        type: 'action',
        color: 'text-amber-500'
      });
    }
    if ((data?.pendingCheckins ?? 0) > 0) {
      recs.push({
        text: `Active quarter requires check-in updates for ${data.pendingCheckins} goal${data.pendingCheckins > 1 ? 's' : ''}. Keep your streak alive!`,
        type: 'warning',
        color: 'text-rose-500'
      });
    }
    if ((data?.completionPercent ?? 0) < 60) {
      recs.push({
        text: `Your overall progress is currently at ${data.completionPercent}%. Focus on high-weightage targets to maximize performance score.`,
        type: 'insight',
        color: 'text-indigo-400'
      });
    } else {
      recs.push({
        text: `Top performer pace! Overall score at ${data.completionPercent}% completes 90% of your targets. Maintain this momentum.`,
        type: 'success',
        color: 'text-emerald-400'
      });
    }
    return recs;
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      
      {/* Dynamic Glass Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 glass-premium rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome back, Employee</h1>
            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 text-xs px-2.5 py-0.5 rounded-full font-bold">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>Streak: 4w</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">FY 2025-26 · Q4 Performance Assessment active</p>
        </div>
        <Link
          href="/goals"
          onClick={() => {
            // Wait slightly and launch creation modal
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('launch-goal-wizard'));
            }, 100);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700
                     text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-95"
        >
          <Target className="w-4 h-4" /> New Goal Sheet
        </Link>
      </motion.div>

      {/* AI-powered Productivity Panel */}
      <AnimatePresence>
        {showAiTip && (
          <motion.div
            variants={itemVariants}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 relative rounded-2xl glass-premium border-indigo-500/20 dark:border-indigo-500/10 neon-glow-indigo overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl rounded-full -mr-8 -mt-8" />
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-md">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">AI Copilot Insights</span>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div className="mt-2 space-y-2">
                  {getAiRecommendations().map((rec, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                      <span>{rec.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowAiTip(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* High-Fidelity KPI stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Overall Progress"
          value={`${data?.completionPercent ?? 0}%`}
          icon={TrendingUp}
          color="indigo"
          trend={data?.completionPercent >= 70 ? 'up' : 'neutral'}
          trendValue="+4.2% QoQ"
          description="Weighted performance avg"
        />
        <KPICard
          title="Goal Sheet Count"
          value={data?.totalGoals ?? 0}
          icon={Target}
          color="blue"
          description={`${data?.approvedGoals ?? 0} active & approved`}
        />
        <KPICard
          title="Check-ins Gated"
          value={data?.pendingCheckins ?? 0}
          icon={Clock}
          color={data?.pendingCheckins > 0 ? 'amber' : 'green'}
          description="Awaiting updates"
        />
        <KPICard
          title="Streaks & Achievements"
          value="Level 3"
          icon={Award}
          color="violet"
          description="Top 15% in Department"
        />
      </motion.div>

      {/* Interactive visualizer panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Neon Progress Ring card */}
        <motion.div variants={itemVariants} className="glass-premium glass-premium-hover rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-600 opacity-80" />
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-6">Weighted Score Summary</h3>
          <div className="relative">
            <ProgressRing value={data?.completionPercent ?? 0} size={180} strokeWidth={12} color="#6366f1" />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Overall score</span>
            </div>
          </div>
          <div className="mt-6 flex gap-6 text-center select-none">
            <div>
              <div className="text-xs text-slate-400">Total Weight</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">100%</div>
            </div>
            <div className="w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <div className="text-xs text-slate-400">Target Year</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">2026</div>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Curved Area Chart */}
        <motion.div variants={itemVariants} className="glass-premium glass-premium-hover rounded-2xl p-6 lg:col-span-2 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Quarterly Score History</h3>
              <p className="text-xs text-slate-400 mt-0.5">Performance index timeline tracking</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-500/10 text-indigo-500 px-2.5 py-1 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Steady Climb</span>
            </div>
          </div>
          
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.quarterlyTrend || []} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreTimelineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
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
                    color: '#f8fafc',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                  }}
                  formatter={(v: any) => [`${v}%`, 'Performance Score']}
                />
                <Area
                  type="monotone"
                  dataKey="completion"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fill="url(#scoreTimelineGrad)"
                  dot={{ fill: '#6366f1', r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 7, strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Goal status grid */}
      <motion.div variants={itemVariants} className="glass-premium rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Goal Matrix Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Breakdown of targets by locking cycle status</p>
          </div>
          <Link href="/goals" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors uppercase tracking-wider">
            <span>Manage Sheets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Draft Mode', count: data?.draftGoals ?? 0, color: 'from-slate-500/10 to-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800', icon: FileText, desc: 'Not submitted yet' },
            { label: 'In Review', count: data?.submittedGoals ?? 0, color: 'from-amber-500/10 to-amber-500/20 text-amber-600 border-amber-200 dark:border-amber-900/30', icon: Clock, desc: 'Awaiting lock' },
            { label: 'Locked & Active', count: data?.approvedGoals ?? 0, color: 'from-emerald-500/10 to-emerald-500/20 text-emerald-600 border-emerald-200 dark:border-emerald-900/30', icon: CheckCircle, desc: 'Prisma tracked' },
            { label: 'Cycle Blocked', count: 0, color: 'from-indigo-500/10 to-indigo-500/20 text-indigo-600 border-indigo-200 dark:border-indigo-900/30', icon: Lock, desc: 'Locked' },
          ].map((item) => (
            <div key={item.label} className={`bg-gradient-to-br ${item.color} border rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:scale-[1.01]`}>
              <item.icon className="w-5 h-5 opacity-60 mb-3" />
              <div className="text-3xl font-extrabold tracking-tight tabular-nums">{item.count}</div>
              <div className="text-xs font-bold mt-1">{item.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Notifications and system activities */}
      {data?.recentNotifications?.length > 0 && (
        <motion.div variants={itemVariants} className="glass-premium rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Active System Activity Inbox</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time alerts via Server-Sent Events (SSE)</p>
            </div>
            <Link href="/notifications" className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors uppercase tracking-wider">
              Inbox Archive
            </Link>
          </div>
          
          <div className="space-y-2">
            {data.recentNotifications.slice(0, 4).map((notif: any) => (
              <div key={notif.id} className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-900/40 border border-slate-100/50 dark:border-slate-800/40
                ${!notif.isRead ? 'bg-indigo-500/5 border-indigo-500/10' : ''}`}>
                <div className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0
                  ${notif.isRead ? 'bg-slate-300 dark:bg-slate-700' : 'bg-indigo-500 shadow-md shadow-indigo-500/50 animate-pulse'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-950 dark:text-white">{notif.title}</div>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-1">{notif.message}</div>
                </div>
                <div className="text-[10px] text-slate-400 font-medium flex-shrink-0">{timeAgo(notif.createdAt)}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
