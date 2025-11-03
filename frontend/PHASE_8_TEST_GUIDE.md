# Phase 8: 테스트 및 마이그레이션 가이드

## 1. 데이터베이스 마이그레이션

### 1.1 Prisma 클라이언트 재생성
```bash
cd frontend
npx prisma generate
```

### 1.2 마이그레이션 적용
```bash
npx prisma migrate deploy
```

### 1.3 Seed 데이터 생성
```bash
npx tsx prisma/seed-roles.ts
```

예상 결과:
- 6개 역할 템플릿 생성
- 총 46개 권한 매핑

## 2. 기능 테스트 체크리스트

### 2.1 역할 관리 (ORG_ADMIN 권한 필요)

#### 역할 템플릿 조회
- [ ] `/org/settings/roles` 접속
- [ ] "역할 템플릿" 탭 클릭
- [ ] 6개 템플릿 표시 확인
  - 환경측정업체 관리자 (17권한)
  - 환경측정업체 실무자 (6권한)
  - 환경측정업체 조회전용 (4권한)
  - 고객사 그룹관리자 (8권한)
  - 고객사 사업장관리자 (8권한)
  - 고객사 일반사용자 (3권한)

#### 커스텀 역할 생성
- [ ] "커스텀 역할" 탭에서 "+ 역할 생성" 클릭
- [ ] 역할 이름 입력 (예: "현장 책임자")
- [ ] 설명 입력 (선택)
- [ ] 기반 템플릿 선택 (선택)
- [ ] 권한 카테고리별 선택
  - 고객사 관리
  - 굴뚝 관리
  - 측정 데이터
  - 사용자 관리
  - 보고서
  - 설정
- [ ] "전체 선택/해제" 버튼 동작 확인
- [ ] "역할 생성" 클릭
- [ ] 성공 메시지 확인
- [ ] 목록에 새 역할 표시 확인

#### 커스텀 역할 수정
- [ ] 생성한 역할의 "수정" 버튼 클릭
- [ ] 역할 이름 변경
- [ ] 권한 추가/제거
- [ ] "변경사항 저장" 클릭
- [ ] 성공 메시지 확인
- [ ] 변경사항 반영 확인

#### 커스텀 역할 삭제
- [ ] 사용자가 없는 역할의 "삭제" 버튼 클릭
- [ ] 확인 대화상자 표시
- [ ] 삭제 확인
- [ ] 목록에서 제거 확인
- [ ] 사용 중인 역할 삭제 시도 시 오류 메시지 확인

### 2.2 사용자 권한 관리 (ORG_ADMIN 권한 필요)

#### 사용자 목록 조회
- [ ] `/org/settings/users` 접속
- [ ] 사용자 목록 표시 확인
- [ ] 각 사용자의 정보 확인
  - 이름, 이메일
  - 시스템 역할 (배지)
  - 커스텀 역할 (드롭다운)
  - 접근 범위 (배지)
  - 활성 상태

#### 커스텀 역할 할당
- [ ] 사용자의 커스텀 역할 드롭다운 클릭
- [ ] 생성한 커스텀 역할 선택
- [ ] 자동 저장 확인
- [ ] 성공 메시지 확인
- [ ] "기본 역할 사용" 선택 시 역할 제거 확인

#### 개별 권한 설정
- [ ] 사용자의 "개별 권한 설정" 버튼 클릭
- [ ] 모달 표시 확인
- [ ] 권한 카테고리별 표시 확인
- [ ] 권한 체크박스 선택/해제
- [ ] "저장" 클릭
- [ ] 성공 메시지 확인
- [ ] SUPER_ADMIN은 권한 설정 불가 확인

### 2.3 고객사 관리 (기존 기능 통합 확인)

#### 내부 고객사 등록
- [ ] `/org/customers` 접속
- [ ] "내부 고객사" 탭 클릭
- [ ] "+ 고객사 등록" 클릭
- [ ] 고객사 정보 입력
- [ ] "관리자 계정 생성" 체크박스 확인
- [ ] 등록 완료
- [ ] 내부 고객사 목록에 표시 확인
- [ ] isPublic: false 확인

#### 초대 링크 생성
- [ ] "공개 고객사" 탭 클릭
- [ ] 고객사 선택
- [ ] "초대 링크 생성" 클릭
- [ ] 초대 링크 복사
- [ ] 7일 만료 시간 확인
- [ ] isPublic: true로 변경 확인

#### 초대 수락 (고객사 관점)
- [ ] 초대 링크로 접속
- [ ] 고객사 정보 표시 확인
- [ ] 회원가입 진행
- [ ] 자동 연결 (APPROVED) 확인
- [ ] 고객사 대시보드 접근 확인

