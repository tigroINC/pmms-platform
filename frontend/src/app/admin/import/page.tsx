"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";

export default function ImportPage() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/import", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Import failed");
      setMsg(`Import 완료: ${json?.summary || "OK"}`);
    } catch (err: any) {
      setMsg(err.message || "오류");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">데이터 Import</h1>
      <form onSubmit={onUpload} className="rounded-lg border p-4 space-y-3">
        <div className="text-sm text-gray-600">CSV 업로드(고객사/굴뚝/항목/이력). 첫 버전은 간단 CSV만 지원합니다.</div>
        <input name="file" type="file" accept=".csv" className="block" />
        <Button disabled={busy}>{busy ? "업로드 중..." : "업로드"}</Button>
      </form>
      {msg && <div className="text-sm">{msg}</div>}
    </section>
  );
}
