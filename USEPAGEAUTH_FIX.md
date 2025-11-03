# usePageAuth 무한 루프 문제 해결

## 🐛 문제 상황

**증상:**
- 고객사 굴뚝관리 메뉴에서 새로고침 시 로그아웃됨
- 페이지가 계속 리렌더링됨
- 무한 루프 발생

**원인:**
```typescript
// 문제 있는 코드
export function useCustomerAuth() {
  return usePageAuth({
    allowedRoles: ["SUPER_ADMIN", "CUSTOMER_ADMIN", "CUSTOMER_USER"],  // ❌ 매번 새 배열 생성
    redirectTo: "/dashboard",  // ❌ 매번 새 객체 생성
  });
}

// usePageAuth 내부
useEffect(() => {
  // ...
}, [user, loading, pathname, router, options]);  // ❌ options가 매번 변경됨
```

**문제 분석:**
1. `useCustomerAuth()`가 호출될 때마다 새로운 객체와 배열 생성
2. `usePageAuth`의 `useEffect` 의존성 배열에 `options` 포함
3. `options`가 매번 변경되어 `useEffect` 무한 실행
4. 무한 루프 발생 → 로그아웃

## ✅ 해결 방법

### 1. useMemo를 사용한 메모이제이션

**수정된 코드:**
```typescript
import { useMemo } from "react";

export function useCustomerAuth() {
  const options = useMemo(() => ({
    allowedRoles: ["SUPER_ADMIN" as UserRole, "CUSTOMER_ADMIN" as UserRole, "CUSTOMER_USER" as UserRole],
    redirectTo: "/dashboard",
  }), []);  // ✅ 빈 의존성 배열 → 한 번만 생성
  
  return usePageAuth(options);
}
```

### 2. useEffect 의존성 배열 수정

**수정된 코드:**
```typescript
export function usePageAuth(options: PageAuthOptions) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      const callbackUrl = encodeURIComponent(pathname || "/dashboard");
      router.push(`/login?callbackUrl=${callbackUrl}`);
      return;
    }

    const hasPermission = options.allowedRoles.includes(user.role as UserRole);
    
    if (!hasPermission) {
      const redirectPath = options.redirectTo || "/dashboard";
      router.push(redirectPath);
    }
  }, [user, loading, pathname, router, options.allowedRoles, options.redirectTo, options.onUnauthorized]);
  // ✅ options 객체 대신 개별 속성 사용
}
```

## 🔧 수정된 파일

**파일**: `c:/Users/User/boaz/frontend/src/hooks/usePageAuth.ts`

**수정된 훅들:**
- ✅ `useAdminAuth()`
- ✅ `useOrgAuth()`
- ✅ `useOrgAdminAuth()`
- ✅ `useCustomerAuth()`
- ✅ `useCustomerAdminAuth()`

## 📝 Before & After

### Before (문제 있음)
```typescript
export function useCustomerAuth() {
  return usePageAuth({
    allowedRoles: ["SUPER_ADMIN", "CUSTOMER_ADMIN", "CUSTOMER_USER"],
    redirectTo: "/dashboard",
  });
}

// 매번 호출될 때마다:
// 1. 새로운 배열 생성
// 2. 새로운 객체 생성
// 3. useEffect 재실행
// 4. 무한 루프
```

### After (해결됨)
```typescript
export function useCustomerAuth() {
  const options = useMemo(() => ({
    allowedRoles: ["SUPER_ADMIN" as UserRole, "CUSTOMER_ADMIN" as UserRole, "CUSTOMER_USER" as UserRole],
    redirectTo: "/dashboard",
  }), []);
  
  return usePageAuth(options);
}

// 첫 렌더링 시:
// 1. options 객체 생성 및 메모이제이션
// 2. useEffect 실행

// 이후 렌더링:
// 1. 메모이제이션된 options 재사용
// 2. useEffect 재실행 안 함 (의존성 변경 없음)
// 3. 정상 작동
```

## 🧪 테스트

### 1. 새로고침 테스트
```
1. 고객사 굴뚝관리 메뉴 접속
2. F5 또는 Ctrl+R 누르기
3. ✅ 로그아웃되지 않고 동일 페이지 유지
4. ✅ 무한 루프 발생하지 않음
```

### 2. 권한 테스트
```
1. 고객사 사용자로 로그인
2. 고객사 페이지 접속
3. ✅ 정상 접근
4. 환경측정기업 페이지 접속 시도
5. ✅ 대시보드로 리다이렉트
```

### 3. 로그인 테스트
```
1. 로그아웃 상태에서 고객사 페이지 접속
2. ✅ 로그인 페이지로 리다이렉트
3. ✅ callbackUrl 포함됨
4. 로그인
5. ✅ 원래 페이지로 복귀
```

## 💡 핵심 개념

### useMemo란?

```typescript
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

- 계산 비용이 높은 값을 메모이제이션
- 의존성 배열의 값이 변경될 때만 재계산
- 빈 배열 `[]`을 사용하면 한 번만 계산

### 왜 useMemo가 필요한가?

```typescript
// ❌ 문제: 매번 새로운 객체 생성
function MyComponent() {
  const options = {
    allowedRoles: ["ADMIN"],
  };
  
  useEffect(() => {
    // options가 매번 변경되어 무한 루프
  }, [options]);
}

// ✅ 해결: 메모이제이션
function MyComponent() {
  const options = useMemo(() => ({
    allowedRoles: ["ADMIN"],
  }), []);
  
  useEffect(() => {
    // options가 변경되지 않아 한 번만 실행
  }, [options]);
}
```

## ⚠️ 주의사항

### 1. 의존성 배열 관리

```typescript
// ❌ 잘못된 예
const options = useMemo(() => ({
  allowedRoles: [role],  // role이 외부 변수
}), []);  // 의존성 배열에 role이 없음

// ✅ 올바른 예
const options = useMemo(() => ({
  allowedRoles: [role],
}), [role]);  // role이 변경될 때 재생성
```

### 2. 불필요한 useMemo 사용 지양

```typescript
// ❌ 불필요
const name = useMemo(() => "John", []);

// ✅ 간단한 값은 그대로 사용
const name = "John";
```

### 3. 객체/배열만 메모이제이션

```typescript
// ✅ 필요함 (객체)
const options = useMemo(() => ({ key: "value" }), []);

// ✅ 필요함 (배열)
const items = useMemo(() => [1, 2, 3], []);

// ❌ 불필요 (원시값)
const count = useMemo(() => 5, []);
```

## 📚 참고 자료

- React useMemo 공식 문서: https://react.dev/reference/react/useMemo
- useEffect 의존성 배열: https://react.dev/reference/react/useEffect#dependencies

## 🎉 결과

이제 모든 페이지에서:
- ✅ 새로고침 시 로그아웃되지 않음
- ✅ 무한 루프 발생하지 않음
- ✅ 정상적인 권한 체크
- ✅ 안정적인 페이지 유지
