import React, { useEffect, useMemo, useState } from "react";
import type { StackSummary } from "@/hooks/useStackSummary";

export default function StackPickerModal({
  open,
  onClose,
  summaries,
  loading,
  initialSelectedNames = [],
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  summaries: StackSummary[];
  loading: boolean;
  initialSelectedNames?: string[];
  onApply: (selectedNames: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(initialSelectedNames);
  useEffect(() => { if (open) setSelected(initialSelectedNames); }, [open, initialSelectedNames]);

  const filtered = useMemo(() => {
    const q = query.trim();
    let list = [...summaries];
    if (q) list = list.filter(s => s.stackName.toLowerCase().includes(q.toLowerCase()));
    // 기본 정렬: 평균농도 내림차순
    list.sort((a,b)=> (b.avg - a.avg) || a.stackName.localeCompare(b.stackName));
    return list;
  }, [summaries, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-neutral-900 rounded shadow-xl w-[880px] max-h-[80vh] flex flex-col">
        <div className="px-4 py-3 border-b flex items-center gap-3">
          <h2 className="text-lg font-semibold">굴뚝 선택</h2>
          <div className="ml-auto flex items-center gap-2">
            <input
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              placeholder="굴뚝 검색"
              className="border rounded px-3 py-1 bg-transparent"
            />
          </div>
        </div>
        <div className="p-4 flex-1 overflow-auto">
          {loading ? (
            <div className="py-12 text-center text-sm text-neutral-500">불러오는 중…</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 px-2 w-10">선택</th>
                  <th className="py-2 px-2">굴뚝</th>
                  <th className="py-2 px-2">평균농도</th>
                  <th className="py-2 px-2">측정건수</th>
                  <th className="py-2 px-2">기준초과</th>
                  <th className="py-2 px-2">최근측정</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s)=>{
                  const checked = selected.includes(s.stackName);
                  return (
                    <tr key={s.stackId} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      <td className="py-2 px-2"><input type="checkbox" checked={checked} onChange={(e)=>{
                        const on = e.currentTarget.checked;
                        setSelected(prev => on ? Array.from(new Set([...prev, s.stackName])) : prev.filter(n=>n!==s.stackName));
                      }} /></td>
                      <td className="py-2 px-2">{s.stackName}</td>
                      <td className="py-2 px-2">{s.avg}</td>
                      <td className="py-2 px-2">{s.count}</td>
                      <td className="py-2 px-2">{s.exceedCount}</td>
                      <td className="py-2 px-2">{s.lastMeasuredAt ? new Date(s.lastMeasuredAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-4 py-3 border-t flex items-center gap-2">
          <button className="px-3 py-1 border rounded" onClick={()=>{
            // 현재 검색결과(필터링된 리스트) 전체 선택
            const all = filtered.map(s=>s.stackName);
            setSelected(all);
          }}>모두 선택</button>
          <button className="px-3 py-1 border rounded" onClick={()=>setSelected([])}>모두 해제</button>
          <button className="px-3 py-1 border rounded" onClick={()=>{
            const top = filtered.slice(0, 5).map(s=>s.stackName);
            setSelected(top);
          }}>Top 5 선택</button>
          <button className="px-3 py-1 border rounded" onClick={()=>{
            // 평균이 아니라 실제 초과 건수가 있는 스택만 선별
            const onlyExceed = filtered.filter(s=> (s.exceedCount ?? 0) > 0).map(s=>s.stackName);
            setSelected(onlyExceed);
          }}>기준초과만</button>
          <div className="ml-auto" />
          <button className="px-3 py-1 border rounded" onClick={onClose}>취소</button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={()=> onApply(selected)}>적용</button>
        </div>
      </div>
    </div>
  );
}
