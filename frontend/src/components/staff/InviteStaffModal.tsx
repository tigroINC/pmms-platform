"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userType?: "organization" | "customer"; // 조직 타입
}

export default function InviteStaffModal({ isOpen, onClose, onSuccess, userType = "organization" }: InviteStaffModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: userType === "customer" ? "CUSTOMER_USER" : "OPERATOR",
  });
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      alert("이름과 이메일은 필수입니다.");
      return;
    }

    try {
      setLoading(true);
      const apiUrl = userType === "customer" ? "/api/customer/staff/invite" : "/api/org/staff/invite";
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setInviteUrl(data.inviteUrl);
        // onSuccess는 모달을 닫을 때 호출 (링크 표시 후)
      } else {
        alert(data.error || "초대 링크 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Invite error:", error);
      alert("초대 링크 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    alert("링크가 복사되었습니다!");
  };

  const handleClose = () => {
    setFormData({ name: "", email: "", role: "OPERATOR" });
    setInviteUrl("");
    onSuccess(); // 직원 목록 새로고침
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            직원 초대 링크 생성
          </h2>
        </div>

        <div className="p-6">
          {!inviteUrl ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="홍길동"
                required
              />
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                이메일 <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="hong@example.com"
                required
              />
            </div>

            {/* 역할 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                역할 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {userType === "customer" ? (
                  <>
                    <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="role"
                        value="CUSTOMER_ADMIN"
                        checked={formData.role === "CUSTOMER_ADMIN"}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">고객사 관리자</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          직원 관리, 데이터 조회 등 모든 권한
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="role"
                        value="CUSTOMER_USER"
                        checked={formData.role === "CUSTOMER_USER"}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">고객사 사용자</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          데이터 조회만 가능 (읽기 전용)
                        </div>
                      </div>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="role"
                        value="ORG_ADMIN"
                        checked={formData.role === "ORG_ADMIN"}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">조직 관리자</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          직원 관리, 고객사 관리 등 모든 권한
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                      <input
                        type="radio"
                        name="role"
                        value="OPERATOR"
                        checked={formData.role === "OPERATOR"}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">실무자</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          측정 데이터 입력, 담당 고객사 관리
                        </div>
                      </div>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 초대 링크가 생성되며, 직원이 링크를 통해 가입 완료 후 담당 고객사를 할당할 수 있습니다.
              </p>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                취소
              </button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? "생성 중..." : "초대 링크 생성"}
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                ✅ 초대 링크가 생성되었습니다!
              </p>
              <div className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600 break-all text-sm text-gray-900 dark:text-white">
                {inviteUrl}
              </div>
            </div>

            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold mb-2">
                📋 다음 단계:
              </p>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-decimal">
                <li>위 링크를 복사하여 직원에게 전달하세요 (카카오톡, 이메일 등)</li>
                <li>직원이 링크를 통해 비밀번호를 설정하면 계정이 활성화됩니다</li>
                <li>현재 직원 목록에 <strong>비활성 상태</strong>로 표시됩니다</li>
              </ol>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                ⚠️ 링크는 24시간 동안 유효합니다.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                📋 링크 복사
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                닫기
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
