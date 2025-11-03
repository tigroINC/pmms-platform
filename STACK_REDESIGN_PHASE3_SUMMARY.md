# Phase 3 진행 중: UI 개선 요약

## ✅ 완료된 작업

### 1. 고객사 굴뚝 페이지 수정 ✅
**파일**: `src/app/customer/stacks/page.tsx`

#### 주요 변경사항:
1. **탭 순서 및 명칭 변경**
   - 기본 탭: "확인 필요" → "전체 굴뚝"
   - 탭 순서: [전체 굴뚝] [검토 대기]

2. **승인/거부 기능 제거**
   - ❌ 일괄 승인 버튼 삭제
   - ❌ 일괄 거부 버튼 삭제
   - ❌ 개별 승인 버튼 삭제
   - ❌ 체크박스 선택 기능 삭제

3. **선택적 확인 기능 추가**
   - "확인 상태" 컬럼 추가
   - ✓ 확인완료 / 확인필요 배지 표시
   - [확인완료] 버튼 추가 (미확인 굴뚝만)
   - `handleVerify()` 함수로 확인 처리

4. **타입 업데이트**
   ```typescript
   type ConfirmedStack = {
     // ... 기존 필드
     isActive: boolean;
     isVerified: boolean;
     verifiedBy: string | null;
     verifiedAt: string | null;
   };
   ```

5. **API 호출 변경**
   - 상태 필터링: `status === "CONFIRMED"` → `isActive === true`

#### UI 변경 전/후:

**Before (승인/거부 방식)**:
```
[확인 필요] [확정 완료]

확인 필요 탭:
- 체크박스 선택
- [일괄 승인] [일괄 거부]
- 각 굴뚝: [수정] [승인]
```

**After (즉시 공유 방식)**:
```
[전체 굴뚝] [검토 대기]

전체 굴뚝 탭:
- 확인 상태 컬럼 (✓ 확인완료 / 확인필요)
- 각 굴뚝: [확인완료] [수정] (확인완료는 미확인만)

검토 대기 탭:
- 각 굴뚝: [상세보기]
```

---

## 🔄 다음 작업

### 2. 환경측정기업 굴뚝 페이지 수정
**파일**: `src/app/masters/stacks/page.tsx`

**작업 내용**:
- 상태 필터 단순화 (DRAFT, PENDING_REVIEW, CONFIRMED, REJECTED → 전체/활성/비활성)
- isActive 기반 필터링으로 변경

### 3. 충돌 모달 컴포넌트 추가
**파일**: `src/components/modals/ConflictModal.tsx` (신규)

**기능**:
- 409 Conflict 응답 처리
- 현재 값 vs 내 값 비교 표시
- [현재 값 사용] [내 값으로 덮어쓰기] [취소]

### 4. 굴뚝 수정 폼 업데이트
**파일**: `src/app/customer/stacks/[id]/edit/page.tsx`

**작업 내용**:
- `_lastSeenAt` 필드 추가
- 409 응답 시 충돌 모달 표시

### 5. 수정 이력 타임라인 추가
**파일**: `src/components/stack/HistoryTimeline.tsx` (신규)

**기능**:
- StackHistory 조회 및 표시
- 타임라인 형식으로 변경 이력 표시

---

## 📊 진행 상황

| 작업 | 상태 | 파일 |
|------|------|------|
| 고객사 굴뚝 페이지 | ✅ 완료 | customer/stacks/page.tsx |
| 환경측정기업 굴뚝 페이지 | 🔄 대기 | masters/stacks/page.tsx |
| 충돌 모달 | 🔄 대기 | components/modals/ConflictModal.tsx |
| 수정 폼 업데이트 | 🔄 대기 | customer/stacks/[id]/edit/page.tsx |
| 수정 이력 타임라인 | 🔄 대기 | components/stack/HistoryTimeline.tsx |

---

## 🎯 Phase 3 목표

1. ✅ 승인/거부 UI 제거
2. ✅ 선택적 확인 UI 추가
3. 🔄 상태 필터 단순화
4. 🔄 충돌 감지 UI 추가
5. 🔄 수정 이력 조회 UI 추가

---

**작성일**: 2024-11-01  
**Phase**: 3/5 진행 중  
**다음**: 환경측정기업 굴뚝 페이지 수정
