# 고객사 굴뚝관리 검토대기 탭 수정 완료

## 수정된 문제점

### 1. ✅ 페이지 로드 시 두 탭 데이터 동시 로드
**문제**: 전체 탭이 기본으로 보일 때 검토대기 탭 카운트가 0으로 표시됨
**해결**: 
- 초기 로드 시 `fetchPendingStacks()`와 `fetchConfirmedStacks()` 모두 호출
- 탭 변경 시에만 해당 탭 데이터 새로고침

```typescript
// 초기 로드 시 두 탭 모두 데이터 가져오기
useEffect(() => {
  if (user?.role !== "CUSTOMER_ADMIN" && user?.role !== "CUSTOMER_USER") {
    router.push("/dashboard");
    return;
  }
  // 두 탭 모두 데이터 가져오기
  fetchPendingStacks();
  fetchConfirmedStacks();
}, [user, router]);

// 탭 변경 시 해당 탭만 새로고침
useEffect(() => {
  if (!user) return;
  if (activeTab === "pending") {
    fetchPendingStacks();
  } else if (activeTab === "confirmed") {
    fetchConfirmedStacks();
  }
}, [activeTab]);
```

### 2. ✅ 검토대기 탭 담당환경측정회사 정보 표시
**문제**: 담당환경측정회사 컬럼에 정보가 표시되지 않음
**해결**: 
- API에서 `draftCreatedBy` 필드를 통해 Organization 정보 조회
- `stackCodes` 관계 대신 직접 Organization 조회로 변경

```typescript
// draftCreatedBy로 Organization 정보 조회
const organizationIds = [...new Set(stacks.map(s => s.draftCreatedBy).filter(Boolean))] as string[];
const organizations = await prisma.organization.findMany({
  where: {
    id: { in: organizationIds },
  },
  select: {
    id: true,
    name: true,
  },
});
const orgMap = new Map(organizations.map(o => [o.id, o]));

const result = stacks.map((s) => {
  const org = s.draftCreatedBy ? orgMap.get(s.draftCreatedBy) : null;
  return {
    // ...
    internal: org
      ? {
          code: s.code || "-",
          name: s.fullName,
          organization: {
            id: org.id,
            name: org.name,
          },
        }
      : null,
    // ...
  };
});
```

### 3. ✅ 검토대기 탭 굴뚝코드 정보 표시
**문제**: 굴뚝코드 컬럼에 정보가 표시되지 않음
**해결**: 
- Stack의 `code` 필드 사용
- 값이 없으면 "-" 표시

```typescript
internal: org
  ? {
      code: s.code || "-",  // Stack.code 사용
      name: s.fullName,
      organization: {
        id: org.id,
        name: org.name,
      },
    }
  : null,
```

### 4. ✅ 일괄확인완료 버튼 항상 표시
**문제**: 검토대기 탭에서 일괄확인완료 버튼이 표시되지 않음
**해결**: 
- 검토대기 탭에서 CUSTOMER_ADMIN일 때 항상 버튼 표시
- 선택된 항목이 없으면 `disabled` 상태로 표시
- 선택된 항목 수를 동적으로 표시

```typescript
{activeTab === "pending" && user?.role === "CUSTOMER_ADMIN" && (
  <Button
    size="sm"
    onClick={handleBulkConfirm}
    disabled={selectedStacks.size === 0}
  >
    일괄확인완료 {selectedStacks.size > 0 && `(${selectedStacks.size})`}
  </Button>
)}
```

### 5. ✅ 전체 탭 담당환경측정회사 정보 표시
**문제**: 전체 탭에서 담당환경측정회사 정보가 표시되지 않음
**해결**: 
- `/api/stacks` API가 이미 `organizationNames` 필드 제공
- UI에서 `stack.organizationNames` 사용하여 표시

```typescript
<td className="px-4 py-3 text-sm">
  {stack.organizationNames && stack.organizationNames.length > 0
    ? stack.organizationNames.join(", ")
    : "-"}
</td>
```

## 수정된 파일

1. **c:/Users/User/boaz/frontend/src/app/customer/stacks/page.tsx**
   - 초기 로드 시 두 탭 데이터 동시 로드
   - 일괄확인완료 버튼 항상 표시 (disabled 처리)
   - 로딩 상태 제거
   - 디버그 콘솔 로그 추가

2. **c:/Users/User/boaz/frontend/src/app/api/customer/stacks/pending-review/route.ts**
   - `draftCreatedBy`로 Organization 정보 조회
   - `stackCodes` 관계 제거
   - Stack의 `code` 필드 사용

## 테스트 방법

### 브라우저 콘솔 확인
페이지 로드 시 다음 로그가 출력됩니다:
```
Pending stacks data: { stacks: [...], total: N }
Confirmed stacks data: { data: [...] }
```

### 확인 사항
1. ✅ 페이지 로드 시 검토대기 탭 카운트가 즉시 표시됨
2. ✅ 검토대기 탭에서 담당환경측정회사 컬럼에 조직명 표시
3. ✅ 검토대기 탭에서 굴뚝코드 컬럼에 코드 표시
4. ✅ 검토대기 탭 우상단에 "일괄확인완료" 버튼 표시
5. ✅ 선택 항목이 없으면 버튼 비활성화
6. ✅ 선택 항목이 있으면 "일괄확인완료 (N)" 형태로 표시
7. ✅ 전체 탭에서 담당환경측정회사 컬럼에 조직명 표시

## 데이터 확인 필요

만약 검토대기 탭에 데이터가 표시되지 않는다면:

1. **PENDING_REVIEW 상태 굴뚝이 있는지 확인**
   ```sql
   SELECT id, name, siteCode, siteName, status, draftCreatedBy 
   FROM Stack 
   WHERE status = 'PENDING_REVIEW';
   ```

2. **draftCreatedBy가 설정되어 있는지 확인**
   ```sql
   SELECT id, name, status, draftCreatedBy, draftCreatedAt 
   FROM Stack 
   WHERE status = 'PENDING_REVIEW' AND draftCreatedBy IS NULL;
   ```

3. **Organization 정보가 존재하는지 확인**
   ```sql
   SELECT o.id, o.name 
   FROM Organization o
   WHERE o.id IN (
     SELECT DISTINCT draftCreatedBy 
     FROM Stack 
     WHERE status = 'PENDING_REVIEW' AND draftCreatedBy IS NOT NULL
   );
   ```

## 주의사항

- Prisma 클라이언트 재생성이 필요할 수 있습니다: `npx prisma generate`
- 개발 서버 재시작이 필요할 수 있습니다
- 브라우저 캐시를 지우고 새로고침하세요
