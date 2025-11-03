# 굴뚝 관리 시스템 통합 상태 확인

## ✅ 통합 완료 항목

### 1. 데이터베이스 스키마
- ✅ `CustomerStatus` enum (DRAFT, CONNECTED)
- ✅ `StackStatus` enum (DRAFT, PENDING_REVIEW, CONFIRMED, REJECTED)
- ✅ `Customer` 테이블: status, draftCreatedBy, draftCreatedAt 필드
- ✅ `Stack` 테이블: siteCode, siteName, status, draftCreatedBy 필드
- ✅ `StackCode` 테이블 (환경측정기업별 내부 코드)
- ✅ `StackUpdateLog` 테이블 (수정 알림 로그)

### 2. 백엔드 API
#### 환경측정기업 API (7개)
- ✅ `POST /api/org/draft-customers/create` - 임시 고객 등록
- ✅ `GET /api/org/draft-customers` - 임시 고객 목록
- ✅ `POST /api/org/draft-customers/[customerId]/stacks/create` - 임시 굴뚝 단건 등록
- ✅ `POST /api/org/draft-customers/[customerId]/stacks/bulk-create` - 임시 굴뚝 일괄 등록
- ✅ `GET /api/org/draft-customers/[customerId]/stacks` - 임시 굴뚝 조회
- ✅ `PATCH /api/org/draft-customers/[customerId]/stacks/[stackId]` - 임시 굴뚝 수정
- ✅ `DELETE /api/org/draft-customers/[customerId]/stacks/[stackId]` - 임시 굴뚝 삭제

#### 고객사 API (5개)
- ✅ `GET /api/customer/stacks/pending-review` - 검토 대기 목록
- ✅ `POST /api/customer/stacks/bulk-confirm` - 일괄 승인
- ✅ `PATCH /api/customer/stacks/[id]/confirm` - 개별 수정 후 승인
- ✅ `POST /api/customer/stacks/bulk-reject` - 일괄 거부
- ✅ `POST /api/customer/stacks/create` - 고객사 직접 등록

#### 연결 승인 API
- ✅ `PATCH /api/customer-organizations/[id]/approve` - 연결 승인 시 자동 전환

### 3. 프론트엔드 컴포넌트
#### 공통 컴포넌트
- ✅ `InfoTooltip.tsx` - 코드 설명 툴팁
- ✅ `CodeGuideAlert.tsx` - 코드 체계 안내

#### 환경측정기업 페이지
- ✅ `/org/draft-customers/page.tsx` - 임시 고객 관리
- ✅ `/org/draft-customers/[customerId]/stacks/page.tsx` - 임시 굴뚝 관리

#### 고객사 페이지
- ✅ `/customer/stacks/page.tsx` - 굴뚝 검토/확정
- ✅ `/customer/stacks/create/page.tsx` - 굴뚝 직접 등록

### 4. 네비게이션 메뉴
- ✅ "임시 고객 관리" 메뉴 추가 (ORG_ADMIN)
- ✅ "굴뚝 검토/확정" 메뉴 추가 (CUSTOMER_ADMIN)

## 🎯 핵심 기능 흐름

### 시나리오 1: 환경측정기업 주도 (일괄 등록)
```
1. admin@boaz.com 로그인 (ORG_ADMIN)
   ↓
2. [임시 고객 관리] 메뉴 → 신규 고객 등록 (DRAFT 상태)
   ↓
3. 고객 선택 → [굴뚝 관리] → 굴뚝 일괄 등록 (DRAFT 상태)
   - 현장 코드 (siteCode): S-001, S-002, ...
   - 내부 코드 (internalCode): 선택적
   ↓
4. [고객사 관리] → 초대 링크 발송
   ↓
5. 고객사가 초대 수락 → 자동 전환
   - Customer: DRAFT → CONNECTED
   - Stack: DRAFT → PENDING_REVIEW
   ↓
6. admin@customer.com 로그인 (CUSTOMER_ADMIN)
   ↓
7. [굴뚝 검토/확정] 메뉴 → 검토 대기 목록 확인
   ↓
8. 개별 수정 또는 일괄 승인
   - Stack: PENDING_REVIEW → CONFIRMED
   ↓
9. 완료! [굴뚝관리] 메뉴에서 확인 가능
```

### 시나리오 2: 고객사 직접 등록
```
1. admin@koreazinc.com 로그인 (CUSTOMER_ADMIN)
   ↓
2. [굴뚝 검토/확정] 메뉴 → "직접 등록" 버튼
   ↓
3. 굴뚝 정보 입력 (현장 코드 필수)
   - 즉시 CONFIRMED 상태로 생성
   ↓
4. 완료! [굴뚝관리] 메뉴에서 확인 가능
```

