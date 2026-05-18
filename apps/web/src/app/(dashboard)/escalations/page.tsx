'use client';

// ============================================================
// Escalations Page — View automated escalations
// ============================================================

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { getApiClient } from '@/lib/api';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate, timeAgo } from '@/lib/utils';
import { toast } from 'sonner';

export default function EscalationsPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken || '';
  const role = (session?.user as any)?.role || 'EMPLOYEE';

  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchEscalations = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getApiClient(token).get('/escalations');
      setEscalations(res.data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEscalations(); }, [token]);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await getApiClient(token).post(`/escalations/${id}/resolve`);
      toast.success('Escalation marked as resolved');
      fetchEscalations();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResolvingId(null);
    }
  };

  if (role === 'EMPLOYEE') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-2">Only Managers and Admins can view escalations.</p>
      </div>
    );
  }

  if (loading) return <LoadingSkeleton count={5} type="list" />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <div className="page-title">Escalations Tracker</div>
          <div className="page-subtitle">Automated alerts for missing submissions and approvals</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
            {escalations.filter(e => e.status === 'OPEN').length} Open
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            {escalations.filter(e => e.status === 'RESOLVED').length} Resolved
          </span>
        </div>
      </div>

      {escalations.length === 0 ? (
        <EmptyState icon={CheckCircle} title="No Escalations" description="Everything is running smoothly! No compliance breaches detected." />
      ) : (
        <div className="space-y-3">
          {escalations.map((escalation: any) => (
            <motion.div key={escalation.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border ${escalation.status === 'OPEN' ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'} flex items-start gap-4`}
            >
              <div className="mt-1">
                {escalation.status === 'OPEN' ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className={`font-semibold ${escalation.status === 'OPEN' ? 'text-red-900 dark:text-red-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {escalation.type.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{escalation.description}</p>
                  </div>
                  {escalation.status === 'OPEN' && role === 'ADMIN' && (
                    <button
                      onClick={() => handleResolve(escalation.id)}
                      disabled={resolvingId === escalation.id}
                      className="ml-4 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      {resolvingId === escalation.id ? 'Resolving...' : 'Mark Resolved'}
                    </button>
                  )}
                </div>
                <div className="flex gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Target: {escalation.targetUser?.name}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Escaped: {timeAgo(escalation.createdAt)}</span>
                  {escalation.resolvedAt && (
                    <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3.5 h-3.5" /> Resolved {timeAgo(escalation.resolvedAt)}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Ensure lucide icon is imported above
import { Users } from 'lucide-react';
