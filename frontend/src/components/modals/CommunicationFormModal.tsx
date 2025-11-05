"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

interface CommunicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialShareType?: boolean;
}

export default function CommunicationFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialShareType = true,
}: CommunicationFormModalProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isCustomer = user?.role === "CUSTOMER_ADMIN" || user?.role === "CUSTOMER_USER";

  const [formData, setFormData] = useState({
    customerId: "",
    contactAt: new Date().toISOString().slice(0, 16),
    channel: "PHONE",
    subject: "",
    content: "",
    priority: "NORMAL",
    assignedToId: "",
    contactPerson: "",
    contactOrg: "",
    isShared: true,
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (!isCustomer) {
        fetchCustomers();
        fetchStaff();
      }
      setFormData({
        customerId: "",
        contactAt: new Date().toISOString().slice(0, 16),
        channel: "PHONE",
        subject: "",
        content: "",
        priority: "NORMAL",
        assignedToId: "",
        contactPerson: "",
        contactOrg: "",
        isShared: initialShareType,
      });
      setError("");
    }
  }, [isOpen, isCustomer]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers?tab=all");
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/org/staff");
      const data = await res.json();
      if (res.ok) {
        setStaff(data.staff || []);
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isCustomer && !formData.customerId) {
      setError("고객사를 선택해주세요");
      return;
    }

    if (!formData.content.trim()) {
      setError("내용을 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
      } else {
        setError(data.error || "등록 실패");
      }
    } catch (error) {
      console.error("Communication creation error:", error);
      setError("등록 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isCustomer ? "요청사항 등록" : "커뮤니케이션 등록"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {!isCustomer && (
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                공유 범위
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.isShared === true}
                    onChange={() => handleChange("isShared", true)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">고객사 공유</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.isShared === false}
                    onChange={() => handleChange("isShared", false)}
                    disabled={initialShareType === false}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">내부 전용</span>
                </label>
              </div>
              {initialShareType === false && formData.isShared === false && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  * 내부 전용은 고객사 공유로만 변경 가능합니다
                </p>
              )}
            </div>
          )}

          {!isCustomer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                고객사 <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.customerId}
                onChange={(e) => handleChange("customerId", e.target.value)}
                required
              >
                <option value="">선택하세요</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                소통 일시 <span className="text-red-500">*</span>
              </label>
              <Input
                type="datetime-local"
                value={formData.contactAt}
                onChange={(e) => handleChange("contactAt", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                채널 <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.channel}
                onChange={(e) => handleChange("channel", e.target.value)}
                required
              >
                <option value="PHONE">📞 전화</option>
                <option value="EMAIL">📧 이메일</option>
                <option value="VISIT">👤 방문</option>
                <option value="KAKAO">💬 카톡</option>
                <option value="SMS">📱 SMS</option>
                <option value="FAX">📠 팩스</option>
                <option value="OTHER">기타</option>
              </Select>
            </div>
          </div>

          {!isCustomer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                우선순위
              </label>
              <Select
                value={formData.priority}
                onChange={(e) => handleChange("priority", e.target.value)}
              >
                <option value="URGENT">🔴 긴급</option>
                <option value="HIGH">🟠 높음</option>
                <option value="NORMAL">⚪ 보통</option>
                <option value="LOW">🔵 낮음</option>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                상대방 조직명 <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.contactOrg}
                onChange={(e) => handleChange("contactOrg", e.target.value)}
                placeholder={isCustomer ? "측정기업명" : "고객사명"}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                상대방 담당자명 <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.contactPerson}
                onChange={(e) => handleChange("contactPerson", e.target.value)}
                placeholder="담당자 이름"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              제목
            </label>
            <Input
              value={formData.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              placeholder="제목을 입력하세요 (선택사항)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="소통 내용을 입력하세요"
              rows={6}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {!isCustomer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                담당자 지정
              </label>
              <Select
                value={formData.assignedToId}
                onChange={(e) => handleChange("assignedToId", e.target.value)}
              >
                <option value="">선택 안 함</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "등록 중..." : "등록"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
