'use client';

// ============================================================
// Goals List Page — filterable table with create modal
// ============================================================

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Plus, Search, Filter, Download, Lock, CheckCircle,
  Clock, XCircle, FileText, ChevronDown, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getApiClient } from '@/lib/api';
import { GoalStatusBadge } from '@/components/goals/GoalStatusBadge';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate, getUoMLabel, truncate } from '@/lib/utils';
import { GoalCreateModal } from '@/components/goals/GoalCreateModal';
import { ProgressRing } from '@/components/charts/ProgressRing';

export default function GoalsPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken || '';
  const role = (session?.user as any)?.role || 'EMPLOYEE';

  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchGoals = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const api = getApiClient(token);
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/goals', { params });
      setGoals(res.data.goals || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, [token, page, statusFilter]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { if (token) fetchGoals(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleSubmitGoals = async () => {
    try {
      const api = getApiClient(token);
      // Submit all draft goals — use any goal id (backend submits all)
      const draftGoal = goals.find((g) => g.status === 'DRAFT');
      if (!draftGoal) {
        toast.error('No draft goals to submit');
        return;
      }
      await api.post(`/goals/${draftGoal.id}/submit`);
      toast.success('Goals submitted for approval!');
      fetchGoals();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalWeightage = goals
    .filter((g) => g.status !== 'REJECTED')
    .reduce((s, g) => s + g.weightage, 0);
  const hasDrafts = goals.some((g) => g.status === 'DRAFT');

  const STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'LOCKED', 'COMPLETED'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">My Goals</div>
          <div className="page-subtitle">
            {total} goal{total !== 1 ? 's' : ''} · Total weight: {' '}
            <span className={totalWeightage === 100 ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>
              {totalWeightage}%
            </span>
            {totalWeightage !== 100 && totalWeightage > 0 && (
              <span className="ml-1 text-amber-500">(must be 100%)</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasDrafts && role === 'EMPLOYEE' && (
            <button
              onClick={handleSubmitGoals}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700
                         text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> Submit for Approval
            </button>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700
                       text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> New Goal
          </button>
        </div>
      </div>

      {/* Weightage warning */}
      {totalWeightage > 0 && totalWeightage !== 100 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl
                     border border-amber-200 dark:border-amber-800"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <strong>Weightage mismatch:</strong> Your goals currently total{' '}
            <strong>{totalWeightage}%</strong>. Adjust to reach exactly 100% before submitting.
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search goals by title, description, thrust area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                       bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white
                       placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                     bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </select>
      </div>

      {/* Goals list */}
      {loading ? (
        <LoadingSkeleton count={6} type="list" />
      ) : error ? (
        <EmptyState icon={AlertCircle} title="Failed to load goals" description={error} />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals found"
          description="Create your first goal to get started with performance tracking."
          action={{ label: 'Create Goal', href: '#' }}
        />
      ) : (
        <motion.div
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
          initial="hidden" animate="show"
          className="space-y-3"
        >
          {goals.map((goal) => (
            <motion.div
              key={goal.id}
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            >
              <Link href={`/goals/${goal.id}`}>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100
                               dark:border-slate-800 p-5 hover:shadow-card-hover hover:border-indigo-100
                               dark:hover:border-indigo-900 transition-all duration-200 group cursor-pointer">
                  <div className="flex items-start gap-4">
                    {/* Progress indicator */}
                    <div className="flex-shrink-0">
                      {goal.checkins?.length > 0 ? (
                        <ProgressRing
                          value={goal.checkins[goal.checkins.length - 1]?.progressPercent || 0}
                          size={48}
                          strokeWidth={5}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                          <Target className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600
                                         dark:group-hover:text-indigo-400 transition-colors">
                            {goal.title}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                            {truncate(goal.description, 100)}
                          </p>
                        </div>
                        <GoalStatusBadge status={goal.status} />
                      </div>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                          {goal.thrustArea}
                        </span>
                        <span>{getUoMLabel(goal.uomType)}</span>
                        <span>Target: <strong className="text-slate-600 dark:text-slate-300">{goal.target}</strong></span>
                        <span>Weight: <strong className="text-indigo-600">{goal.weightage}%</strong></span>
                        {goal.isShared && (
                          <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-2 py-1 rounded-lg">
                            Shared
                          </span>
                        )}
                        {goal.isLocked && (
                          <span className="flex items-center gap-1 text-indigo-600">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                        <span className="ml-auto">Due {formatDate(goal.timeline)}</span>
                      </div>

                      {/* Check-in progress bar */}
                      {goal.checkins?.length > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Q{goal.checkins.length} progress</span>
                            <span>{Math.round(goal.checkins[goal.checkins.length - 1]?.progressPercent)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${goal.checkins[goal.checkins.length - 1]?.progressPercent}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="bg-indigo-500 h-1.5 rounded-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Goal Create Modal */}
      <GoalCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => { setShowCreate(false); fetchGoals(); }}
        token={token}
      />
    </div>
  );
}
