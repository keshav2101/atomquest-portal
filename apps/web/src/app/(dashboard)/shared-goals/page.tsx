'use client';

// ============================================================
// Shared Goals Page
// ============================================================

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Share2, Users, Target } from 'lucide-react';
import { toast } from 'sonner';
import { getApiClient } from '@/lib/api';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProgressRing } from '@/components/charts/ProgressRing';

export default function SharedGoalsPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken || '';

  const [sharedGoals, setSharedGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getApiClient(token).get('/shared-goals')
      .then(res => setSharedGoals(res.data))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingSkeleton count={4} />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <div className="page-title">Departmental Shared Goals</div>
          <div className="page-subtitle">View and link to goals spanning across your department</div>
        </div>
      </div>

      {sharedGoals.length === 0 ? (
        <EmptyState icon={Share2} title="No Shared Goals" description="There are currently no active shared goals in your department." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sharedGoals.map((sg: any) => (
            <div key={sg.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col hover:shadow-card-hover transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{sg.title}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">{sg.department?.name}</div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1">{sg.description}</p>
              
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Target className="w-4 h-4" /> Target: <strong>{sg.target}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total Progress</span>
                  <ProgressRing value={sg.currentProgress} size={36} strokeWidth={4} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
