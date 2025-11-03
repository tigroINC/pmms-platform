# 고객사 굴뚝 관리 - 검토대기 탭 분석 보고서

## 📋 질문 1: 검토대기 탭의 굴뚝 흐름

### ✅ 검토대기 탭에 굴뚝이 오는 경우

**시나리오: 환경측정기업이 DRAFT 고객사에 굴뚝 등록 → 고객사 연결 승인**

```
1. 환경측정기업 ORG_ADMIN
   ↓ POST /api/org/draft-customers/create
   Customer 생성 (status: "DRAFT", draftCreatedBy: organizationId)

2. 환경측정기업 ORG_ADMIN
   ↓ POST /api/org/draft-customers/[customerId]/stacks/create
   Stack 생성 (status: "DRAFT", draftCreatedBy: organizationId)
   - 여러 개 등록 가능

3. 환경측정기업 ORG_ADMIN
   ↓ POST /api/customer-organizations (연결 요청)
   CustomerOrganization 생성 (status: "PENDING")

4. 고객사 CUSTOMER_ADMIN
   ↓ PATCH /api/customer-organizations/[id]/approve (연결 승인)
   - CustomerOrganization.status: "PENDING" → "APPROVED"
   - Customer.status: "DRAFT" → "CONNECTED"
   - **Stack.status: "DRAFT" → "PENDING_REVIEW"** ✅
   - Stack.draftCreatedBy: organizationId (유지)

5. 고객사 굴뚝 관리 페이지
   ↓ GET /api/customer/stacks/pending-review
   검토대기 탭에 굴뚝 표시 ✅
```

### 📊 검토대기 굴뚝의 상태값

**Stack 테이블 필드:**
```typescript
{
  status: "PENDING_REVIEW",  // 문자열 (enum 아님)
  draftCreatedBy: "org_xxx", // 등록한 환경측정기업 ID
  draftCreatedAt: "2025-11-03T...",
  customerId: "cust_xxx",
  isActive: true,
  // ... 기타 필드
}
```

**API 조회 조건:**
```typescript
// GET /api/customer/stacks/pending-review
where: {
  customerId: userCustomerId,
  status: "PENDING_REVIEW",
}
```

### 🔄 검토대기 → 확정 액션

**방법 1: 개별 확인 (현재 미구현)**
```
고객사 CUSTOMER_ADMIN
  ↓ "상세보기" 클릭
  ↓ 정보 확인 후 "확인" 버튼 (미구현)
  ↓ PATCH /api/customer/stacks/[id]/confirm
Stack.status: "PENDING_REVIEW" → "CONFIRMED"
```

**방법 2: 수정 후 확정**
```
고객사 CUSTOMER_ADMIN
  ↓ "상세보기" 클릭 → 수정 페이지
  ↓ 정보 수정 후 저장
  ↓ PATCH /api/customer/stacks/[id]/confirm
Stack.status: "PENDING_REVIEW" → "CONFIRMED"
StackOrganization 생성 (담당 배정)
```

**방법 3: 일괄 확정 (현재 미구현)**
```
고객사 CUSTOMER_ADMIN
  ↓ 여러 개 선택 후 "일괄 확정" 버튼 (미구현)
  ↓ POST /api/customer/stacks/bulk-confirm
모든 선택 굴뚝: "PENDING_REVIEW" → "CONFIRMED"
```

### ⚠️ 현재 문제점

1. **검토대기 → 확정 프로세스 불명확**
   - "상세보기" 버튼만 있고 "확인" 버튼 없음
   - 수정하지 않으면 확정할 방법 없음
   - 일괄 확정 기능 없음

2. **자동 확정 없음**
   - PENDING_REVIEW 상태가 자동으로 CONFIRMED로 변경되지 않음
   - 고객사가 명시적으로 확정해야 함

---

## 📋 질문 2: 전체 탭의 굴뚝 정보 문제

### 🔴 문제 상황

**고려아연 관리자 계정 → 전체 탭:**
- 보아스환경기술이 등록한 굴뚝 표시됨 ✅
- 담당환경측정회사 컬럼 없음 ❌
- 상태: "확인필요" (isVerified: false) ✅

