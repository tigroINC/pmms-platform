# 굴뚝 관리 시스템 재설계 정책 문서

## 📋 확정된 정책

### 1. 데이터 품질 검증 방식: Hybrid (즉시 공유 + 선택적 확인)

#### 기본 원칙
```typescript
환경측정기업 등록 → isActive: true (즉시 사용 가능)
+ isVerified: false (확인 필요 플래그)
+ 고객사에 "신규 굴뚝 확인 요청" 알림
+ 고객사가 확인하면 isVerified: true
+ 확인 안 해도 사용 가능 (강제 아님)
```

#### 스키마
```prisma
model Stack {
  id             String   @id @default(cuid())
  organizationId String
  customerId     String
  
  // 기본 정보
  name           String
  code           String?
  internalCode   String?
  location       String?
  height         Float?
  diameter       Float?
  
  // 활성화 (사용 가능 여부)
  isActive       Boolean  @default(true)
  
  // 선택적 확인 (강제 아님)
  isVerified     Boolean  @default(false)
  verifiedBy     String?
  verifiedAt     DateTime?
  
  // 이력
  createdBy      String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

#### UI 표시
```
환경측정기업 등록 굴뚝:
┌─────────────────────────────────────────────────┐
│  S-101: 1호 소각로                               │
│  ⚠️ 확인 필요 (환경측정기업 등록)                │
│  [정보 확인] [수정] [확인 완료]                  │
└─────────────────────────────────────────────────┘

확인 완료 후:
┌─────────────────────────────────────────────────┐
│  S-101: 1호 소각로                               │
│  ✓ 확인 완료 (2024-11-01 김관리)                │
│  [상세보기] [수정]                               │
└─────────────────────────────────────────────────┘
```

---

### 2. 담당 변경 시 측정 데이터 정책: 읽기 전용

#### 정책
```
옵션 1 채택: 기존 데이터 읽기 전용
- A사: 자신이 입력한 측정 데이터 조회만 가능
- B사: 새로운 측정 데이터만 입력 가능
```

#### 구현
```typescript
// Measurement 테이블 (기존)
model Measurement {
  id             String   @id @default(cuid())
  stackId        String
  organizationId String   // 측정 입력한 환경측정기업
  customerId     String
  itemKey        String
  value          Float
  measuredAt     DateTime
  createdAt      DateTime @default(now())
  
  stack          Stack @relation(fields: [stackId], references: [id])
  organization   Organization @relation(fields: [organizationId], references: [id])
}

// 조회 권한 체크
async function getMeasurements(stackId, userOrgId) {
  const stack = await prisma.stack.findUnique({
    where: { id: stackId }
  });
  
  // 현재 담당: 모든 측정 데이터 조회 가능
  if (stack.organizationId === userOrgId) {
    return await prisma.measurement.findMany({
      where: { stackId }
    });
  }
  
  // 이전 담당: 자신이 입력한 데이터만 조회 가능 (읽기 전용)
  const wasAssigned = await prisma.stackAssignment.findFirst({
    where: {
      stackId,
      organizationId: userOrgId,
      endDate: { not: null }  // 종료된 담당
    }
  });
  
  if (wasAssigned) {
    return await prisma.measurement.findMany({
      where: {
        stackId,
        organizationId: userOrgId  // 자신이 입력한 것만
      }
    });
  }
  
  // 담당 이력 없음: 접근 불가
  return [];
}

// 입력 권한 체크
async function createMeasurement(stackId, userOrgId) {
  const stack = await prisma.stack.findUnique({
    where: { id: stackId }
  });
  
  // 현재 담당만 입력 가능
  if (stack.organizationId !== userOrgId) {
    throw new Error("현재 담당 환경측정기업만 측정 데이터를 입력할 수 있습니다.");
  }
  
  // 입력 진행...
}
```

#### UI 표시
```
A사 (이전 담당) 로그인 시:
┌─────────────────────────────────────────────────┐
│  S-101: 1호 소각로                               │
│  현재 담당: B환경측정 (2024-10-01부터)           │
│  ℹ️ 이전 담당사로 조회만 가능합니다              │
│                                                  │
│  📊 측정 이력 (A사 입력분만)                     │
│  - 2024-09-01 ~ 2024-09-30 (50건)               │
│  [상세보기]                                      │
└─────────────────────────────────────────────────┘

