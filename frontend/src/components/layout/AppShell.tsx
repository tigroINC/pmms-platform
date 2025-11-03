"use client";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 로그인, 회원가입, 관리자 페이지, 설정 페이지, 초대 페이지에서는 Navbar 숨김
  const hideNavbar = pathname === "/login" || pathname?.startsWith("/register") || pathname === "/forgot-password" || pathname?.startsWith("/admin") || pathname?.startsWith("/org/settings") || pathname?.startsWith("/invite") || pathname?.startsWith("/auth");
  
  return (
    <AuthProvider>
      {!hideNavbar && <Navbar />}
      <div className={`mx-auto w-full ${hideNavbar ? "" : "px-6 py-6"}`}>
        <main className="min-w-0">{children}</main>
      </div>
    </AuthProvider>
  );
}
