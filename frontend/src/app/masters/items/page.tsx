"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import ItemFormModal from "@/components/modals/ItemFormModal";
import BulkUploadModal from "@/components/modals/BulkUploadModal";
import HelpModal from "@/components/modals/HelpModal";
import { getMeasurementItemsHelpSections } from "@/lib/help/measurementItemsHelp";

type Item = {
  id?: string;
  key: string;
  name: string;
  englishName: string | null;
  unit: string;
  category: string | null;
  classification: string | null;
  limit: number;
  hasLimit: boolean;
  isActive?: boolean;
  order?: number;
};

export default function ItemsPage() {
  const { user } = useAuth();
  const role = user?.role;
  const [activeTab, setActiveTab] = useState<"items" | "stack-items">("items");
  const [list, setList] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Item>>({});
  const [showInactive, setShowInactive] = useState(false);
  
  // 굴뚝별 측정 대상 설정 state
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [stacks, setStacks] = useState<any[]>([]);
  const [selectedStackId, setSelectedStackId] = useState("");
  const [stackItems, setStackItems] = useState<any[]>([]);
  const [loadingStackItems, setLoadingStackItems] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [availableItemsToAdd, setAvailableItemsToAdd] = useState<any[]>([]);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchStacks(selectedCustomerId);
    } else {
      setStacks([]);
      setSelectedStackId("");
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    if (selectedStackId) {
      fetchStackItems(selectedStackId);
    } else {
      setStackItems([]);
    }
  }, [selectedStackId]);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/items");
      const json = await res.json();
      setList(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const json = await res.json();
      setCustomers(json.customers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStacks = async (customerId: string) => {
    try {
      const res = await fetch(`/api/stacks?customerId=${customerId}`);
      const json = await res.json();
      setStacks(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStackItems = async (stackId: string) => {
    setLoadingStackItems(true);
    console.log(`[fetchStackItems] 굴뚝 ID: ${stackId}`);
    try {
      const res = await fetch(`/api/stacks/${stackId}/measurement-items`);
      console.log(`[fetchStackItems] API 응답 상태:`, res.status);
      const json = await res.json();
      console.log(`[fetchStackItems] API 응답 데이터:`, json);
      setStackItems(json.items || []);
    } catch (err) {
      console.error('[fetchStackItems] 에러:', err);
      setStackItems([]);
    } finally {
      setLoadingStackItems(false);
    }
  };

  const handleToggleStackItem = async (itemKey: string, isActive: boolean) => {
    if (!selectedStackId) return;
    
    // 낙관적 업데이트
    setStackItems(prev => 
      prev.map(item => 
        item.key === itemKey ? { ...item, isActive } : item
      )
    );

    try {
      const updatedItems = stackItems.map(item => ({
        itemKey: item.key,
        isActive: item.key === itemKey ? isActive : item.isActive,
        order: item.order,
      }));

      const res = await fetch(`/api/stacks/${selectedStackId}/measurement-items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updatedItems }),
      });

      if (!res.ok) {
        throw new Error("설정 저장 실패");
      }
    } catch (err: any) {
      alert(err.message || "설정 저장 중 오류가 발생했습니다.");
      // 실패 시 되돌리기
      fetchStackItems(selectedStackId);
    }
  };

  const handleOpenAddItemModal = () => {
    // 현재 굴뚝에 없는 오염물질 + 채취환경 필터링
    const currentItemKeys = new Set(stackItems.map(item => item.key));
    const available = list.filter(item => 
      (item.category === "오염물질" || item.category === "채취환경") && !currentItemKeys.has(item.key)
    );
    setAvailableItemsToAdd(available);
    setShowAddItemModal(true);
  };

  const handleAddItemToStack = async (itemKey: string) => {
    if (!selectedStackId) return;

    try {
      const newItems = [
        ...stackItems.map(item => ({
          itemKey: item.key,
          isActive: item.isActive,
          order: item.order,
        })),
        {
          itemKey,
          isActive: true,
          order: 0,
        }
      ];

      const res = await fetch(`/api/stacks/${selectedStackId}/measurement-items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: newItems }),
      });

      if (!res.ok) {
        throw new Error("항목 추가 실패");
      }

      // 목록 새로고침
      await fetchStackItems(selectedStackId);
      setShowAddItemModal(false);
      alert("항목이 추가되었습니다.");
    } catch (err: any) {
      alert(err.message || "항목 추가 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteStackItem = async (itemKey: string, itemName: string) => {
    if (!selectedStackId) return;
    
    if (!confirm(`"${itemName}" 항목을 삭제하시겠습니까?\n측정 이력이 있는 항목은 삭제할 수 없습니다.`)) {
      return;
    }

    try {
      // 해당 항목을 제외한 나머지 항목들로 업데이트
      const remainingItems = stackItems
        .filter(item => item.key !== itemKey)
        .map(item => ({
          itemKey: item.key,
          isActive: item.isActive,
          order: item.order,
        }));

      const res = await fetch(`/api/stacks/${selectedStackId}/measurement-items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: remainingItems }),
      });

      if (!res.ok) {
        throw new Error("항목 삭제 실패");
      }

      // 목록 새로고침
      await fetchStackItems(selectedStackId);
      alert("항목이 삭제되었습니다.");
    } catch (err: any) {
      alert(err.message || "항목 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleResetStackItems = async () => {
    if (!selectedStackId) return;
    
    if (!confirm("해당 굴뚝의 측정항목 설정을 전체 기준으로 초기화하시겠습니까?\n\n개별 설정된 모든 항목이 삭제되고, 전체 기본 항목으로 대체됩니다.")) {
      return;
    }

    try {
      const res = await fetch(`/api/stacks/${selectedStackId}/measurement-items`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("초기화 실패");
      }

      await fetchStackItems(selectedStackId);
      alert("전체 기준으로 초기화되었습니다.");
    } catch (err: any) {
      alert(err.message || "초기화 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateOrder = async (itemKey: string, newOrder: number) => {
    if (!selectedStackId) return;

    // 낙관적 업데이트
    setStackItems(prev => 
      prev.map(item => 
        item.key === itemKey ? { ...item, order: newOrder } : item
      )
    );

    try {
      const updatedItems = stackItems.map(item => ({
        itemKey: item.key,
        isActive: item.isActive,
        order: item.key === itemKey ? newOrder : item.order,
      }));

      const res = await fetch(`/api/stacks/${selectedStackId}/measurement-items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updatedItems }),
      });

      if (!res.ok) {
        throw new Error("순서 변경 실패");
      }
    } catch (err: any) {
      alert(err.message || "순서 변경 중 오류가 발생했습니다.");
      // 실패 시 되돌리기
      fetchStackItems(selectedStackId);
    }
  };

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(list.map((item) => item.category).filter(Boolean)));
    return uniqueCategories.sort();
  }, [list]);

  const filtered = useMemo(() => {
    const items = list.filter((item: any) => {
      // 비활성 필터링
      const isActive = item.isActive !== false;
      if (!showInactive && !isActive) return false;

      if (!q) {
        const matchesCategory = categoryFilter === "전체" || item.category === categoryFilter;
        return matchesCategory;
      }

      const searchLower = q.toLowerCase();
      const matchesSearch =
        (item.key && item.key.toLowerCase().includes(searchLower)) ||
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.englishName && item.englishName.toLowerCase().includes(searchLower)) ||
        (item.unit && item.unit.toLowerCase().includes(searchLower)) ||
        (item.category && item.category.toLowerCase().includes(searchLower));

      const matchesCategory = categoryFilter === "전체" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    // 정렬 함수: order가 0이 아닌 항목 우선, 같은 order는 name으로 정렬
    const sortByOrder = (a: any, b: any) => {
      const aOrder = a.order ?? 0;
      const bOrder = b.order ?? 0;
      if (aOrder === 0 && bOrder !== 0) return 1;
      if (aOrder !== 0 && bOrder === 0) return -1;
      if (aOrder === bOrder) return a.name.localeCompare(b.name);
      return aOrder - bOrder;
    };

    // 오염물질과 채취환경 분리
    const pollutants = items.filter(item => item.category === "오염물질");
    const auxiliary = items.filter(item => item.category === "채취환경");
    const others = items.filter(item => item.category !== "오염물질" && item.category !== "채취환경");
    
    // 각각 정렬
    pollutants.sort(sortByOrder);
    auxiliary.sort(sortByOrder);
    others.sort(sortByOrder);
    
    // 오염물질 → 채취환경 → 기타 순서
    return [...pollutants, ...auxiliary, ...others];
  }, [list, q, categoryFilter, showInactive]);

  const handleBulkUpload = async (file: File): Promise<{ success: boolean; message: string; count?: number }> => {
    try {
      const text = await file.text();
      const res = await fetch("/api/measurement-items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: text }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        fetchItems();
        return {
          success: true,
          message: data.message || "업로드 성공",
          count: data.count,
        };
      } else {
        return {
          success: false,
          message: data.error || "업로드 실패",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "오류 발생",
      };
    }
  };

  const onExport = () => {
    const header = ["항목코드", "항목명(한글)", "항목명(영문)", "기본단위", "구분", "항목분류", "허용기준값(기본)"];
    const body = filtered.map((item: any) => [
      item.key || "",
      item.name || "",
      item.englishName || "",
      item.unit || "",
      item.category || "",
      item.classification || "",
      item.limit || ""
    ]);
    const csv = [header, ...body].map((cols) => cols.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `items_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEdit = (item: any) => {
    setEditingRowKey(item.key);
    setEditingData({
      key: item.key,
      name: item.name,
      englishName: item.englishName,
      unit: item.unit,
      category: item.category,
      classification: item.classification,
      limit: item.limit,
      hasLimit: item.hasLimit,
      inputType: item.inputType || "number",
      options: item.options || "",
    });
  };

  const handleSaveEdit = async (itemKey: string) => {
    try {
      const res = await fetch(`/api/items/${itemKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: itemKey,
          ...editingData,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "수정 실패");
      }
      setEditingRowKey(null);
      setEditingData({});
      fetchItems();
    } catch (err: any) {
      alert(err.message || "수정 중 오류가 발생했습니다.");
    }
  };

  const handleCancelEdit = () => {
    setEditingRowKey(null);
    setEditingData({});
  };

  const toggleActive = async (item: any) => {
    try {
      const res = await fetch(`/api/items/${item.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "상태 변경 실패");
      }
      fetchItems();
    } catch (err: any) {
      alert(err.message || "상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`${item.name} (항목코드: ${item.key})를 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "삭제 실패");
      }
      alert("삭제되었습니다.");
      fetchItems();
    } catch (err: any) {
      alert(err.message || "삭제 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateItemOrder = async (itemKey: string, newOrder: number) => {
    try {
      const res = await fetch(`/api/items/${itemKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "순서 변경 실패");
      }
      fetchItems();
    } catch (err: any) {
      alert(err.message || "순서 변경 중 오류가 발생했습니다.");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  return (
    <section className="space-y-3">
      {/* Compact Header - 반응형 필터 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-2.5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex flex-wrap items-end gap-2">
            <h1 className="text-lg font-semibold whitespace-nowrap mb-1.5">측정항목 관리</h1>
            <span className="text-gray-300 dark:text-gray-600 mb-1.5">|</span>
            
            {/* 탭 */}
            <div className="flex gap-2 mb-1.5">
            <button
              onClick={() => setActiveTab("items")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === "items"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              📋 전체 항목 관리
            </button>
            <button
              onClick={() => setActiveTab("stack-items")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === "stack-items"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              🏭 굴뚝별 측정 대상 설정
            </button>
          </div>
          </div>
          
          {/* 도움말 버튼 */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded mb-1.5"
          >
            ❓ 도움말
          </button>
        </div>
        
        <div className="flex flex-wrap items-end gap-2">
          <span className="text-gray-300 dark:text-gray-600 mb-1.5">|</span>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">검색</label>
            <Input
              className="text-sm h-8"
              style={{ width: '352px', minWidth: '352px' }}
              value={q}
              onChange={(e) => setQ((e.target as HTMLInputElement).value)}
              placeholder="항목코드, 항목명, 영문명, 단위 등"
            />
          </div>
          <div className="flex flex-col" style={{ width: '176px', minWidth: '176px' }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">항목 분류</label>
            <select
              className="text-sm h-8 w-full border rounded px-2 bg-white dark:bg-gray-800"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option>전체</option>
              {categories.map((cat) => (
                <option key={cat || "unknown"} value={cat || ""}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          {activeTab === "items" && (
            <label className="flex items-center gap-2 text-sm mb-1.5">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4"
              />
              비활성 표시
            </label>
          )}
          <div className="flex gap-1.5 ml-auto mb-1.5">
            {(role === "SUPER_ADMIN" || role === "ORG_ADMIN") && activeTab === "items" && (
              <>
                <Button size="sm" variant="secondary" onClick={onExport}>Excel</Button>
                <Button size="sm" variant="secondary" onClick={() => setShowBulkUploadModal(true)}>일괄업로드</Button>
                <Button size="sm" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>+ 신규 추가</Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 전체 항목 관리 탭 */}
      {activeTab === "items" && (
        <>
        {/* Desktop Table */}
        <div className="hidden md:block rounded-lg border overflow-x-auto max-h-[calc(100vh-180px)] overflow-y-auto">
        <Table className="min-w-[1200px]">
          <Thead className="bg-gray-50 dark:bg-white/10 sticky top-0 z-10">
            <Tr>
              <Th className="bg-gray-50 dark:bg-gray-800">상태</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">순서</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">구분</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">항목코드</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">항목명(한글)</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">항목명(영문)</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">기본단위</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">항목분류</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">허용기준값(기본)</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">입력타입</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">선택옵션</Th>
              {(role === "SUPER_ADMIN" || role === "ORG_ADMIN") && <Th className="w-40 bg-gray-50 dark:bg-gray-800">액션</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {filtered.length === 0 ? (
              <Tr>
                <Td colSpan={(role === "SUPER_ADMIN" || role === "ORG_ADMIN") ? 12 : 11} className="text-center text-gray-500 py-8">
                  등록된 측정항목이 없습니다
                </Td>
              </Tr>
            ) : (
              filtered.map((item: any) => {
                const isActive = item.isActive !== false;
                const isEditing = editingRowKey === item.key;
                return (
                  <Tr key={item.key} className={!isActive ? "opacity-50 bg-gray-50 dark:bg-gray-900/20" : ""}>
                    <Td>
                      {isActive ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                          활성
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-xs">
                          비활성
                        </span>
                      )}
                    </Td>
                    <Td>
                      <input
                        type="number"
                        value={item.order || 0}
                        onChange={(e) => handleUpdateItemOrder(item.key, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-center border rounded text-sm"
                        min="0"
                        disabled={role !== "SUPER_ADMIN" && role !== "ORG_ADMIN" || isEditing}
                      />
                    </Td>
                    <Td>
                      {isEditing ? (
                        <select
                          value={editingData.category || ""}
                          onChange={(e) => setEditingData({ ...editingData, category: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        >
                          <option value="">-</option>
                          <option value="오염물질">오염물질</option>
                          <option value="채취환경">채취환경</option>
                        </select>
                      ) : (
                        item.category || "-"
                      )}
                    </Td>
                    <Td className="font-mono text-xs">{item.key}</Td>
                    <Td className="font-medium">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingData.name || ""}
                          onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      ) : (
                        item.name
                      )}
                    </Td>
                    <Td className="text-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingData.englishName || ""}
                          onChange={(e) => setEditingData({ ...editingData, englishName: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      ) : (
                        item.englishName || "-"
                      )}
                    </Td>
                    <Td className="text-center">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingData.unit || ""}
                          onChange={(e) => setEditingData({ ...editingData, unit: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm text-center"
                        />
                      ) : (
                        item.unit
                      )}
                    </Td>
                    <Td className="text-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingData.classification || ""}
                          onChange={(e) => setEditingData({ ...editingData, classification: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                          placeholder="금속화합물, 무기물질 등"
                        />
                      ) : (
                        item.classification || "-"
                      )}
                    </Td>
                    <Td className="text-center">
                      {isEditing ? (
                          <input
                            type="number"
                            value={editingData.limit ?? ""}
                            onChange={(e) => setEditingData({ ...editingData, limit: parseFloat(e.target.value) })}
                            className="w-full px-2 py-1 border rounded text-sm text-center"
                            step="0.01"
                          />
                        ) : (
                          item.limit
                        )}
                      </Td>
                      <Td>
                        {isEditing ? (
                          <select
                            value={(editingData as any).inputType || "number"}
                            onChange={(e) => setEditingData({ ...editingData, inputType: e.target.value } as any)}
                            className="w-full px-2 py-1 border rounded text-sm"
                          >
                            <option value="number">숫자</option>
                            <option value="select">선택</option>
                            <option value="text">텍스트</option>
                          </select>
                        ) : (
                          item.inputType === "select" ? "선택" : item.inputType === "text" ? "텍스트" : "숫자"
                        )}
                      </Td>
                      <Td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={(editingData as any).options || ""}
                            onChange={(e) => setEditingData({ ...editingData, options: e.target.value } as any)}
                            className="w-full px-2 py-1 border rounded text-sm"
                            placeholder='["옵션1","옵션2"]'
                            disabled={(editingData as any).inputType !== "select"}
                          />
                        ) : (
                          item.options || "-"
                        )}
                      </Td>
                      {(role === "SUPER_ADMIN" || role === "ORG_ADMIN") && (
                        <Td>
                          <div className="flex gap-2 whitespace-nowrap">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(item.key)}
                                  className="text-xs text-green-600 hover:underline font-semibold"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="text-xs text-gray-600 hover:underline"
                                >
                                  취소
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="text-xs text-green-600 hover:underline"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => toggleActive(item)}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  {isActive ? "비활성화" : "활성화"}
                                </button>
                                {!isActive && (
                                  <button
                                    onClick={() => handleDelete(item)}
                                    className="text-xs text-red-600 hover:underline"
                                  >
                                    삭제
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </Td>
                      )}
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-6 text-center text-gray-500">
              등록된 측정항목이 없습니다
            </div>
          ) : (
            filtered.map((item: any) => {
              const isActive = item.isActive !== false;
              const isEditing = editingRowKey === item.key;
              return (
                <div key={item.key} className={`rounded-lg border bg-white/50 dark:bg-white/5 p-4 space-y-2 ${!isActive ? "opacity-50" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
                      {isActive ? "활성" : "비활성"}
                    </span>
                    {(role === "SUPER_ADMIN" || role === "ORG_ADMIN") && !isEditing && (
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(item)} className="text-xs text-blue-600 hover:underline">수정</button>
                        <button onClick={() => toggleActive(item)} className="text-xs text-blue-600 hover:underline">
                          {isActive ? "비활성화" : "활성화"}
                        </button>
                        {!isActive && (
                          <button onClick={() => handleDelete(item.key)} className="text-xs text-gray-600 hover:underline">삭제</button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500">구분</label>
                        <select
                          value={editingData.category || ""}
                          onChange={(e) => setEditingData({ ...editingData, category: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm mt-1"
                        >
                          <option value="">-</option>
                          <option value="오염물질">오염물질</option>
                          <option value="채취환경">채취환경</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">항목명(한글)</label>
                        <input
                          type="text"
                          value={editingData.name || ""}
                          onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">항목명(영문)</label>
                        <input
                          type="text"
                          value={editingData.englishName || ""}
                          onChange={(e) => setEditingData({ ...editingData, englishName: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500">단위</label>
                          <input
                            type="text"
                            value={editingData.unit || ""}
                            onChange={(e) => setEditingData({ ...editingData, unit: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">기준값</label>
                          <input
                            type="number"
                            value={editingData.limit || ""}
                            onChange={(e) => setEditingData({ ...editingData, limit: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 border rounded text-sm mt-1"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => handleSaveEdit(item.key)} className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">저장</button>
                        <button onClick={handleCancelEdit} className="flex-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm">취소</button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">📋 코드:</span> {item.key}</div>
                      <div><span className="text-gray-500">🔢 순서:</span> {item.order || 0}</div>
                      <div><span className="text-gray-500">🏷️ 구분:</span> {item.category || "-"}</div>
                      <div><span className="text-gray-500">📊 분류:</span> {item.type || "-"}</div>
                      <div className="col-span-2"><span className="text-gray-500">📝 한글명:</span> {item.name}</div>
                      <div className="col-span-2"><span className="text-gray-500">🔤 영문명:</span> {item.englishName || "-"}</div>
                      <div><span className="text-gray-500">📏 단위:</span> {item.unit || "-"}</div>
                      <div><span className="text-gray-500">⚠️ 기준:</span> {item.defaultLimit ?? "-"}</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        </>
      )}

      {/* 굴뚝별 측정 대상 설정 탭 */}
      {activeTab === "stack-items" && (
        <div className="space-y-3">
          {/* 고객사 및 굴뚝 선택 */}
          <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col" style={{ width: '280px' }}>
                <label className="text-sm font-medium mb-1.5">고객사 선택</label>
                <select
                  className="text-sm h-9 border rounded px-3 bg-white dark:bg-gray-800"
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    setSelectedStackId("");
                  }}
                >
                  <option value="">고객사를 선택하세요</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col" style={{ width: '280px' }}>
                <label className="text-sm font-medium mb-1.5">굴뚝 선택</label>
                <select
                  className="text-sm h-9 border rounded px-3 bg-white dark:bg-gray-800"
                  value={selectedStackId}
                  onChange={(e) => setSelectedStackId(e.target.value)}
                  disabled={!selectedCustomerId}
                >
                  <option value="">{selectedCustomerId ? "굴뚝을 선택하세요" : "먼저 고객사를 선택하세요"}</option>
                  {stacks.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} - {s.fullName || s.siteName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 측정 대상 항목 목록 */}
          {selectedStackId && (
            <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-4">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold mb-1">📊 측정 이력 기반 항목 (자동 감지)</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    해당 굴뚝에서 과거에 측정된 오염물질 항목입니다. 체크를 해제하면 측정 대상에서 제외됩니다.
                  </p>
                </div>
                {(role === "SUPER_ADMIN" || role === "ORG_ADMIN") && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={handleResetStackItems}>
                      🔄 전체 기준으로 초기화
                    </Button>
                    <Button size="sm" onClick={handleOpenAddItemModal}>
                      + 신규추가
                    </Button>
                  </div>
                )}
              </div>

              {loadingStackItems ? (
                <div className="text-center py-8 text-gray-500">
                  로딩 중...
                </div>
              ) : stackItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">측정 이력이 없습니다.</p>
                  <p className="text-sm">측정 데이터를 입력하면 자동으로 항목이 표시됩니다.</p>
                </div>
              ) : (
                <>
                  {/* 오염물질 항목 */}
                  {stackItems.filter(item => item.category === "오염물질").length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                        🏭 오염물질 ({stackItems.filter(item => item.category === "오염물질").length}개)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stackItems.filter(item => item.category === "오염물질").map((item) => (
                    <div
                      key={item.key}
                      className={`border rounded-lg p-3 hover:shadow-md transition-shadow ${
                        !item.isActive
                          ? 'bg-gray-100 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 opacity-60'
                          : item.measurementCount === 0 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                            : 'bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={item.isActive}
                          onChange={(e) => handleToggleStackItem(item.key, e.target.checked)}
                          className="w-5 h-5 mt-0.5 accent-blue-600 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          {/* 1행: 항목명 + 코드 + 뱃지 */}
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-base truncate">{item.name}</span>
                            {!item.isActive && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-400 text-white rounded-full">
                                비활성
                              </span>
                            )}
                            {item.isActive && item.measurementCount === 0 && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded-full">
                                NEW
                              </span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">코드: {item.key}</span>
                          </div>
                          {/* 2행: 단위 / 기준 / 측정횟수 / 순서 */}
                          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                            <span>단위: {item.unit}</span>
                            <span>•</span>
                            <span>기준: <span className="font-medium text-blue-600 dark:text-blue-400">{item.limit}</span></span>
                            <span>•</span>
                            <span className={`font-medium ${
                              item.measurementCount === 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-orange-600 dark:text-orange-400'
                            }`}>
                              📊 {item.measurementCount === 0 ? '신규 추가' : `${item.measurementCount}회`}
                            </span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <span>순서:</span>
                              <input
                                type="number"
                                value={item.order}
                                onChange={(e) => handleUpdateOrder(item.key, parseInt(e.target.value) || 0)}
                                className="w-12 px-1 py-0.5 text-center border rounded text-xs"
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                        {/* 삭제 버튼 (신규 추가 항목만) */}
                        {item.measurementCount === 0 && (role === "SUPER_ADMIN" || role === "ORG_ADMIN") && (
                          <button
                            onClick={() => handleDeleteStackItem(item.key, item.name)}
                            className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="삭제"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 채취환경 */}
                  {stackItems.filter(item => item.category === "채취환경").length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                        🌡️ 채취환경 ({stackItems.filter(item => item.category === "채취환경").length}개)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stackItems.filter(item => item.category === "채취환경").map((item) => (
                          <div
                            key={item.key}
                            className={`border rounded-lg p-3 hover:shadow-md transition-shadow ${
                              !item.isActive
                                ? 'bg-gray-100 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 opacity-60'
                                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={item.isActive}
                                onChange={(e) => handleToggleStackItem(item.key, e.target.checked)}
                                className="w-5 h-5 mt-0.5 accent-blue-600 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-base truncate">{item.name}</span>
                                  {!item.isActive && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-400 text-white rounded-full">
                                      비활성
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500 dark:text-gray-400">코드: {item.key}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                                  <span>단위: {item.unit}</span>
                                  <span>•</span>
                                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                                    📊 {item.measurementCount}회
                                  </span>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <span>순서:</span>
                                    <input
                                      type="number"
                                      value={item.order}
                                      onChange={(e) => handleUpdateOrder(item.key, parseInt(e.target.value) || 0)}
                                      className="w-12 px-1 py-0.5 text-center border rounded text-xs"
                                      min="0"
                                    />
                                  </div>
                                </div>
                              </div>
                              {/* 삭제 버튼 (신규 추가 항목만) */}
                              {item.measurementCount === 0 && (role === "SUPER_ADMIN" || role === "ORG_ADMIN") && (
                                <button
                                  onClick={() => handleDeleteStackItem(item.key, item.name)}
                                  className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="삭제"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {!selectedStackId && (
            <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-12 text-center text-gray-500">
              <p className="text-lg mb-2">🏭 굴뚝을 선택하세요</p>
              <p className="text-sm">고객사와 굴뚝을 선택하면 측정 대상 항목을 관리할 수 있습니다.</p>
            </div>
          )}
        </div>
      )}

      <ItemFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={fetchItems}
        item={editingItem}
      />

      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        title="측정항목 일괄업로드"
        templateHeaders={["항목코드", "항목명(한글)", "항목명(영문)", "기본단위", "구분", "항목분류", "허용기준값(기본)"]}
        exampleRow={["EA-I-0001", "먼지", "Dust", "mg/Sm³", "오염물질", "무기물질", "30"]}
        templateFileName="측정항목_일괄업로드_양식.csv"
        onUpload={handleBulkUpload}
        parseInstructions="항목코드, 항목명(한글), 기본단위, 허용기준값(기본)은 필수 항목입니다. 구분은 '오염물질' 또는 '채취환경'을 입력하세요."
      />

      {/* 항목 추가 모달 */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddItemModal(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">측정항목 추가</h2>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              이 굴뚝에 추가할 측정항목을 선택하세요. (오염물질 + 채취환경)
            </p>

            {availableItemsToAdd.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                추가 가능한 항목이 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {availableItemsToAdd.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        {item.key} • {item.unit} • 기준: {item.limit}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddItemToStack(item.key)}
                    >
                      추가
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowAddItemModal(false)}
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        title="측정항목 관리 도움말"
        sections={getMeasurementItemsHelpSections()}
        onClose={() => setShowHelpModal(false)}
      />
    </section>
  );
}
