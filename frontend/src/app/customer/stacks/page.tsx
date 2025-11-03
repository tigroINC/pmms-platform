"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { HelpCircle } from "lucide-react";

type PendingStack = {
  stackId: string;
  site: {
    code: string;
    name: string;
  };
  internal: {
    code: string;
    name: string | null;
    organization: {
      id: string;
      name: string;
    };
  } | null;
  physical: {
    location: string | null;
    height: number | null;
    diameter: number | null;
  };
  status: string;
  draftCreatedAt: string | null;
};

type ConfirmedStack = {
  id: string;
  name: string;
  code: string | null;
  fullName: string | null;
  facilityType: string | null;
  height: number | null;
  diameter: number | null;
  location: string | null;
  isActive: boolean;
  isVerified: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
  _count?: { measurements: number };
};

export default function CustomerStacksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pending" | "confirmed">("confirmed");
  const [pendingStacks, setPendingStacks] = useState<PendingStack[]>([]);
  const [confirmedStacks, setConfirmedStacks] = useState<ConfirmedStack[]>([]);
  const [selectedStacks, setSelectedStacks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (user?.role !== "CUSTOMER_ADMIN" && user?.role !== "CUSTOMER_USER") {
      router.push("/dashboard");
      return;
    }
    if (activeTab === "pending") {
      fetchPendingStacks();
    } else if (activeTab === "confirmed") {
      fetchConfirmedStacks();
    }
  }, [user, router, activeTab]);

  const fetchPendingStacks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customer/stacks/pending-review");
      const data = await res.json();
      setPendingStacks(data.stacks || []);
    } catch (error) {
      console.error("Failed to fetch pending stacks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfirmedStacks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stacks");
      const data = await res.json();
      // 활성화된 굴뚝만 필터링
      const active = (data.data || []).filter((s: any) => s.isActive);
      setConfirmedStacks(active);
    } catch (error) {
      console.error("Failed to fetch confirmed stacks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedStacks.size === pendingStacks.length) {
      setSelectedStacks(new Set());
    } else {
      setSelectedStacks(new Set(pendingStacks.map((s) => s.stackId)));
    }
  };

  const handleToggleSelect = (stackId: string) => {
    const newSet = new Set(selectedStacks);
    if (newSet.has(stackId)) {
      newSet.delete(stackId);
    } else {
      newSet.add(stackId);
    }
    setSelectedStacks(newSet);
  };

  const handleVerify = async (stackId: string) => {
    try {
      const res = await fetch(`/api/customer/stacks/${stackId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "확인 완료되었습니다.");
        fetchConfirmedStacks();
      } else {
        alert(data.error || "확인 실패");
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
    <section className="space-y-3">
      {/* Compact Header - 반응형 필터 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-2.5">
        <div className="flex flex-wrap items-end gap-2">
          <h1 className="text-lg font-semibold whitespace-nowrap mb-1.5">굴뚝 관리</h1>
          <span className="text-gray-300 dark:text-gray-600 mb-1.5">|</span>
          
          {/* 탭 */}
          <div className="flex gap-2 mb-1.5">
            <button
              onClick={() => setActiveTab("confirmed")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === "confirmed"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              전체 ({confirmedStacks.length})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === "pending"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              검토대기 ({pendingStacks.length})
            </button>
          </div>
          
          {/* 검색 필터 (전체 굴뚝 탭에서만 표시) */}
          {activeTab === "confirmed" && (
            <div className="flex flex-col" style={{ minWidth: '280px' }}>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">검색</label>
              <input
                type="text"
                placeholder="굴뚝번호, 코드, 명칭, 위치..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm h-8 px-3 border rounded dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          )}
          
          <div className="flex gap-2 ml-auto mb-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowHelp(true)}
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              도움말
            </Button>
            <Button size="sm" onClick={() => router.push("/customer/stacks/create")}>
              + 굴뚝 직접 등록
            </Button>
          </div>
        </div>
      </div>

      {/* 도움말 모달 */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowHelp(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">굴뚝 관리 도움말</h2>
              <button onClick={() => setShowHelp(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="font-semibold text-base mb-2">📋 메뉴 개요</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  자사의 모든 굴뚝 정보를 조회하고 관리할 수 있는 메뉴입니다. 환경측정기업이 등록한 굴뚝을 검토하거나, 직접 굴뚝을 등록할 수 있습니다.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">📑 탭 설명</h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-3">
                    <h4 className="font-medium mb-1">전체 굴뚝</h4>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                      <li>자사의 모든 활성화된 굴뚝 목록을 확인할 수 있습니다</li>
                      <li>검색 기능으로 굴뚝번호, 코드, 명칭, 위치로 검색 가능합니다</li>
                      <li>각 굴뚝의 측정 건수를 확인할 수 있습니다</li>
                      <li>확인 상태(확인완료/확인필요)를 표시합니다</li>
                      <li><strong>관리자</strong>는 "확인완료" 버튼으로 굴뚝 정보를 확인할 수 있습니다</li>
                      <li><strong>관리자</strong>는 "수정" 버튼으로 굴뚝 정보를 수정할 수 있습니다</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-3">
                    <h4 className="font-medium mb-1">검토 대기</h4>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                      <li>환경측정기업이 등록한 굴뚝 중 검토가 필요한 목록입니다</li>
                      <li>등록한 환경측정기업과 내부 코드 정보를 확인할 수 있습니다</li>
                      <li>"상세보기" 버튼으로 굴뚝 정보를 확인할 수 있습니다</li>
                      <li>검토 후 문제가 없으면 자동으로 전체 굴뚝으로 이동됩니다</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">➕ 굴뚝 직접 등록</h3>
                <div className="space-y-2 text-gray-600 dark:text-gray-400">
                  <p>우측 상단의 "+ 굴뚝 직접 등록" 버튼을 클릭하여 새로운 굴뚝을 등록할 수 있습니다.</p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                    <p className="font-medium text-blue-900 dark:text-blue-300 mb-2">필수 입력 항목:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>현장 코드</strong>: 자사에서 사용하는 굴뚝 코드 (예: S-001)</li>
                      <li><strong>현장 명칭</strong>: 굴뚝의 명칭 (예: 1호 소각로)</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded">
                    <p className="font-medium text-gray-900 dark:text-gray-300 mb-2">선택 입력 항목:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>위치, 배출시설 종류, 높이, 직경, 카테고리 등</li>
                    </ul>
                  </div>
                  <p className="text-sm italic">💡 직접 등록한 굴뚝은 즉시 활성화되어 측정 데이터 입력이 가능합니다.</p>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">✏️ 굴뚝 정보 수정</h3>
                <div className="space-y-2 text-gray-600 dark:text-gray-400">
                  <p>전체 굴뚝 탭에서 "수정" 버튼을 클릭하여 굴뚝 정보를 수정할 수 있습니다.</p>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                    <p className="font-medium text-green-900 dark:text-green-300 mb-2">수정 가능 항목:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>굴뚝 코드, 정식 명칭, 배출시설 종류</li>
                      <li>위치, 높이, 직경, 설명</li>
                    </ul>
                  </div>
                  <p className="text-sm italic">⚠️ 수정 시 반드시 <strong>수정 사유</strong>를 입력해야 하며, 모든 수정 이력이 자동으로 기록됩니다.</p>
                  <p className="text-sm italic">📌 굴뚝번호는 환경측정기업 전용 필드로 수정할 수 없습니다.</p>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">🔔 알림 기능</h3>
                <div className="space-y-2 text-gray-600 dark:text-gray-400">
                  <ul className="list-disc list-inside space-y-1">
                    <li>환경측정기업이 굴뚝을 등록하면 실시간 알림을 받습니다</li>
                    <li>굴뚝 정보를 수정하면 담당 환경측정기업에게 알림이 전송됩니다</li>
                    <li>우측 상단 알림 아이콘에서 확인할 수 있습니다</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">❓ 자주 묻는 질문</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">Q. 굴뚝 정보에 오류가 있으면 어떻게 하나요?</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      A. "수정" 버튼을 클릭하여 직접 수정할 수 있습니다. 수정 사유를 입력하면 담당 환경측정기업에게 알림이 전송됩니다.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Q. 검토 대기 중인 굴뚝은 측정이 가능한가요?</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      A. 네, 가능합니다. 활성화된 모든 굴뚝은 검토 여부와 관계없이 측정 데이터 입력이 가능합니다.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Q. 확인완료 버튼은 무엇인가요?</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      A. 굴뚝 정보를 확인했음을 표시하는 기능입니다. 측정 가능 여부와는 무관하며, 정보 확인 여부만 표시합니다.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowHelp(false)}>닫기</Button>
            </div>
          </div>
        </div>
      )}


      {activeTab === "pending" && (
        <>

          {pendingStacks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">
                검토가 필요한 굴뚝이 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingStacks.map((stack) => (
                <div
                  key={stack.stackId}
                  className="p-4 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedStacks.has(stack.stackId)}
                      onChange={() => handleToggleSelect(stack.stackId)}
                      className="mt-1 h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-mono text-lg font-semibold">
                          {stack.site.code}
                        </h3>
                        <span className="px-2 py-0.5 text-xs rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                          검토 대기
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        {stack.site.name}
                      </p>
                      {stack.internal && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          등록: {stack.internal.organization.name} (
                          {stack.internal.code})
                        </p>
                      )}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {stack.physical.location && (
                          <p>위치: {stack.physical.location}</p>
                        )}
                        {(stack.physical.height || stack.physical.diameter) && (
                          <p>
                            {stack.physical.height && `${stack.physical.height}m`}
                            {stack.physical.height && stack.physical.diameter &&
                              " / "}
                            {stack.physical.diameter &&
                              `Ø${stack.physical.diameter}m`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push(`/customer/stacks/${stack.stackId}/edit`)
                        }
                      >
                        상세보기
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "confirmed" && (
        <>
          {confirmedStacks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">
                확정된 굴뚝이 없습니다.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-white dark:bg-gray-900">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      굴뚝번호
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      확인 상태
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      굴뚝코드
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      굴뚝 정식 명칭
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      배출시설 종류
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      위치
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      높이(m)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      직경(m)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      측정 건수
                    </th>
                    {user?.role === "CUSTOMER_ADMIN" && (
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        액션
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {confirmedStacks
                    .filter((stack) => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        stack.name?.toLowerCase().includes(q) ||
                        stack.code?.toLowerCase().includes(q) ||
                        stack.fullName?.toLowerCase().includes(q) ||
                        stack.facilityType?.toLowerCase().includes(q) ||
                        stack.location?.toLowerCase().includes(q)
                      );
                    })
                    .map((stack) => (
                      <tr key={stack.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-mono">{stack.name}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          {stack.isVerified ? (
                            <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                              ✓ 확인완료
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                              확인필요
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono">{stack.code || "-"}</td>
                        <td className="px-4 py-3 text-sm">{stack.fullName || "-"}</td>
                        <td className="px-4 py-3 text-sm">{stack.facilityType || "-"}</td>
                        <td className="px-4 py-3 text-sm">{stack.location || "-"}</td>
                        <td className="px-4 py-3 text-sm text-center">{stack.height ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-center">{stack.diameter ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          {stack._count?.measurements || 0}
                        </td>
                        {user?.role === "CUSTOMER_ADMIN" && (
                          <td className="px-4 py-3 text-sm text-center">
                            <div className="flex gap-2 justify-center">
                              {!stack.isVerified && (
                                <button
                                  onClick={() => handleVerify(stack.id)}
                                  className="text-blue-600 hover:underline text-xs"
                                >
                                  확인완료
                                </button>
                              )}
                              <button
                                onClick={() => router.push(`/customer/stacks/${stack.id}/edit`)}
                                className="text-green-600 hover:underline text-xs"
                              >
                                수정
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
