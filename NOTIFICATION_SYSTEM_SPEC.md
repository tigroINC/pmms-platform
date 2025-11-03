# 📢 알림 시스템 상세 설계

## 🎯 목적

굴뚝 관리 시스템의 **즉시 공유 방식**에서 발생하는 정보 비대칭 문제를 해결합니다.

### 해결할 문제
1. 고객사가 굴뚝 직접 등록 → 환경측정기업이 모름
2. 고객사가 굴뚝 정보 수정 → 환경측정기업이 모름
3. 환경측정기업이 굴뚝 등록 (내부코드만) → 고객사가 확인 필요
4. 고객사 등록 시 내부코드 없음 → 환경측정기업이 지정 필요

---

## 📊 데이터베이스 스키마

### Notification 모델

```prisma
model Notification {
  id          String             @id @default(cuid())
  userId      String
  user        User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type        NotificationType
  title       String
  message     String
  
  // 관련 엔티티
  stackId     String?
  stack       Stack?             @relation(fields: [stackId], references: [id], onDelete: Cascade)
  customerId  String?
  customer    Customer?          @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  // 상태
  isRead      Boolean            @default(false)
  readAt      DateTime?
  
  // 메타데이터
  metadata    Json?              // 추가 정보 (변경 필드, 이전/이후 값 등)
  
  createdAt   DateTime           @default(now())
  
  @@index([userId, isRead])
  @@index([userId, createdAt])
}

enum NotificationType {
  // 굴뚝 관련
  STACK_CREATED_BY_CUSTOMER      // 고객사가 굴뚝 직접 등록
  STACK_UPDATED_BY_CUSTOMER      // 고객사가 굴뚝 정보 수정
  STACK_CREATED_BY_ORG           // 환경측정기업이 굴뚝 등록 (확인 요청)
  STACK_VERIFIED_BY_CUSTOMER     // 고객사가 굴뚝 확인 완료
  STACK_INTERNAL_CODE_NEEDED     // 내부코드 지정 필요
  
  // 향후 확장
  MEASUREMENT_LIMIT_EXCEEDED     // 측정값 기준 초과
  CUSTOMER_CONNECTED             // 새 고객사 연결
  USER_INVITED                   // 사용자 초대
}
```

---

## 🔔 알림 시나리오

### 1. 고객사가 굴뚝 직접 등록 (STACK_CREATED_BY_CUSTOMER)

**트리거**: `POST /api/customer/stacks/create`

**알림 대상**: 
- 해당 고객사와 연결된 **모든 환경측정기업의 ORG_ADMIN**
- CustomerOrganization.status === "APPROVED"

**알림 내용**:
```typescript
{
  type: "STACK_CREATED_BY_CUSTOMER",
  title: "고객사가 새 굴뚝을 등록했습니다",
  message: "{고객사명}에서 '{굴뚝번호}'를 등록했습니다. 내부코드를 지정해주세요.",
  stackId: "stack_id",
  customerId: "customer_id",
  metadata: {
    stackName: "S-101",
    stackCode: "1호 소각로",
    customerName: "고려아연",
    needsInternalCode: true
  }
}
```

**UI 액션**:
- 클릭 시 → `/masters/stacks?stackId={stackId}` (해당 굴뚝으로 스크롤)
- 또는 → `/masters/stacks/{stackId}/edit` (수정 페이지)

---

### 2. 고객사가 굴뚝 정보 수정 (STACK_UPDATED_BY_CUSTOMER)

**트리거**: `PATCH /api/customer/stacks/[id]`

**알림 대상**: 
- 해당 고객사와 연결된 **모든 환경측정기업의 ORG_ADMIN**

**알림 내용**:
```typescript
{
  type: "STACK_UPDATED_BY_CUSTOMER",
  title: "고객사가 굴뚝 정보를 수정했습니다",
  message: "{고객사명}에서 '{굴뚝번호}' 정보를 수정했습니다. 변경 내용을 확인해주세요.",
  stackId: "stack_id",
  customerId: "customer_id",
  metadata: {
    stackName: "S-101",
    customerName: "고려아연",
    changedFields: ["height", "location"],
    changes: {
      height: { before: 25, after: 30 },
      location: { before: "A동", after: "B동" }
    },
    changeReason: "현장 재측정 결과 반영"
  }
}
```

**UI 액션**:
- 클릭 시 → `/masters/stacks/{stackId}` (상세 페이지)
- 수정 이력 자동 표시

---

### 3. 환경측정기업이 굴뚝 등록 (STACK_CREATED_BY_ORG)

**트리거**: `POST /api/org/draft-customers/[customerId]/stacks/create`

**알림 대상**: 
- 해당 고객사의 **모든 CUSTOMER_ADMIN**

