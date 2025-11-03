"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type Role = "admin" | "operator" | "customer";
const navItems: { href: string; label: string; roles: Role[] }[] = [
  { href: "/dashboard", label: "대시보드", roles: ["admin", "operator", "customer"] },
  { href: "/measure/input", label: "측정입력", roles: ["admin", "operator"] },
  { href: "/measure/history", label: "측정이력", roles: ["admin", "operator", "customer"] },
  { href: "/masters/customers", label: "고객사", roles: ["admin"] },
  { href: "/masters/stacks", label: "굴뚝관리", roles: ["admin"] },
  { href: "/masters/limits", label: "배출허용기준", roles: ["admin"] },
];

export default function Sidebar({ open = false }: { open?: boolean }) {
  const pathname = usePathname();
  const { role, setRole } = useAuth();
  return (
    <aside
      className={`w-60 shrink-0 border-r bg-white/60 dark:bg-black/20 md:relative md:translate-x-0 fixed top-16 bottom-0 left-0 z-40 transition-transform duration-200 ${
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 text-xs text-gray-500">메뉴</div>
        <nav className="flex-1 flex flex-col">
          {navItems.filter((i) => i.roles.includes(role)).map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-white/10 ${
                  active ? "font-medium bg-gray-100 dark:bg-white/10" : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t text-sm space-y-2">
          <div>
            <label className="block text-xs mb-1">역할</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full border rounded px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">관리자</option>
              <option value="operator">측정담당자</option>
              <option value="customer">고객사</option>
            </select>
          </div>
          <button className="w-full rounded-md px-3 py-2 border">로그인</button>
        </div>
      </div>
    </aside>
  );
}
