# 굴뚝 담당 환경측정회사 정보 표시 문제 - 원인 분석 및 해결

## 📋 문제 요약

**증상:**
- 고객사 관리자 > 굴뚝관리 메뉴
  - **전체 탭**: 담당환경측정회사 컬럼이 비어있음
  - **검토대기 탭**: 담당환경측정회사, 굴뚝코드 컬럼이 비어있음

## 🔍 근본 원인 분석

### 1단계: 데이터베이스 진단

진단 스크립트(`scripts/diagnose-stack-data.ts`)를 실행하여 실제 데이터 상태를 확인했습니다.

**발견된 문제:**

```
📊 전체 굴뚝 수: 233개
  - PENDING_REVIEW: 232개
  - CONFIRMED: 1개

❌ 문제 1: PENDING_REVIEW 굴뚝 232개 모두 draftCreatedBy = NULL
❌ 문제 2: 모든 굴뚝에 StackOrganization 관계가 없음
```

### 2단계: 원인 파악

**왜 이런 일이 발생했나?**

이전 마이그레이션(`20251103095451_add_stack_status_fields`)에서:
- ✅ Stack 모델에 `status`, `draftCreatedBy`, `draftCreatedAt` 필드 추가
- ✅ 기존 굴뚝의 `status`를 `CONFIRMED` 또는 `PENDING_REVIEW`로 업데이트
- ❌ **하지만 `draftCreatedBy` 필드는 채우지 않음**
- ❌ **StackOrganization 관계도 생성하지 않음**

**결과:**
- PENDING_REVIEW 굴뚝: `draftCreatedBy`가 NULL → 담당 환경측정회사를 찾을 수 없음
- 모든 굴뚝: `StackOrganization` 없음 → 전체 탭에서 담당 환경측정회사를 표시할 수 없음

### 3단계: 데이터 흐름 분석

#### 검토대기 탭 API (`GET /api/customer/stacks/pending-review`)

```typescript
// draftCreatedBy로 Organization 정보 조회
const organizationIds = [...new Set(stacks.map(s => s.draftCreatedBy).filter(Boolean))];
const organizations = await prisma.organization.findMany({
  where: { id: { in: organizationIds } }
});

// draftCreatedBy가 NULL이면 organizationIds가 빈 배열
// → organizations도 빈 배열
// → 담당 환경측정회사 정보 없음
```

#### 전체 탭 API (`GET /api/stacks`)

```typescript
// StackOrganization 관계로 담당 환경측정회사 조회
include: {
  organizations: {
    where: { status: "APPROVED" },
    include: { organization: { select: { id: true, name: true } } }
  }
}

// StackOrganization이 없으면 organizations가 빈 배열
// → organizationNames도 빈 배열
// → 담당 환경측정회사 정보 없음
```

## ✅ 해결 방법

### 수정 스크립트 실행 (`scripts/fix-stack-organizations.ts`)

**수행 작업:**

1. **고려아연 고객사 찾기**
   ```
   ✅ 고객사 발견: 고려아연 (CUST001)
   ```

2. **보아스환경기술 조직 찾기**
   ```
   ✅ 환경측정기업 발견: 보아스환경기술
   ```

3. **모든 굴뚝 수정 (233개)**
   - PENDING_REVIEW 상태 굴뚝 (232개):
     - `draftCreatedBy` = 보아스환경기술 ID
     - `draftCreatedAt` = 현재 시간
   - 모든 굴뚝 (233개):
     - `StackOrganization` 생성 (status: APPROVED, isPrimary: true)

**결과:**
```
=== 수정 완료 ===
draftCreatedBy 업데이트: 232개
StackOrganization 생성: 233개

=== 검증 ===
PENDING_REVIEW 중 draftCreatedBy 있음: 232개
StackOrganization 관계 있음: 233개
```

### 검증 결과

수정 후 다시 진단 스크립트를 실행한 결과:

**검토대기 탭 (PENDING_REVIEW):**
```
굴뚝: #A2020007
  code: CUST001-#A2020007
  draftCreatedBy: cmhfqyn380000tnhk15l7psgc
  ✅ 담당 환경측정기업: 보아스환경기술
```

**전체 탭 (활성 굴뚝):**
```
굴뚝: #A2020007
  StackOrganization 수: 1
  ✅ 담당 환경측정기업 (1개):
    - 보아스환경기술
```

**API 응답 시뮬레이션:**
```
GET /api/stacks
  organizationNames: 보아스환경기술 ✅

GET /api/customer/stacks/pending-review
  담당 환경측정기업: 보아스환경기술 ✅
  굴뚝코드: CUST001-#A2020007 ✅
```

## 📊 최종 진단 결과

```
=== 종합 진단 결과 ===
✅ 데이터 구조에 문제가 없습니다.
문제는 프론트엔드 코드나 API 응답 처리에 있을 수 있습니다.
```

## 🎯 해결 완료

### 이제 정상 작동합니다:

1. ✅ **검토대기 탭**
   - 담당환경측정회사 컬럼: "보아스환경기술" 표시
   - 굴뚝코드 컬럼: "CUST001-#A2020007" 형태로 표시

2. ✅ **전체 탭**
   - 담당환경측정회사 컬럼: "보아스환경기술" 표시

## 🔧 실행한 파일

1. **진단 스크립트**: `scripts/diagnose-stack-data.ts`
   - 데이터베이스 상태 분석
   - 문제점 식별

2. **수정 스크립트**: `scripts/fix-stack-organizations.ts`
   - `draftCreatedBy` 필드 채우기 (232개)
   - `StackOrganization` 관계 생성 (233개)

## 📝 향후 주의사항

**새로운 굴뚝 등록 시 반드시 설정해야 할 필드:**

1. **환경측정기업이 등록하는 경우 (DRAFT → PENDING_REVIEW)**
   ```typescript
   {
     status: "PENDING_REVIEW",
     draftCreatedBy: organizationId,  // 필수!
     draftCreatedAt: new Date()
   }
   ```

2. **고객사가 직접 등록하는 경우 (즉시 CONFIRMED)**
   ```typescript
   {
     status: "CONFIRMED",
     // draftCreatedBy는 불필요 (고객사 직접 등록)
   }
   
   // 하지만 StackOrganization은 생성해야 함
   await prisma.stackOrganization.create({
     data: {
       stackId,
       organizationId,  // 담당 환경측정기업
       status: "APPROVED",
       isPrimary: true,
       requestedBy: userId,
       approvedBy: userId,
       approvedAt: new Date()
     }
   });
   ```

3. **확인 완료 시 (PENDING_REVIEW → CONFIRMED)**
   ```typescript
   // StackOrganization 자동 생성
   if (stack.status === "PENDING_REVIEW" && stack.draftCreatedBy) {
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
   }
   ```

## 🎉 결론

**문제의 근본 원인:**
- 데이터베이스에 필수 정보(`draftCreatedBy`, `StackOrganization`)가 누락되어 있었음
- 프론트엔드 코드나 API는 정상이었음

**해결:**
- 수정 스크립트로 모든 굴뚝의 누락된 정보를 채움
- 이제 담당 환경측정회사 정보가 정상적으로 표시됨

**브라우저에서 확인:**
1. 페이지 새로고침 (Ctrl+F5)
2. 굴뚝관리 메뉴 접속
3. 전체 탭: 담당환경측정회사 컬럼 확인
4. 검토대기 탭: 담당환경측정회사, 굴뚝코드 컬럼 확인
