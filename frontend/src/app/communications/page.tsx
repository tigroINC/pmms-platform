"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { Plus, Filter, Search, HelpCircle } from "lucide-react";
import CommunicationFormModal from "@/components/modals/CommunicationFormModal";
import CommunicationHelpModal from "@/components/modals/CommunicationHelpModal";

type Communication = {
  id: string;
  customerId: string;
  customer: { id: string; name: string };
  contactAt: string;
  channel: string;
  direction: string;
  subject: string | null;
  content: string;
  status: string;
  priority: string;
  createdBy: { id: string; name: string; role: string };
  assignedTo: { id: string; name: string } | null;
  _count: { notes: number; attachments: number };
  createdAt: string;
  contactPerson: string | null;
  contactOrg: string | null;
  isShared: boolean;
};

const CHANNEL_LABELS: Record<string, string> = {
  PHONE: "📞 전화",
  EMAIL: "📧 이메일",
  VISIT: "👤 방문",
  KAKAO: "💬 카톡",
  SMS: "📱 SMS",
  FAX: "📠 팩스",
  OTHER: "기타",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "답변대기", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  IN_PROGRESS: { label: "대화중", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  COMPLETED: { label: "완료", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  REFERENCE: { label: "참고", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300" },
};

const PRIORITY_LABELS: Record<string, { label: string; icon: string }> = {
  URGENT: { label: "긴급", icon: "🔴" },
  HIGH: { label: "높음", icon: "🟠" },
  NORMAL: { label: "보통", icon: "⚪" },
  LOW: { label: "낮음", icon: "🔵" },
};

// 상태 레이블 가져오기 함수
const getStatusLabel = (status: string, isShared: boolean) => {
  if (status === "PENDING" && !isShared) {
    return { label: "완료전", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" };
  }
  return STATUS_LABELS[status];
};

export default function CommunicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showShareTypeDialog, setShowShareTypeDialog] = useState(false);
  const [selectedShareType, setSelectedShareType] = useState<boolean>(true); // true: 공유, false: 내부전용
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterChannel, setFilterChannel] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const user = session?.user as any;
  const isCustomer = user?.role === "CUSTOMER_ADMIN" || user?.role === "CUSTOMER_USER";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchCommunications();
    }
  }, [status, router, filterStatus, filterChannel, searchQuery, startDate, endDate]);

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterChannel) params.append("channel", filterChannel);
      if (searchQuery) params.append("search", searchQuery);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/communications?${params.toString()}`);
      const data = await res.json();
      
      if (res.ok) {
        setCommunications(data.data || []);
      } else {
        console.error("Failed to fetch communications:", data.error);
      }
    } catch (error) {
      console.error("Error fetching communications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) {
      alert("변경할 항목을 선택해주세요");
      return;
    }

    if (!confirm(`선택한 ${selectedIds.size}건을 ${STATUS_LABELS[newStatus].label} 상태로 변경하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch("/api/communications/bulk-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          status: newStatus,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(`${data.updated}건이 변경되었습니다`);
        setSelectedIds(new Set());
        fetchCommunications();
      } else {
        alert(`변경 실패: ${data.error}`);
      }
    } catch (error) {
      console.error("Bulk status change error:", error);
      alert("상태 변경 중 오류가 발생했습니다");
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === communications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(communications.map(c => c.id)));
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {/* 헤더 - 측정이력 스타일 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-2.5">
        <div className="flex flex-wrap items-end gap-2">
          <h1 className="text-lg font-semibold whitespace-nowrap mb-1.5">
            {isCustomer ? "소통 내역" : "고객 소통"}
          </h1>
          <span className="text-gray-300 dark:text-gray-600 mb-1.5">|</span>
          
          {/* 필터 */}
          <div className="flex flex-col" style={{ width: '140px', minWidth: '140px' }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">검색</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제목, 내용..."
              className="text-sm h-8 px-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex flex-col" style={{ width: '120px', minWidth: '120px' }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">상태</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm h-8 px-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">상태:전체</option>
              <option value="PENDING">답변대기</option>
              <option value="IN_PROGRESS">대화중</option>
              <option value="COMPLETED">완료</option>
              <option value="REFERENCE">참고</option>
            </select>
          </div>
          <div className="flex flex-col" style={{ width: '120px', minWidth: '120px' }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">채널</label>
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="text-sm h-8 px-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">전체</option>
              <option value="PHONE">전화</option>
              <option value="EMAIL">이메일</option>
              <option value="VISIT">방문</option>
              <option value="KAKAO">카톡</option>
              <option value="SMS">SMS</option>
            </select>
          </div>
          <div className="flex flex-col" style={{ width: '140px', minWidth: '140px' }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm h-8 px-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex flex-col" style={{ width: '140px', minWidth: '140px' }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm h-8 px-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          {/* 통계 카드 */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 px-3 py-1 flex items-center gap-1.5">
              <span className="text-xs text-gray-600 dark:text-gray-400">전체</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{communications.length}</span>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 px-3 py-1 flex items-center gap-1.5">
              <span className="text-xs text-gray-600 dark:text-gray-400">답변대기</span>
              <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{communications.filter(c => c.status === "PENDING").length}</span>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 px-3 py-1 flex items-center gap-1.5">
              <span className="text-xs text-gray-600 dark:text-gray-400">완료</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">{communications.filter(c => c.status === "COMPLETED").length}</span>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 px-3 py-1 flex items-center gap-1.5">
              <span className="text-xs text-gray-600 dark:text-gray-400">긴급</span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">{communications.filter(c => c.priority === "URGENT").length}</span>
            </div>
            
            <button
              onClick={() => setShowHelp(true)}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors flex items-center gap-1"
            >
              <HelpCircle className="w-4 h-4" />
              도움말
            </button>
            
            <Button onClick={() => {
              if (isCustomer) {
                setShowFormModal(true);
              } else {
                setShowShareTypeDialog(true);
              }
            }} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              {isCustomer ? "요청 등록" : "등록"}
            </Button>
          </div>
        </div>
      </div>

      {/* 일괄 작업 */}
      {!isCustomer && selectedIds.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
              {selectedIds.size}건 선택됨
            </span>
            <Button size="sm" variant="secondary" onClick={() => handleBulkStatusChange("COMPLETED")}>
              완료 처리
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleBulkStatusChange("REFERENCE")}>
              참고 처리
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setSelectedIds(new Set())}>
              선택 해제
            </Button>
          </div>
        </div>
      )}

      {/* 목록 - Desktop Table (헤더 고정) */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {!isCustomer && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === communications.length && communications.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">일시</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {isCustomer ? "환경측정기업" : "고객사"}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">채널</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">내용</th>
              {!isCustomer && (
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">공유범위</th>
              )}
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">우선순위</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {communications.map((comm) => (
              <tr
                key={comm.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                onClick={() => router.push(`/communications/${comm.id}`)}
              >
                {!isCustomer && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(comm.id)}
                      onChange={() => toggleSelection(comm.id)}
                      className="rounded"
                    />
                  </td>
                )}
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                  {new Date(comm.contactAt).toLocaleDateString("ko-KR", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {isCustomer ? (comm.contactOrg || "-") : comm.customer.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {CHANNEL_LABELS[comm.channel]}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-md">
                  <div className="font-medium">{comm.subject || "(제목 없음)"}</div>
                  <div className="text-gray-500 dark:text-gray-400 truncate">
                    {comm.content.substring(0, 50)}
                    {comm.content.length > 50 && "..."}
                  </div>
                  {(comm._count.notes > 0 || comm._count.attachments > 0) && (
                    <div className="text-xs text-gray-400 mt-1">
                      {comm._count.notes > 0 && `💬 ${comm._count.notes}`}
                      {comm._count.attachments > 0 && ` 📎 ${comm._count.attachments}`}
                    </div>
                  )}
                </td>
                {!isCustomer && (
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 text-xs rounded font-medium ${
                      comm.isShared 
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                        : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                    }`}>
                      {comm.isShared ? "고객사 공유" : "내부전용"}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 text-xs rounded font-medium ${
                    comm.priority === "URGENT" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                    comm.priority === "HIGH" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" :
                    comm.priority === "NORMAL" ? "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300" :
                    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  }`}>
                    {PRIORITY_LABELS[comm.priority].label}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 text-xs rounded ${getStatusLabel(comm.status, comm.isShared).color}`}>
                    {getStatusLabel(comm.status, comm.isShared).label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {communications.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            등록된 커뮤니케이션이 없습니다
          </div>
        )}
      </div>

      {/* 목록 - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {communications.map((comm) => (
          <div
            key={comm.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3"
            onClick={() => router.push(`/communications/${comm.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded ${getStatusLabel(comm.status, comm.isShared).color}`}>
                  {getStatusLabel(comm.status, comm.isShared).label}
                </span>
                <span className="text-lg">
                  {PRIORITY_LABELS[comm.priority].icon}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(comm.contactAt).toLocaleDateString("ko-KR", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            
            <div>
              <div className="font-medium text-gray-900 dark:text-white mb-1">
                {comm.subject || "(제목 없음)"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {comm.content}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div>🏢 {comm.customer.name}</div>
              <div>{CHANNEL_LABELS[comm.channel]}</div>
              {!isCustomer && (
                <div>
                  <span className={`px-2 py-1 text-xs rounded font-medium ${
                    comm.isShared 
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                      : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                  }`}>
                    {comm.isShared ? "고객사 공유" : "내부전용"}
                  </span>
                </div>
              )}
              {comm.assignedTo && <div>👤 {comm.assignedTo.name}</div>}
              {(comm._count.notes > 0 || comm._count.attachments > 0) && (
                <div>
                  {comm._count.notes > 0 && `💬 ${comm._count.notes} `}
                  {comm._count.attachments > 0 && `📎 ${comm._count.attachments}`}
                </div>
              )}
            </div>
          </div>
        ))}
        {communications.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            등록된 커뮤니케이션이 없습니다
          </div>
        )}
      </div>

      {/* 공유 타입 선택 다이얼로그 */}
      {showShareTypeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              소통 내역 유형 선택
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              등록할 소통 내역의 공유 범위를 선택해주세요
            </p>
            <div className="space-y-3 mb-6">
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                <input
                  type="radio"
                  name="shareType"
                  checked={selectedShareType === true}
                  onChange={() => setSelectedShareType(true)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">고객사 공유</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">고객사가 확인할 수 있는 소통 내역</div>
                </div>
              </label>
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                <input
                  type="radio"
                  name="shareType"
                  checked={selectedShareType === false}
                  onChange={() => setSelectedShareType(false)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">내부 전용</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">환경측정기업 내부에서만 확인 가능</div>
                </div>
              </label>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowShareTypeDialog(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={() => {
                  setShowShareTypeDialog(false);
                  setShowFormModal(true);
                }}
                className="flex-1"
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 등록 모달 */}
      <CommunicationFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSuccess={() => {
          setShowFormModal(false);
          fetchCommunications();
        }}
        initialShareType={selectedShareType}
      />

      {/* 도움말 모달 */}
      <CommunicationHelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </section>
  );
}
