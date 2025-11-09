"use client";

import { useState } from "react";

interface Customer {
  id: string;
  name: string;
  businessNumber: string;
  siteType?: string;
}

interface CreateInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess: () => void;
}

export default function CreateInvitationModal({
  isOpen,
  onClose,
  customer,
  onSuccess,
}: CreateInvitationModalProps) {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [suggestedRole, setSuggestedRole] = useState("ADMIN");
  const [roleNote, setRoleNote] = useState("");
  const [expiryDays, setExpiryDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  
  const siteType = customer?.siteType || "-";

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/customer-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          adminEmail,
          adminName,
          adminPhone,
          suggestedRole,
          roleNote,
          siteType: customer?.siteType,
          expiryDays,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // 기존 이메일인 경우 안내 메시지만 표시하고 링크는 보여주지 않음
        if (data.isExistingEmail) {
          alert(data.autoConnectMessage);
          handleClose();
          return;
        }
        setInviteUrl(data.inviteUrl);
        onSuccess();
      } else if (res.status === 400 && data.inviteUrl) {
        // 기존 초대 링크가 있는 경우
        if (confirm("이미 활성화된 초대 링크가 있습니다.\n\n기존 링크를 사용하시겠습니까?\n(취소를 누르면 기존 링크를 무효화하고 새 링크를 생성합니다)")) {
          setInviteUrl(data.inviteUrl);
          onSuccess();
        } else {
          // 기존 링크 무효화 후 새로 생성
          await handleForceCreate();
        }
      } else {
        alert(data.error || "초대 링크 생성 실패");
      }
    } catch (error) {
      console.error("Error creating invitation:", error);
      alert("초대 링크 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleForceCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customer-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          adminEmail,
          adminName,
          adminPhone,
          suggestedRole,
          roleNote,
          siteType: customer?.siteType,
          expiryDays,
          forceCreate: true, // 강제 생성 플래그
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // 기존 이메일인 경우 안내 메시지만 표시하고 링크는 보여주지 않음
        if (data.isExistingEmail) {
          alert(data.autoConnectMessage);
          handleClose();
          return;
        }
        setInviteUrl(data.inviteUrl);
        onSuccess();
      } else {
        alert(data.error || "초대 링크 생성 실패");
      }
    } catch (error) {
      console.error("Error creating invitation:", error);
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
    setAdminEmail("");
    setAdminName("");
    setAdminPhone("");
    setSuggestedRole("ADMIN");
    setRoleNote("");
    setExpiryDays(7);
    setInviteUrl("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">고객사 초대 링크 생성</h2>

        {!inviteUrl ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                고객사
              </label>
              <div className="p-3 bg-gray-50 rounded border">
                <div className="font-medium">{customer.name}</div>
                <div className="text-sm text-gray-500">{customer.businessNumber}</div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                담당자 이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="example@company.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                해당 이메일로만 가입이 가능합니다.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                담당자 이름 (선택)
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="홍길동"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                담당자 전화번호 (선택)
              </label>
              <input
                type="tel"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="010-1234-5678"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                권장 역할
              </label>
              <select
                value={suggestedRole}
                onChange={(e) => setSuggestedRole(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="ADMIN">관리자 (CUSTOMER_ADMIN)</option>
                <option value="USER">일반 사용자 (CUSTOMER_USER)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                초대받은 사람이 가입 시 이 역할로 기본 설정됩니다.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                역할 설명 (선택)
              </label>
              <input
                type="text"
                value={roleNote}
                onChange={(e) => setRoleNote(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="예: 환경안전팀장급"
              />
              <p className="text-xs text-gray-500 mt-1">
                담당자의 직급이나 역할을 메모할 수 있습니다.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사업장구분
              </label>
              <div className="p-3 bg-gray-50 rounded border text-gray-700">
                {siteType}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                고객사 정보의 사업장구분이 자동으로 표시됩니다.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                링크 유효기간
              </label>
              <select
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              >
                <option value={1}>1일</option>
                <option value={3}>3일</option>
                <option value={7}>7일 (권장)</option>
                <option value={14}>14일</option>
                <option value={30}>30일</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                disabled={loading}
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? "생성 중..." : "초대 링크 생성"}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800 mb-2">
                ✅ 초대 링크가 생성되었습니다!
              </p>
              <div className="bg-white p-3 rounded border break-all text-sm">
                {inviteUrl}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                이 링크를 고객사 담당자에게 전달하세요. 링크를 통해 회원가입하면 자동으로 연결됩니다.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                📋 링크 복사
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