## 🔍 통합 확인 방법

### 1. 메뉴 확인
- [ ] ORG_ADMIN 로그인 시 "임시 고객 관리" 메뉴 표시
- [ ] CUSTOMER_ADMIN 로그인 시 "굴뚝 검토/확정" 메뉴 표시

### 2. 임시 고객 관리 페이지 (`/org/draft-customers`)
- [ ] 페이지 로딩 정상
- [ ] "신규 고객 등록" 버튼 동작
- [ ] 고객 목록 표시
- [ ] "굴뚝 관리" 버튼으로 이동

### 3. 임시 굴뚝 관리 페이지 (`/org/draft-customers/[customerId]/stacks`)
- [ ] 페이지 로딩 정상
- [ ] 코드 가이드 알림 표시
- [ ] "단건 등록" 폼 동작
- [ ] "일괄 등록" 폼 동작
- [ ] 굴뚝 목록 표시
- [ ] 수정/삭제 버튼 동작

### 4. 굴뚝 검토/확정 페이지 (`/customer/stacks`)
- [ ] 페이지 로딩 정상
- [ ] 검토 대기 목록 표시 (PENDING_REVIEW)
- [ ] "일괄 승인" 버튼 동작
- [ ] "일괄 거부" 버튼 동작
- [ ] 개별 수정 후 승인 동작
- [ ] "직접 등록" 버튼으로 이동

### 5. 굴뚝 직접 등록 페이지 (`/customer/stacks/create`)
- [ ] 페이지 로딩 정상
- [ ] 코드 가이드 알림 표시
- [ ] 폼 제출 동작
- [ ] 즉시 CONFIRMED 상태로 생성

### 6. 연결 승인 자동 전환
- [ ] 초대 수락 시 Customer: DRAFT → CONNECTED
- [ ] 초대 수락 시 Stack: DRAFT → PENDING_REVIEW
- [ ] StackUpdateLog 생성 확인

## 📊 데이터베이스 확인

### Customer 테이블
```sql
SELECT id, name, status, draftCreatedBy, draftCreatedAt 
FROM Customer 
WHERE status = 'DRAFT';
```

### Stack 테이블
```sql
SELECT id, name, siteCode, status, draftCreatedBy 
FROM Stack 
WHERE status IN ('DRAFT', 'PENDING_REVIEW', 'CONFIRMED');
```

### StackCode 테이블
```sql
SELECT sc.*, s.name as stackName, o.name as orgName
FROM StackCode sc
JOIN Stack s ON sc.stackId = s.id
JOIN Organization o ON sc.organizationId = o.id;
```

### StackUpdateLog 테이블
```sql
SELECT * FROM StackUpdateLog 
ORDER BY createdAt DESC 
LIMIT 10;
```

## 🚀 다음 단계

### 필수 작업
1. **서버 재시작**
   ```bash
   # 개발 서버 중지 (Ctrl+C)
   npx prisma generate
   npm run dev
   ```

2. **테스트 시나리오 실행**
   - 시나리오 1: 환경측정기업 주도 일괄 등록
   - 시나리오 2: 고객사 직접 등록

### 선택적 개선 사항
- [ ] 알림 시스템 UI (StackUpdateLog 표시)
- [ ] 코드 체계 도움말 페이지
- [ ] 굴뚝 상태 변경 이력 조회
- [ ] 내부 코드 일괄 설정 기능
- [ ] Excel 일괄 업로드 개선

## 📝 주요 변경 사항

### 이중 코드 시스템
- **현장 코드 (siteCode)**: 고객사가 관리하는 공식 코드 (필수)
- **내부 코드 (internalCode)**: 각 환경측정기업이 독립적으로 관리 (선택)
- 시스템이 자동으로 매칭하여 관리

### DRAFT 시스템
- 환경측정기업이 연결 전에 고객/굴뚝 정보를 미리 등록
- 연결 승인 시 자동으로 PENDING_REVIEW로 전환
- 고객사가 검토 후 승인/거부/수정

### 상태 전환 흐름
```
DRAFT (임시 등록)
  ↓ 연결 승인
PENDING_REVIEW (검토 대기)
  ↓ 고객사 승인
CONFIRMED (확정 완료)
```

## ✅ 통합 완료 체크리스트

- [x] 데이터베이스 스키마 수정
- [x] 백엔드 API 구현 (12개)
- [x] 프론트엔드 컴포넌트 구현 (6개)
- [x] 네비게이션 메뉴 통합
- [ ] 서버 재시작 및 Prisma 생성
- [ ] 테스트 시나리오 실행
- [ ] 데이터베이스 확인

---

**작성일**: 2025-10-31  
**상태**: 통합 완료, 테스트 대기
