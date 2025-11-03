"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Bell, CheckCircle, AlertTriangle, UserPlus } from "lucide-react";
import { useNotifications, type Notification } from "@/hooks/useNotifications";

type NotificationItemProps = {
  notification: Notification;
  onClose?: () => void;
};

export default function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const router = useRouter();
  const { markAsRead } = useNotifications();

  // 알림 타입별 아이콘
  const getIcon = () => {
    switch (notification.type) {
      case "STACK_CREATED_BY_CUSTOMER":
      case "STACK_UPDATED_BY_CUSTOMER":
      case "STACK_CREATED_BY_ORG":
        return <Bell className="w-5 h-5 text-blue-500" />;
      case "STACK_VERIFIED_BY_CUSTOMER":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "STACK_INTERNAL_CODE_NEEDED":
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // 알림 클릭 시 이동할 페이지
  const getNavigationPath = () => {
    switch (notification.type) {
      case "STACK_CREATED_BY_CUSTOMER":
      case "STACK_UPDATED_BY_CUSTOMER":
      case "STACK_INTERNAL_CODE_NEEDED":
        // 환경측정기업 관리자 → 굴뚝 관리 페이지
        return `/masters/stacks?stackId=${notification.stackId}`;
      
      case "STACK_CREATED_BY_ORG":
        // 고객사 관리자 → 확인 필요 탭
        return `/customer/stacks?tab=unverified&stackId=${notification.stackId}`;
      
      case "STACK_VERIFIED_BY_CUSTOMER":
        // 환경측정기업 관리자 → 굴뚝 상세
        return `/masters/stacks/${notification.stackId}`;
      
      default:
        return null;
    }
  };

  // 알림 클릭 핸들러
  const handleClick = async () => {
    // 읽음 처리
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // 페이지 이동
    const path = getNavigationPath();
    if (path) {
      router.push(path);
      onClose?.();
    }
  };

  // 상대 시간 표시
  const getRelativeTime = () => {
    try {
      return formatDistanceToNow(new Date(notification.createdAt), {
        addSuffix: true,
        locale: ko,
      });
    } catch {
      return "방금 전";
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.isRead ? "bg-blue-50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 mb-1">
            {notification.title}
          </p>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-400">
            {getRelativeTime()}
          </p>
        </div>

        {/* 읽지 않음 표시 */}
        {!notification.isRead && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
}
