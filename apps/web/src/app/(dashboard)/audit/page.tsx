'use client';

// ============================================================
// Audit Trail Page
// ============================================================

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Shield, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { getApiClient } from '@/lib/api';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { formatDate } from '@/lib/utils';

export default function AuditPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken || '';
  const role = (session?.user as any)?.role || 'EMPLOYEE';

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getApiClient(token).get('/audit')
      .then(res => setLogs(res.data.logs || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (role === 'EMPLOYEE') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-2">Only Managers and Admins can view the audit trail.</p>
      </div>
    );
  }

  if (loading) return <LoadingSkeleton count={5} type="table" />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <div className="page-title">Audit Trail</div>
          <div className="page-subtitle">System-wide immutable activity logs</div>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
        <div className="space-y-4">
          {logs.map((log: any) => (
            <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-xl transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-slate-900 dark:text-white">{log.action.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-slate-400">{formatDate(log.createdAt)}</div>
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  <strong>{log.user?.name}</strong> performed this action on entity <code>{log.entityType}</code> ({log.entityId}).
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
