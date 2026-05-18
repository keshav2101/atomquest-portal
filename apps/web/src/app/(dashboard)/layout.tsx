// ============================================================
// Dashboard Layout — AtomQuest Portal
// Sidebar + Topbar shell, auth-protected
// ============================================================

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { SSEListener } from '@/components/shared/SSEListener';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* SSE Real-time Listener */}
      <SSEListener token={(session.user as any).accessToken} />

      {/* Sidebar */}
      <Sidebar user={session.user as any} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar user={session.user as any} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
