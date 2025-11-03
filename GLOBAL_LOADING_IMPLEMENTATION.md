# 전역 로딩 화면 구현 완료

## 📋 문제 상황

**기존 문제:**
- 로딩 중일 때 상단 네비게이션 바가 표시됨
- 고객사 페이지에서 특정 환경측정기업 정보가 표시됨
- 일관성 없는 로딩 화면

**요구사항:**
- 모든 로딩 중 화면은 상단에 "오염물질 측정 관리 시스템"만 표시
- 중간에 "로딩 중" 표시
- 네비게이션 바 및 기타 UI 요소 숨김

## ✅ 해결 방법

### 1. 전역 로딩 컴포넌트 생성

**파일**: `c:/Users/User/boaz/frontend/src/components/ui/GlobalLoading.tsx`

**구성:**
```
┌─────────────────────────────────────┐
│                                     │
│    오염물질 측정 관리 시스템        │
│  Pollutant Measurement Management   │
│              System                 │
│                                     │
│              ⟳ 로딩 중...           │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**특징:**
- ✅ 깔끔한 중앙 정렬 레이아웃
- ✅ 회전하는 스피너 애니메이션
- ✅ 다크 모드 지원
- ✅ 반응형 디자인

### 2. AuthContext 수정

**파일**: `c:/Users/User/boaz/frontend/src/contexts/AuthContext.tsx`

**변경 사항:**
```typescript
// Before
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  
  return (
    <AuthContext.Provider value={{ user, loading: status === "loading" }}>
      {children}  // ❌ 로딩 중에도 children이 렌더링됨
    </AuthContext.Provider>
  );
}

