'use client';

// ============================================================
// Admin Dashboard Component
// ============================================================

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Target, TrendingUp, AlertTriangle, Building2, Activity } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
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

  const iv = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
      initial="hidden" animate="show" className="space-y-6"
    >
      <motion.div variants={iv} className="page-header">
        <div>
          <div className="page-title">Organization Dashboard</div>
          <div className="page-subtitle">Admin view · Full org analytics</div>
        </div>
        <div className="flex gap-2">
          <Link href="/users"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200
                       dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl">
            <Users className="w-4 h-4" /> Manage Users
          </Link>
          <Link href="/reports"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl">
            Export Reports
          </Link>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={iv} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Users" value={data?.totalUsers ?? 0} icon={Users} color="blue" />
        <KPICard title="Total Goals" value={data?.totalGoals ?? 0} icon={Target} color="indigo" />
        <KPICard title="Org Completion" value={`${data?.orgCompletionPercent ?? 0}%`} icon={TrendingUp} color="green" />
        <KPICard title="Open Escalations" value={data?.totalEscalations ?? 0} icon={AlertTriangle}
          color={data?.totalEscalations > 0 ? 'red' : 'green'} />
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal status pie */}
        <motion.div variants={iv} className="kpi-card">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Goal Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                dataKey="value" paddingAngle={3}>
                {pieData.map((_: any, index: number) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc' }} />
              <Legend formatter={(v) => v.charAt(0) + v.slice(1).toLowerCase()} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Department heatmap */}
        <motion.div variants={iv} className="kpi-card">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Department Completion</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc' }}
                formatter={(v: any) => [`${v}%`, 'Completion']} />
              <Bar dataKey="completion" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent activity */}
      <motion.div variants={iv} className="kpi-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
          <Link href="/audit" className="text-sm text-indigo-600 hover:underline">View audit log →</Link>
        </div>
        <div className="space-y-2">
          {(data?.recentActivity || []).slice(0, 6).map((log: any) => (
            <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                <Activity className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-slate-900 dark:text-white font-medium">{log.user?.name}</span>
                <span className="text-sm text-slate-500 mx-1">·</span>
                <span className="text-sm text-slate-500">{log.action}</span>
              </div>
              <div className="text-xs text-slate-400 flex-shrink-0">{timeAgo(log.createdAt)}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
