'use client';

// ============================================================
// Notifications Page
// ============================================================

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getApiClient } from '@/lib/api';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { timeAgo } from '@/lib/utils';
import { useNotificationStore } from '@/store';

export default function NotificationsPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken || '';
  const { clearUnread } = useNotificationStore();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    if (!token) return;
    try {
      const res = await getApiClient(token).get('/notifications');
      setNotifications(res.data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifs(); }, [token]);

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      await getApiClient(token).post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      clearUnread();
      toast.success('All marked as read');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await getApiClient(token).patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <LoadingSkeleton count={5} type="list" />;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="page-header border-b-0 pb-0">
        <div>
          <div className="page-title">Notifications</div>
          <div className="page-subtitle">You have {unreadCount} unread messages</div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            <Check className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="All Caught Up" description="You don't have any notifications right now." />
      ) : (
        <div className="space-y-3">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markAsRead(n.id)}
              className={`p-4 rounded-xl border flex items-start gap-4 transition-colors ${
                !n.isRead 
                  ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30 cursor-pointer hover:border-indigo-200' 
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
              }`}
            >
              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-indigo-500' : 'bg-transparent'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`font-semibold ${!n.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {n.title}
                  </h4>
                  <span className="text-xs text-slate-400 flex-shrink-0 ml-4">{timeAgo(n.createdAt)}</span>
                </div>
                <p className={`mt-1 text-sm ${!n.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  {n.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
