"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /org/customers -> /masters/customers 리다이렉트
 * 
 * 고객사 관리 페이지가 /masters/customers로 통합되었습니다.
 * 이 페이지는 하위 호환성을 위해 유지되며, 자동으로 새 페이지로 리다이렉트합니다.
 */
export default function OrganizationCustomersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/masters/customers");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-gray-500">리다이렉트 중...</div>
    </div>
  );
}
