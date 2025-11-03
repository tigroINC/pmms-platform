"use client";

import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationItem from "./NotificationItem";

type NotificationDropdownProps = {
  onClose: () => void;
};

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const router = useRouter();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  // 최근 5개만 표시
  const recentNotifications = notifications.slice(0, 5);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleViewAll = () => {
    router.push("/notifications");
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">알림</h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            모두 읽음
          </button>
        )}
      </div>

      {/* 알림 목록 */}
      <div className="max-h-96 overflow-y-auto">
        {recentNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>알림이 없습니다</p>
          </div>
        ) : (
          recentNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClose={onClose}
            />
          ))
        )}
      </div>

      {/* 푸터 */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 text-center">
          <button
            onClick={handleViewAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            모든 알림 보기
          </button>
        </div>
      )}
    </div>
  );
}
