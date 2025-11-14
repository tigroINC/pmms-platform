# 🚀 보아스 PMMS - PostgreSQL 전환 가이드

## 📊 전환 개요

**Before (현재):**
```
Frontend → PostgreSQL
Backend  → SQLite (dev.db) + Prophet 손상
```

**After (목표):**
```
Frontend → PostgreSQL ← Backend
Docker 환경에서 Prophet 정상 작동
```

---

## ✅ Phase 1: 백업 및 파일 교체 (10분)

### 1-1. 기존 파일 백업

```powershell
cd C:\Users\User\boaz

# 백업 폴더 생성
mkdir backup_postgresql_$(Get-Date -Format "yyyyMMdd_HHmmss")

# 백업 (중요!)
Copy-Item backend/main.py backup_postgresql_*/
Copy-Item backend/requirements.txt backup_postgresql_*/
Copy-Item docker-compose.yml backup_postgresql_*/
```

### 1-2. 다운로드한 파일 교체

Claude가 생성한 4개 파일을 다운로드:

1. `main_postgresql.py` → `backend/main.py` (덮어쓰기)
2. `requirements_postgresql.txt` → `backend/requirements.txt` (덮어쓰기)
3. `docker-compose-full.yml` → `docker-compose.yml` (덮어쓰기)
4. `.env-postgresql` → `.env` (새로 생성)

```powershell
# 다운로드 폴더에서 실행 (예시)
Copy-Item Downloads/main_postgresql.py backend/main.py -Force
Copy-Item Downloads/requirements_postgresql.txt backend/requirements.txt -Force
Copy-Item Downloads/docker-compose-full.yml docker-compose.yml -Force
Copy-Item Downloads/.env-postgresql .env -Force
```

### 1-3. 환경변수 확인

```powershell
# .env 파일 내용 확인
Get-Content .env

# DATABASE_URL이 PostgreSQL인지 확인
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/boaz"
```

---

## ✅ Phase 2: 기존 컨테이너 정리 (5분)

### 2-1. 실행 중인 PostgreSQL 컨테이너 확인

```powershell
docker ps
# pmms-local-db (postgres:16) 실행 중 확인
```

### 2-2. 기존 PostgreSQL 데이터 확인 (중요!)

```powershell
# PostgreSQL에 접속하여 데이터 확인
docker exec -it pmms-local-db psql -U postgres -d boaz

# SQL 실행:
SELECT COUNT(*) FROM "Measurement";
SELECT COUNT(*) FROM "Customer";
\q  # 종료
```

**⚠️ 데이터가 있으면 백업 필수!**

```powershell
# PostgreSQL 덤프 (백업)
docker exec -it pmms-local-db pg_dump -U postgres boaz > backup_boaz.sql

# 확인
dir backup_boaz.sql
```

### 2-3. 기존 컨테이너 중지 (선택사항)

```powershell
# 새 docker-compose로 전환할 예정이므로
# 기존 컨테이너는 유지하거나 중지 가능

# 중지하려면:
docker stop pmms-local-db
```

---

## ✅ Phase 3: Docker 빌드 및 실행 (20-30분)

### 3-1. Docker 이미지 빌드

```powershell
cd C:\Users\User\boaz

# ⚠️ 첫 빌드는 5-10분 소요 (Prophet, Playwright 설치)
docker-compose build

# 빌드 과정 확인:
# [+] Building ...
#  => [deps] RUN apk add python3 ...
#  => [deps] RUN playwright install chromium  ← 중요!
#  => [builder] RUN npm run build
#  => Successfully built
```

**예상 빌드 시간:**
- Prophet 설치: 2-3분
- Playwright Chromium: 1-2분
- Next.js 빌드: 2-3분
- **총: 5-10분**

### 3-2. 컨테이너 실행

