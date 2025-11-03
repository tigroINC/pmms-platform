# 굴뚝 수정 모달 구현 완료

## 📋 변경 사항

### 기존 방식
- 수정 버튼 클릭 → 별도 페이지로 이동 (`/customer/stacks/[id]/edit`)
- 페이지 전환으로 인한 사용자 경험 저하
- 수정 후 목록으로 돌아오는 과정 필요

### 개선된 방식
- 수정 버튼 클릭 → 모달 팝업
- 페이지 전환 없이 즉시 수정 가능
- 수정 완료 후 자동으로 목록 새로고침

## ✨ 구현 내용

### 1. 새로운 컴포넌트: `StackEditModal`

**파일**: `c:/Users/User/boaz/frontend/src/components/modals/StackEditModal.tsx`

**기능:**
- 굴뚝 정보 조회 및 표시
- 모든 필드 수정 가능
- 수정 사유 필수 입력
- 저장 시 자동 검증

**수정 가능 필드:**
- ✅ 굴뚝 코드 (`code`)
- ✅ 굴뚝 정식 명칭 (`fullName`)
- ✅ 배출시설 종류 (`facilityType`)
- ✅ 위치 (`location`)
- ✅ 높이 (`height`)
- ✅ 직경 (`diameter`)
- ✅ 설명 (`description`)
- ✅ 수정 사유 (`changeReason`) - 필수

**읽기 전용 필드:**
- 굴뚝번호 (`name`) - 환경측정기업 전용
- 현장 코드 (`siteCode`)
- 현장 명칭 (`siteName`)

### 2. 굴뚝관리 페이지 수정

**파일**: `c:/Users/User/boaz/frontend/src/app/customer/stacks/page.tsx`

**변경 사항:**
1. `StackEditModal` 컴포넌트 import
2. `editingStackId` 상태 추가
3. 수정 버튼 클릭 시 모달 열기
4. 모달 닫기 시 목록 새로고침

**적용 위치:**
- ✅ 검토대기 탭의 수정 버튼
- ✅ 전체 탭의 수정 버튼

## 🎨 UI/UX 개선

### 모달 레이아웃

```
┌─────────────────────────────────────────┐
│ 굴뚝 정보 수정                      [✕] │
├─────────────────────────────────────────┤
│                                         │
│ [읽기 전용 정보]                        │
│ - 굴뚝번호, 현장 코드, 현장 명칭        │
│                                         │
│ [수정 가능 필드]                        │
│ - 굴뚝 코드                             │
│ - 굴뚝 정식 명칭                        │
│ - 배출시설 종류                         │
│ - 위치                                  │
│ - 높이, 직경                            │
│ - 설명                                  │
│                                         │
│ [수정 사유 (필수)]                      │
│ ⚠️ 모든 수정 이력이 자동으로 기록됩니다 │
│                                         │
│                    [취소]  [저장]       │
└─────────────────────────────────────────┘
```

### 사용자 경험 개선

1. **즉시 수정**
   - 페이지 전환 없이 바로 수정 가능
   - 컨텍스트 유지

2. **자동 새로고침**
   - 수정 완료 시 자동으로 목록 업데이트
   - 두 탭 모두 새로고침

3. **명확한 구분**
   - 읽기 전용 필드: 회색 배경으로 구분
   - 수정 가능 필드: 일반 입력 필드
   - 수정 사유: 노란색 배경으로 강조

4. **반응형 디자인**
   - 최대 너비: 2xl (672px)
   - 최대 높이: 화면의 90%
   - 스크롤 가능

## 📝 사용 방법

### 고객사 관리자

1. **굴뚝관리 메뉴 접속**
   - 전체 탭 또는 검토대기 탭 선택

2. **수정 버튼 클릭**
   - 수정하려는 굴뚝의 "수정" 버튼 클릭
   - 모달이 즉시 열림

3. **정보 수정**
   - 필요한 필드 수정
   - 수정 사유 입력 (필수)

4. **저장**
   - "저장" 버튼 클릭
   - 성공 메시지 확인
   - 모달 자동 닫힘
   - 목록 자동 새로고침

## 🔧 기술 구현

### 상태 관리

```typescript
const [editingStackId, setEditingStackId] = useState<string | null>(null);

// 수정 버튼 클릭
<button onClick={() => setEditingStackId(stack.id)}>
  수정
</button>

// 모달
{editingStackId && (
  <StackEditModal
    stackId={editingStackId}
    isOpen={!!editingStackId}
    onClose={() => setEditingStackId(null)}
    onSuccess={() => {
      fetchPendingStacks();
      fetchConfirmedStacks();
    }}
  />
)}
```

### API 호출

```typescript
// 굴뚝 정보 조회
GET /api/stacks/${stackId}

// 굴뚝 정보 수정
PATCH /api/stacks/${stackId}
{
  code: string,
  fullName: string,
  facilityType: string,
  location: string,
  height: number,
  diameter: number,
  description: string,
  changeReason: string  // 필수
}
```

### 수정 이력 자동 기록

모든 수정은 `StackHistory` 테이블에 자동으로 기록됩니다:
- 변경된 필드명 (`fieldName`)
- 이전 값 (`previousValue`)
- 새 값 (`newValue`)
- 변경 사유 (`changeReason`)
- 변경자 (`changedBy`)
- 변경 시간 (`changedAt`)

## ✅ 테스트 체크리스트

- [x] 검토대기 탭에서 수정 버튼 클릭 시 모달 열림
- [x] 전체 탭에서 수정 버튼 클릭 시 모달 열림
- [x] 모달에서 굴뚝 정보 정상 로드
- [x] 읽기 전용 필드는 수정 불가
- [x] 수정 가능 필드는 정상 수정
- [x] 수정 사유 미입력 시 경고
- [x] 저장 성공 시 모달 닫힘
- [x] 저장 성공 시 목록 새로고침
- [x] ESC 키 또는 X 버튼으로 모달 닫기
- [x] 모달 외부 클릭 시 모달 닫기

## 🎯 장점

### 사용자 경험
- ✅ 페이지 전환 없이 빠른 수정
- ✅ 컨텍스트 유지 (탭, 검색 상태 등)
- ✅ 직관적인 UI

### 개발 관점
- ✅ 재사용 가능한 모달 컴포넌트
- ✅ 명확한 상태 관리
- ✅ 자동 새로고침으로 데이터 일관성 유지

### 유지보수
- ✅ 단일 컴포넌트로 관리
- ✅ 기존 API 재사용
- ✅ 확장 가능한 구조

## 📌 참고

**기존 수정 페이지**: `c:/Users/User/boaz/frontend/src/app/customer/stacks/[id]/edit/page.tsx`
- 현재는 사용되지 않음
- 필요시 삭제 가능
- URL 직접 접근 시에는 여전히 작동

**모달 컴포넌트**: `c:/Users/User/boaz/frontend/src/components/modals/StackEditModal.tsx`
- 독립적으로 재사용 가능
- 다른 페이지에서도 사용 가능
