'use client';

// ============================================================
// Reporting Cycles Page
// ============================================================

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { getApiClient } from '@/lib/api';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { formatDate } from '@/lib/utils';

export default function CyclesPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken || '';
  const role = (session?.user as any)?.role || 'EMPLOYEE';

  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getApiClient(token).get('/cycles')
      .then(res => setCycles(res.data))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-2">Only Admins can manage reporting cycles.</p>
      </div>
    );
  }

  if (loading) return <LoadingSkeleton count={3} type="table" />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <div className="page-title">Reporting Cycles</div>
          <div className="page-subtitle">Configure financial years and quarterly windows</div>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
        <div className="space-y-4">
          {cycles.map((cycle: any) => (
            <div key={cycle.id} className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl relative overflow-hidden">
              {cycle.isActive && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                  ACTIVE
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{cycle.name}</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(q => {
                  const qStart = cycle[`q${q}Start`];
                  const qEnd = cycle[`q${q}End`];
                  return (
                    <div key={q} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Quarter {q}</div>
                      <div className="text-xs text-slate-500">
                        {qStart ? formatDate(qStart) : 'Not set'} <br /> to <br /> {qEnd ? formatDate(qEnd) : 'Not set'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
