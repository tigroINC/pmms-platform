# 페이지 새로고침 시 리다이렉트 문제 해결 가이드

## 📋 문제 상황

**증상:**
- 특정 페이지에서 F5 또는 Ctrl+R로 새로고침하면 다른 페이지(주로 `/dashboard`)로 리다이렉트됨
- 사용자가 작업 중이던 페이지를 잃어버림
- 불편한 사용자 경험

**원인:**
```typescript
// 기존 코드 (문제 있음)
useEffect(() => {
  if (user?.role !== "CUSTOMER_ADMIN" && user?.role !== "CUSTOMER_USER") {
    router.push("/dashboard");  // ❌ 새로고침 시에도 실행됨
    return;
  }
  fetchData();
}, [user, router]);
```

새로고침 시 `user`가 잠시 `null`이 되었다가 다시 로드되는데, 이 과정에서 권한 체크 로직이 실행되어 리다이렉트가 발생합니다.

## ✅ 해결 방법

### 1. 새로운 훅 사용: `usePageAuth`

**파일**: `c:/Users/User/boaz/frontend/src/hooks/usePageAuth.ts`

이 훅은 다음을 처리합니다:
- ✅ 로딩 중에는 권한 체크 안 함
- ✅ 로그인하지 않은 경우 로그인 페이지로 이동 (callbackUrl 포함)
- ✅ 권한이 없는 경우에만 리다이렉트
- ✅ 새로고침 시 현재 페이지 유지

### 2. 사용 가능한 훅들

#### `useAdminAuth()` - 시스템 관리자 전용
```typescript
import { useAdminAuth } from "@/hooks/usePageAuth";

export default function AdminPage() {
  const { user, loading } = useAdminAuth();
  
  if (loading) return <div>로딩 중...</div>;
  
  // 페이지 내용
}
```

#### `useOrgAuth()` - 환경측정기업 (관리자 + 실무자)
```typescript
import { useOrgAuth } from "@/hooks/usePageAuth";

export default function OrgPage() {
  const { user, loading } = useOrgAuth();
  
  if (loading) return <div>로딩 중...</div>;
  
  // 페이지 내용
}
```

#### `useOrgAdminAuth()` - 환경측정기업 관리자 전용
```typescript
import { useOrgAdminAuth } from "@/hooks/usePageAuth";

export default function OrgAdminPage() {
  const { user, loading } = useOrgAdminAuth();
  
  if (loading) return <div>로딩 중...</div>;
  
  // 페이지 내용
}
```

#### `useCustomerAuth()` - 고객사 (관리자 + 일반 사용자)
```typescript
import { useCustomerAuth } from "@/hooks/usePageAuth";

export default function CustomerPage() {
  const { user, loading } = useCustomerAuth();
  
  if (loading) return <div>로딩 중...</div>;
  
  // 페이지 내용
}
```

#### `useCustomerAdminAuth()` - 고객사 관리자 전용
```typescript
import { useCustomerAdminAuth } from "@/hooks/usePageAuth";

export default function CustomerAdminPage() {
  const { user, loading } = useCustomerAdminAuth();
  
  if (loading) return <div>로딩 중...</div>;
  
  // 페이지 내용
}
```

### 3. 커스텀 권한 체크

특별한 권한 체크가 필요한 경우:

```typescript
import { usePageAuth } from "@/hooks/usePageAuth";

export default function CustomPage() {
  const { user, loading } = usePageAuth({
    allowedRoles: ["SUPER_ADMIN", "ORG_ADMIN"],
    redirectTo: "/custom-error",
    onUnauthorized: () => {
      alert("권한이 없습니다.");
    },
  });
  
  if (loading) return <div>로딩 중...</div>;
  
  // 페이지 내용
}
```

## 🔧 페이지 수정 방법

### Before (기존 코드)

```typescript
"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function MyPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // ❌ 문제: 새로고침 시 user가 null이 되어 리다이렉트됨
    if (user?.role !== "CUSTOMER_ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchData();
  }, [user, router]);

  return <div>...</div>;
}
```

### After (개선된 코드)

