"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type Customer = {
  id: string;
  code: string | null;
  name: string;
  fullName: string | null;
};

type Stack = {
  id: string;
  name: string;
  fullName: string | null;
};

export default function NewReportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Step 1: 기본정보 선택
  const [customerSel, setCustomerSel] = useState("");
  const [stackSel, setStackSel] = useState("");
  const [measuredAt, setMeasuredAt] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const selectedCustomerId = useMemo(
    () => {
      // "[코드] 이름" 형식 또는 "이름" 형식 모두 처리
      const customer = customers.find((c) => {
        const withCode = c.code ? `[${c.code}] ${c.name}` : c.name;
        return withCode === customerSel || c.name === customerSel;
      });
      return customer?.id;
    },
    [customers, customerSel]
  );

  // 고객사 조회
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // tab=all 파라미터 추가하여 모든 고객사 조회
        const res = await fetch("/api/customers?tab=all");
        const json = await res.json();
        console.log("고객사 조회 결과:", json);
        setCustomers(json.customers || json.data || []);
      } catch (error) {
        console.error("고객사 조회 오류:", error);
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, []);

  // 굴뚝 조회
  useEffect(() => {
    if (!selectedCustomerId) {
      setStacks([]);
      return;
    }

    const fetchStacks = async () => {
      try {
        const res = await fetch(`/api/stacks?customerId=${selectedCustomerId}`);
        const json = await res.json();
        setStacks(json.stacks || json.data || []);
      } catch (error) {
        console.error("굴뚝 조회 오류:", error);
        setStacks([]);
      }
    };
    fetchStacks();
  }, [selectedCustomerId]);

  // 측정 데이터가 있는 날짜 조회
  useEffect(() => {
    if (!selectedCustomerId || !stackSel) {
      setAvailableDates([]);
      return;
    }

    const stackCode = stackSel.match(/\[(.*?)\]/)?.[1] || stackSel;
    const stackId = stacks.find((s) => s.name === stackCode || stackSel.includes(s.name))?.id;
    
    if (!stackId) return;

    const fetchAvailableDates = async () => {
      try {
        const res = await fetch(`/api/measurements?customerId=${selectedCustomerId}&stackId=${stackId}`);
        const json = await res.json();
        
        // 측정 데이터에서 고유한 날짜만 추출 (시간 제외)
        const dates = (json.data || [])
          .map((m: any) => new Date(m.measuredAt).toISOString().split('T')[0])
          .filter((date: string, index: number, self: string[]) => self.indexOf(date) === index)
          .sort((a: string, b: string) => b.localeCompare(a)); // 최신순
        
        setAvailableDates(dates);
      } catch (error) {
        console.error("측정 날짜 조회 오류:", error);
        setAvailableDates([]);
      }
    };
    fetchAvailableDates();
  }, [selectedCustomerId, stackSel, stacks]);

  const handleCreate = async () => {
    if (!selectedCustomerId || !stackSel || !measuredAt) {
      alert("고객사, 굴뚝, 측정일자를 모두 선택해주세요.");
      return;
    }

    // stackSel에서 코드 추출: "[코드] 이름" 형식
    const stackCode = stackSel.match(/\[(.*?)\]/)?.[1] || stackSel;
    const stackId = stacks.find((s) => s.name === stackCode || stackSel.includes(s.name))?.id;
    if (!stackId) {
      alert("굴뚝을 찾을 수 없습니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          stackId,
          measuredAt,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        router.push(`/reports/${json.data.id}`);
      } else {
        alert(json.error || "보고서 생성 실패");
      }
    } catch (error: any) {
      alert(error.message || "보고서 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">신규 보고서 작성</h1>
        <Button variant="secondary" onClick={() => router.push("/reports")}>
          취소
        </Button>
      </div>

      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-6 space-y-4">
        <h2 className="text-lg font-semibold mb-4">기본 정보 선택</h2>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            고객사 <span className="text-red-500">*</span>
          </label>
          <input
            list="customers-list"
            value={customerSel}
            onChange={(e) => {
              setCustomerSel(e.target.value);
              setStackSel("");
            }}
            placeholder="고객사를 검색하거나 선택하세요"
            className="w-full border rounded px-3 py-2 dark:bg-gray-800"
          />
          <datalist id="customers-list">
            {customers.map((c) => {
              const displayValue = c.code ? `[${c.code}] ${c.name}` : c.name;
              return (
                <option key={c.id} value={displayValue}>
                  {c.fullName || c.name}
                </option>
              );
            })}
          </datalist>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            굴뚝명 <span className="text-red-500">*</span>
          </label>
          <input
            list="stacks-list"
            value={stackSel}
            onChange={(e) => setStackSel(e.target.value)}
            disabled={!selectedCustomerId}
            placeholder="굴뚝을 검색하거나 선택하세요"
            className="w-full border rounded px-3 py-2 dark:bg-gray-800 disabled:opacity-50"
          />
          <datalist id="stacks-list">
            {stacks.map((s) => {
              const displayValue = `[${s.name}] ${s.fullName || s.name}`;
              return (
                <option key={s.id} value={displayValue}>
                  {displayValue}
                </option>
              );
            })}
          </datalist>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            측정일자 <span className="text-red-500">*</span>
          </label>
          <select
            value={measuredAt}
            onChange={(e) => setMeasuredAt(e.target.value)}
            disabled={availableDates.length === 0}
            className="w-full border rounded px-3 py-2 dark:bg-gray-800 disabled:opacity-50"
          >
            <option value="">측정일자를 선택하세요</option>
            {availableDates.map((date) => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            {availableDates.length === 0 && stackSel
              ? "해당 굴뚝의 측정 데이터가 없습니다."
              : "측정 데이터가 있는 날짜만 표시됩니다."}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 보고서는 선택한 측정일자의 데이터를 자동으로 불러옵니다.<br/>
            생성 후 모든 항목을 수정할 수 있습니다.
          </p>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleCreate} disabled={loading} className="flex-1">
            {loading ? "생성 중..." : "보고서 생성"}
          </Button>
          <Button variant="secondary" onClick={() => router.push("/reports")} className="flex-1">
            취소
          </Button>
        </div>
      </div>
    </div>
  );
}