**알림 내용**:
```typescript
{
  type: "STACK_CREATED_BY_ORG",
  title: "새 굴뚝이 등록되었습니다",
  message: "{환경측정기업명}에서 '{굴뚝번호}'를 등록했습니다. 정보를 확인해주세요.",
  stackId: "stack_id",
  customerId: "customer_id",
  metadata: {
    stackName: "S-101",
    internalCode: "BZ-2024-001",
    organizationName: "보아스환경기술",
    needsVerification: true
  }
}
```

**UI 액션**:
- 클릭 시 → `/customer/stacks?tab=unverified&stackId={stackId}`
- "확인 필요" 탭으로 이동

---

### 4. 고객사가 굴뚝 확인 완료 (STACK_VERIFIED_BY_CUSTOMER)

**트리거**: `POST /api/customer/stacks/[id]/verify`

**알림 대상**: 
- 해당 고객사와 연결된 **모든 환경측정기업의 ORG_ADMIN**

**알림 내용**:
```typescript
{
  type: "STACK_VERIFIED_BY_CUSTOMER",
  title: "고객사가 굴뚝 정보를 확인했습니다",
  message: "{고객사명}에서 '{굴뚝번호}' 정보를 확인 완료했습니다.",
  stackId: "stack_id",
  customerId: "customer_id",
  metadata: {
    stackName: "S-101",
    customerName: "고려아연",
    verifiedBy: "박고객",
    verifiedAt: "2024-11-01T03:30:00Z"
  }
}
```

**UI 액션**:
- 클릭 시 → `/masters/stacks/{stackId}`
- 정보성 알림 (액션 불필요)

---

### 5. 내부코드 지정 필요 (STACK_INTERNAL_CODE_NEEDED)

**트리거**: 
- `POST /api/customer/stacks/create` (고객사 직접 등록)
- 내부코드 없이 생성된 경우

**알림 대상**: 
- 해당 고객사와 연결된 **모든 환경측정기업의 ORG_ADMIN**

**알림 내용**:
```typescript
{
  type: "STACK_INTERNAL_CODE_NEEDED",
  title: "내부코드 지정이 필요합니다",
  message: "{고객사명}의 '{굴뚝번호}'에 내부코드가 지정되지 않았습니다.",
  stackId: "stack_id",
  customerId: "customer_id",
  metadata: {
    stackName: "S-101",
    stackCode: "1호 소각로",
    customerName: "고려아연",
    priority: "high"
  }
}
```

**UI 액션**:
- 클릭 시 → `/masters/stacks/{stackId}/edit`
- 내부코드 입력 필드로 포커스

---

## 🎨 UI 설계

### 1. 네비게이션 바 알림 아이콘

```tsx
// 위치: 네비게이션 바 오른쪽 (사용자 메뉴 왼쪽)
<div className="relative">
  <button className="relative p-2 hover:bg-gray-100 rounded-full">
    <Bell className="w-5 h-5" />
    {unreadCount > 0 && (
      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    )}
  </button>
</div>
```

### 2. 알림 드롭다운

```tsx
// 클릭 시 표시되는 드롭다운
<div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border">
  <div className="p-4 border-b flex justify-between items-center">
    <h3 className="font-semibold">알림</h3>
    <button className="text-sm text-blue-600">모두 읽음</button>
  </div>
  
  <div className="max-h-96 overflow-y-auto">
    {notifications.slice(0, 5).map(notification => (
      <NotificationItem key={notification.id} notification={notification} />
    ))}
  </div>
  
  <div className="p-3 border-t text-center">
    <Link href="/notifications" className="text-sm text-blue-600">
      모든 알림 보기
    </Link>
  </div>
</div>
```

### 3. 알림 아이템

```tsx
<div className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${!isRead && 'bg-blue-50'}`}>
  <div className="flex items-start gap-3">
    {/* 아이콘 */}
    <div className="flex-shrink-0">
      {getNotificationIcon(type)}
    </div>
    
    {/* 내용 */}
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm">{title}</p>
      <p className="text-sm text-gray-600 mt-1">{message}</p>
      <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(createdAt)}</p>
    </div>
    
    {/* 읽음 표시 */}
    {!isRead && (
      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
    )}
  </div>
</div>
```

### 4. 알림 페이지 (/notifications)

```tsx
// 전체 알림 목록 페이지
<div className="container mx-auto p-6">
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-2xl font-bold">알림</h1>
    <div className="flex gap-2">
      <button onClick={markAllAsRead}>모두 읽음</button>
      <button onClick={deleteAllRead}>읽은 알림 삭제</button>
    </div>
  </div>
  
  {/* 필터 탭 */}
  <Tabs defaultValue="all">
    <TabsList>
      <TabsTrigger value="all">전체 ({totalCount})</TabsTrigger>
      <TabsTrigger value="unread">읽지 않음 ({unreadCount})</TabsTrigger>
      <TabsTrigger value="stack">굴뚝 관련</TabsTrigger>
    </TabsList>
    
    <TabsContent value="all">
      <NotificationList notifications={notifications} />
    </TabsContent>
  </Tabs>
