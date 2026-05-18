'use client';

// ============================================================
// Analytics Page
// ============================================================

import { useSession } from 'next-auth/react';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || 'EMPLOYEE';
  const token = (session?.user as any)?.accessToken || '';

  return (
    <div className="space-y-6">
      <div className="page-header pb-0 border-none mb-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="page-title">Analytics Hub</div>
            <div className="page-subtitle">Deep dive into performance metrics and trends</div>
          </div>
        </div>
      </div>
      <div className="pt-2">
        {role === 'ADMIN' && <AdminDashboard token={token} />}
        {role === 'MANAGER' && <ManagerDashboard token={token} />}
        {role === 'EMPLOYEE' && <EmployeeDashboard token={token} />}
      </div>
    </div>
  );
}
