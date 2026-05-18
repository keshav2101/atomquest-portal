// ============================================================
// Dashboard Page — Role-aware dashboard
// ============================================================

import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your AtomQuest performance dashboard',
};

export default async function DashboardPage() {
  const session = await auth();
  const role = (session?.user as any)?.role || 'EMPLOYEE';
  const token = (session?.user as any)?.accessToken || '';

  if (role === 'ADMIN') return <AdminDashboard token={token} />;
  if (role === 'MANAGER') return <ManagerDashboard token={token} />;
  return <EmployeeDashboard token={token} />;
}