### 2.4 권한 체크 미들웨어 테스트

#### 권한 우선순위 확인
1. **개별 권한 > 커스텀 역할 > 역할 템플릿 > 시스템 역할**
   - [ ] 사용자에게 개별 권한 부여
   - [ ] 해당 기능 접근 가능 확인
   - [ ] 개별 권한 제거
   - [ ] 커스텀 역할의 권한으로 접근 확인

#### 접근 범위 테스트
- [ ] **SYSTEM**: SUPER_ADMIN만 모든 데이터 접근
- [ ] **ORGANIZATION**: ORG_ADMIN은 자사 데이터만
- [ ] **GROUP**: CUSTOMER_GROUP_ADMIN은 그룹 데이터만
- [ ] **SITE**: CUSTOMER_SITE_ADMIN은 사업장 데이터만
- [ ] **ASSIGNED**: OPERATOR는 담당 고객사만
- [ ] **SELF**: 본인 데이터만

### 2.5 API 엔드포인트 테스트

#### 역할 템플릿 API
```bash
# 목록 조회
curl -X GET http://localhost:3000/api/role-templates \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

#### 커스텀 역할 API
```bash
# 생성
curl -X POST http://localhost:3000/api/custom-roles \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "name": "테스트 역할",
    "description": "테스트용",
    "templateId": "TEMPLATE_ID",
    "permissions": [
      {"permissionCode": "customer.view", "granted": true},
      {"permissionCode": "customer.create", "granted": true}
    ]
  }'

# 목록 조회
curl -X GET http://localhost:3000/api/custom-roles \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# 단일 조회
curl -X GET http://localhost:3000/api/custom-roles/ROLE_ID \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# 수정
curl -X PATCH http://localhost:3000/api/custom-roles/ROLE_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "name": "수정된 역할",
    "permissions": [...]
  }'

# 삭제
curl -X DELETE http://localhost:3000/api/custom-roles/ROLE_ID \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

#### 사용자 권한 API
```bash
# 사용자 권한 조회
curl -X GET http://localhost:3000/api/users/USER_ID/permissions \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# 사용자 권한 수정
curl -X PATCH http://localhost:3000/api/users/USER_ID/permissions \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "permissions": [
      {"permissionCode": "customer.view", "granted": true},
      {"permissionCode": "customer.delete", "granted": false}
    ]
  }'

# 사용자 역할 변경
curl -X PATCH http://localhost:3000/api/users/USER_ID/role \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "customRoleId": "ROLE_ID"
  }'
```

#### 고객사 초대 API
```bash
# 초대 링크 생성
curl -X POST http://localhost:3000/api/customer-invitations \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "customerId": "CUSTOMER_ID"
  }'

# 초대 목록 조회
curl -X GET http://localhost:3000/api/customer-invitations \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# 초대 정보 조회
curl -X GET http://localhost:3000/api/customer-invitations/TOKEN

# 초대 수락
curl -X POST http://localhost:3000/api/customer-invitations/TOKEN/accept \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID"
  }'
```

## 3. 에러 케이스 테스트

### 3.1 권한 부족
- [ ] 권한 없는 사용자가 역할 관리 접근 시 403 에러
- [ ] 권한 없는 사용자가 권한 관리 접근 시 403 에러
- [ ] OPERATOR가 고객사 삭제 시도 시 권한 오류

### 3.2 유효성 검증
- [ ] 역할 이름 없이 생성 시도 시 오류
- [ ] 권한 없이 역할 생성 시도 시 오류
- [ ] 사용 중인 역할 삭제 시도 시 오류
- [ ] 존재하지 않는 역할 수정 시도 시 404 에러
- [ ] SUPER_ADMIN 역할 변경 시도 시 오류

### 3.3 초대 링크
- [ ] 만료된 초대 링크 접근 시 오류
- [ ] 이미 사용된 초대 링크 재사용 시 오류
- [ ] 잘못된 토큰으로 접근 시 404 에러

## 4. 성능 테스트

### 4.1 권한 체크 성능
- [ ] 100명 사용자 동시 권한 체크
- [ ] 복잡한 권한 구조에서 응답 시간 측정
- [ ] 데이터베이스 쿼리 최적화 확인

### 4.2 목록 조회 성능
- [ ] 100개 이상 커스텀 역할 목록 조회
- [ ] 1000명 이상 사용자 목록 조회
- [ ] 페이지네이션 동작 확인

## 5. 보안 테스트

