"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import GlobalLoading from "@/components/ui/GlobalLoading";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId?: string;
  customerId?: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "loading") {
      setInitializing(false);
    }
    
    if (session?.user) {
      setUser(session.user as User);
    } else if (status === "unauthenticated") {
      setUser(null);
    }
  }, [session, status]);

  const isLoading = status === "loading" || initializing;

  // 로그인, 회원가입 페이지에서는 GlobalLoading을 표시하지 않음
  const showGlobalLoading = isLoading && 
    pathname !== "/login" && 
    !pathname?.startsWith("/register") && 
    !pathname?.startsWith("/invite") &&
    !pathname?.startsWith("/auth");

  // 로딩 중이고 GlobalLoading을 표시해야 하는 경우
  if (showGlobalLoading) {
    return <GlobalLoading />;
  }

  return (
    <AuthContext.Provider value={{ user, loading: isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider is missing");
  return ctx;
}
