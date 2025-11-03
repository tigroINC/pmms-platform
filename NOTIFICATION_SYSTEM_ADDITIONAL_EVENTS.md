# 📢 알림 시스템 추가 이벤트 분석

## 🎯 기본 원칙

**"고객사와 환경측정기업 사이의 관련 이벤트가 일어나면 최대한 공유"**

---

## 📊 현재 구현 상태

### ✅ 구현 완료 (3개)
1. **고객사 굴뚝 등록** → 환경측정기업 관리자
2. **고객사 굴뚝 수정** → 환경측정기업 관리자
3. **고객사 굴뚝 확인** → 환경측정기업 관리자

### ❌ 누락된 알림 (15개 이상)

---

## 🔴 긴급 추가 필요 (우선순위 높음)

### 1. 환경측정기업 → 고객사 알림

#### 1-1. 굴뚝 등록/수정
- **이벤트**: 환경측정기업이 굴뚝 등록
- **알림 대상**: 해당 고객사 CUSTOMER_ADMIN
- **내용**: "보아스환경기술에서 '1호 소각로'를 등록했습니다. 정보를 확인해주세요."
- **API**: `POST /api/org/draft-customers/[customerId]/stacks/create`
- **타입**: `STACK_CREATED_BY_ORG`

#### 1-2. 환경측정기업이 굴뚝 수정
- **이벤트**: 환경측정기업이 굴뚝 정보 수정
- **알림 대상**: 해당 고객사 CUSTOMER_ADMIN
- **내용**: "보아스환경기술에서 '1호 소각로' 정보를 수정했습니다."
- **API**: `PATCH /api/stacks/[id]` (ORG_ADMIN/OPERATOR가 수정)
- **타입**: `STACK_UPDATED_BY_ORG` (신규)

#### 1-3. 측정 데이터 입력
- **이벤트**: 환경측정기업이 측정 데이터 입력
- **알림 대상**: 해당 고객사 CUSTOMER_ADMIN
- **내용**: "보아스환경기술에서 '1호 소각로'의 측정 데이터를 입력했습니다. (먼지 15개)"
- **API**: `POST /api/measurements`, `POST /api/measurements/bulk`
- **타입**: `MEASUREMENT_CREATED` (신규)

#### 1-4. 기준 초과 측정값
- **이벤트**: 배출허용기준 초과 측정값 입력
- **알림 대상**: 해당 고객사 CUSTOMER_ADMIN + 담당 OPERATOR
- **내용**: "⚠️ '1호 소각로'에서 먼지 배출허용기준을 초과했습니다. (측정값: 25mg/Sm³, 기준: 20mg/Sm³)"
- **API**: `POST /api/measurements` (기준 초과 감지)
- **타입**: `MEASUREMENT_LIMIT_EXCEEDED` (신규)
- **우선순위**: 🔴 매우 높음

---

### 2. 고객사-환경측정기업 연결 관련

#### 2-1. 연결 요청
- **이벤트**: 환경측정기업이 고객사에 연결 요청
- **알림 대상**: 해당 고객사 CUSTOMER_ADMIN
- **내용**: "보아스환경기술에서 귀사와의 연결을 요청했습니다."
- **API**: `POST /api/customer-organizations/request`
- **타입**: `CONNECTION_REQUESTED` (신규)

#### 2-2. 연결 승인
- **이벤트**: 고객사가 연결 요청 승인
- **알림 대상**: 해당 환경측정기업 ORG_ADMIN
- **내용**: "고려아연에서 연결 요청을 승인했습니다."
- **API**: `PATCH /api/customer-organizations/[id]/approve`
- **타입**: `CONNECTION_APPROVED` (신규)

#### 2-3. 연결 거부
- **이벤트**: 고객사가 연결 요청 거부
- **알림 대상**: 해당 환경측정기업 ORG_ADMIN
- **내용**: "고려아연에서 연결 요청을 거부했습니다."
- **API**: `PATCH /api/customer-organizations/[id]/reject`
- **타입**: `CONNECTION_REJECTED` (신규)

#### 2-4. 연결 해제
- **이벤트**: 고객사 또는 환경측정기업이 연결 해제
- **알림 대상**: 상대방 관리자
- **내용**: "고려아연과의 연결이 해제되었습니다."
- **API**: `DELETE /api/customer-organizations/[id]`
- **타입**: `CONNECTION_TERMINATED` (신규)

---

### 3. 사용자 관리 관련