### 🔍 원인 분석

#### 1. 담당환경측정회사 컬럼 부재

**현재 전체 탭 컬럼:**
```typescript
// customer/stacks/page.tsx (409-454줄)
<thead>
  <tr>
    <th>굴뚝번호</th>
    <th>확인 상태</th>
    <th>굴뚝코드</th>
    <th>굴뚝 정식 명칭</th>
    <th>배출시설 종류</th>
    <th>위치</th>
    <th>높이(m)</th>
    <th>직경(m)</th>
    <th>측정 건수</th>
    <th>액션</th>
  </tr>
</thead>
```

**문제:**
- `담당환경측정회사` 컬럼이 없음
- Stack 데이터에 `organizations` 관계 포함 안됨

#### 2. API 응답 데이터 부족

**현재 GET /api/stacks 응답:**
```typescript
include: { 
  customer: { 
    select: { 
      id: true, 
      name: true, 
      code: true, 
      isActive: true 
    }
  },
  _count: {
    select: { measurements: true }
  }
}
// organizations 관계 포함 안됨 ❌
```

#### 3. 확인필요 상태

**isVerified: false 원인:**
```typescript
// Stack 생성 시 기본값
{
  isVerified: false,  // 기본값
  verifiedBy: null,
  verifiedAt: null
}
```

**확인완료 방법:**
```typescript
// POST /api/customer/stacks/[id]/verify
{
  isVerified: true,
  verifiedBy: userId,
  verifiedAt: new Date()
}
```

### ✅ 해결 방안

#### 방안 1: 담당환경측정회사 컬럼 추가 (권장)

**1단계: API 수정**
```typescript
// GET /api/stacks
include: { 
  customer: { 
    select: { 
      id: true, 
      name: true, 
      code: true, 
      isActive: true 
    }
  },
  organizations: {  // 추가 ✅
    where: {
      status: "APPROVED"
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true
        }
      }
    }
  },
  _count: {
    select: { measurements: true }
  }
}
```

**2단계: UI 수정**
```typescript
// customer/stacks/page.tsx
<th>담당환경측정회사</th>

// 테이블 바디
<td>
  {stack.organizations?.map(org => 
    org.organization.name
  ).join(", ") || "-"}
</td>
```

#### 방안 2: PENDING_REVIEW 굴뚝 표시

**검토대기 탭에서 확정하지 않은 굴뚝:**
- 현재: 전체 탭에 표시됨 (isActive: true)
- 문제: 담당 환경측정회사 정보 없음 (StackOrganization 미생성)

**해결:**
```typescript
// 검토대기 탭에서 확정 시
await prisma.stackOrganization.create({
  data: {
    stackId,
    organizationId: stack.draftCreatedBy,
    status: "APPROVED",
    isPrimary: true,
    requestedBy: userId,
    approvedBy: userId,
    approvedAt: new Date()
  }
});
```

---

## 🎯 종합 정리

### 검토대기 탭 흐름

| 단계 | 상태 | 액션 | 결과 상태 |
|------|------|------|-----------|
| 1. 환경측정기업 등록 | DRAFT | 고객사 연결 승인 | PENDING_REVIEW |
| 2. 고객사 검토 | PENDING_REVIEW | 상세보기 → 확인 | CONFIRMED |
| 3. 확정 완료 | CONFIRMED | - | 전체 탭 표시 |

### 전체 탭 문제

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| 담당환경측정회사 미표시 | organizations 관계 미포함 | API에 include 추가 + UI 컬럼 추가 |
| 확인필요 상태 | isVerified: false | "확인완료" 버튼 클릭 |
| PENDING_REVIEW 굴뚝도 표시 | isActive: true 필터링 | status 필터 추가 고려 |

### 즉시 수정 필요 사항

1. **GET /api/stacks에 organizations 관계 추가** ✅
2. **전체 탭에 담당환경측정회사 컬럼 추가** ✅
3. **검토대기 → 확정 프로세스 명확화** (개별 확인 버튼 또는 일괄 확정)
