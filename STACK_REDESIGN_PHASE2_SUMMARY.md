# Phase 2 완료: API 수정 요약

## ✅ 완료된 작업

### 1. 승인/거부 API 제거
- ❌ `/api/customer/stacks/bulk-confirm` - 삭제 예정 (수동 삭제 필요)
- ❌ `/api/customer/stacks/bulk-reject` - 삭제 예정 (수동 삭제 필요)

### 2. 측정 데이터 입력 제한 변경 ✅
**파일**: `src/app/api/measurements/route.ts`
```typescript
// 변경 전: status === "CONFIRMED" 체크
// 변경 후: isActive === true 체크

if (!stackRow.isActive) {
  return NextResponse.json({ 
    error: "비활성화된 굴뚝입니다. 측정 데이터를 입력할 수 없습니다." 
  }, { status: 400 });
}
```

**파일**: `src/app/api/measurements/bulk/route.ts`
```typescript
// 변경 전: status !== "CONFIRMED" 필터링
// 변경 후: !isActive 필터링

const inactiveStacks = stacks.filter(s => !s.isActive);
if (inactiveStacks.length > 0) {
  return NextResponse.json({ 
    error: "비활성화된 굴뚝이 포함되어 있습니다: " + inactiveStacks.map(s => s.name).join(", ")
  }, { status: 400 });
}
```

### 3. 선택적 확인 API 추가 ✅
**파일**: `src/app/api/customer/stacks/[id]/verify/route.ts` (신규)

**기능**:
- 고객사 관리자가 굴뚝 정보 확인 완료 처리
- `isVerified: true`, `verifiedBy`, `verifiedAt` 업데이트
- StackHistory에 VERIFY 액션 기록

**사용법**:
```typescript
POST /api/customer/stacks/{stackId}/verify

// Response
{
  message: "굴뚝 정보 확인이 완료되었습니다.",
  data: { ...stack }
}
```

### 4. 동시 수정 충돌 감지 추가 ✅
**파일**: `src/app/api/stacks/[id]/route.ts`

**중요 필드 정의**:
```typescript
const CRITICAL_FIELDS = ['height', 'diameter', 'location', 'coordinates'];
```

**충돌 감지 로직**:
```typescript
if (body._lastSeenAt) {
  const lastSeenAt = new Date(body._lastSeenAt);
  if (currentStack.updatedAt > lastSeenAt) {
    // 다른 사용자가 이미 수정함
    const criticalChanges = CRITICAL_FIELDS.filter(field => 
      body[field] !== undefined && 
      (currentStack as any)[field] !== body[field]
    );

    if (criticalChanges.length > 0) {
      // 중요 필드 충돌 → 409 Conflict 반환
      return NextResponse.json({
        error: "CONFLICT",
        message: "다른 사용자가 중요 정보를 수정했습니다.",
        conflicts: [...],
        currentData: currentStack
      }, { status: 409 });
    }
    // 일반 필드만 변경 → Last Write Wins
  }
}
```

### 5. StackHistory 형식 변경 ✅
**변경 전**:
```typescript
{
  stackId,
  fieldName,
  previousValue,
  newValue,
  changeReason,
  changedBy
}
```

**변경 후**:
```typescript
{
  stackId,
  userId,
  userName,
  userRole,
  action: 'UPDATE' | 'VERIFY',
  field,
  oldValue,
  newValue,
  reason
}
```

---

## 📋 수동 작업 필요

### 1. 승인/거부 API 폴더 삭제
```powershell
# 수동으로 삭제 필요
Remove-Item -Path "src/app/api/customer/stacks/bulk-confirm" -Recurse -Force
Remove-Item -Path "src/app/api/customer/stacks/bulk-reject" -Recurse -Force
```

---

## 🔄 다음 단계: Phase 3 (UI 개선)

### 작업 목록:
1. **고객사 굴뚝 페이지** (`/customer/stacks/page.tsx`)
   - 승인/거부 버튼 제거
   - 상태 필터 제거 (PENDING_REVIEW, REJECTED)
   - "확인 필요" 배지 추가 (isVerified: false)
   - [확인 완료] 버튼 추가

2. **환경측정기업 굴뚝 페이지** (`/masters/stacks/page.tsx`)
   - 상태 필터 단순화 (전체/활성/비활성)
   - DRAFT, PENDING_REVIEW, CONFIRMED, REJECTED 제거

3. **굴뚝 수정 폼**
   - `_lastSeenAt` 필드 추가 (충돌 감지용)
   - 충돌 모달 추가 (409 응답 처리)

4. **굴뚝 상세 페이지**
   - 수정 이력 타임라인 추가
   - StackHistory 조회 및 표시

---

## 📊 API 변경 요약

| API | 변경 사항 | 상태 |
|-----|----------|------|
| POST /api/measurements | status → isActive 체크 | ✅ |
| POST /api/measurements/bulk | status → isActive 체크 | ✅ |
| POST /api/customer/stacks/[id]/verify | 신규 추가 | ✅ |
| PATCH /api/stacks/[id] | 충돌 감지 추가 | ✅ |
| PATCH /api/stacks/[id] | StackHistory 형식 변경 | ✅ |
| DELETE /api/customer/stacks/bulk-confirm | 삭제 예정 | 🔄 |
| DELETE /api/customer/stacks/bulk-reject | 삭제 예정 | 🔄 |

---

## ✅ 검증 체크리스트

### API 테스트
- [ ] 활성 굴뚝에 측정 데이터 입력 → 성공
- [ ] 비활성 굴뚝에 측정 데이터 입력 → 400 에러
- [ ] 고객사 관리자가 굴뚝 확인 → isVerified: true
- [ ] 동시 수정 (중요 필드) → 409 Conflict
- [ ] 동시 수정 (일반 필드) → Last Write Wins

### 데이터 확인
- [ ] 489개 굴뚝 모두 isActive: true
- [ ] 489개 굴뚝 모두 isVerified: true
- [ ] StackHistory 형식 확인

---

**작성일**: 2024-11-01  
**Phase**: 2/5 완료  
**다음**: Phase 3 - UI 개선