```powershell
# 백그라운드 실행
docker-compose up -d

# 로그 모니터링
docker-compose logs -f

# 예상 로그:
# boaz-postgres | database system is ready to accept connections
# boaz-app      | 🚀 보아스 PMMS 시작 중...
# boaz-app      | 🗄️ Prisma 데이터베이스 초기화 중...
# boaz-app      | 🐍 백엔드 FastAPI 서버 시작 중...
# boaz-app      | ⚛️ 프론트엔드 Next.js 서버 시작 중...
# boaz-app      | ✅ 모든 서비스 준비 완료!
```

### 3-3. 서비스 상태 확인

```powershell
# 실행 중인 컨테이너 확인
docker-compose ps

# 예상 결과:
# NAME          STATE    PORTS
# boaz-postgres Up       0.0.0.0:5432->5432/tcp
# boaz-app      Up       0.0.0.0:3000->3000/tcp, 0.0.0.0:8000->8000/tcp
```

---

## ✅ Phase 4: 데이터 마이그레이션 (10분)

### 4-1. 기존 데이터가 있는 경우

```powershell
# 백업한 SQL 파일을 새 PostgreSQL에 복원
docker exec -i boaz-postgres psql -U postgres boaz < backup_boaz.sql

# 또는 기존 pmms-local-db에서 직접 덤프 & 복원:
docker exec pmms-local-db pg_dump -U postgres boaz | \
  docker exec -i boaz-postgres psql -U postgres boaz
```

### 4-2. 데이터 확인

```powershell
# 새 PostgreSQL 접속
docker exec -it boaz-postgres psql -U postgres -d boaz

# 데이터 확인
SELECT COUNT(*) FROM "Measurement";
SELECT COUNT(*) FROM "Customer";
\q
```

---

## ✅ Phase 5: 기능 테스트 (15분)

### 5-1. 기본 접속 테스트

```
1. 프론트엔드: http://localhost:3000
   ✅ 로그인 페이지 표시

2. 백엔드 헬스체크: http://localhost:8000/health
   ✅ {"status":"healthy","database":"connected"}

3. 백엔드 API 문서: http://localhost:8000/docs
   ✅ Swagger UI 표시
```

### 5-2. Prophet 설치 확인 (중요!)

```powershell
# 컨테이너 내부 진입
docker exec -it boaz-app sh

# Prophet 버전 확인
python3 -c "import prophet; print('Prophet:', prophet.__version__)"
# 예상: Prophet: 1.1.5

# Playwright 확인
python3 -c "import playwright; print('Playwright OK')"

# 백엔드 API 테스트 (컨테이너 내부)
curl http://localhost:8000/health

exit
```

### 5-3. AutoML 예측 테스트

```
1. http://localhost:3000 로그인
2. 대시보드 이동
3. 고객사 선택: 고려아연
4. 굴뚝 선택: #A2020007
5. 항목 선택: 먼지 (EA-I-0001)
6. 🤖 AutoML 예측 버튼 클릭
7. ⏳ 10-30초 대기
8. ✅ 예측 결과 확인 (녹색 점선)
```

**성공 기준:**
- ✅ 에러 없이 예측 완료
- ✅ 예측 그래프 표시
- ✅ 신뢰구간 표시

### 5-4. 인사이트 보고서 테스트

```
1. 인사이트 보고서 생성 버튼 클릭
2. ⏳ 15-45초 대기
3. ✅ PDF 다운로드 확인
```

### 5-5. 이상치 탐지 테스트

```
1. 측정 입력 → 현장임시입력
2. 고객사/굴뚝 선택
3. 이상한 값 입력 (예: 999999)
4. 임시저장 클릭
5. ✅ 워닝 모달 표시 확인
```

---

## ✅ Phase 6: Railway 배포 준비 (10분)

### 6-1. Git 커밋

