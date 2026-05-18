'use client';

import { useEffect } from 'react';
import { useNotificationStore } from '@/store';
import { toast } from 'sonner';

export function SSEListener({ token }: { token: string }) {
  const { setUnreadCount, unreadCount } = useNotificationStore();

  useEffect(() => {
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const eventSource = new EventSource(`${apiUrl}/api/v1/notifications/stream?token=${token}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Increase unread count
        setUnreadCount(useNotificationStore.getState().unreadCount + 1);
        
        // Show a real-time toast notification
        toast.message(data.title, {
          description: data.message,
        });

      } catch (err) {
        console.error('Error parsing SSE message', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [token]);

  return null;
}
