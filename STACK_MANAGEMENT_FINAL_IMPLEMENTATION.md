# 고객사 굴뚝 관리 최종 구현 완료 보고서

## ✅ 완료된 작업

### 1️⃣ 데이터 마이그레이션 (기존 굴뚝 상태 업데이트)

**Prisma 스키마 변경:**
```prisma
model Stack {
  // ... 기존 필드
  
  // 상태 관리 (신규 추가)
  status         String? // DRAFT, PENDING_REVIEW, CONFIRMED
  draftCreatedBy String? // DRAFT 생성한 환경측정기업 ID
  draftCreatedAt DateTime? // DRAFT 생성 시간
}
```

**마이그레이션 실행:**
- 마이그레이션 파일: `20251103095451_add_stack_status_fields`
- 스크립트: `scripts/fix-stack-status.ts`
- 결과: 233건 CONFIRMED 상태로 업데이트 완료

**파일:**
- `prisma/schema.prisma`
- `prisma/migrations/fix_stack_status.sql`
- `scripts/fix-stack-status.ts`

---

### 2️⃣ 검토대기 탭 확인완료 기능

**API 개선:**
```typescript
// POST /api/customer/stacks/[id]/verify
// 기능 확장: isVerified 업데이트 + PENDING_REVIEW → CONFIRMED 전환

await prisma.$transaction(async (tx) => {
  // 1. 굴뚝 상태 업데이트
  await tx.stack.update({
    where: { id },
    data: {
      isVerified: true,
      verifiedBy: userId,
      verifiedAt: new Date(),
      status: "CONFIRMED", // ✅ 상태 전환
    },
  });

  // 2. PENDING_REVIEW였던 경우 StackOrganization 생성
  if (stack.status === "PENDING_REVIEW" && stack.draftCreatedBy) {
    await tx.stackOrganization.create({
      data: {
        stackId: id,
        organizationId: stack.draftCreatedBy,
        status: "APPROVED",
        isPrimary: true,
        requestedBy: userId,
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });
  }
});
```

**UI 개선:**
```typescript
// 검토대기 탭 액션 컬럼
<Button variant="secondary" onClick={() => router.push(`/customer/stacks/${stack.stackId}/edit`)}>
  수정
</Button>
<Button onClick={() => handleConfirm(stack.stackId)}>
  확인완료
</Button>

// 확인 모달
confirm("이 굴뚝을 확인 완료하시겠습니까?\n\n확인 완료 후 전체 탭에서 계속 표시되며, 검토대기 탭에서는 사라집니다.")
```

**파일:**
- `src/app/api/customer/stacks/[id]/verify/route.ts`
- `src/app/customer/stacks/page.tsx`

---

### 3️⃣ 환경측정기업 컬럼 정보 수정

**문제:**
- PENDING_REVIEW 상태 굴뚝은 StackOrganization이 없음
- draftCreatedBy만 있음
- 담당환경측정회사 컬럼에 "-" 표시됨

**해결:**
```typescript
// GET /api/stacks
const data = await Promise.all(
  stacks.map(async (stack) => {
    let orgNames: string[] = [];

    // 1. StackOrganization에서 담당 환경측정회사
    if (stack.organizations && stack.organizations.length > 0) {
      orgNames = stack.organizations.map(o => o.organization.name);
    }

    // 2. PENDING_REVIEW 상태이고 draftCreatedBy가 있으면 해당 조직 추가
    if (stack.status === "PENDING_REVIEW" && stack.draftCreatedBy && orgNames.length === 0) {
      const draftOrg = await prisma.organization.findUnique({
        where: { id: stack.draftCreatedBy },
        select: { name: true }
      });
      if (draftOrg) {
        orgNames.push(draftOrg.name);
      }
    }

    return {
      ...stack,
      organizationNames: orgNames // ✅ 추가 필드
    };
  })
);
```

**UI 수정:**
```typescript
<td className="px-4 py-3 text-sm">
  {stack.organizationNames && stack.organizationNames.length > 0
    ? stack.organizationNames.join(", ")
    : "-"}
</td>
```

**파일:**
- `src/app/api/stacks/route.ts`
- `src/app/customer/stacks/page.tsx`

---

### 4️⃣ 고객사 직접 등록 시 즉시 CONFIRMED 상태

**변경 전:**
```typescript
await prisma.stack.create({
  data: {
    // ... 필드
    isActive: true,
    isVerified: false, // ❌ 확인필요
    // status 없음
  }
});
```

**변경 후:**
```typescript
await prisma.stack.create({
  data: {
    // ... 필드
    isActive: true,
    isVerified: true, // ✅ 즉시 확인완료
    verifiedBy: userId,
    verifiedAt: new Date(),
    status: "CONFIRMED", // ✅ 즉시 확정 상태
    createdBy: userId,
  }
});
```

**결과:**
- 고객사 직접 등록 → 전체 탭에만 표시
- 검토대기 탭에는 표시 안됨
- 즉시 측정 데이터 입력 가능

**파일:**
- `src/app/api/customer/stacks/create/route.ts`

---

## 🎯 최종 워크플로우

### 시나리오 1: 환경측정기업 등록