```typescript
"use client";

import { useEffect } from "react";
import { useCustomerAdminAuth } from "@/hooks/usePageAuth";

export default function MyPage() {
  const { user, loading } = useCustomerAdminAuth();

  useEffect(() => {
    // ✅ 해결: 로딩 완료 후에만 데이터 로드
    if (loading || !user) return;
    fetchData();
  }, [user, loading]);

  // ✅ 로딩 중 표시
  if (loading) {
    return <div>로딩 중...</div>;
  }

  return <div>...</div>;
}
```

## 📝 수정이 필요한 페이지 목록

다음 패턴을 찾아서 수정하세요:

```bash
# 문제 패턴 검색
grep -r "router.push.*dashboard" src/app --include="*.tsx"
```

### 우선순위 높음 (자주 사용되는 페이지)

1. **고객사 페이지**
   - [x] `/customer/stacks/page.tsx` - 완료
   - [ ] `/customer/organizations/page.tsx`
   - [ ] `/customer/staff/page.tsx`
   - [ ] `/customer/stack-requests/page.tsx`

2. **환경측정기업 페이지**
   - [ ] `/org/draft-customers/page.tsx`
   - [ ] `/org/staff/page.tsx`
   - [ ] `/org/settings/users/page.tsx`
   - [ ] `/org/settings/roles/page.tsx`

3. **시스템 관리자 페이지**
   - [ ] `/admin/dashboard/page.tsx`
   - [ ] `/admin/organizations/page.tsx`
   - [ ] `/admin/customers/page.tsx`
   - [ ] `/admin/users/page.tsx`

## 🎯 수정 체크리스트

각 페이지를 수정할 때 다음을 확인하세요:

- [ ] `useAuth()` 대신 적절한 `use*Auth()` 훅 사용
- [ ] `router.push("/dashboard")` 제거
- [ ] `if (loading || !user) return` 체크 추가
- [ ] 로딩 상태 UI 추가
- [ ] `useEffect` 의존성 배열에 `loading` 추가

## 🧪 테스트 방법

1. **페이지 접속**
   - 해당 페이지로 직접 이동

2. **새로고침 테스트**
   - F5 또는 Ctrl+R 누르기
   - ✅ 현재 페이지 유지되는지 확인
   - ❌ 다른 페이지로 리다이렉트되지 않는지 확인

3. **권한 테스트**
   - 권한이 없는 사용자로 로그인
   - 해당 페이지 접속 시도
   - ✅ 대시보드로 리다이렉트되는지 확인

4. **로그아웃 테스트**
   - 로그아웃 후 페이지 접속 시도
   - ✅ 로그인 페이지로 리다이렉트되는지 확인
   - ✅ 로그인 후 원래 페이지로 돌아오는지 확인 (callbackUrl)

## 💡 추가 개선 사항

### 1. 로딩 컴포넌트 통일

```typescript
// components/ui/PageLoading.tsx
export default function PageLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">로딩 중...</div>
    </div>
  );
}

// 사용
import PageLoading from "@/components/ui/PageLoading";

if (loading) return <PageLoading />;
```

### 2. 에러 바운더리 추가

```typescript
// components/ErrorBoundary.tsx
export default function ErrorBoundary({ children }: { children: React.ReactNode }) {
  // 에러 처리 로직
}
```

### 3. 권한 없음 페이지

```typescript
// app/unauthorized/page.tsx
export default function UnauthorizedPage() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">권한이 없습니다</h1>
      <p className="mt-2 text-gray-600">이 페이지에 접근할 권한이 없습니다.</p>
      <Link href="/dashboard" className="mt-4 inline-block">
        대시보드로 돌아가기
      </Link>
    </div>
  );
}
```

## 🚀 일괄 적용 스크립트

모든 페이지를 한 번에 수정하려면:

```bash
# 1. 백업
git add .
git commit -m "Before: 페이지 새로고침 문제 수정 전"

# 2. 각 페이지 수동 수정
# (자동화 스크립트는 복잡하므로 수동 권장)

# 3. 테스트
npm run dev

# 4. 커밋
git add .
git commit -m "Fix: 페이지 새로고침 시 리다이렉트 문제 해결"
```

## 📚 참고

- `usePageAuth` 훅: `src/hooks/usePageAuth.ts`
- 로그인 페이지: `src/app/login/page.tsx` (callbackUrl 지원)
- AuthContext: `src/contexts/AuthContext.tsx`
