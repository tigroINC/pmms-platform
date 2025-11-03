# 굴뚝 관리 시스템 개선 완료 보고서

## 📋 개요
환경측정기업과 고객사의 굴뚝 관련 메뉴와 기능을 분석하여 발견된 문제점을 개선했습니다.

**작업 기간**: 2025-11-01  
**작업 범위**: Phase 1 (긴급) + Phase 2 (중요) 일부

---

## ✅ 완료된 개선 사항

### Phase 1: 긴급 개선 (완료)

#### 1. 측정 데이터 입력 제한 (CONFIRMED만) ✅
**문제**: PENDING_REVIEW 또는 DRAFT 상태 굴뚝에도 측정 데이터 입력 가능

**해결**:
- `POST /api/measurements` - 단건 입력 시 굴뚝 상태 체크 추가
- `POST /api/measurements/bulk` - 일괄 입력 시 모든 굴뚝 상태 체크 추가
- CONFIRMED 상태가 아니면 400 에러 반환

**수정 파일**:
- `c:/Users/User/boaz/frontend/src/app/api/measurements/route.ts`
- `c:/Users/User/boaz/frontend/src/app/api/measurements/bulk/route.ts`

**코드 예시**:
```typescript
// ⚠️ CRITICAL: 확정된 굴뚝만 측정 데이터 입력 가능
if (stackRow.status !== "CONFIRMED") {
  return NextResponse.json({ 
    error: "확정된 굴뚝만 측정 데이터를 입력할 수 있습니다. 현재 상태: " + stackRow.status 
  }, { status: 400 });
}
```

---

#### 2. 고객사 굴뚝 목록 페이지 추가 ✅
**문제**: 고객사가 확정된 굴뚝 전체 목록을 조회하는 독립 메뉴 없음

**해결**:
- `/customer/stacks` 페이지의 "확정 완료" 탭에 실제 목록 표시
- 검색 기능 추가 (굴뚝번호, 코드, 명칭, 위치)
- 측정 건수 표시
- CUSTOMER_ADMIN은 수정 버튼 표시

**수정 파일**:
- `c:/Users/User/boaz/frontend/src/app/customer/stacks/page.tsx`

**기능**:
- ✅ 확정된 굴뚝 목록 표시 (CONFIRMED 상태만)
- ✅ 실시간 검색 필터
- ✅ 굴뚝별 측정 건수 표시
- ✅ 수정 버튼 (CUSTOMER_ADMIN만)

---

### Phase 2: 중요 개선 (완료)

#### 3. 고객사 굴뚝 수정 권한 추가 ✅
**문제**: 확정 후 굴뚝 정보 수정 권한이 환경측정기업에만 있음

**해결**:
- 고객사 사용자도 자사 굴뚝 수정 가능
- 수정 가능 필드 제한: `code`, `location`, `height`, `diameter`, `coordinates`, `description`, `fullName`, `facilityType`
- 수정 불가 필드: `name` (굴뚝번호, 환경측정기업 전용)
- 수정 사유 입력 필수
- 수정 이력 자동 기록 (StackHistory)

**수정/생성 파일**:
- `c:/Users/User/boaz/frontend/src/app/api/stacks/[id]/route.ts` - 권한 체크 추가
- `c:/Users/User/boaz/frontend/src/app/customer/stacks/[id]/edit/page.tsx` - 신규 생성
- `c:/Users/User/boaz/frontend/src/app/customer/stacks/page.tsx` - 수정 버튼 추가

**권한 체크 로직**:
```typescript
// 권한 체크: 고객사 사용자는 자사 굴뚝만 수정 가능
if (userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER") {
  if (currentStack.customerId !== userCustomerId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  // 고객사 사용자는 특정 필드만 수정 가능
  const allowedFields = ['code', 'location', 'height', 'diameter', 'coordinates', 'description', 'fullName', 'facilityType'];
  const restrictedFields = Object.keys(body).filter(key => 
    !allowedFields.includes(key) && key !== 'changeReason' && key !== 'isActive'
  );
  if (restrictedFields.length > 0) {
    return NextResponse.json({ 
      error: `고객사는 다음 필드를 수정할 수 없습니다: ${restrictedFields.join(', ')}` 
    }, { status: 403 });
  }
}
```

---

#### 4. 거부 프로세스 개선 (사유 입력) ✅
**문제**: 거부 사유 입력이 선택적이고, 사유 없이 거부 가능

**해결**:
- 거부 사유 입력 필수화
- 사유 미입력 시 400 에러 반환
- 프론트엔드에서 사유 입력 안내 개선
- 확인 모달에 사유 표시

