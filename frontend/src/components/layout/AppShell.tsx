"use client";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading } = useAuth();
  
  // 로그인, 회원가입, 관리자 페이지, 초대 페이지, 설정 페이지에서는 Navbar 숨김
  const hideNavbar = pathname === "/login" || pathname?.startsWith("/register") || pathname === "/forgot-password" || pathname?.startsWith("/reset-password") || pathname?.startsWith("/admin") || pathname?.startsWith("/invite") || pathname?.startsWith("/auth") || pathname?.startsWith("/org/settings");
  
  // 로딩 중이거나 숨겨야 할 페이지면 Navbar 표시 안 함
  if (loading || hideNavbar) {
    return (
      <div className="mx-auto w-full">
        <main className="min-w-0">{children}</main>
      </div>
    );
  }
  
  return (
    <>
      <Navbar />
      <div className="mx-auto w-full px-6 py-6">
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