#### 3-1. 임직원 가입 신청
- **이벤트**: 임직원이 가입 신청
- **알림 대상**: 해당 조직 ORG_ADMIN
- **내용**: "이실무님이 가입 신청했습니다. 승인해주세요."
- **API**: `POST /api/operators/register`
- **타입**: `USER_REGISTRATION_PENDING` (신규)

#### 3-2. 고객사 사용자 가입 신청
- **이벤트**: 고객사 사용자가 가입 신청
- **알림 대상**: 해당 고객사 CUSTOMER_ADMIN
- **내용**: "최사원님이 가입 신청했습니다. 승인해주세요."
- **API**: `POST /api/auth/register`
- **타입**: `USER_REGISTRATION_PENDING`

#### 3-3. 사용자 승인/거부
- **이벤트**: 관리자가 사용자 승인/거부
- **알림 대상**: 해당 사용자
- **내용**: "가입 신청이 승인되었습니다." / "가입 신청이 거부되었습니다."
- **API**: `PATCH /api/users/[id]/approve`, `PATCH /api/users/[id]/reject`
- **타입**: `USER_APPROVED` / `USER_REJECTED` (신규)

---

### 4. 담당자 변경 관련

#### 4-1. 굴뚝 담당자 변경
- **이벤트**: 굴뚝 담당 환경측정기업 변경
- **알림 대상**: 
  - 이전 담당 환경측정기업 ORG_ADMIN
  - 새 담당 환경측정기업 ORG_ADMIN
  - 해당 고객사 CUSTOMER_ADMIN
- **내용**: 
  - 이전: "고려아연 '1호 소각로' 담당이 해제되었습니다."
  - 새: "고려아연 '1호 소각로' 담당이 할당되었습니다."
  - 고객사: "'1호 소각로' 담당 환경측정기업이 변경되었습니다."
- **API**: `POST /api/stack-organizations`, `DELETE /api/stack-organizations/[id]`
- **타입**: `STACK_ASSIGNMENT_CHANGED` (신규)

#### 4-2. 실무자 담당 고객사 변경
- **이벤트**: 실무자에게 고객사 할당/해제
- **알림 대상**: 해당 실무자
- **내용**: "고려아연 담당이 할당되었습니다." / "고려아연 담당이 해제되었습니다."
- **API**: `POST /api/customer-assignments`, `DELETE /api/customer-assignments/[id]`
- **타입**: `CUSTOMER_ASSIGNMENT_CHANGED` (신규)

---

## 🟡 중요 추가 (우선순위 중간)

### 5. 계약 관련

#### 5-1. 계약 만료 임박
- **이벤트**: 계약 종료일 30일 전
- **알림 대상**: 
  - 해당 고객사 CUSTOMER_ADMIN
  - 담당 환경측정기업 ORG_ADMIN
- **내용**: "고려아연과의 계약이 30일 후 만료됩니다."
- **API**: 스케줄러 (매일 체크)
- **타입**: `CONTRACT_EXPIRING_SOON` (신규)

#### 5-2. 계약 만료
- **이벤트**: 계약 종료일 도래
- **알림 대상**: 
  - 해당 고객사 CUSTOMER_ADMIN
  - 담당 환경측정기업 ORG_ADMIN
- **내용**: "고려아연과의 계약이 만료되었습니다."
- **API**: 스케줄러 (매일 체크)
- **타입**: `CONTRACT_EXPIRED` (신규)

---

### 6. 초대 관련

#### 6-1. 고객사 초대 링크 생성
- **이벤트**: 환경측정기업이 고객사 초대 링크 생성
- **알림 대상**: 초대 링크를 받은 고객사 담당자 (이메일)
- **내용**: "보아스환경기술에서 귀사를 초대했습니다."
- **API**: `POST /api/customer-invitations`
- **타입**: `CUSTOMER_INVITED` (신규)

#### 6-2. 초대 수락
- **이벤트**: 고객사가 초대 수락
- **알림 대상**: 초대한 환경측정기업 ORG_ADMIN
- **내용**: "고려아연에서 초대를 수락했습니다."
- **API**: `POST /api/customer-invitations/[token]/accept`
- **타입**: `INVITATION_ACCEPTED` (신규)

---

### 7. 데이터 수정 이력

