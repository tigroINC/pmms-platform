# 멀티테넌트 권한 시스템 배포 가이드

## 📋 목차
1. [사전 준비](#사전-준비)
2. [데이터베이스 마이그레이션](#데이터베이스-마이그레이션)
3. [애플리케이션 배포](#애플리케이션-배포)
4. [초기 설정](#초기-설정)
5. [검증](#검증)
6. [롤백 절차](#롤백-절차)

---

## 사전 준비

### 1. 환경 확인
```bash
# Node.js 버전 확인 (v18 이상 권장)
node --version

# npm 버전 확인
npm --version

# PostgreSQL 버전 확인
psql --version
```

### 2. 데이터베이스 백업
```bash
# 프로덕션 데이터베이스 백업
pg_dump -U username -d database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# 백업 파일 확인
ls -lh backup_*.sql
```

### 3. 의존성 설치
```bash
cd frontend
npm install
```

---

## 데이터베이스 마이그레이션

### 1. Prisma 클라이언트 생성
```bash
npm run prisma:generate
```

### 2. 마이그레이션 적용
```bash
# 개발 환경
npx prisma migrate dev

# 프로덕션 환경
npx prisma migrate deploy
```

### 3. 마이그레이션 확인
```bash
# 마이그레이션 상태 확인
npx prisma migrate status

# 데이터베이스 스키마 확인
npx prisma db pull
```

### 4. Seed 데이터 생성
```bash
# 역할 템플릿 및 권한 생성
npm run seed:roles
```

예상 출력:
```
🌱 Seeding role templates...
✅ Created/Updated role template: 환경측정업체 관리자
   📋 Added 17 permissions
✅ Created/Updated role template: 환경측정업체 실무자
   📋 Added 6 permissions
✅ Created/Updated role template: 환경측정업체 조회전용
   📋 Added 4 permissions
✅ Created/Updated role template: 고객사 그룹관리자
   📋 Added 8 permissions
✅ Created/Updated role template: 고객사 사업장관리자
   📋 Added 8 permissions
✅ Created/Updated role template: 고객사 일반사용자
   📋 Added 3 permissions

✨ Role templates seeding completed!
```

---

## 애플리케이션 배포

### 1. 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# 필수 환경 변수 설정
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://yourdomain.com"
```

### 2. 빌드
```bash
# Next.js 애플리케이션 빌드
npm run build
```

### 3. 프로덕션 서버 시작
```bash
# PM2 사용 (권장)
pm2 start npm --name "boaz-frontend" -- start
pm2 save
pm2 startup

# 또는 직접 실행
npm start
```

### 4. 서버 상태 확인
```bash
# PM2 사용 시
pm2 status
pm2 logs boaz-frontend

# 직접 실행 시
curl http://localhost:3000/api/health
```

---

## 초기 설정

### 1. 시스템 관리자 확인
```sql
-- SUPER_ADMIN 계정 확인
SELECT id, email, name, role 
FROM "User" 
WHERE role = 'SUPER_ADMIN';
```

### 2. 역할 템플릿 확인
```sql
-- 생성된 역할 템플릿 확인
SELECT 
  rt.id,
  rt.code,
  rt.name,
  rt.category,
  COUNT(rtp.id) as permission_count
FROM "RoleTemplate" rt
LEFT JOIN "RoleTemplatePermission" rtp ON rt.id = rtp."templateId"
GROUP BY rt.id, rt.code, rt.name, rt.category
ORDER BY rt.category, rt.name;
```

예상 결과:
```
| id   | code                    | name                      | category     | permission_count |
|------|-------------------------|---------------------------|--------------|------------------|
| ...  | org_admin               | 환경측정업체 관리자        | ORGANIZATION | 17               |
| ...  | org_operator            | 환경측정업체 실무자        | ORGANIZATION | 6                |
| ...  | org_viewer              | 환경측정업체 조회전용      | ORGANIZATION | 4                |
| ...  | customer_group_admin    | 고객사 그룹관리자          | CUSTOMER     | 8                |
| ...  | customer_site_admin     | 고객사 사업장관리자        | CUSTOMER     | 8                |
| ...  | customer_user           | 고객사 일반사용자          | CUSTOMER     | 3                |
```

### 3. 기존 데이터 확인
```sql
-- 고객사 isPublic 필드 확인
SELECT 
  "isPublic",
  COUNT(*) as count
FROM "Customer"
GROUP BY "isPublic";

-- 사용자 accessScope 필드 확인
SELECT 
  "accessScope",
  COUNT(*) as count
FROM "User"
GROUP BY "accessScope";
```

---

## 검증

### 1. 웹 UI 접근 테스트

#### 시스템 관리자 (SUPER_ADMIN)
```
1. https://yourdomain.com/login 접속
2. SUPER_ADMIN 계정으로 로그인
3. 네비게이션에서 "역할 관리" 메뉴 확인
4. 네비게이션에서 "권한 관리" 메뉴 확인
5. /org/settings/roles 접속 가능 확인
6. /org/settings/users 접속 가능 확인
```

#### 조직 관리자 (ORG_ADMIN)
```
1. ORG_ADMIN 계정으로 로그인
2. "역할 관리" 메뉴 표시 확인
3. "권한 관리" 메뉴 표시 확인
4. 커스텀 역할 생성 가능 확인
5. 사용자 권한 관리 가능 확인
```

#### 일반 사용자 (OPERATOR)
```
1. OPERATOR 계정으로 로그인
2. "역할 관리" 메뉴 미표시 확인
3. "권한 관리" 메뉴 미표시 확인
4. /org/settings/roles 접근 시 403 에러 확인
```

### 2. API 엔드포인트 테스트

```bash
# 역할 템플릿 조회
curl -X GET https://yourdomain.com/api/role-templates \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# 커스텀 역할 목록 조회
curl -X GET https://yourdomain.com/api/custom-roles \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# 사용자 권한 조회
curl -X GET https://yourdomain.com/api/users/USER_ID/permissions \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

### 3. 권한 체크 테스트

```bash
# 권한 있는 사용자
curl -X GET https://yourdomain.com/api/customers \
  -H "Cookie: next-auth.session-token=ORG_ADMIN_TOKEN"
# 예상: 200 OK

# 권한 없는 사용자
curl -X DELETE https://yourdomain.com/api/customers/CUSTOMER_ID \
  -H "Cookie: next-auth.session-token=OPERATOR_TOKEN"
# 예상: 403 Forbidden
```

### 4. 데이터 무결성 확인

```sql
-- 고아 레코드 확인 (외래 키 무결성)
SELECT COUNT(*) FROM "CustomRole" 
WHERE "organizationId" NOT IN (SELECT id FROM "Organization");

SELECT COUNT(*) FROM "CustomRolePermission" 
WHERE "roleId" NOT IN (SELECT id FROM "CustomRole");

SELECT COUNT(*) FROM "UserPermission" 
WHERE "userId" NOT IN (SELECT id FROM "User");

-- 모두 0이어야 함
```

---

## 롤백 절차

### 긴급 롤백이 필요한 경우

#### 1. 애플리케이션 롤백
```bash
# PM2 사용 시
pm2 stop boaz-frontend

# 이전 버전으로 체크아웃
git checkout PREVIOUS_COMMIT_HASH

# 재빌드 및 재시작
npm run build
pm2 restart boaz-frontend
```

#### 2. 데이터베이스 롤백
```bash
# 마이그레이션 되돌리기
npx prisma migrate resolve --rolled-back 20251030060734_add_customer_groups_and_permissions

# 백업 복원
psql -U username -d database_name < backup_YYYYMMDD_HHMMSS.sql
```

#### 3. 검증
```bash
# 애플리케이션 상태 확인
curl https://yourdomain.com/api/health

# 데이터베이스 연결 확인
npx prisma db pull
```

---

## 모니터링

### 1. 로그 확인
```bash
# PM2 로그
pm2 logs boaz-frontend --lines 100

# 에러 로그만
pm2 logs boaz-frontend --err

# 실시간 로그
pm2 logs boaz-frontend --raw
```

### 2. 성능 모니터링
```bash
# PM2 모니터링
pm2 monit

# 메모리 사용량
pm2 list
```

### 3. 데이터베이스 모니터링
```sql
-- 활성 연결 수
SELECT count(*) FROM pg_stat_activity;

-- 느린 쿼리 확인
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 테이블 크기 확인
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 문제 해결

### 일반적인 문제

#### 1. 마이그레이션 실패
```bash
# 마이그레이션 상태 확인
npx prisma migrate status

# 마이그레이션 리셋 (개발 환경만)
npx prisma migrate reset

# 수동 마이그레이션 적용
npx prisma db execute --file prisma/migrations/MIGRATION_NAME/migration.sql
```

#### 2. Seed 데이터 중복
```sql
-- 기존 역할 템플릿 삭제
DELETE FROM "RoleTemplatePermission";
DELETE FROM "RoleTemplate";

-- Seed 재실행
npm run seed:roles
```

#### 3. 권한 체크 오류
```bash
# Prisma 클라이언트 재생성
npm run prisma:generate

# 캐시 클리어
rm -rf .next
npm run build
```

#### 4. 세션 문제
```bash
# 세션 스토리지 클리어 (클라이언트)
localStorage.clear()
sessionStorage.clear()

# 쿠키 삭제
# 브라우저 개발자 도구 > Application > Cookies > 삭제
```

---

## 보안 체크리스트

- [ ] DATABASE_URL에 강력한 비밀번호 사용
- [ ] NEXTAUTH_SECRET 랜덤 문자열 생성 (최소 32자)
- [ ] HTTPS 사용 (프로덕션)
- [ ] CORS 설정 확인
- [ ] Rate Limiting 설정
- [ ] SQL Injection 방지 (Prisma ORM 사용)
- [ ] XSS 방지 (입력값 검증)
- [ ] CSRF 토큰 검증
- [ ] 민감한 정보 로그 제외
- [ ] 정기적인 보안 업데이트

---

## 성능 최적화

### 1. 데이터베이스 인덱스
```sql
-- 자주 조회되는 필드에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"("role");
CREATE INDEX IF NOT EXISTS idx_user_custom_role ON "User"("customRoleId");
CREATE INDEX IF NOT EXISTS idx_custom_role_org ON "CustomRole"("organizationId");
CREATE INDEX IF NOT EXISTS idx_customer_public ON "Customer"("isPublic");
```

### 2. 캐싱 전략
```javascript
// Redis 캐싱 예시 (향후 구현 권장)
const cacheKey = `user:${userId}:permissions`;
const cachedPermissions = await redis.get(cacheKey);

if (cachedPermissions) {
  return JSON.parse(cachedPermissions);
}

const permissions = await fetchPermissions(userId);
await redis.set(cacheKey, JSON.stringify(permissions), 'EX', 3600); // 1시간
```

### 3. 쿼리 최적화
```typescript
// N+1 문제 방지
const users = await prisma.user.findMany({
  include: {
    customRole: {
      include: {
        permissions: true,
      },
    },
    permissions: true,
  },
});
```

---

## 지원 및 문의

문제가 발생하거나 도움이 필요한 경우:

1. **문서 확인**: `PHASE_8_TEST_GUIDE.md` 참조
2. **로그 확인**: PM2 로그 및 데이터베이스 로그 확인
3. **이슈 등록**: GitHub Issues에 상세한 정보와 함께 등록
4. **긴급 지원**: [연락처 정보]

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2025-10-30 | 1.0.0 | 초기 배포 가이드 작성 |
