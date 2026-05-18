'use client';

// ============================================================
// Approvals Page — Manager approval queue
// ============================================================

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, CheckCircle, Clock, Users, AlertCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { getApiClient } from '@/lib/api';
import { GoalStatusBadge } from '@/components/goals/GoalStatusBadge';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate, timeAgo, getUoMLabel } from '@/lib/utils';

export default function ApprovalsPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken || '';

  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});

  const fetchPending = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getApiClient(token).get('/approvals/pending');
      setGoals(res.data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, [token]);

  const handleAction = async (goalId: string, action: 'APPROVE' | 'REJECT') => {
    const comment = comments[goalId] || '';
    if (action === 'REJECT' && !comment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setActionLoading(`${goalId}-${action}`);
    try {
      await getApiClient(token).post(`/approvals/${goalId}`, { action, comment });
      toast.success(`Goal ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`);
      fetchPending();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Group by employee
  const groupedByEmployee = goals.reduce((acc: any, goal: any) => {
    const empId = goal.owner.id;
    if (!acc[empId]) acc[empId] = { employee: goal.owner, goals: [] };
    acc[empId].goals.push(goal);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <div className="page-title">Approval Queue</div>
          <div className="page-subtitle">{goals.length} goal{goals.length !== 1 ? 's' : ''} pending review</div>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} type="list" />
      ) : goals.length === 0 ? (
        <EmptyState icon={CheckCircle} title="All caught up!" description="No goals are pending your approval at this time." />
      ) : (
        <div className="space-y-6">
          {Object.values(groupedByEmployee).map((group: any) => (
            <motion.div
              key={group.employee.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              {/* Employee header */}
              <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{group.employee.name}</div>
                  <div className="text-xs text-slate-400">
                    {group.employee.employeeId} · {group.employee.department?.name}
                    {' · '}{group.goals.length} goal{group.goals.length !== 1 ? 's' : ''} submitted
                    {' · '}<span className="text-amber-600">
                      Total weight: {group.goals.reduce((s: number, g: any) => s + g.weightage, 0)}%
                    </span>
                  </div>
                </div>
                <div className="ml-auto">
                  <button
                    onClick={async () => {
                      setActionLoading(`bulk-${group.employee.id}`);
                      try {
                        await getApiClient(token).post(`/approvals/bulk-approve/${group.employee.id}`);
                        toast.success(`All goals approved for ${group.employee.name}`);
                        fetchPending();
                      } catch (err: any) {
                        toast.error(err.message);
                      } finally {
                        setActionLoading(null);
                      }
                    }}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700
                               text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve All
                  </button>
                </div>
              </div>

              {/* Goals list */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {group.goals.map((goal: any) => (
                  <div key={goal.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{goal.title}</h3>
                          <GoalStatusBadge status={goal.status} />
                          {goal.isShared && (
                            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Shared</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{goal.description}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{goal.thrustArea}</span>
                          <span>{getUoMLabel(goal.uomType)}</span>
                          <span>Target: <strong>{goal.target}</strong></span>
                          <span>Weight: <strong className="text-indigo-600">{goal.weightage}%</strong></span>
                          <span>Due: {formatDate(goal.timeline)}</span>
                          <span>Submitted: {timeAgo(goal.submittedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Comment field */}
                    <div className="mt-4 flex gap-3">
                      <div className="flex-1 relative">
                        <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                        <textarea
                          placeholder="Add a comment (required for rejection)..."
                          value={comments[goal.id] || ''}
                          onChange={(e) => setComments((c) => ({ ...c, [goal.id]: e.target.value }))}
                          rows={2}
                          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200
                                     dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900
                                     dark:text-white placeholder:text-slate-400 focus:outline-none
                                     focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleAction(goal.id, 'APPROVE')}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white
                                     text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleAction(goal.id, 'REJECT')}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white
                                     text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
