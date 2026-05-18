'use client';

// ============================================================
// Check-ins Page — Submit quarterly updates
// ============================================================

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { CheckSquare, Calendar, AlertTriangle, Target, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getApiClient } from '@/lib/api';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { getUoMLabel } from '@/lib/utils';
import { ProgressRing } from '@/components/charts/ProgressRing';

export default function CheckinsPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken || '';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, { achievement: string; notes: string }>>({});

  const fetchCheckins = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getApiClient(token).get('/checkins/my');
      setData(res.data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCheckins(); }, [token]);

  const handleSubmit = async (goalId: string, quarter: string) => {
    const input = inputs[goalId];
    if (!input || !input.achievement) {
      toast.error('Please enter your current achievement value');
      return;
    }

    setSubmitting(goalId);
    try {
      await getApiClient(token).post('/checkins', {
        goalId,
        quarter,
        achievement: Number(input.achievement),
        notes: input.notes || '',
      });
      toast.success(`${quarter} Check-in submitted successfully`);
      fetchCheckins();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <LoadingSkeleton count={4} />;

  const activeQuarter = data?.activeQuarter;
  const checkins = data?.checkins || [];

  // Group checkins by goal to easily see which goals need check-ins
  // Actually, we need to fetch user's goals to show the form for goals that don't have a check-in
  // Wait, the backend currently returns just past checkins, but we need the approved goals to render forms.
  // The backend endpoint `/checkins/my` might need to be augmented, or we fetch goals here.
  // We'll fetch goals.
  
  return <CheckinsView token={token} activeQuarter={activeQuarter} pastCheckins={checkins} onUpdate={fetchCheckins} />;
}

function CheckinsView({ token, activeQuarter, pastCheckins, onUpdate }: any) {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, { achievement: string; notes: string }>>({});

  useEffect(() => {
    if (!token) return;
    getApiClient(token).get('/goals?status=APPROVED,LOCKED')
      .then(res => setGoals(res.data.goals || []))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (goalId: string) => {
    const input = inputs[goalId];
    if (!input || !input.achievement) {
      toast.error('Please enter your current achievement value');
      return;
    }
    setSubmitting(goalId);
    try {
      await getApiClient(token).post('/checkins', {
        goalId,
        quarter: activeQuarter,
        achievement: Number(input.achievement),
        notes: input.notes || '',
      });
      toast.success(`${activeQuarter} check-in submitted successfully`);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <LoadingSkeleton count={3} type="list" />;

  const eligibleGoals = goals.filter(g => g.status === 'APPROVED' || g.status === 'LOCKED');

  return (
    <div className="space-y-6">
      <div className="page-header mb-2">
        <div>
          <div className="page-title">Quarterly Check-Ins</div>
          <div className="page-subtitle">Submit your progress for the active quarter</div>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl flex items-center gap-2 font-semibold">
          <Calendar className="w-5 h-5" />
          Active Window: {activeQuarter || 'None'}
        </div>
      </div>

      {!activeQuarter && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            No check-in window is currently open. You can view past check-ins but cannot submit new ones.
          </div>
        </div>
      )}

      {eligibleGoals.length === 0 ? (
        <EmptyState icon={Target} title="No eligible goals" description="You don't have any approved goals to check in against." />
      ) : (
        <div className="space-y-4">
          {eligibleGoals.map(goal => {
            const hasCheckedIn = pastCheckins.some((c: any) => c.goalId === goal.id && c.quarter === activeQuarter);
            const lastCheckin = goal.checkins?.[goal.checkins.length - 1];

            return (
              <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
                <div className="flex flex-col md:flex-row gap-6">
                  
                  {/* Goal Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{goal.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                      <span>UoM: <strong className="text-slate-700 dark:text-slate-300">{getUoMLabel(goal.uomType)}</strong></span>
                      <span>Target: <strong className="text-slate-700 dark:text-slate-300">{goal.target}</strong></span>
                      <span>Current: <strong className="text-slate-700 dark:text-slate-300">{goal.achievement || 0}</strong></span>
                    </div>
                    {lastCheckin && (
                      <div className="mt-4 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <ProgressRing value={lastCheckin.progressPercent} size={40} strokeWidth={4} />
                        <div>
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Last Check-in ({lastCheckin.quarter})</div>
                          <div className="text-xs text-slate-500">Progress: {lastCheckin.progressPercent.toFixed(1)}%</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Form */}
                  <div className="w-full md:w-80 flex-shrink-0 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    {hasCheckedIn ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                          <CheckSquare className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{activeQuarter} Submitted</div>
                        <div className="text-xs text-slate-500 mt-1">You're all set for this quarter.</div>
                      </div>
                    ) : !activeQuarter ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                        Check-in window closed
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="font-semibold text-sm text-slate-900 dark:text-white">Submit {activeQuarter} Update</div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">New Achievement Value</label>
                          <input type="number" 
                            placeholder={`Target: ${goal.target}`}
                            value={inputs[goal.id]?.achievement || ''}
                            onChange={(e) => setInputs(p => ({ ...p, [goal.id]: { ...p[goal.id], achievement: e.target.value } }))}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Notes (Optional)</label>
                          <textarea rows={2}
                            placeholder="Highlights or roadblocks..."
                            value={inputs[goal.id]?.notes || ''}
                            onChange={(e) => setInputs(p => ({ ...p, [goal.id]: { ...p[goal.id], notes: e.target.value } }))}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                          />
                        </div>
                        <button
                          onClick={() => handleSubmit(goal.id)}
                          disabled={submitting === goal.id}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex justify-center items-center gap-2"
                        >
                          {submitting === goal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Update'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