**수정 파일**:
- `c:/Users/User/boaz/frontend/src/app/api/customer/stacks/bulk-reject/route.ts`
- `c:/Users/User/boaz/frontend/src/app/customer/stacks/page.tsx`

**개선 사항**:
```typescript
// 백엔드: 사유 필수 체크
if (!reason || !reason.trim()) {
  return NextResponse.json(
    { error: "거부 사유를 입력해주세요." },
    { status: 400 }
  );
}

// 프론트엔드: 사유 입력 안내
const reason = prompt("거부 사유를 입력해주세요 (필수):\n\n예시:\n- 굴뚝 위치 정보 불일치\n- 현장 코드 오류\n- 중복 등록");
if (!reason || !reason.trim()) {
  alert("거부 사유는 필수입니다.");
  return;
}

// 확인 모달에 사유 표시
if (!confirm(`${selectedStacks.size}개 굴뚝을 거부하시겠습니까?\n\n거부 사유: ${reason}`)) {
  return;
}
```

---

## 📊 개선 효과

### 1. 데이터 정합성 향상
- ✅ 확정되지 않은 굴뚝에 측정 데이터 입력 방지
- ✅ 잘못된 상태의 데이터 생성 차단

### 2. 사용자 경험 개선
- ✅ 고객사가 자사 굴뚝 목록을 한눈에 확인 가능
- ✅ 검색 기능으로 빠른 조회
- ✅ 측정 건수로 활동 현황 파악

### 3. 권한 체계 명확화
- ✅ 고객사도 자사 굴뚝 정보 수정 가능
- ✅ 수정 가능/불가 필드 명확히 구분
- ✅ 수정 이력 자동 기록으로 추적 가능

### 4. 프로세스 투명성 향상
- ✅ 거부 사유 필수 입력으로 의사소통 개선
- ✅ 거부 사유 기록으로 재작업 시 참고 가능

---

## 🔍 테스트 체크리스트

### Phase 1 테스트
- [ ] **측정 데이터 입력 제한**
  - [ ] DRAFT 상태 굴뚝에 측정 입력 시도 → 400 에러
  - [ ] PENDING_REVIEW 상태 굴뚝에 측정 입력 시도 → 400 에러
  - [ ] CONFIRMED 상태 굴뚝에 측정 입력 → 성공
  - [ ] 일괄 업로드 시 비확정 굴뚝 포함 → 400 에러

- [ ] **고객사 굴뚝 목록**
  - [ ] CUSTOMER_ADMIN 로그인 → "확정 완료" 탭 클릭
  - [ ] 확정된 굴뚝 목록 표시 확인
  - [ ] 검색 기능 동작 확인
  - [ ] 측정 건수 표시 확인
  - [ ] 수정 버튼 클릭 → 수정 페이지 이동

### Phase 2 테스트
- [ ] **고객사 굴뚝 수정**
  - [ ] CUSTOMER_ADMIN으로 자사 굴뚝 수정 → 성공
  - [ ] 타사 굴뚝 수정 시도 → 403 에러
  - [ ] 굴뚝번호(name) 수정 시도 → 403 에러
  - [ ] 허용된 필드 수정 → 성공
  - [ ] 수정 사유 미입력 → 경고
  - [ ] StackHistory 기록 확인

- [ ] **거부 프로세스**
  - [ ] 거부 사유 미입력 → 경고
  - [ ] 거부 사유 입력 후 거부 → 성공
  - [ ] 거부된 굴뚝의 rejectionReason 확인
  - [ ] 확인 모달에 사유 표시 확인

---

## 📝 남은 작업 (Phase 2 나머지 + Phase 3)

### Phase 2 (중요)
- [ ] **일괄 등록 검증 강화**
  - Excel 업로드 → 파싱 → 검증 → 미리보기 → 수정 → 등록
  - 오류 행 표시 및 수정 기능
  - 중복 코드 체크
  - 필수 필드 검증

### Phase 3 (개선)
- [ ] **알림 시스템 구축**
  - 새 굴뚝 검토 요청 알림 (고객사)
  - 승인/거부 결과 알림 (환경측정기업)
  - 굴뚝 정보 수정 알림 (환경측정기업)

- [ ] **수정 이력 조회 UI**
  - StackHistory 활용
  - 변경 내역 타임라인
  - 변경 전/후 비교

- [ ] **코드 체계 도움말 페이지**
  - 내부 코드 vs 현장 코드 설명
  - 코드 작성 가이드
  - 예시 및 FAQ

---

## 🎯 시스템 흐름 정리

