"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { ArrowLeft, Trash2, Send, Lock, Edit } from "lucide-react";

type Communication = {
  id: string;
  customerId: string;
  customer: { id: string; name: string };
  measurement?: { id: string; measuredAt: string; stack: { name: string } };
  stack?: { id: string; name: string };
  contactAt: string;
  channel: string;
  direction: string;
  subject: string | null;
  content: string;
  status: string;
  priority: string;
  createdBy: { id: string; name: string; email: string };
  assignedTo: { id: string; name: string; email: string } | null;
  attachments: any[];
  replies: any[];
  notes: any[];
  createdAt: string;
  updatedAt: string;
  isShared: boolean;
  contactOrg?: string;
  contactPerson?: string;
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

export default function CommunicationDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [communication, setCommunication] = useState<Communication | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [addingReply, setAddingReply] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ subject: "", content: "" });

  const user = session?.user as any;
  const isCustomer = user?.role === "CUSTOMER_ADMIN" || user?.role === "CUSTOMER_USER";
  const canEdit = communication?.createdBy.id === user?.id;
  const canEditContent = canEdit && (!communication?.replies || communication.replies.length === 0);
  const isCompleted = communication?.status === "COMPLETED";

  useEffect(() => {
    if (id) {
      fetchCommunication();
    }
  }, [id]);

  const fetchCommunication = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/communications/${id}`);
      
      if (!res.ok) {
        console.error("API error:", res.status, res.statusText);
        return;
      }
      
      const data = await res.json();

      // API가 communication 객체를 직접 반환하는 경우와 { communication: ... } 형태 모두 처리
      const comm = data.communication || data;
      
      if (comm && comm.id) {
        setCommunication(comm);
        setEditData({
          subject: comm.subject || "",
          content: comm.content || "",
        });
      } else {
        console.error("Invalid communication data:", data);
      }
    } catch (error) {
      console.error("Error fetching communication:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`상태를 ${STATUS_LABELS[newStatus].label}(으)로 변경하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/communications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchCommunication();
      } else {
        const data = await res.json();
        alert(data.error || "상태 변경 실패");
      }
    } catch (error) {
      console.error("Status change error:", error);
      alert("상태 변경 중 오류가 발생했습니다");
    }
  };

  const handleAddReply = async () => {
    if (!replyText.trim()) {
      alert("답변 내용을 입력해주세요");
      return;
    }

    try {
      setAddingReply(true);
      const res = await fetch(`/api/communications/${id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText }),
      });

      if (res.ok) {
        setReplyText("");
        fetchCommunication();
      } else {
        const data = await res.json();
        alert(data.error || "답변 추가 실패");
      }
    } catch (error) {
      console.error("Add reply error:", error);
      alert("답변 추가 중 오류가 발생했습니다");
    } finally {
      setAddingReply(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      alert("메모 내용을 입력해주세요");
      return;
    }

    try {
      setAddingNote(true);
      const res = await fetch(`/api/communications/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText }),
      });

      if (res.ok) {
        setNoteText("");
        fetchCommunication();
      } else {
        const data = await res.json();
        alert(data.error || "메모 추가 실패");
      }
    } catch (error) {
      console.error("Add note error:", error);
      alert("메모 추가 중 오류가 발생했습니다");
    } finally {
      setAddingNote(false);
    }
  };

  const handleShareTypeChange = async (isShared: boolean) => {
    try {
      const res = await fetch(`/api/communications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isShared }),
      });

      if (res.ok) {
        alert("공유 범위가 변경되었습니다");
        fetchCommunication();
      } else {
        const data = await res.json();
        alert(data.error || "변경 실패");
      }
    } catch (error) {
      console.error("Share type change error:", error);
      alert("변경 중 오류가 발생했습니다");
    }
  };

  const handleUpdate = async () => {
    if (!editData.content.trim()) {
      alert("내용을 입력해주세요");
      return;
    }

    try {
      const res = await fetch(`/api/communications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: editData.subject,
          content: editData.content,
        }),
      });

      if (res.ok) {
        alert("수정되었습니다");
        setEditing(false);
        fetchCommunication();
      } else {
        const data = await res.json();
        alert(data.error || "수정 실패");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("수정 중 오류가 발생했습니다");
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    try {
      const res = await fetch(`/api/communications/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("삭제되었습니다");
        router.push("/communications");
      } else {
        const data = await res.json();
        alert(data.error || "삭제 실패");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("삭제 중 오류가 발생했습니다");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!communication) {
    return null;
  }

  return (
    <section className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="secondary" onClick={() => router.push("/communications")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          커뮤니케이션 상세
        </h1>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-sm rounded ${STATUS_LABELS[communication.status].color}`}>
              {STATUS_LABELS[communication.status].label}
            </span>
            <span className="text-2xl">
              {PRIORITY_LABELS[communication.priority].icon}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {PRIORITY_LABELS[communication.priority].label}
            </span>
          </div>
          <div className="flex gap-2">
            {communication.status !== "COMPLETED" && (
              <Button size="sm" onClick={() => handleStatusChange("COMPLETED")}>
                완료 처리
              </Button>
            )}
            {canEditContent && !editing && !isCompleted && (
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                <Edit className="w-4 h-4 mr-1" />
                수정
              </Button>
            )}
            {editing && (
              <>
                <Button size="sm" onClick={handleUpdate}>
                  저장
                </Button>
                <Button size="sm" variant="secondary" onClick={() => {
                  setEditing(false);
                  setEditData({
                    subject: communication.subject || "",
                    content: communication.content || "",
                  });
                }}>
                  취소
                </Button>
              </>
            )}
            {canEdit && (
              <Button size="sm" variant="secondary" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {!isCustomer && (
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  공유 범위
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={communication.isShared === true}
                      onChange={async () => {
                        if (!communication.isShared) {
                          await handleShareTypeChange(true);
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">고객사 공유</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={communication.isShared === false}
                      disabled={communication.isShared === true}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">내부 전용</span>
                  </label>
                </div>
              </div>
              {communication.isShared === false && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  * 내부 전용은 고객사 공유로만 변경 가능합니다
                </p>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isCustomer ? "환경측정기업" : "고객사"}
              </div>
              <div className="font-medium text-gray-900 dark:text-white">
                {isCustomer ? (communication.contactOrg || "-") : communication.customer.name}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">소통 일시</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {new Date(communication.contactAt).toLocaleString("ko-KR")}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">채널</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {CHANNEL_LABELS[communication.channel]}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">작성자</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {communication.createdBy.name}
              </div>
            </div>
            {communication.assignedTo && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">담당자</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {communication.assignedTo.name}
                </div>
              </div>
            )}
          </div>

          {editing ? (
            <>
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">제목</label>
                <input
                  type="text"
                  value={editData.subject}
                  onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="제목 (선택사항)"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">내용 <span className="text-red-500">*</span></label>
                <textarea
                  value={editData.content}
                  onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="내용을 입력하세요"
                  required
                />
              </div>
            </>
          ) : (
            <>
              {communication.subject && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">제목</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {communication.subject}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">내용</div>
                <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {communication.content}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2열 레이아웃: 대화 내역 | 내부 메모 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 대화 내역 (공개) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            💬 대화 내역 (거래처 공유)
          </h2>

          <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto">
            {/* 답변들 */}
            {communication.replies && communication.replies.length > 0 ? (
              communication.replies.map((reply: any) => (
              <div
                key={reply.id}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {reply.createdBy.name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(reply.createdAt).toLocaleString("ko-KR", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </div>
                <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {reply.content}
                </div>
              </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                아직 답변이 없습니다
              </div>
            )}
          </div>

          {/* 답변 입력 */}
          {!isCompleted && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="답변을 입력하세요..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-end mt-2">
                <Button onClick={handleAddReply} disabled={addingReply}>
                  <Send className="w-4 h-4 mr-2" />
                  {addingReply ? "전송 중..." : "답변 전송"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 내부 메모 (비공개) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            내부 메모 (비공개)
          </h2>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2 mb-4">
            <p className="text-xs text-yellow-800 dark:text-yellow-300">
              우리 조직 내부에서만 공유되며, 거래처에는 노출되지 않습니다.
            </p>
          </div>

          <div className="space-y-3 mb-4 max-h-[500px] overflow-y-auto">
            {communication.notes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                등록된 내부 메모가 없습니다
              </div>
            ) : (
              communication.notes.map((note: any) => (
                <div
                  key={note.id}
                  className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {note.createdBy.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(note.createdAt).toLocaleString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {note.note}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 메모 입력 */}
          {!isCompleted && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="내부 메모를 입력하세요..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-end mt-2">
                <Button onClick={handleAddNote} disabled={addingNote}>
                  <Lock className="w-4 h-4 mr-2" />
                  {addingNote ? "저장 중..." : "메모 저장"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
