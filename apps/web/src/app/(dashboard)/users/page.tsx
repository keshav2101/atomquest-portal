'use client';

// ============================================================
// Users Management Page
// ============================================================

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Users, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getApiClient } from '@/lib/api';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

export default function UsersPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken || '';
  const role = (session?.user as any)?.role || 'EMPLOYEE';

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getApiClient(token).get('/users')
      .then(res => setUsers(res.data))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-2">Only Admins can manage users.</p>
      </div>
    );
  }

  if (loading) return <LoadingSkeleton count={5} type="table" />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <div className="page-title">User Management</div>
          <div className="page-subtitle">Manage system access and roles</div>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' :
                      u.role === 'MANAGER' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.department?.name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
