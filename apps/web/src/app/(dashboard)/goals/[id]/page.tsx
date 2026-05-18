'use client';

// ============================================================
// Goal Detail Page — /goals/[id]
// ============================================================

import { useEffect, useState, use } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Target, Clock, Activity, CheckSquare, Settings } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getApiClient } from '@/lib/api';
import { GoalStatusBadge } from '@/components/goals/GoalStatusBadge';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate, getUoMLabel } from '@/lib/utils';
import { ProgressRing } from '@/components/charts/ProgressRing';

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken || '';

  const [goal, setGoal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'audit'>('details');

  useEffect(() => {
    if (!token) return;
    getApiClient(token).get(`/goals/${resolvedParams.id}`)
      .then(res => setGoal(res.data))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [token, resolvedParams.id]);

  if (loading) return <LoadingSkeleton count={4} />;
  if (!goal) return <EmptyState icon={Target} title="Goal Not Found" description="The goal you're looking for doesn't exist or you don't have access." action={{ label: 'Back to Goals', href: '/goals' }} />;

  const currentProgress = goal.checkins?.length > 0 ? goal.checkins[goal.checkins.length - 1].progressPercent : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/goals" className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div className="page-header pb-0 border-none mb-0 flex-1">
          <div>
            <div className="flex items-center gap-3">
              <div className="page-title">{goal.title}</div>
              <GoalStatusBadge status={goal.status} />
            </div>
            <div className="page-subtitle mt-1">ID: {goal.id} · Created by {goal.owner?.name}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="flex border-b border-slate-100 dark:border-slate-800 px-2 pt-2">
              {[
                { id: 'details', label: 'Details', icon: Target },
                { id: 'history', label: 'Check-in History', icon: CheckSquare },
                { id: 'audit', label: 'Audit Trail', icon: Activity },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                    ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'details' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Description</h4>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{goal.description}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="text-xs text-slate-500 mb-1">Thrust Area</div>
                      <div className="font-semibold text-slate-900 dark:text-white">{goal.thrustArea}</div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="text-xs text-slate-500 mb-1">Weightage</div>
                      <div className="font-semibold text-indigo-600">{goal.weightage}%</div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="text-xs text-slate-500 mb-1">Deadline</div>
                      <div className="font-semibold text-slate-900 dark:text-white">{formatDate(goal.timeline)}</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {goal.checkins?.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">No check-ins recorded yet.</p>
                  ) : (
                    goal.checkins.map((c: any, i: number) => (
                      <div key={c.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-indigo-500 rounded-full mt-1.5" />
                          {i !== goal.checkins.length - 1 && <div className="flex-1 w-px bg-slate-200 dark:bg-slate-700 my-1" />}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-slate-900 dark:text-white">{c.quarter} Update</span>
                              <span className="text-xs text-slate-500">{formatDate(c.createdAt)}</span>
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                              Achieved: <strong>{c.achievement}</strong> 
                              <span className="mx-2 text-slate-300">|</span> 
                              Progress: <strong className="text-indigo-600">{c.progressPercent.toFixed(1)}%</strong>
                            </div>
                            {c.notes && (
                              <div className="mt-3 text-sm text-slate-500 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                "{c.notes}"
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {activeTab === 'audit' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {/* Fetch audit trail here optionally or just list changes if stored in goal. For hackathon we can omit or show stub if not joined. */}
                  <p className="text-sm text-slate-500 text-center py-8">Goal lifecycle events are tracked in the global Audit Trail.</p>
                  <Link href="/audit" className="block text-center text-sm text-indigo-600 hover:underline">View System Audit Trail</Link>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">Overall Progress</h3>
            <ProgressRing value={currentProgress} size={160} />
            <div className="mt-4 w-full text-left text-sm text-slate-600 dark:text-slate-400 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex justify-between"><span>Target Value:</span> <strong>{goal.target}</strong></div>
              <div className="flex justify-between"><span>Current Value:</span> <strong>{goal.achievement || 0}</strong></div>
              <div className="flex justify-between"><span>UoM Type:</span> <strong>{getUoMLabel(goal.uomType)}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