</div>
```

---

## 🔧 API 엔드포인트

### 1. GET /api/notifications

**설명**: 알림 목록 조회

**Query Parameters**:
- `isRead`: boolean (선택) - 읽음/안읽음 필터
- `type`: NotificationType (선택) - 알림 타입 필터
- `limit`: number (선택, 기본: 20) - 페이지 크기
- `offset`: number (선택, 기본: 0) - 페이지 오프셋

**Response**:
```typescript
{
  notifications: Notification[],
  total: number,
  unreadCount: number
}
```

### 2. GET /api/notifications/unread-count

**설명**: 읽지 않은 알림 개수 조회 (폴링용)

**Response**:
```typescript
{
  count: number
}
```

### 3. PATCH /api/notifications/[id]/read

**설명**: 알림 읽음 처리

**Response**:
```typescript
{
  success: true
}
```

### 4. PATCH /api/notifications/mark-all-read

**설명**: 모든 알림 읽음 처리

**Response**:
```typescript
{
  success: true,
  count: number  // 읽음 처리된 알림 개수
}
```

### 5. DELETE /api/notifications/[id]

**설명**: 알림 삭제

**Response**:
```typescript
{
  success: true
}
```

### 6. DELETE /api/notifications/delete-read

**설명**: 읽은 알림 일괄 삭제

**Response**:
```typescript
{
  success: true,
  count: number  // 삭제된 알림 개수
}
```

---

## 🔄 알림 생성 헬퍼 함수

### createNotification()

```typescript
// lib/notification-helper.ts

type CreateNotificationParams = {
  userId: string | string[];  // 단일 또는 다수 사용자
  type: NotificationType;
  title: string;
  message: string;
  stackId?: string;
  customerId?: string;
  metadata?: any;
};

export async function createNotification(params: CreateNotificationParams) {
  const userIds = Array.isArray(params.userId) ? params.userId : [params.userId];
  
  const notifications = userIds.map(userId => ({
    userId,
    type: params.type,
    title: params.title,
    message: params.message,
    stackId: params.stackId,
    customerId: params.customerId,
    metadata: params.metadata,
  }));
  
  return await prisma.notification.createMany({
    data: notifications,
  });
}

// 사용 예시
await createNotification({
  userId: orgAdminIds,  // 여러 관리자에게 동시 발송
  type: "STACK_CREATED_BY_CUSTOMER",
  title: "고객사가 새 굴뚝을 등록했습니다",
  message: `${customerName}에서 '${stackName}'를 등록했습니다.`,
  stackId: stack.id,
  customerId: stack.customerId,
  metadata: {
    stackName: stack.name,
    customerName: customer.name,
    needsInternalCode: !stack.internalCode,
  },
});
```

---

## 📍 알림 트리거 위치

### 1. 고객사 굴뚝 등록
**파일**: `src/app/api/customer/stacks/create/route.ts`

```typescript
// POST 핸들러 끝에 추가
const stack = await prisma.stack.create({ ... });

// 알림 생성: 연결된 모든 환경측정기업의 ORG_ADMIN
const orgAdmins = await prisma.user.findMany({
  where: {
    role: "ORG_ADMIN",
    organizationId: {
      in: customer.organizations
        .filter(co => co.status === "APPROVED")
        .map(co => co.organizationId)
    }
  }
});

await createNotification({
  userId: orgAdmins.map(u => u.id),
  type: "STACK_CREATED_BY_CUSTOMER",
  title: "고객사가 새 굴뚝을 등록했습니다",
  message: `${customer.name}에서 '${stack.name}'를 등록했습니다. 내부코드를 지정해주세요.`,
  stackId: stack.id,
  customerId: customer.id,
  metadata: { ... }
});
```

### 2. 고객사 굴뚝 수정
**파일**: `src/app/api/customer/stacks/[id]/route.ts` (PATCH)

```typescript
// 수정 완료 후
await createNotification({
  userId: orgAdminIds,
  type: "STACK_UPDATED_BY_CUSTOMER",
  title: "고객사가 굴뚝 정보를 수정했습니다",
  message: `${customer.name}에서 '${stack.name}' 정보를 수정했습니다.`,
  stackId: stack.id,
  customerId: customer.id,
  metadata: {
    changedFields: Object.keys(body),
    changeReason: body.changeReason
  }
});
```

### 3. 환경측정기업 굴뚝 등록
**파일**: `src/app/api/org/draft-customers/[customerId]/stacks/create/route.ts`

```typescript
// 등록 완료 후
const customerAdmins = await prisma.user.findMany({
  where: {
    role: "CUSTOMER_ADMIN",
    customerId: customerId
  }
});

