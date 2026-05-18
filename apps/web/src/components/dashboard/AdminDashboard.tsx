'use client';

// ============================================================
// Premium Admin Dashboard Component — AtomQuest Portal
// Global organization metrics, pie distributions and activity feeds
// ============================================================

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Target, TrendingUp, AlertTriangle, Building2, Activity, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { getApiClient } from '@/lib/api';
import { KPICard } from '@/components/charts/KPICard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { timeAgo } from '@/lib/utils';
import Link from 'next/link';

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

export function AdminDashboard({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApiClient(token).get('/analytics/admin')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingSkeleton count={8} />;

  const pieData = (data?.goalStatusDistribution || []).map((d: any) => ({
    name: d.status, value: d.count,
  })).filter((d: any) => d.value > 0);

  const deptData = (data?.departmentBreakdown || []).map((d: any) => ({
    name: d.name.split(' ')[0], completion: d.completion, goals: d.goalCount,
  }));

  const iv = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 150, damping: 20 } }
  };

  return (
    <motion.div
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      initial="hidden" animate="show" className="space-y-6"
    >
      {/* Premium Glassmorphic Page Header */}
      <motion.div variants={iv} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 glass-premium rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Organization Control Hub</h1>
            <span className="bg-emerald-500/10 text-emerald-500 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Admin</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Org-wide alignments, performance breakdowns, and cycles auditing</p>
        </div>
        <div className="flex gap-2">
          <Link href="/users"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200
                       dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
            <Users className="w-4 h-4" /> Manage Users
          </Link>
          <Link href="/reports"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/20 hover:scale-[1.02]">
            <FileSpreadsheet className="w-4 h-4" /> Export Reports
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={iv} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Active Users" value={data?.totalUsers ?? 0} icon={Users} color="blue" />
        <KPICard title="Total OKR Goals" value={data?.totalGoals ?? 0} icon={Target} color="indigo" />
        <KPICard title="Org Performance Avg" value={`${data?.orgCompletionPercent ?? 0}%`} icon={TrendingUp} color="green" />
        <KPICard title="Critical Escalations" value={data?.totalEscalations ?? 0} icon={ShieldAlert}
          color={data?.totalEscalations > 0 ? 'red' : 'green'} description="Action required" />
      </motion.div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Goal Status Pie */}
        <motion.div variants={iv} className="glass-premium glass-premium-hover rounded-2xl p-6 relative overflow-hidden">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6">Goal Status Distributions</h3>
          <div className="w-full h-[220px]">
            {pieData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-16">No active goals found.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85}
                    dataKey="value" paddingAngle={4}>
                    {pieData.map((_: any, index: number) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.9)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      color: '#f8fafc'
                    }}
                  />
                  <Legend formatter={(v) => v.charAt(0) + v.slice(1).toLowerCase()} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Department heatmaps */}
        <motion.div variants={iv} className="glass-premium glass-premium-hover rounded-2xl p-6 relative overflow-hidden">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6">Department completion rates</h3>
          <div className="w-full h-[220px]">
            {deptData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-16">No department data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} barSize={36} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-10" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.9)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      color: '#f8fafc'
                    }}
                    formatter={(v: any) => [`${v}%`, 'Completion']}
                  />
                  <Bar dataKey="completion" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* Real-time Audit Timeline stream */}
      <motion.div variants={iv} className="glass-premium rounded-2xl p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500 animate-pulse" /> Live Audit Trail Stream
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Global organization events synced via SSE</p>
          </div>
          <Link href="/audit" className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors uppercase tracking-wider">
            View full log
          </Link>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {(data?.recentActivity || []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No activity events recorded yet.</p>
          ) : (
            (data.recentActivity || []).slice(0, 6).map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100/50 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-950 dark:text-slate-100 truncate">{log.user?.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">{log.action}</div>
                </div>
                <div className="text-[10px] text-slate-400 font-medium flex-shrink-0">{timeAgo(log.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