#### 7-1. 중요 데이터 수정
- **이벤트**: 고객사 정보 수정 (주소, 대표자 등)
- **알림 대상**: 연결된 모든 환경측정기업 ORG_ADMIN
- **내용**: "고려아연의 회사 정보가 수정되었습니다."
- **API**: `PATCH /api/customers/[id]`
- **타입**: `CUSTOMER_INFO_UPDATED` (신규)

---

## 🟢 선택적 추가 (우선순위 낮음)

### 8. 시스템 알림

#### 8-1. 시스템 공지
- **이벤트**: 시스템 관리자가 공지 등록
- **알림 대상**: 모든 사용자 또는 특정 그룹
- **내용**: "시스템 점검이 예정되어 있습니다. (2024-11-05 02:00~04:00)"
- **API**: `POST /api/system-announcements`
- **타입**: `SYSTEM_ANNOUNCEMENT` (신규)

#### 8-2. 기능 업데이트
- **이벤트**: 새 기능 출시
- **알림 대상**: 모든 사용자
- **내용**: "새로운 기능이 추가되었습니다: AutoML 예측 시스템"
- **API**: `POST /api/system-announcements`
- **타입**: `FEATURE_RELEASED` (신규)

---

## 📋 추가 구현 계획

### Phase 4-6: 추가 알림 타입 구현

#### 우선순위 1 (긴급)
1. ✅ 환경측정기업 굴뚝 등록 → 고객사
2. ✅ 환경측정기업 굴뚝 수정 → 고객사
3. ⚠️ **측정 데이터 입력** → 고객사 (중요!)
4. 🔴 **기준 초과 측정값** → 고객사 + 담당자 (매우 중요!)

#### 우선순위 2 (중요)
5. 연결 요청/승인/거부/해제
6. 사용자 가입 신청/승인/거부
7. 담당자 변경

#### 우선순위 3 (선택)
8. 계약 만료 임박/만료
9. 초대 관련
10. 데이터 수정 이력

---

## 🔧 구현 방법

### 1. NotificationType enum 확장

```prisma
enum NotificationType {
  // 기존 (5개)
  STACK_CREATED_BY_CUSTOMER
  STACK_UPDATED_BY_CUSTOMER
  STACK_CREATED_BY_ORG
  STACK_VERIFIED_BY_CUSTOMER
  STACK_INTERNAL_CODE_NEEDED
  
  // 추가 - 굴뚝 관련 (1개)
  STACK_UPDATED_BY_ORG              // 환경측정기업이 굴뚝 수정
  
  // 추가 - 측정 관련 (2개)
  MEASUREMENT_CREATED               // 측정 데이터 입력
  MEASUREMENT_LIMIT_EXCEEDED        // 기준 초과 🔴
  
  // 추가 - 연결 관련 (4개)
  CONNECTION_REQUESTED              // 연결 요청
  CONNECTION_APPROVED               // 연결 승인
  CONNECTION_REJECTED               // 연결 거부
  CONNECTION_TERMINATED             // 연결 해제
  
  // 추가 - 사용자 관련 (3개)
  USER_REGISTRATION_PENDING         // 가입 신청
  USER_APPROVED                     // 가입 승인
  USER_REJECTED                     // 가입 거부
  
  // 추가 - 담당 관련 (2개)
  STACK_ASSIGNMENT_CHANGED          // 굴뚝 담당 변경
  CUSTOMER_ASSIGNMENT_CHANGED       // 고객사 담당 변경
  
  // 추가 - 계약 관련 (2개)
  CONTRACT_EXPIRING_SOON            // 계약 만료 임박
  CONTRACT_EXPIRED                  // 계약 만료
  
  // 추가 - 초대 관련 (2개)
  CUSTOMER_INVITED                  // 고객사 초대
  INVITATION_ACCEPTED               // 초대 수락
  
  // 추가 - 데이터 관련 (1개)
  CUSTOMER_INFO_UPDATED             // 고객사 정보 수정
  
  // 추가 - 시스템 관련 (2개)
  SYSTEM_ANNOUNCEMENT               // 시스템 공지
  FEATURE_RELEASED                  // 기능 출시
}
```

**총 알림 타입**: 5개 → **26개**

---

### 2. 헬퍼 함수 추가

