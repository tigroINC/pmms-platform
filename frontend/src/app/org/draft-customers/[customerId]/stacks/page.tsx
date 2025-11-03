"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { CodeGuideAlert } from "@/components/alerts/CodeGuideAlert";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

type DraftStack = {
  stackId: string;
  internal: {
    code: string;
    name: string | null;
  };
  physical: {
    location: string | null;
    height: number | null;
    diameter: number | null;
    coordinates: any;
  };
  description: string | null;
  createdAt: string;
};

export default function DraftStacksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const customerId = params.customerId as string;
  
  const [stacks, setStacks] = useState<DraftStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStack, setEditingStack] = useState<DraftStack | null>(null);
  const [formData, setFormData] = useState({
    internalCode: "",
    internalName: "",
    location: "",
    height: "",
    diameter: "",
    description: "",
  });

  useEffect(() => {
    if (user?.role !== "ORG_ADMIN" && user?.role !== "OPERATOR") {
      router.push("/dashboard");
      return;
    }
    fetchStacks();
  }, [user, router, customerId]);

  const fetchStacks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/org/draft-customers/${customerId}/stacks`);
      const data = await res.json();
      setStacks(data.stacks || []);
    } catch (error) {
      console.error("Failed to fetch stacks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.internalCode) {
      alert("내부 코드는 필수입니다.");
      return;
    }

    try {
      const url = editingStack
        ? `/api/org/draft-customers/${customerId}/stacks/${editingStack.stackId}`
        : `/api/org/draft-customers/${customerId}/stacks/create`;
      
      const method = editingStack ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert(editingStack ? "수정되었습니다." : "등록되었습니다.");
        setShowModal(false);
        setEditingStack(null);
        setFormData({
          internalCode: "",
          internalName: "",
          location: "",
          height: "",
          diameter: "",
          description: "",
        });
        fetchStacks();
      } else {
        const data = await res.json();
        alert(data.error || "실패");
      }
    } catch (error) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleEdit = (stack: DraftStack) => {
    setEditingStack(stack);
    setFormData({
      internalCode: stack.internal.code,
      internalName: stack.internal.name || "",
      location: stack.physical.location || "",
      height: stack.physical.height?.toString() || "",
      diameter: stack.physical.diameter?.toString() || "",
      description: stack.description || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (stackId: string, code: string) => {
    if (!confirm(`"${code}" 굴뚝을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch(
        `/api/org/draft-customers/${customerId}/stacks/${stackId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        alert("삭제되었습니다.");
        fetchStacks();
      } else {
        const data = await res.json();
        alert(data.error || "삭제 실패");
      }
    } catch (error) {
      alert("오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <CodeGuideAlert pageType="org" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <Button
            onClick={() => router.back()}
            className="mb-2 text-sm"
          >
            ← 돌아가기
          </Button>
          <h1 className="text-2xl font-bold mb-1">임시 굴뚝 관리</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            연결 전에 굴뚝 정보를 미리 등록할 수 있습니다.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          + 굴뚝 등록
        </Button>
      </div>

      {stacks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            등록된 굴뚝이 없습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {stacks.map((stack) => (
            <div
              key={stack.stackId}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-mono text-lg font-semibold">
                      {stack.internal.code}
                    </h3>
                    <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                      임시
                    </span>
                  </div>
                  {stack.internal.name && (
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {stack.internal.name}
                    </p>
                  )}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stack.physical.location && (
                      <p>위치: {stack.physical.location}</p>
                    )}
                    {(stack.physical.height || stack.physical.diameter) && (
                      <p>
                        {stack.physical.height && `${stack.physical.height}m`}
                        {stack.physical.height && stack.physical.diameter && " / "}
                        {stack.physical.diameter && `Ø${stack.physical.diameter}m`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEdit(stack)}
                  >
                    수정
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDelete(stack.stackId, stack.internal.code)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    삭제
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 등록/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-xl font-bold mb-4">
              {editingStack ? "굴뚝 수정" : "굴뚝 등록"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    내부 코드 <span className="text-red-500">*</span>
                    <InfoTooltip
                      title="내부 코드란?"
                      content="우리 회사에서 사용하는 굴뚝 관리 코드입니다."
                    />
                  </label>
                  <Input
                    value={formData.internalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, internalCode: e.target.value })
                    }
                    placeholder="예: S-001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    내부 명칭
                    <InfoTooltip
                      content="우리 회사에서 사용하는 굴뚝 명칭입니다."
                    />
                  </label>
                  <Input
                    value={formData.internalName}
                    onChange={(e) =>
                      setFormData({ ...formData, internalName: e.target.value })
                    }
                    placeholder="예: 북측 높은 굴뚝"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">위치</label>
                  <Input
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="예: 1공장 북측"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      높이 (m)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.height}
                      onChange={(e) =>
                        setFormData({ ...formData, height: e.target.value })
                      }
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      직경 (m)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.diameter}
                      onChange={(e) =>
                        setFormData({ ...formData, diameter: e.target.value })
                      }
                      placeholder="1.2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">메모</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="측정 시 사다리 필요 등"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingStack(null);
                    setFormData({
                      internalCode: "",
                      internalName: "",
                      location: "",
                      height: "",
                      diameter: "",
                      description: "",
                    });
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600"
                >
                  취소
                </Button>
                <Button type="submit" className="flex-1">
                  {editingStack ? "수정" : "등록"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
