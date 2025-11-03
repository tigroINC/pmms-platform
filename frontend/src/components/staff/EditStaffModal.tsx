"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface EditStaffModalProps {
  isOpen: boolean;
  staff: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    department: string | null;
    position: string | null;
    role: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditStaffModal({
  isOpen,
  staff,
  onClose,
  onSuccess,
}: EditStaffModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    department: "",
    position: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && staff) {
      setFormData({
        name: staff.name || "",
        phone: staff.phone || "",
        department: staff.department || "",
        position: staff.position || "",
      });
    }
  }, [isOpen, staff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("이름은 필수입니다.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/org/staff/${staff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("저장되었습니다.");
        onSuccess();
      } else {
        alert(data.error || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Update staff error:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            직원 정보 수정
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              이메일
            </label>
            <div className="text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-md">
              {staff.email}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              이메일은 변경할 수 없습니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              전화번호
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="010-1234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              부서
            </label>
            <Input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="개발팀"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              직책
            </label>
            <Input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="팀장"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
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
              {loading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