// After
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  
  const isLoading = status === "loading";
  
  // 로그인, 회원가입 페이지에서는 GlobalLoading을 표시하지 않음
  const showGlobalLoading = isLoading && 
    pathname !== "/login" && 
    !pathname?.startsWith("/register") && 
    !pathname?.startsWith("/invite") &&
    !pathname?.startsWith("/auth");
  
  // ✅ 로딩 중이면 GlobalLoading만 표시
  if (showGlobalLoading) {
    return <GlobalLoading />;
  }
  
  return (
    <AuthContext.Provider value={{ user, loading: isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

## 🎨 UI 디자인

### 레이아웃

```
전체 화면 (min-h-screen)
├─ 상단 여백
├─ 타이틀 영역
│  ├─ "오염물질 측정 관리 시스템" (3xl, bold)
│  └─ "Pollutant Measurement Management System" (sm, gray)
├─ 중간 여백 (mb-16)
├─ 로딩 영역
│  ├─ 회전 스피너 (w-16 h-16, blue-600)
│  └─ "로딩 중..." (sm, gray)
└─ 하단 여백
```

### 색상 스킴

**라이트 모드:**
- 배경: `bg-gray-50`
- 타이틀: `text-gray-900`
- 서브타이틀: `text-gray-600`
- 스피너 테두리: `border-gray-200`
- 스피너 활성: `border-t-blue-600`

**다크 모드:**
- 배경: `dark:bg-gray-900`
- 타이틀: `dark:text-white`
- 서브타이틀: `dark:text-gray-400`
- 스피너 테두리: `dark:border-gray-700`
- 스피너 활성: `border-t-blue-600` (동일)

## 🔧 적용 범위

### GlobalLoading이 표시되는 경우

✅ **표시됨:**
- `/dashboard` - 대시보드
- `/customer/*` - 고객사 페이지
- `/org/*` - 환경측정기업 페이지
- `/admin/*` - 시스템 관리자 페이지
- `/masters/*` - 기준 정보 관리
- `/measure/*` - 측정 관리
- `/notifications` - 알림
- `/profile` - 프로필
- 기타 모든 인증이 필요한 페이지

❌ **표시 안 됨:**
- `/login` - 로그인 페이지 (자체 로딩 UI)
- `/register/*` - 회원가입 페이지
- `/invite/*` - 초대 페이지
- `/auth/*` - 인증 관련 페이지

## 📝 동작 흐름

### 1. 페이지 접속 시

```
사용자 → 페이지 접속
  ↓
AuthProvider 로딩 시작 (status: "loading")
  ↓
GlobalLoading 표시
  - 네비게이션 바 숨김
  - 페이지 콘텐츠 숨김
  - 깔끔한 로딩 화면만 표시
  ↓
세션 로드 완료 (status: "authenticated" or "unauthenticated")
  ↓
GlobalLoading 숨김
  ↓
실제 페이지 렌더링
  - 네비게이션 바 표시
  - 페이지 콘텐츠 표시
```

### 2. 페이지 새로고침 시

```
F5 또는 Ctrl+R
  ↓
AuthProvider 재로딩 (status: "loading")
  ↓
GlobalLoading 표시 (0.5~1초)
  - 기존 페이지 숨김
  - 로딩 화면 표시
  ↓
세션 재확인 완료
  ↓
GlobalLoading 숨김
  ↓
동일한 페이지 표시 (리다이렉트 없음)
```

## 🎯 장점

### 사용자 경험
- ✅ 일관된 로딩 화면
- ✅ 깔끔한 UI
- ✅ 혼란스러운 정보 표시 없음
- ✅ 브랜드 아이덴티티 강화

### 개발 관점
- ✅ 중앙 집중식 로딩 관리
- ✅ 모든 페이지에 자동 적용
- ✅ 추가 코드 불필요
- ✅ 유지보수 용이

### 성능
- ✅ 불필요한 컴포넌트 렌더링 방지
- ✅ 네비게이션 바 로딩 방지
- ✅ API 호출 최소화

## 🧪 테스트 방법

### 1. 페이지 접속 테스트
```
1. 로그아웃 상태에서 시작
2. 로그인
3. 대시보드 접속
   → GlobalLoading이 잠깐 표시되는지 확인
   → 네비게이션 바가 로딩 중에 표시되지 않는지 확인
```

### 2. 새로고침 테스트
```
1. 임의의 페이지 접속 (예: /customer/stacks)
2. F5 또는 Ctrl+R 누르기
   → GlobalLoading이 표시되는지 확인
   → 동일한 페이지로 돌아오는지 확인
   → 네비게이션 바가 로딩 중에 표시되지 않는지 확인
```

### 3. 다크 모드 테스트
```
1. 다크 모드 활성화
2. 페이지 새로고침
   → GlobalLoading이 다크 모드로 표시되는지 확인
```

### 4. 로그인 페이지 테스트
```
1. 로그인 페이지 접속
2. 새로고침
   → GlobalLoading이 표시되지 않는지 확인
   → 로그인 페이지 자체 UI가 표시되는지 확인
```

## 💡 추가 개선 사항

### 1. 스켈레톤 로딩 (선택)

페이지별로 더 구체적인 로딩 UI가 필요한 경우:

```typescript
// components/ui/PageSkeleton.tsx
export default function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );
}

// 사용
if (loading) return <PageSkeleton />;
```

### 2. 로딩 진행률 표시 (선택)

```typescript
// GlobalLoading.tsx에 추가
<div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
  <div className="h-full bg-blue-600 animate-progress"></div>
</div>
```

### 3. 로딩 시간 측정 (디버깅용)

```typescript
useEffect(() => {
  if (isLoading) {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      console.log(`Loading duration: ${duration}ms`);
    };
  }
}, [isLoading]);
```

## 📚 참고 파일

1. **GlobalLoading 컴포넌트**: `src/components/ui/GlobalLoading.tsx`
2. **AuthContext**: `src/contexts/AuthContext.tsx`
3. **AppShell**: `src/components/layout/AppShell.tsx`

## ⚠️ 주의사항

1. **로그인 페이지 예외 처리**
   - 로그인 페이지에서는 GlobalLoading을 표시하지 않음
   - 자체 로딩 UI 사용

2. **회원가입 페이지 예외 처리**
   - 회원가입 페이지에서도 GlobalLoading을 표시하지 않음
   - 자체 UI 유지

3. **초대 링크 페이지**
   - 초대 링크 페이지도 예외 처리됨
   - 자체 UI 사용

## 🎉 결과

이제 모든 페이지에서:
- ✅ 로딩 중에는 깔끔한 로딩 화면만 표시
- ✅ 네비게이션 바 숨김
- ✅ 일관된 사용자 경험
- ✅ 브랜드 아이덴티티 강화