### 5.1 인증/인가
- [ ] 비로그인 사용자 접근 차단 확인
- [ ] 세션 만료 시 리다이렉트 확인
- [ ] CSRF 토큰 검증 확인

### 5.2 데이터 격리
- [ ] 조직 A의 관리자가 조직 B의 데이터 접근 불가 확인
- [ ] 고객사 A의 사용자가 고객사 B의 데이터 접근 불가 확인
- [ ] SUPER_ADMIN만 전체 데이터 접근 가능 확인

### 5.3 SQL Injection 방지
- [ ] Prisma ORM 사용으로 자동 방지 확인
- [ ] 사용자 입력값 검증 확인

## 6. 브라우저 호환성 테스트

- [ ] Chrome (최신 버전)
- [ ] Firefox (최신 버전)
- [ ] Safari (최신 버전)
- [ ] Edge (최신 버전)

## 7. 모바일 반응형 테스트

- [ ] 모바일 화면에서 역할 관리 페이지
- [ ] 모바일 화면에서 권한 관리 페이지
- [ ] 모바일 화면에서 모달 표시
- [ ] 터치 인터랙션 확인

## 8. 데이터 마이그레이션 검증

### 8.1 기존 데이터 확인
```sql
-- 기존 고객사 수
SELECT COUNT(*) FROM "Customer";

-- 기존 사용자 수
SELECT COUNT(*) FROM "User";

-- 기존 측정 데이터 수
SELECT COUNT(*) FROM "Measurement";
```

### 8.2 마이그레이션 후 확인
```sql
-- 역할 템플릿 생성 확인
SELECT * FROM "RoleTemplate";

-- 템플릿 권한 매핑 확인
SELECT rt.name, COUNT(rtp.id) as permission_count
FROM "RoleTemplate" rt
LEFT JOIN "RoleTemplatePermission" rtp ON rt.id = rtp."templateId"
GROUP BY rt.id, rt.name;

-- 고객사 isPublic 필드 확인
SELECT "isPublic", COUNT(*) 
FROM "Customer" 
GROUP BY "isPublic";

-- 사용자 accessScope 필드 확인
SELECT "accessScope", COUNT(*) 
FROM "User" 
GROUP BY "accessScope";
```

## 9. 롤백 계획

만약 문제가 발생할 경우:

### 9.1 데이터베이스 롤백
```bash
# 마이그레이션 되돌리기
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

### 9.2 코드 롤백
```bash
# Git으로 이전 커밋으로 되돌리기
git revert HEAD
git push
```

### 9.3 백업 복원
```bash
# 데이터베이스 백업 복원
psql -U username -d database_name < backup.sql
```

## 10. 배포 전 최종 체크리스트

- [ ] 모든 마이그레이션 적용 완료
- [ ] Seed 데이터 생성 완료
- [ ] 모든 기능 테스트 통과
- [ ] 에러 케이스 테스트 통과
- [ ] 성능 테스트 통과
- [ ] 보안 테스트 통과
- [ ] 브라우저 호환성 확인
- [ ] 모바일 반응형 확인
- [ ] 문서 업데이트 완료
- [ ] 팀원 리뷰 완료

## 11. 배포 후 모니터링

### 11.1 로그 확인
- [ ] 애플리케이션 로그에서 에러 확인
- [ ] 데이터베이스 쿼리 성능 모니터링
- [ ] API 응답 시간 모니터링

### 11.2 사용자 피드백
- [ ] 초기 사용자 피드백 수집
- [ ] 버그 리포트 모니터링
- [ ] 사용성 개선 사항 수집

## 12. 알려진 이슈 및 제한사항

1. **권한 캐싱**: 현재 권한은 매 요청마다 체크됩니다. 성능 개선을 위해 Redis 캐싱 고려 필요
2. **역할 삭제**: 사용 중인 역할은 삭제할 수 없습니다. 사용자를 먼저 다른 역할로 변경해야 합니다.
3. **초대 링크**: 7일 후 자동 만료되며, 재생성이 필요합니다.
4. **SUPER_ADMIN**: 시스템 관리자의 권한은 변경할 수 없습니다.

## 13. 다음 단계 권장사항

1. **권한 캐싱 구현**: Redis를 사용한 권한 캐싱으로 성능 개선
2. **감사 로그 강화**: 모든 권한 변경 이력을 상세히 기록
3. **역할 템플릿 관리 UI**: 시스템 관리자가 템플릿을 수정할 수 있는 UI
4. **권한 분석 대시보드**: 조직별 권한 사용 현황 시각화
5. **알림 시스템**: 권한 변경 시 사용자에게 이메일 알림
