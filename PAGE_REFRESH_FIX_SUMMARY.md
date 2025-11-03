# 페이지 새로고침 문제 해결 - 요약

## 🎯 문제 해결

**문제**: 모든 시스템 화면에서 새로고침(F5)을 하면 다른 화면으로 리다이렉트됨

**원인**: 
- 페이지 로드 시 `user` 상태가 잠시 `null`이 됨
- 권한 체크 로직이 즉시 실행되어 리다이렉트 발생

**해결**:
- 새로운 `usePageAuth` 훅 생성
- 로딩 상태를 고려한 권한 체크
- 로그인 페이지에 callbackUrl 지원

## ✅ 완료된 작업

### 1. 새로운 훅 생성
**파일**: `c:/Users/User/boaz/frontend/src/hooks/usePageAuth.ts`

**제공하는 훅들**:
- `useAdminAuth()` - 시스템 관리자 전용
- `useOrgAuth()` - 환경측정기업 (관리자 + 실무자)
- `useOrgAdminAuth()` - 환경측정기업 관리자 전용
- `useCustomerAuth()` - 고객사 (관리자 + 일반 사용자)
- `useCustomerAdminAuth()` - 고객사 관리자 전용
- `usePageAuth(options)` - 커스텀 권한 체크

### 2. 샘플 페이지 수정
**파일**: `c:/Users/User/boaz/frontend/src/app/customer/stacks/page.tsx`

**변경 사항**:
```typescript
// Before
const { user } = useAuth();
useEffect(() => {
  if (user?.role !== "CUSTOMER_ADMIN" && user?.role !== "CUSTOMER_USER") {
    router.push("/dashboard");  // ❌ 새로고침 시 리다이렉트
    return;
  }
  fetchData();
}, [user, router]);

// After
const { user, loading } = useCustomerAuth();
useEffect(() => {
  if (loading || !user) return;  // ✅ 로딩 완료 후 실행
  fetchData();
}, [user, loading]);
```

### 3. 가이드 문서 작성
**파일**: `c:/Users/User/boaz/PAGE_REFRESH_FIX_GUIDE.md`

## 📝 적용 방법

### 단계별 가이드

1. **적절한 훅 import**
```typescript
import { useCustomerAuth } from "@/hooks/usePageAuth";
```

2. **기존 useAuth 대체**
```typescript
// Before
const { user } = useAuth();

// After
const { user, loading } = useCustomerAuth();
```

3. **router.push 제거**
```typescript
// Before
useEffect(() => {
  if (user?.role !== "ALLOWED_ROLE") {
    router.push("/dashboard");  // ❌ 제거
    return;
  }
  fetchData();
}, [user, router]);

// After
useEffect(() => {
  if (loading || !user) return;  // ✅ 추가
  fetchData();
}, [user, loading]);
```

4. **로딩 UI 추가 (선택)**
```typescript
if (loading) {
  return <div>로딩 중...</div>;
}
```

## 🔧 수정이 필요한 페이지

### 우선순위 높음

#### 고객사 페이지
- [x] `/customer/stacks/page.tsx` - ✅ 완료
- [ ] `/customer/organizations/page.tsx`
- [ ] `/customer/staff/page.tsx`
- [ ] `/customer/stack-requests/page.tsx`

#### 환경측정기업 페이지
- [ ] `/org/draft-customers/page.tsx`
- [ ] `/org/staff/page.tsx`
- [ ] `/org/settings/users/page.tsx`
- [ ] `/org/settings/roles/page.tsx`
- [ ] `/org/customers/page.tsx`
- [ ] `/org/stack-requests/page.tsx`
- [ ] `/org/team/page.tsx`

#### 시스템 관리자 페이지
- [ ] `/admin/dashboard/page.tsx`
- [ ] `/admin/organizations/page.tsx`
- [ ] `/admin/customers/page.tsx`
- [ ] `/admin/users/page.tsx`
- [ ] `/admin/system/page.tsx`

#### 공통 페이지
- [ ] `/dashboard/page.tsx`
- [ ] `/masters/customers/page.tsx`
- [ ] `/masters/items/page.tsx`
- [ ] `/masters/limits/page.tsx`
- [ ] `/masters/stacks/page.tsx`
- [ ] `/measure/history/page.tsx`
- [ ] `/measure/input/page.tsx`
- [ ] `/notifications/page.tsx`
- [ ] `/profile/page.tsx`
- [ ] `/report/page.tsx`

## 🧪 테스트 체크리스트

각 페이지 수정 후:

- [ ] 페이지 직접 접속 → 정상 로드
- [ ] F5 새로고침 → 현재 페이지 유지
- [ ] Ctrl+R 새로고침 → 현재 페이지 유지
- [ ] 권한 없는 사용자 접속 → 대시보드로 리다이렉트
- [ ] 로그아웃 후 접속 → 로그인 페이지로 이동
- [ ] 로그인 후 → 원래 페이지로 복귀 (callbackUrl)

## 💡 추가 개선 사항

### 1. 로딩 컴포넌트 통일
```typescript
// components/ui/PageLoading.tsx 생성
export default function PageLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">로딩 중...</div>
    </div>
  );
}
```

### 2. 권한 없음 페이지
```typescript
// app/unauthorized/page.tsx 생성
export default function UnauthorizedPage() {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">권한이 없습니다</h1>
      <Link href="/dashboard">대시보드로 돌아가기</Link>
    </div>
  );
}
```

## 📚 참고 파일

1. **usePageAuth 훅**: `src/hooks/usePageAuth.ts`
2. **샘플 수정 페이지**: `src/app/customer/stacks/page.tsx`
3. **상세 가이드**: `PAGE_REFRESH_FIX_GUIDE.md`
4. **로그인 페이지**: `src/app/login/page.tsx` (callbackUrl 지원)

## 🚀 다음 단계

1. **우선순위 높은 페이지부터 수정**
   - 고객사 페이지 (4개)
   - 환경측정기업 페이지 (7개)
   - 시스템 관리자 페이지 (5개)

2. **테스트**
   - 각 페이지별 새로고침 테스트
   - 권한 체크 테스트

3. **배포**
   - 모든 페이지 수정 완료 후 배포

## ⚠️ 주의사항

- `router.push("/dashboard")`를 무조건 제거하지 말고, 로딩 체크를 추가하세요
- `useEffect` 의존성 배열에 `loading`을 반드시 추가하세요
- 각 페이지의 역할에 맞는 훅을 사용하세요
