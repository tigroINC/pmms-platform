# 굴뚝 관리 최종 점검 보고서

## 📋 현재 상황 분석

### 1. 고객사 직접 등록 굴뚝 흐름

**API: POST /api/customer/stacks/create**
```typescript
// 1. 고객사 CUSTOMER_ADMIN이 굴뚝 직접 등록
// 2. Stack 생성 (isActive: true, 즉시 활성화)
// 3. 알림 생성 (notifyStackCreatedByCustomer)
//    - 담당 환경측정기업 관리자에게 알림
//    - needsInternalCode: true (내부코드 없음)
```

**문제점:**
- ✅ 굴뚝은 정상 생성됨 (isActive: true)
- ✅ 알림은 정상 발송됨
- ❌ **고객사 화면에서 보이지 않음**

### 2. 고객사 굴뚝 목록 조회 흐름

**페이지: /customer/stacks**
- **전체 탭**: `/api/stacks` 호출
- **검토대기 탭**: `/api/customer/stacks/pending-review` 호출

**API: GET /api/stacks**
```typescript
// 조직 필터링 로직
where.customer = {
  OR: [
    { createdBy: userId },  // 내부 관리
    {
      organizations: {
        some: {
          organizationId: effectiveOrgId,
          status: "APPROVED"
        }
      }
    }
  ]
};
```

## 🔴 핵심 문제 발견

### 문제 1: 고객사 사용자의 조직 필터링 오류

**현재 코드 (GET /api/stacks):**
```typescript
const userRole = (session.user as any).role;
const userOrgId = (session.user as any).organizationId;
const effectiveOrgId = organizationId || userOrgId;

// 고객사 사용자는 organizationId가 없음!
// effectiveOrgId = undefined
```

**문제:**
- 고객사 사용자는 `organizationId`가 없음 (customerId만 있음)
- `effectiveOrgId`가 undefined가 되어 필터링 실패
- 고객사가 직접 등록한 굴뚝도 `createdBy`가 고객사 사용자 ID
- 하지만 `customer.createdBy`는 환경측정기업 사용자 ID를 기대함

### 문제 2: 고객사 직접 등록 굴뚝의 createdBy 불일치

**현재 Stack 생성:**
```typescript
await prisma.stack.create({
  data: {
    customerId,
    siteCode,
    siteName,
    createdBy: userId,  // 고객사 사용자 ID
    // ...
  }
});
```

**조회 조건:**
```typescript
where.customer = {
  OR: [
    { createdBy: userId },  // Customer.createdBy를 체크
    // ...
  ]
};
```

**문제:**
- Stack.createdBy는 고객사 사용자 ID
- Customer.createdBy는 환경측정기업 사용자 ID (또는 null)
- 조건이 맞지 않아 조회 실패

## ✅ 해결 방안

### 방안 1: 고객사 사용자 전용 필터링 로직 추가 (권장)

**GET /api/stacks 수정:**
```typescript
// 고객사 사용자인 경우
if (userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER") {
  const userCustomerId = (session.user as any).customerId;
  
  if (userCustomerId) {
    where.customerId = userCustomerId;
  }
} else {
  // 환경측정기업 사용자 (기존 로직)
  where.customer = {
    OR: [
      { createdBy: userId },
      {
        organizations: {
          some: {
            organizationId: effectiveOrgId,
            status: "APPROVED"
          }
        }
      }
    ]
  };
}
```

### 방안 2: 고객사 페이지에서 customerId 파라미터 전달

**customer/stacks/page.tsx 수정:**
```typescript
const fetchConfirmedStacks = async () => {
  try {
    setLoading(true);
    const customerId = user?.customerId;
    const url = customerId 
      ? `/api/stacks?customerId=${customerId}`
      : `/api/stacks`;
    const res = await fetch(url);
    // ...
  }
};
```

## 🎯 권장 구현 순서

1. **즉시 수정 (방안 1)**: GET /api/stacks에 고객사 사용자 필터링 추가
2. **확인**: 고객사 로그인 → 굴뚝 관리 → 전체 탭에서 직접 등록한 굴뚝 확인
3. **추가 개선**: 검토대기 탭 로직도 확인 및 개선

## 📊 환경측정기업 배정 및 공유 프로세스

### 현재 구현 상태

#### 1. 고객사 직접 등록 시
```
고객사 CUSTOMER_ADMIN
  ↓ POST /api/customer/stacks/create
Stack 생성 (isActive: true)
  ↓
알림 생성 (notifyStackCreatedByCustomer)
  ↓
환경측정기업 ORG_ADMIN에게 알림
  - "고객사명이 새로운 굴뚝을 등록했습니다"
  - needsInternalCode: true
```

#### 2. 환경측정기업 확인 및 배정
```
환경측정기업 ORG_ADMIN
  ↓ 알림 확인
굴뚝 관리 메뉴 접근
  ↓
내부 코드 부여 (선택)
  ↓
StackOrganization 생성 (담당 배정)
```

#### 3. 실시간 공유
```
고객사 수정 → Stack 업데이트
  ↓
StackHistory 기록
  ↓
환경측정기업에게 알림 (notifyStackUpdatedByCustomer)
  ↓
실시간 데이터 공유 (동일 Stack 레코드)
```

### 누락된 기능

#### ❌ 환경측정기업 배정 UI
- 현재: 알림만 발송
- 필요: 배정 버튼 및 StackOrganization 생성 UI

#### ❌ 내부 코드 부여 UI
- 현재: Stack.code 필드만 존재
- 필요: 환경측정기업이 내부 코드 입력하는 UI

#### ✅ 알림 시스템
- 고객사 등록 → 환경측정기업 알림 ✅
- 고객사 수정 → 환경측정기업 알림 ✅
- 환경측정기업 등록 → 고객사 알림 ✅

## 🔧 다음 단계 작업

### 1단계: 즉시 수정 (고객사 굴뚝 표시)
- [ ] GET /api/stacks에 고객사 사용자 필터링 추가
- [ ] 테스트: 고객사 직접 등록 → 화면 표시 확인

### 2단계: 환경측정기업 배정 기능
- [ ] 환경측정기업 굴뚝 관리에 "미배정 굴뚝" 탭 추가
- [ ] 배정 버튼 → StackOrganization 생성
- [ ] 내부 코드 입력 UI

### 3단계: 완전한 공유 프로세스
- [ ] 고객사: 직접 등록 → 즉시 표시 ✅
- [ ] 환경측정기업: 알림 확인 → 배정 → 내부 코드 부여
- [ ] 양측: 실시간 데이터 공유 ✅
- [ ] 양측: 수정 시 알림 ✅

## 📝 요약

**현재 상태:**
- ✅ 고객사 직접 등록 API 정상 작동
- ✅ 알림 시스템 정상 작동
- ❌ 고객사 화면에 굴뚝 표시 안됨 (필터링 오류)
- ⚠️ 환경측정기업 배정 UI 미구현

**즉시 해결 필요:**
- GET /api/stacks의 고객사 사용자 필터링 로직 수정

**향후 개선 필요:**
- 환경측정기업 배정 및 내부 코드 부여 UI 구현