```
환경측정기업 (보아스환경기술)
  ↓ DRAFT 고객사 생성
  ↓ 굴뚝 등록 (status: "DRAFT")
  ↓ 고객사 연결 요청
  
고객사 (고려아연)
  ↓ 연결 승인
  ↓ Stack.status: "DRAFT" → "PENDING_REVIEW" ✅
  
고객사 굴뚝 관리
  ├─ 전체 탭: 모든 굴뚝 표시 (PENDING_REVIEW 포함)
  │   └─ 담당환경측정회사: "보아스환경기술" ✅
  │   └─ 확인 상태: "확인필요" ⚠️
  │
  └─ 검토대기 탭: PENDING_REVIEW만 표시
      ↓ "확인완료" 버튼 클릭
      ↓ status: "CONFIRMED", isVerified: true
      ↓ StackOrganization 생성 (담당 배정)
      
결과
  ├─ 전체 탭: 계속 표시 (확인 상태: "확인완료" ✅)
  └─ 검토대기 탭: 사라짐 ✅
```

### 시나리오 2: 고객사 직접 등록

```
고객사 (고려아연)
  ↓ 굴뚝 직접 등록
  ↓ Stack 생성
      - status: "CONFIRMED" ✅
      - isVerified: true ✅
      - verifiedBy: userId
      - verifiedAt: new Date()
  
고객사 굴뚝 관리
  ├─ 전체 탭: 즉시 표시 ✅
  │   └─ 담당환경측정회사: "-" (아직 배정 안됨)
  │   └─ 확인 상태: "확인완료" ✅
  │
  └─ 검토대기 탭: 표시 안됨 ✅ (이미 CONFIRMED)
  
결과
  └─ 즉시 측정 데이터 입력 가능 ✅
```

---

## 📊 탭별 표시 로직

### 전체 탭
```typescript
// 모든 활성 굴뚝 표시
where: {
  customerId: userCustomerId,
  isActive: true
  // status 필터 없음 (모든 상태 포함)
}
```

**표시 내용:**
- PENDING_REVIEW: 확인필요 ⚠️
- CONFIRMED: 확인완료 ✅
- 담당환경측정회사: organizationNames 표시

### 검토대기 탭
```typescript
// PENDING_REVIEW만 표시
where: {
  customerId: userCustomerId,
  status: "PENDING_REVIEW",
  isActive: true
}
```

**액션:**
- 수정 버튼
- 확인완료 버튼 ✅

---

## 🔄 상태 전환 다이어그램

```
DRAFT (환경측정기업 임시 등록)
  ↓ 고객사 연결 승인
PENDING_REVIEW (고객사 검토 대기)
  ↓ 고객사 확인완료
CONFIRMED (확정 완료)

고객사 직접 등록 → 즉시 CONFIRMED ✅
```

---

## 📁 수정된 파일 목록

### 스키마 & 마이그레이션
1. `prisma/schema.prisma` - Stack 모델에 status, draftCreatedBy, draftCreatedAt 추가
2. `prisma/migrations/20251103095451_add_stack_status_fields/migration.sql`
3. `prisma/migrations/fix_stack_status.sql` - 수동 마이그레이션 SQL
4. `scripts/fix-stack-status.ts` - 데이터 마이그레이션 스크립트

### API
5. `src/app/api/customer/stacks/[id]/verify/route.ts` - 확인완료 시 CONFIRMED 전환 및 StackOrganization 생성
6. `src/app/api/customer/stacks/create/route.ts` - 직접 등록 시 CONFIRMED 상태 생성
7. `src/app/api/stacks/route.ts` - organizationNames 필드 추가

### UI
8. `src/app/customer/stacks/page.tsx` - 검토대기 탭 확인완료 버튼, organizationNames 표시

---

## ✅ 테스트 체크리스트

### 환경측정기업 등록 흐름
- [ ] 환경측정기업이 DRAFT 고객사 생성
- [ ] 굴뚝 등록 (status: "DRAFT")
- [ ] 고객사 연결 요청
- [ ] 고객사 연결 승인 → Stack.status: "PENDING_REVIEW"
- [ ] 고객사 전체 탭에 표시 (담당환경측정회사 표시)
- [ ] 고객사 검토대기 탭에 표시
- [ ] 확인완료 클릭 → status: "CONFIRMED"
- [ ] 검토대기 탭에서 사라짐
- [ ] 전체 탭에서 "확인완료" 상태로 표시

### 고객사 직접 등록 흐름
- [ ] 고객사 직접 등록
- [ ] 전체 탭에 즉시 표시 (확인완료 상태)
- [ ] 검토대기 탭에 표시 안됨
- [ ] 측정 데이터 입력 가능

### UI 확인
- [ ] 전체 탭: 담당환경측정회사 컬럼 표시
- [ ] 검토대기 탭: 수정, 확인완료 버튼 표시
- [ ] 확인완료 모달 메시지 표시
- [ ] 확인완료 후 두 탭 모두 새로고침

---

## 🎉 완료!

모든 요구사항이 구현되었습니다:

1. ✅ 전체 탭 = 모든 굴뚝 표시 (검토대기 포함)
2. ✅ 검토대기 탭 = PENDING_REVIEW만 표시
3. ✅ 검토대기 탭에서 확인완료 버튼
4. ✅ 환경측정기업 컬럼 정보 표시 (PENDING_REVIEW 포함)
5. ✅ 고객사 직접 등록 → 즉시 CONFIRMED 상태
6. ✅ 일관된 워크플로우 보장

**다음 단계:**
- 고객사 로그인하여 실제 테스트
- 환경측정기업 등록 → 고객사 확인 흐름 테스트
- 고객사 직접 등록 테스트