B사 (현재 담당) 로그인 시:
┌─────────────────────────────────────────────────┐
│  S-101: 1호 소각로                               │
│  현재 담당: B환경측정 (2024-10-01부터)           │
│                                                  │
│  📊 측정 이력 (전체)                             │
│  - A사 입력분: 2024-09-01 ~ 2024-09-30 (50건)   │
│  - B사 입력분: 2024-10-01 ~ 현재 (30건)         │
│  [측정 입력] [상세보기]                          │
└─────────────────────────────────────────────────┘
```

---

### 3. 동시 수정 충돌 처리: 중요 필드 충돌 감지

#### 정책
```
일반 필드: Last Write Wins
중요 필드: 충돌 감지 + 사용자 선택
```

#### 중요 필드 정의
```typescript
const CRITICAL_FIELDS = [
  'height',      // 굴뚝 높이
  'diameter',    // 굴뚝 직경
  'location',    // 위치
  'coordinates'  // 좌표
];
```

#### 구현
```typescript
// PATCH /api/stacks/[id]

async function updateStack(stackId, data, userId, lastSeenAt) {
  // 1. 현재 DB 값 조회
  const current = await prisma.stack.findUnique({
    where: { id: stackId }
  });
  
  // 2. 충돌 감지
  if (current.updatedAt > new Date(lastSeenAt)) {
    // 다른 사용자가 이미 수정함
    
    // 3. 중요 필드 변경 여부 확인
    const criticalChanges = CRITICAL_FIELDS.filter(field => 
      data[field] !== undefined && 
      current[field] !== data[field]
    );
    
    if (criticalChanges.length > 0) {
      // 중요 필드 충돌 → 사용자에게 확인 요청
      return {
        status: 409,
        error: "CONFLICT",
        message: "다른 사용자가 중요 정보를 수정했습니다.",
        conflicts: criticalChanges.map(field => ({
          field,
          currentValue: current[field],
          yourValue: data[field]
        })),
        currentData: current
      };
    }
    
    // 일반 필드만 변경 → Last Write Wins
    // 계속 진행...
  }
  
  // 4. 정상 업데이트
  const updated = await prisma.stack.update({
    where: { id: stackId },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });
  
  // 5. 이력 기록
  for (const [field, newValue] of Object.entries(data)) {
    if (current[field] !== newValue) {
      await prisma.stackHistory.create({
        data: {
          stackId,
          userId,
          userName: user.name,
          userRole: user.role,
          action: "UPDATE",
          field,
          oldValue: String(current[field]),
          newValue: String(newValue),
          reason: data.reason
        }
      });
    }
  }
  
  // 6. 상대방에게 알림
  await sendNotification({
    targetId: current.customerId || current.organizationId,
    type: "STACK_UPDATED",
    message: `${current.name} 정보가 수정되었습니다.`,
    data: { stackId, changes: data }
  });
  
  return { status: 200, data: updated };
}
```

#### 클라이언트 처리
```typescript
// 수정 폼 제출
async function handleSubmit(formData) {
  const response = await fetch(`/api/stacks/${stackId}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...formData,
      _lastSeenAt: lastSeenAt  // 마지막 조회 시간
    })
  });
  
  const result = await response.json();
  
  if (result.error === "CONFLICT") {
    // 충돌 모달 표시
    showConflictModal({
      conflicts: result.conflicts,
      currentData: result.currentData,
      yourData: formData,
      onResolve: (resolution) => {
        if (resolution === "use_current") {
          // 현재 값 사용 (취소)
          loadCurrentData();
        } else if (resolution === "use_yours") {
          // 내 값으로 강제 덮어쓰기
          forceUpdate(formData);
        }
      }
    });
  } else {
    // 성공
    alert("수정되었습니다.");
  }
}
```

#### UI 모달
```
┌─────────────────────────────────────────────────┐
│  ⚠️ 충돌 감지                                    │
│                                                  │
│  다른 사용자가 최근에 수정했습니다.              │
│                                                  │
│  📊 height (굴뚝 높이)                           │
│  현재 값: 30m (박실장, 5분 전)                   │
│  당신 값: 28m                                    │
│                                                  │
│  📊 diameter (굴뚝 직경)                         │
│  현재 값: 1.5m (박실장, 5분 전)                  │
│  당신 값: 1.2m                                   │
│                                                  │
│  [현재 값 사용] [내 값으로 덮어쓰기] [취소]      │
└─────────────────────────────────────────────────┘
```

---

### 4. 마이그레이션 계획: 단계적 전환

#### Step 1: 데이터 정리 (마이그레이션 전)
```typescript
// 1. 현재 상태 확인
const statusCount = await prisma.stack.groupBy({
  by: ['status'],
  _count: true
});

console.log("현재 굴뚝 상태:");
console.log(statusCount);
// 예: DRAFT: 10, PENDING_REVIEW: 5, CONFIRMED: 100, REJECTED: 3

// 2. 고객사에 안내 메시지 (UI)
"📢 시스템 개선 안내
굴뚝 승인 프로세스가 간소화됩니다.
- 검토 대기 중인 굴뚝이 자동으로 확정됩니다.
- 이후 등록되는 굴뚝은 즉시 사용 가능합니다."
```

#### Step 2: 상태 자동 변환
```typescript
// prisma/migrations/remove_stack_status.ts

async function migrate() {
  console.log("🚀 굴뚝 상태 제거 마이그레이션 시작...\n");
  
  // 1. PENDING_REVIEW → 자동 확정
  const pendingStacks = await prisma.stack.findMany({
    where: { status: "PENDING_REVIEW" }
  });
  
  console.log(`📋 검토 대기 굴뚝: ${pendingStacks.length}개`);
  
  for (const stack of pendingStacks) {
    await prisma.stack.update({
      where: { id: stack.id },
      data: {
        isActive: true,
        isVerified: false,  // 확인 필요 플래그
        // status는 스키마에서 제거되므로 자동 삭제
      }
    });
    
    // 고객사에 알림
    await prisma.notification.create({
      data: {
        customerId: stack.customerId,
        type: "STACK_AUTO_CONFIRMED",
        title: "굴뚝 자동 확정",
        message: `${stack.name} 굴뚝이 자동으로 확정되었습니다. 정보를 확인해주세요.`,
        data: { stackId: stack.id }
      }
    });
  }
  
  console.log(`✅ ${pendingStacks.length}개 자동 확정 완료\n`);
  
  // 2. REJECTED → 비활성화
  const rejectedStacks = await prisma.stack.findMany({
    where: { status: "REJECTED" }
  });
  
  console.log(`📋 거부된 굴뚝: ${rejectedStacks.length}개`);
  
  for (const stack of rejectedStacks) {
    await prisma.stack.update({
      where: { id: stack.id },
      data: {
        isActive: false,  // 비활성화
        isVerified: false
      }
    });
    
    // 환경측정기업에 알림
    await prisma.notification.create({
      data: {
        organizationId: stack.organizationId,
        type: "STACK_DEACTIVATED",
        title: "거부 굴뚝 비활성화",
        message: `${stack.name} 굴뚝이 비활성화되었습니다. 정보 수정 후 다시 활성화할 수 있습니다.`,
        data: { stackId: stack.id, reason: stack.rejectionReason }
      }
    });
  }
  
  console.log(`✅ ${rejectedStacks.length}개 비활성화 완료\n`);
  
  // 3. DRAFT, CONFIRMED → 그대로 유지
  await prisma.stack.updateMany({
    where: {
      status: { in: ["DRAFT", "CONFIRMED"] }
    },
    data: {
      isActive: true,
      isVerified: true  // 기존 확정 굴뚝은 확인 완료로 간주
    }
  });
  
  console.log("✅ 기존 확정 굴뚝 유지 완료\n");
  
  // 4. StackAssignment 생성 (없는 경우)
  const stacksWithoutAssignment = await prisma.stack.findMany({
    where: {
      assignments: { none: {} }
    }
  });
  
  console.log(`📋 담당 이력 없는 굴뚝: ${stacksWithoutAssignment.length}개`);
  
  for (const stack of stacksWithoutAssignment) {
    await prisma.stackAssignment.create({
      data: {
        stackId: stack.id,
        organizationId: stack.organizationId,
        startDate: stack.createdAt,
        endDate: null,
        internalCodeSnapshot: stack.internalCode
      }
    });
  }
  
  console.log(`✅ ${stacksWithoutAssignment.length}개 담당 이력 생성 완료\n`);
  
  console.log("🎉 마이그레이션 완료!");
  console.log("\n다음 단계:");
  console.log("1. Prisma 스키마에서 status, rejectionReason 필드 제거");
  console.log("2. npx prisma migrate dev --name remove_stack_status");
  console.log("3. 프론트엔드 코드 업데이트");
}

// 실행
migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

#### Step 3: 스키마 변경
```prisma
// prisma/schema.prisma

model Stack {
  id             String   @id @default(cuid())
  organizationId String
  customerId     String
  
  name           String
  code           String?
  internalCode   String?
  location       String?
  height         Float?
  diameter       Float?
  coordinates    String?
  description    String?
  fullName       String?
  facilityType   String?
  category       String?
  fuel           String?
  
  // ❌ 제거
  // status          String @default("DRAFT")
  // rejectionReason String?
  
  // ✅ 추가/유지
  isActive       Boolean  @default(true)
  isVerified     Boolean  @default(false)
  verifiedBy     String?
  verifiedAt     DateTime?
  
  createdBy      String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  customer       Customer @relation(fields: [customerId], references: [id])
  assignments    StackAssignment[]
  history        StackHistory[]
  measurements   Measurement[]
  
  @@index([customerId])
  @@index([organizationId])
  @@index([isActive])
  @@index([isVerified])
}
```

#### Step 4: 고객사 안내
```typescript
// 마이그레이션 후 첫 로그인 시 모달 표시

┌─────────────────────────────────────────────────┐
│  🎉 시스템 개선 완료                             │
│                                                  │
│  굴뚝 관리가 더 간편해졌습니다!                  │
│                                                  │
│  ✅ 변경 사항:                                   │
│  • 승인/거부 과정 제거                           │
│  • 새 굴뚝 즉시 사용 가능                        │
│  • 정보 확인은 선택 사항                         │
│                                                  │
│  📋 확인이 필요한 굴뚝: 5개                      │
│  [지금 확인하기] [나중에]                        │
└─────────────────────────────────────────────────┘
```

---

### 5. 고객사 직접 등록 시 내부코드 처리

#### 프로세스
```typescript
// 1. 고객사가 굴뚝 등록
POST /api/customer/stacks

{
  name: "3호 보일러",
  code: "BOILER-03",
  location: "A동 3층",
  height: 25,
  diameter: 1.2
}

// 2. Stack 생성
const stack = await prisma.stack.create({
  data: {
    ...data,
    customerId: userCustomerId,
    organizationId: primaryOrgId,  // 주 담당 환경측정기업
    internalCode: null,  // 미지정
    isActive: true,
    isVerified: true,  // 고객사 등록은 자동 확인
    createdBy: userId
  }
});

// 3. 담당 이력 생성
await prisma.stackAssignment.create({
  data: {
    stackId: stack.id,
    organizationId: primaryOrgId,
    startDate: new Date(),
    endDate: null
  }
});

// 4. 환경측정기업에 알림
await prisma.notification.create({
  data: {
    organizationId: primaryOrgId,
    type: "STACK_CREATED_BY_CUSTOMER",
    title: "고객사 굴뚝 등록",
    message: `${customer.name}이(가) '${stack.name}' 굴뚝을 등록했습니다. 내부코드를 지정해주세요.`,
    data: {
      stackId: stack.id,
      needsInternalCode: true
    }
  }
});
```

#### UI (환경측정기업)
```
알림:
┌─────────────────────────────────────────────────┐
│  📢 삼성전자가 '3호 보일러' 굴뚝 등록            │
│  ⚠️ 내부코드 미지정                              │
│  [내부코드 지정하기]                             │
└─────────────────────────────────────────────────┘

굴뚝 목록:
┌─────────────────────────────────────────────────┐
│  3호 보일러                                      │
│  ⚠️ 내부코드 미지정 (고객사 등록)                │
│  [내부코드 지정] [상세보기]                      │
└─────────────────────────────────────────────────┘

내부코드 지정 모달:
┌─────────────────────────────────────────────────┐
│  내부코드 지정                                   │
│                                                  │
│  굴뚝: 3호 보일러                                │
│  고객사: 삼성전자                                │
│                                                  │
│  내부코드: [SAMSUNG-BOILER-03____]               │
│                                                  │
│  [저장] [취소]                                   │
└─────────────────────────────────────────────────┘
```

---

## 📊 정책 요약표

| 항목 | 정책 | 구현 방식 |
|------|------|----------|
| **데이터 검증** | Hybrid (즉시 공유 + 선택적 확인) | isActive: true, isVerified: false |
| **담당 변경 시 측정 데이터** | 읽기 전용 | 이전 담당은 자신이 입력한 데이터만 조회 |
| **동시 수정 충돌** | 중요 필드 충돌 감지 | height, diameter, location, coordinates |
| **마이그레이션** | 단계적 전환 | PENDING_REVIEW → 자동 확정 + 알림 |
| **내부코드** | 나중에 지정 가능 | 고객사 등록 시 null → 환경측정기업이 지정 |

---

## ✅ 다음 단계

1. **Phase 1: 스키마 변경 및 마이그레이션**
   - [ ] 스키마 수정 (status 제거, isVerified 추가)
   - [ ] 마이그레이션 스크립트 작성
   - [ ] 마이그레이션 실행
   - [ ] 데이터 검증

2. **Phase 2: API 수정**
   - [ ] 승인/거부 API 제거
   - [ ] 굴뚝 등록 API 수정 (즉시 공유)
   - [ ] 굴뚝 수정 API 수정 (충돌 감지)
   - [ ] 측정 데이터 권한 체크 수정
   - [ ] 선택적 확인 API 추가

3. **Phase 3: UI 개선**
   - [ ] 상태 필터 제거
   - [ ] 선택적 확인 UI 추가
   - [ ] 충돌 모달 추가
   - [ ] 담당 변경 UI 개선

4. **Phase 4: 알림 시스템**
   - [ ] 알림 테이블 확인
   - [ ] 알림 발송 로직 추가
   - [ ] 알림 UI 추가

---

**작성일**: 2024-11-01  
**작성자**: Cascade AI  
**상태**: 정책 확정 완료