### 시나리오 1: 환경측정기업 주도 (정상 흐름)
```
1. ORG_ADMIN: 임시 고객 + 굴뚝 등록 (DRAFT)
   ↓
2. ORG_ADMIN: 초대 링크 발송
   ↓
3. CUSTOMER_ADMIN: 초대 수락 → 자동 전환 (PENDING_REVIEW)
   ↓
4. CUSTOMER_ADMIN: 굴뚝 검토 → 현장 코드 지정 → 승인 (CONFIRMED)
   ↓
5. ✅ 측정 데이터 입력 가능 (CONFIRMED 상태)
   ↓
6. CUSTOMER_ADMIN: 굴뚝 정보 수정 가능 (허용된 필드만)
```

### 시나리오 2: 거부 흐름
```
1. CUSTOMER_ADMIN: 굴뚝 검토 → 거부 사유 입력 (필수)
   ↓
2. 시스템: Stack → REJECTED, rejectionReason 저장
   ↓
3. ORG_ADMIN: 거부 사유 확인
   ↓
4. ORG_ADMIN: 정보 수정 후 재등록
   ↓
5. CUSTOMER_ADMIN: 재검토 → 승인
```

### 시나리오 3: 고객사 직접 등록
```
1. CUSTOMER_ADMIN: 굴뚝 직접 등록 (즉시 CONFIRMED)
   ↓
2. ✅ 측정 데이터 입력 가능
   ↓
3. CUSTOMER_ADMIN: 굴뚝 정보 수정 가능
```

---

## 🔒 권한 매트릭스

| 기능 | SUPER_ADMIN | ORG_ADMIN | OPERATOR | CUSTOMER_ADMIN | CUSTOMER_USER |
|------|-------------|-----------|----------|----------------|---------------|
| 임시 굴뚝 등록 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 굴뚝 검토/승인 | ❌ | ❌ | ❌ | ✅ | ❌ |
| 굴뚝 거부 (사유 필수) | ❌ | ❌ | ❌ | ✅ | ❌ |
| 굴뚝 직접 등록 | ❌ | ❌ | ❌ | ✅ | ❌ |
| 확정 굴뚝 조회 | ✅ | ✅ | ✅ (담당만) | ✅ | ✅ |
| 확정 굴뚝 수정 (전체) | ✅ | ✅ | ❌ | ❌ | ❌ |
| 확정 굴뚝 수정 (제한) | ❌ | ❌ | ❌ | ✅ | ❌ |
| 측정 데이터 입력 (CONFIRMED만) | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 📂 수정된 파일 목록

### API (백엔드)
1. `c:/Users/User/boaz/frontend/src/app/api/measurements/route.ts` - 측정 입력 제한
2. `c:/Users/User/boaz/frontend/src/app/api/measurements/bulk/route.ts` - 일괄 입력 제한
3. `c:/Users/User/boaz/frontend/src/app/api/stacks/[id]/route.ts` - 고객사 수정 권한
4. `c:/Users/User/boaz/frontend/src/app/api/customer/stacks/bulk-reject/route.ts` - 거부 사유 필수

### 페이지 (프론트엔드)
1. `c:/Users/User/boaz/frontend/src/app/customer/stacks/page.tsx` - 목록 표시 + 거부 개선
2. `c:/Users/User/boaz/frontend/src/app/customer/stacks/[id]/edit/page.tsx` - 신규 생성

---

## 🚀 배포 전 확인 사항

### 1. 데이터베이스
- [x] 스키마에 `rejectionReason` 필드 존재 확인
- [x] `StackHistory` 테이블 존재 확인
- [ ] 기존 데이터 마이그레이션 필요 여부 확인

### 2. 환경 설정
- [ ] Prisma 클라이언트 재생성: `npx prisma generate`
- [ ] 개발 서버 재시작: `npm run dev`

### 3. 테스트
- [ ] Phase 1 테스트 체크리스트 완료
- [ ] Phase 2 테스트 체크리스트 완료
- [ ] 회귀 테스트 (기존 기능 정상 동작 확인)

---

## 📞 문의 및 피드백

**작성자**: Cascade AI  
**작성일**: 2025-11-01  
**문서 버전**: 1.0

**관련 문서**:
- `STACK_MANAGEMENT_ANALYSIS.md` - 초기 분석 문서
- `STACK_MANAGEMENT_INTEGRATION_STATUS.md` - 통합 상태 문서
- `TEST_ACCOUNTS.md` - 테스트 계정 정보

---

**✅ Phase 1 + Phase 2 (일부) 완료!**

다음 단계: Phase 2 나머지 (일괄 등록 검증) 및 Phase 3 (알림 시스템) 진행
