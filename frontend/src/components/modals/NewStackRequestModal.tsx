"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Customer {
  id: string;
  name: string;
  businessNumber: string;
}

interface NewStackRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewStackRequestModal({
  isOpen,
  onClose,
  onSuccess,
}: NewStackRequestModalProps) {
  const { data: session } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [stackName, setStackName] = useState("");
  const [stackCode, setStackCode] = useState("");
  const [location, setLocation] = useState("");
  const [height, setHeight] = useState("");
  const [diameter, setDiameter] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      const organizationId = (session?.user as any)?.organizationId;
      const res = await fetch(`/api/connections/by-organization?organizationId=${organizationId}`);
      const data = await res.json();
      
      if (res.ok) {
        // 승인된 연결만 필터링
        const approvedCustomers = data.connections
          .filter((conn: any) => conn.status === "APPROVED")
          .map((conn: any) => conn.customer);
        setCustomers(approvedCustomers);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomerId || !stackName || !location) {
      alert("고객사, 굴뚝명, 위치는 필수입니다.");
      return;
    }

    try {
      setLoading(true);
      
      const res = await fetch("/api/stack-assignments/request-new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          stackName,
          stackCode: stackCode || null,
          location,
          height: height ? parseFloat(height) : null,
          diameter: diameter ? parseFloat(diameter) : null,
          coordinates: coordinates || null,
          description: description || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("굴뚝 등록 요청이 전송되었습니다.");
        onSuccess();
        handleClose();
      } else {
        alert(data.error || "요청 전송 실패");
      }
    } catch (error) {
      console.error("Error requesting new stack:", error);
      alert("요청 전송 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCustomerId("");
    setStackName("");
    setStackCode("");
    setLocation("");
    setHeight("");
    setDiameter("");
    setCoordinates("");
    setDescription("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">신규 굴뚝 등록 요청</h2>

        {/* 고객사 선택 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            고객사 <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">고객사 선택</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.businessNumber})
              </option>
            ))}
          </select>
        </div>

        {/* 굴뚝명 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            굴뚝명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={stackName}
            onChange={(e) => setStackName(e.target.value)}
            placeholder="예: 1호 소각로"
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        {/* 굴뚝코드 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            굴뚝코드
          </label>
          <input
            type="text"
            value={stackCode}
            onChange={(e) => setStackCode(e.target.value)}
            placeholder="예: ST-001"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* 위치 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            위치 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="예: 공장 동쪽"
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        {/* 제원 */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              높이 (m)
            </label>
            <input
              type="number"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="예: 25.5"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              직경 (m)
            </label>
            <input
              type="number"
              step="0.1"
              value={diameter}
              onChange={(e) => setDiameter(e.target.value)}
              placeholder="예: 1.2"
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {/* 좌표 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            좌표
          </label>
          <input
            type="text"
            value={coordinates}
            onChange={(e) => setCoordinates(e.target.value)}
            placeholder="예: 37.5665,126.9780"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* 설명 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            설명
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="추가 설명이 있으면 입력해주세요"
            rows={3}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* 안내 메시지 */}
        <div className="mb-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
          💡 요청을 전송하면 고객사 관리자가 승인할 수 있습니다.
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            disabled={loading}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "전송 중..." : "등록 요청"}
          </button>
        </div>
      </div>
    </div>
  );
}