```typescript
// lib/notification-helper.ts

// 환경측정기업 굴뚝 수정 시
export async function notifyStackUpdatedByOrg(params: {
  stackId: string;
  stackName: string;
  customerId: string;
  organizationName: string;
  changedFields: string[];
}) {
  const adminIds = await getCustomerAdmins(params.customerId);
  
  return await createNotification({
    userId: adminIds,
    type: "STACK_UPDATED_BY_ORG",
    title: "환경측정기업이 굴뚝 정보를 수정했습니다",
    message: `${params.organizationName}에서 '${params.stackName}' 정보를 수정했습니다.`,
    stackId: params.stackId,
    customerId: params.customerId,
    metadata: {
      stackName: params.stackName,
      organizationName: params.organizationName,
      changedFields: params.changedFields,
    },
  });
}

// 측정 데이터 입력 시
export async function notifyMeasurementCreated(params: {
  customerId: string;
  stackId: string;
  stackName: string;
  organizationName: string;
  itemCount: number;
}) {
  const adminIds = await getCustomerAdmins(params.customerId);
  
  return await createNotification({
    userId: adminIds,
    type: "MEASUREMENT_CREATED",
    title: "측정 데이터가 입력되었습니다",
    message: `${params.organizationName}에서 '${params.stackName}'의 측정 데이터를 입력했습니다. (${params.itemCount}개)`,
    stackId: params.stackId,
    customerId: params.customerId,
  });
}

// 기준 초과 측정값 🔴
export async function notifyMeasurementLimitExceeded(params: {
  customerId: string;
  stackId: string;
  stackName: string;
  itemName: string;
  value: number;
  limit: number;
  organizationName: string;
}) {
  const adminIds = await getCustomerAdmins(params.customerId);
  
  return await createNotification({
    userId: adminIds,
    type: "MEASUREMENT_LIMIT_EXCEEDED",
    title: "⚠️ 배출허용기준을 초과했습니다",
    message: `'${params.stackName}'에서 ${params.itemName} 배출허용기준을 초과했습니다. (측정값: ${params.value}, 기준: ${params.limit})`,
    stackId: params.stackId,
    customerId: params.customerId,
    metadata: {
      stackName: params.stackName,
      itemName: params.itemName,
      value: params.value,
      limit: params.limit,
      organizationName: params.organizationName,
      severity: "high",
    },
  });
}
```

---

### 3. 알림 트리거 추가 위치

#### 측정 데이터 입력
```typescript
// src/app/api/measurements/route.ts
// POST 핸들러 끝에 추가

await notifyMeasurementCreated({
  customerId: measurement.customerId,
  stackId: measurement.stackId,
  stackName: stack.name,
  organizationName: organization.name,
  itemCount: 1,
});

// 기준 초과 체크
if (measurement.value > limit) {
  await notifyMeasurementLimitExceeded({
    customerId: measurement.customerId,
    stackId: measurement.stackId,
    stackName: stack.name,
    itemName: item.name,
    value: measurement.value,
    limit: limit,
    organizationName: organization.name,
  });
}
```

#### 환경측정기업 굴뚝 수정
```typescript
// src/app/api/stacks/[id]/route.ts
// PATCH 핸들러에 추가

// 환경측정기업 사용자가 수정한 경우
if ((userRole === "ORG_ADMIN" || userRole === "OPERATOR") && historyRecords.length > 0) {
  await notifyStackUpdatedByOrg({
    stackId: result.id,
    stackName: result.name,
    customerId: result.customerId,
    organizationName: organization.name,
    changedFields: historyRecords.map(h => h.field),
  });
}
```

---

## 🎯 권장 구현 순서

### 즉시 구현 (1-2시간)
1. **기준 초과 측정값 알림** 🔴 (가장 중요!)
2. 측정 데이터 입력 알림
3. 환경측정기업 굴뚝 수정 알림

### 다음 단계 (2-3시간)
4. 연결 요청/승인/거부 알림
5. 사용자 가입 신청/승인 알림

### 선택적 구현 (향후)
6. 담당자 변경 알림
7. 계약 만료 알림
8. 시스템 공지

---

## 📊 예상 효과

### 현재 (3개 알림)
- 고객사 → 환경측정기업 방향만 알림
- 굴뚝 관련만 커버

### 추가 후 (26개 알림)
- **양방향 알림** (고객사 ↔ 환경측정기업)
- **모든 중요 이벤트** 커버
- **기준 초과 즉시 알림** (법적 리스크 감소)
- **업무 효율 대폭 향상**

---

## 🚀 다음 액션

1. **즉시 추가**: 기준 초과 알림 (가장 중요!)
2. **Phase 4-6**: 나머지 우선순위 1 알림 구현
3. **Phase 4-7**: 프론트엔드 UI 구현

**추가 구현 시간**: 약 3-4시간