await createNotification({
  userId: customerAdmins.map(u => u.id),
  type: "STACK_CREATED_BY_ORG",
  title: "새 굴뚝이 등록되었습니다",
  message: `${organization.name}에서 '${stack.name}'를 등록했습니다.`,
  stackId: stack.id,
  customerId: customerId,
  metadata: { needsVerification: true }
});
```

### 4. 고객사 굴뚝 확인
**파일**: `src/app/api/customer/stacks/[id]/verify/route.ts`

```typescript
// 확인 완료 후
await createNotification({
  userId: orgAdminIds,
  type: "STACK_VERIFIED_BY_CUSTOMER",
  title: "고객사가 굴뚝 정보를 확인했습니다",
  message: `${customer.name}에서 '${stack.name}' 정보를 확인 완료했습니다.`,
  stackId: stack.id,
  customerId: customer.id,
  metadata: {
    verifiedBy: session.user.name,
    verifiedAt: new Date()
  }
});
```

---

## 🔄 실시간 업데이트 (선택 사항)

### Option A: 폴링 방식 (간단)

```typescript
// useNotifications.ts
export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    // 30초마다 폴링
    const interval = setInterval(async () => {
      const res = await fetch('/api/notifications/unread-count');
      const data = await res.json();
      setUnreadCount(data.count);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return { unreadCount };
}
```

### Option B: WebSocket 방식 (복잡, 나중에)

- Socket.io 또는 Pusher 사용
- 실시간 알림 푸시
- 더 나은 UX, 하지만 구현 복잡도 증가

**추천**: 일단 폴링 방식으로 시작

---

## 📋 구현 순서

### Phase 4-1: 스키마 및 마이그레이션 (5분)
- [ ] Notification 모델 추가
- [ ] NotificationType enum 추가
- [ ] 마이그레이션 실행

### Phase 4-2: 헬퍼 함수 (5분)
- [ ] `lib/notification-helper.ts` 생성
- [ ] `createNotification()` 함수 구현

### Phase 4-3: API 구현 (15분)
- [ ] GET /api/notifications
- [ ] GET /api/notifications/unread-count
- [ ] PATCH /api/notifications/[id]/read
- [ ] PATCH /api/notifications/mark-all-read
- [ ] DELETE /api/notifications/[id]

### Phase 4-4: UI 컴포넌트 (20분)
- [ ] NotificationBell 컴포넌트 (네비게이션 바)
- [ ] NotificationDropdown 컴포넌트
- [ ] NotificationItem 컴포넌트
- [ ] useNotifications 훅 (폴링)

### Phase 4-5: 알림 트리거 추가 (10분)
- [ ] 고객사 굴뚝 등록 시
- [ ] 고객사 굴뚝 수정 시
- [ ] 환경측정기업 굴뚝 등록 시
- [ ] 고객사 굴뚝 확인 시

### Phase 4-6: 알림 페이지 (10분)
- [ ] /notifications 페이지 생성
- [ ] 필터 탭 구현
- [ ] 일괄 작업 버튼

**총 예상 시간**: 약 65분

---

## ✅ 완료 기준

1. **기능 테스트**
   - [ ] 고객사 굴뚝 등록 → 환경측정기업 관리자에게 알림
   - [ ] 고객사 굴뚝 수정 → 환경측정기업 관리자에게 알림
   - [ ] 환경측정기업 굴뚝 등록 → 고객사 관리자에게 알림
   - [ ] 고객사 굴뚝 확인 → 환경측정기업 관리자에게 알림

2. **UI 테스트**
   - [ ] 알림 아이콘에 읽지 않은 개수 표시
   - [ ] 알림 클릭 시 해당 페이지로 이동
   - [ ] 알림 읽음 처리 동작
   - [ ] 모두 읽음 버튼 동작

3. **성능 테스트**
   - [ ] 알림 100개 이상 조회 속도
   - [ ] 폴링이 서버에 부담 주지 않는지 확인

---

## 🚀 다음 단계

설계가 완료되었습니다. 이제 구현을 시작할까요?

**진행 방식**:
1. Phase 4-1부터 순차적으로 진행
2. 각 단계마다 테스트
3. 문제 발생 시 즉시 수정

**확인 사항**:
- 이 설계로 진행해도 괜찮을까요?
- 수정하거나 추가할 내용이 있나요?
