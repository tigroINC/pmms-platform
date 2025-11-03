"use client";
import { useState } from "react";

type Tab = { key: string; label: string };

export default function Tabs({ tabs, children }: { tabs: Tab[]; children: (active: string) => React.ReactNode }) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 border-b mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-3 py-1.5 text-sm rounded-t ${
              active === t.key ? "bg-black text-white dark:bg-white dark:text-black" : "border"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{children(active)}</div>
    </div>
  );
}