```powershell
cd C:\Users\User\boaz

git add .
git commit -m "feat: PostgreSQL 통합 및 Docker 환경 구축

- backend/main.py: aiosqlite → asyncpg 전환
- 프론트엔드/백엔드 DB 통합 (PostgreSQL)
- Docker 환경에서 Prophet 정상 작동 확인
- 로컬 개발 환경 Docker로 통일

✅ AutoML 예측 정상
✅ 인사이트 보고서 정상
✅ 이상치 탐지 정상"
```

### 6-2. Railway 환경변수 설정

Railway Dashboard → Variables:

```env
# Railway는 DATABASE_URL 자동 제공 (PostgreSQL 플러그인)
# 그 외 추가 필요:

NEXTAUTH_URL=https://your-app.railway.app
NEXTAUTH_SECRET=[랜덤 32자 생성]
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
NEXT_PUBLIC_AUTOML_API_URL=http://localhost:8000
NODE_ENV=production
```

**NEXTAUTH_SECRET 생성:**
```powershell
# PowerShell에서
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 6-3. Railway 배포

```powershell
git push origin main

# Railway 자동 배포 시작
# Dashboard에서 로그 모니터링
# 예상 시간: 10-15분
```

---

## 🔍 트러블슈팅

### ❌ 빌드 실패: "Playwright installation failed"

**원인**: Chromium 설치 실패

**해결**:
```dockerfile
# Dockerfile 확인
RUN playwright install chromium && \
    playwright install-deps chromium
```

### ❌ 런타임 에러: "Database connection failed"

**원인**: PostgreSQL 연결 실패

**해결**:
```powershell
# docker-compose.yml에서 depends_on 확인
depends_on:
  postgres:
    condition: service_healthy

# 또는 수동으로 PostgreSQL 먼저 시작
docker-compose up -d postgres
# 10초 대기
docker-compose up -d boaz-app
```

### ❌ AutoML 예측 실패: "No module named 'prophet'"

**원인**: Prophet 미설치

**해결**:
```powershell
# 컨테이너 재빌드
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### ❌ 데이터 없음: "학습 데이터가 부족합니다"

**원인**: PostgreSQL 데이터 마이그레이션 미완료

**해결**:
```powershell
# 기존 데이터 백업 & 복원 (Phase 4)
docker exec pmms-local-db pg_dump -U postgres boaz | \
  docker exec -i boaz-postgres psql -U postgres boaz
```

---

## ✅ 최종 체크리스트

### 로컬 Docker 환경
- [ ] 백업 완료
- [ ] 파일 교체 완료
- [ ] Docker 빌드 성공
- [ ] PostgreSQL 컨테이너 실행
- [ ] 애플리케이션 컨테이너 실행
- [ ] 프론트엔드 접속 (http://localhost:3000)
- [ ] 백엔드 헬스체크 (http://localhost:8000/health)
- [ ] Prophet 설치 확인
- [ ] AutoML 예측 테스트 성공
- [ ] 인사이트 보고서 PDF 생성 성공
- [ ] 이상치 탐지 테스트 성공

### Railway 배포
- [ ] Git 커밋 & 푸시
- [ ] Railway 환경변수 설정
- [ ] 빌드 성공 (10-15분)
- [ ] 배포 성공
- [ ] 프론트엔드 접속 (https://your-app.railway.app)
- [ ] 백엔드 헬스체크 API
- [ ] AutoML 기능 작동
- [ ] 인사이트 보고서 기능 작동

---

## 🎉 완료 후 예상 결과

### 로컬 개발 환경:
```
✅ PostgreSQL 통합 (단일 DB)
✅ Prophet AutoML 정상 작동
✅ Docker로 일관된 개발 환경
✅ docker-compose up 한 줄로 전체 실행
```

### 프로덕션 배포:
```
✅ Railway PostgreSQL 연동
✅ AutoML 예측 서비스
✅ 인사이트 보고서 생성
✅ 이상치 실시간 탐지
✅ 월 예상 비용: $20
```

---

**작성일**: 2025-11-12
**버전**: 2.0.0 (PostgreSQL 통합)
**상태**: ✅ 실행 준비 완료
