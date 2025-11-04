"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import NotificationBell from "@/components/notifications/NotificationBell";

interface NavItem {
  href: string;
  label: string;
  roles: string[];
  readOnly?: string[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  // 측정 업무
  { href: "/dashboard", label: "대시보드", roles: ["SUPER_ADMIN", "ORG_ADMIN", "OPERATOR", "CUSTOMER_ADMIN", "CUSTOMER_USER"] },
  { href: "/measure/input", label: "측정 입력", roles: ["SUPER_ADMIN", "ORG_ADMIN", "OPERATOR"] },
  { href: "/measure/history", label: "측정 이력", roles: ["SUPER_ADMIN", "ORG_ADMIN", "OPERATOR", "CUSTOMER_ADMIN", "CUSTOMER_USER"] },
  
  // 고객사 관리
  { href: "/masters/customers", label: "고객사 관리", roles: ["SUPER_ADMIN", "ORG_ADMIN", "OPERATOR"], readOnly: ["OPERATOR"] },
  { href: "/masters/stacks", label: "굴뚝 관리", roles: ["SUPER_ADMIN", "ORG_ADMIN", "OPERATOR"], readOnly: ["OPERATOR"] },
  
  // 기준 정보
  { href: "/masters/items", label: "측정항목", roles: ["SUPER_ADMIN", "ORG_ADMIN", "OPERATOR"], readOnly: ["OPERATOR"] },
  { href: "/masters/limits", label: "배출허용기준", roles: ["SUPER_ADMIN", "ORG_ADMIN", "OPERATOR"], readOnly: ["OPERATOR"] },
  
  // 고객사 메뉴
  { href: "/customer/stacks", label: "굴뚝 관리", roles: ["SUPER_ADMIN", "CUSTOMER_ADMIN"] },
  { href: "/customer/organizations", label: "환경측정기업 관리", roles: ["SUPER_ADMIN", "CUSTOMER_ADMIN", "CUSTOMER_USER"] },
  { href: "/customer/staff", label: "직원 관리", roles: ["SUPER_ADMIN", "CUSTOMER_ADMIN"] },
  
  // 공급회사 직원 관리
  { href: "/org/staff", label: "직원 관리", roles: ["SUPER_ADMIN", "ORG_ADMIN"] },
  
  // 시스템 관리 (SUPER_ADMIN만) - 서브메뉴 구조
  {
    href: "/admin/system",
    label: "시스템 관리",
    roles: ["SUPER_ADMIN"],
    children: [
      { href: "/admin/organizations", label: "환경측정기업 관리", roles: ["SUPER_ADMIN"] },
      { href: "/admin/users", label: "사용자 관리", roles: ["SUPER_ADMIN"] },
      { href: "/org/settings/roles", label: "역할 관리", roles: ["SUPER_ADMIN"] },
      { href: "/org/settings/users", label: "권한 관리", roles: ["SUPER_ADMIN"] },
    ]
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const { selectedOrg, setSelectedOrg, organizations, isSuperAdmin } = useOrganization();

  const userRole = (session?.user as any)?.role || "";
  const userName = session?.user?.name || "";
  const userEmail = session?.user?.email || "";
  const userCustomerId = (session?.user as any)?.customerId;
  const isCustomerUser = userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER";
  
  // 시스템 보기 모드에서 고객사 정보 가져오기
  const [viewAsCustomerName, setViewAsCustomerName] = useState<string>("");
  
  // 시스템 보기 모드 확인
  const viewAsOrgId = typeof window !== "undefined" ? sessionStorage.getItem("viewAsOrganization") : null;
  const viewAsCustomerId = typeof window !== "undefined" ? sessionStorage.getItem("viewAsCustomer") : null;
  const isViewingAsOrg = isSuperAdmin && !!viewAsOrgId;
  const isViewingAsCustomer = isSuperAdmin && !!viewAsCustomerId;
  
  // 고객사 시스템 보기 모드일 때 고객사명 로드
  useEffect(() => {
    if (isViewingAsCustomer && viewAsCustomerId) {
      fetch(`/api/customers/${viewAsCustomerId}`)
        .then(res => res.json())
        .then(data => {
          if (data.customer) {
            setViewAsCustomerName(data.customer.name);
          }
        })
        .catch(err => console.error("Failed to load customer name:", err));
    }
  }, [isViewingAsCustomer, viewAsCustomerId]);
  
  // 시스템 보기 모드일 때 권한 변경
  let effectiveRole = userRole;
  if (isViewingAsOrg) {
    effectiveRole = "ORG_ADMIN";
  } else if (isViewingAsCustomer) {
    effectiveRole = "CUSTOMER_ADMIN";
  }
  const items = navItems.filter((i) => i.roles.includes(effectiveRole));
  return (
    <>
    <header className="h-16 border-b border-gray-800 bg-gray-900 text-white sticky top-0 z-40">
      <div className="mx-auto h-full px-4 flex items-center gap-6">
        {/* Mobile: hamburger */}
        <button
          className="md:hidden inline-flex flex-col items-center justify-center w-9 h-9 rounded border border-gray-700 hover:bg-white/10 gap-1"
          aria-label="메뉴 열기"
          onClick={() => setOpen(true)}
        >
          <span className="block w-5 h-0.5 bg-white" />
          <span className="block w-5 h-0.5 bg-white" />
          <span className="block w-5 h-0.5 bg-white" />
        </button>

        {/* 왼쪽: 회사명 + 메뉴 */}
        <div className="flex items-center gap-6">
          {isCustomerUser || isViewingAsCustomer ? (
            // 고객사 사용자 또는 고객사 시스템 보기: 고객사명만 표시
            <Link href="/" className="font-semibold text-lg whitespace-nowrap text-white">
              {isViewingAsCustomer ? viewAsCustomerName : ((session?.user as any)?.customerName || "고객사")}
            </Link>
          ) : isSuperAdmin ? (
            // SUPER_ADMIN: 환경측정기업 선택 드롭다운 + 시스템 보기 모드 표시
            <div className="flex items-center gap-2">
              {(isViewingAsOrg || isViewingAsCustomer) && (
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-600 rounded-md">
                  <span className="text-sm font-medium">
                    🔍 시스템 보기 {isViewingAsCustomer && "(고객사)"}
                  </span>
                  <button
                    onClick={() => {
                      sessionStorage.removeItem("viewAsOrganization");
                      sessionStorage.removeItem("viewAsCustomer");
                      window.location.href = isViewingAsCustomer ? "/admin/customers" : "/admin/organizations";
                    }}
                    className="text-xs px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded"
                    title="시스템 관리자 모드로 돌아가기"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="relative">
                <button
                  onClick={() => setOrgMenuOpen(!orgMenuOpen)}
                  className="font-semibold text-lg whitespace-nowrap flex items-center gap-2 px-3 py-1 rounded-md border border-gray-700 hover:bg-white/10"
                >
                  {selectedOrg?.name || "조직 선택"}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

              {orgMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setOrgMenuOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20 max-h-96 overflow-y-auto">
                    <div className="py-1">
                      {organizations.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          승인된 조직이 없습니다
                        </div>
                      ) : (
                        organizations.map((org) => (
                          <button
                            key={org.id}
                            onClick={() => {
                              setSelectedOrg(org);
                              setOrgMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                              selectedOrg?.id === org.id
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            <div>{org.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{org.businessNumber}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>
          ) : (
            // 일반 환경측정기업 사용자: 환경측정기업명 표시
            <Link href="/" className="font-semibold text-lg whitespace-nowrap">
              {selectedOrg?.name || "보아스환경기술"}
            </Link>
          )}

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {items.map((item) => {
              const active = pathname?.startsWith(item.href);
              
              // 서브메뉴가 있는 경우
              if (item.children && item.children.length > 0) {
                const isSystemActive = item.children.some(child => pathname?.startsWith(child.href));
                return (
                  <div key={item.href} className="relative">
                    <button
                      onClick={() => setSystemMenuOpen(!systemMenuOpen)}
                      className={`text-sm px-3 py-1 rounded hover:bg-white/10 flex items-center gap-1 ${isSystemActive ? "font-medium bg-white/10" : "text-gray-200"}`}
                    >
                      {item.label}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {systemMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setSystemMenuOpen(false)}
                        />
                        <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                          <div className="py-1">
                            {item.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setSystemMenuOpen(false)}
                                className={`block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                  pathname?.startsWith(child.href)
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              }
              
              // 일반 메뉴
              return (
                <Link key={item.href} href={item.href} className={`text-sm px-3 py-1 rounded hover:bg-white/10 ${active ? "font-medium bg-white/10" : "text-gray-200"}`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 오른쪽: 알림 + 사용자 메뉴 */}
        <div className="flex items-center gap-4 ml-auto">
          <NotificationBell />
          {status === "authenticated" ? (
            <>
              {/* 알림 아이콘 */}
              
              <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1 rounded-md border border-gray-700 text-sm text-white hover:bg-white/10"
              >
                <span className="hidden md:inline">{userName}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{userName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail}</p>
                    </div>
                    <div className="py-1">
                      {userRole === "SUPER_ADMIN" && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => {
                            setUserMenuOpen(false);
                            // 시스템 보기 모드 해제
                            sessionStorage.removeItem("viewAsOrganization");
                            sessionStorage.removeItem("viewAsCustomer");
                          }}
                          className="block px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                        >
                          관리자 대시보드
                        </Link>
                      )}
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        내 정보
                      </Link>
                      {(userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER" || isViewingAsCustomer) && (
                        <Link
                          href="/customer/organization"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          조직 정보
                        </Link>
                      )}
                      {(userRole === "ORG_ADMIN" || userRole === "SUPER_ADMIN") && !isViewingAsCustomer && (
                        <Link
                          href="/org/settings/organization"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          조직 정보
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          // 로컬 스토리지 정리
                          localStorage.removeItem("selectedOrgId");
                          // 세션 스토리지 정리
                          sessionStorage.removeItem("viewAsOrganization");
                          sessionStorage.removeItem("viewAsCustomer");
                          // 로그아웃
                          signOut({ callbackUrl: "/login" });
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md px-3 py-1 border border-gray-700 text-sm text-white hover:bg-white/10"
            >
              로그인
            </Link>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80%] bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">메뉴</span>
              <button
                className="inline-flex items-center justify-center w-9 h-9 rounded border border-gray-700 hover:bg-white/10"
                aria-label="메뉴 닫기"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {items.map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`text-sm px-3 py-2 rounded hover:bg-white/10 ${active ? "font-medium bg-white/10" : "text-gray-200"}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            {status === "authenticated" && (
              <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-white">{userName}</p>
                  <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm text-gray-200 hover:bg-white/10 rounded"
                >
                  내 정보
                </Link>
                {(userRole === "ORG_ADMIN" || userRole === "SUPER_ADMIN") && (
                  <Link
                    href="/org/settings/organization"
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 text-sm text-gray-200 hover:bg-white/10 rounded"
                  >
                    조직 정보
                  </Link>
                )}
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/10 rounded"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  </>
  );
}
