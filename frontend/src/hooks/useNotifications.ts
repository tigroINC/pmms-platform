import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  stackId?: string;
  customerId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  metadata?: any;
  stack?: {
    id: string;
    name: string;
    customer: {
      id: string;
      name: string;
    };
  };
  customer?: {
    id: string;
    name: string;
  };
};

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 알림 목록 조회
  const fetchNotifications = async (limit = 20) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/notifications?limit=${limit}`);
      const data = await res.json();
      
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("[useNotifications] Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 읽지 않은 개수만 조회 (폴링용)
  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const res = await fetch("/api/notifications/unread-count");
      const data = await res.json();
      
      if (res.ok) {
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error("[useNotifications] Unread count error:", error);
    }
  };

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
      
      if (res.ok) {
        // 로컬 상태 업데이트
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("[useNotifications] Mark as read error:", error);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
      });
      
      if (res.ok) {
        // 로컬 상태 업데이트
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("[useNotifications] Mark all as read error:", error);
    }
  };

  // 알림 삭제
  const deleteNotification = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        // 로컬 상태 업데이트
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("[useNotifications] Delete error:", error);
    }
  };

  // 초기 로드
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // 폴링: 2분마다 읽지 않은 개수 확인 (성능 개선)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 120000); // 2분 (120초)

    return () => clearInterval(interval);
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
