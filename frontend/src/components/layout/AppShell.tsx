"use client";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading } = useAuth();
  
  // 로그인, 회원가입, 관리자 페이지, 초대 페이지, 설정 페이지에서는 Navbar 숨김
  const hideNavbar = pathname === "/login" || pathname?.startsWith("/register") || pathname === "/forgot-password" || pathname?.startsWith("/admin") || pathname?.startsWith("/invite") || pathname?.startsWith("/auth") || pathname?.startsWith("/org/settings");
  
  return (
    <>
      {!hideNavbar && !loading && <Navbar />}
      <div className={`mx-auto w-full ${hideNavbar ? "" : "px-6 py-6"}`}>
        <main className="min-w-0">{children}</main>
      </div>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShellContent>{children}</AppShellContent>
    </AuthProvider>
  );
}
