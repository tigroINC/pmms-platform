# 대화 백업 - 2025-11-15

## 📋 목차
1. [초기 문제 상황](#초기-문제-상황)
2. [시도한 해결 방법들](#시도한-해결-방법들)
3. [근본 원인 분석](#근본-원인-분석)
4. [최종 해결책](#최종-해결책)
5. [주요 명령어](#주요-명령어)
6. [교훈](#교훈)

---

## 초기 문제 상황

### 에러 내용
```
2117-4b57cbcc8bb4437b.js:1 ReferenceError: PmmsTrendChart is not defined
    at p (page-a2d62aa0597b38d0.js:1:29354)
    at rE (fd9d1056-936a24b2e33fae79.js:1:40342)
    ...
```

### 배경
- Boaz → PMMS 리팩토링 작업 중
- `BoazTrendChart` → `PmmsTrendChart` 컴포넌트명 변경
- Docker 환경에서 개발 및 테스트 진행

---

## 시도한 해결 방법들

### 1차 시도: 컴포넌트 파일 수정
```tsx
// frontend/src/components/charts/PmmsTrendChart.tsx
export default function PmmsTrendChart({  // ✅ 수정 완료
  labels,
  data,
  ...
})
```

**결과**: 에러 지속

### 2차 시도: Import 경로 수정
```tsx
// frontend/src/app/dashboard/page.tsx
import PmmsTrendChart from '@/components/charts/PmmsTrendChart';  // ✅ 수정 완료
```

**결과**: 에러 지속

### 3차 시도: Docker 재빌드 (1차)
```powershell
docker-compose down
docker-compose build pmms-app
docker-compose up -d
```

**결과**: 빌드 캐시 사용 (CACHED), 에러 지속

### 4차 시도: Docker 재빌드 --no-cache (2차)
```powershell
docker-compose down
docker-compose build --no-cache pmms-app
docker-compose up -d
```

**결과**: 에러 지속, JS 파일 해시 동일

### 5차 시도: 브라우저 캐시 삭제
- 시크릿 모드 테스트
- 다른 브라우저(Edge) 테스트
- 개발자 도구 캐시 비활성화

**결과**: 모두 실패, 에러 지속

### 6차 시도: 로컬 빌드 테스트
```powershell
cd frontend
npm run build
```

**결과**: 빌드 성공 ✅ (하지만 Docker에서는 여전히 에러)

### 7차 시도: Docker 완전 초기화 (3차)
```powershell
docker-compose down -v
docker system prune -af
Remove-Item -Recurse -Force frontend/.next
docker-compose build --no-cache pmms-app
docker-compose up -d
```

**결과**: 에러 지속

---

## 근본 원인 분석

### 발견된 문제들

#### 1. 파일 저장 문제
**PowerShell 명령어 결과:**
```tsx
import BoazTrendChart from "@/components/charts/BoazTrendChart";  // ❌
```

**IDE에서 확인한 내용:**
```tsx
import PmmsTrendChart from "@/components/charts/PmmsTrendChart";  // ✅
```

→ **파일이 디스크에 저장되지 않았거나 PowerShell 캐시 문제**

#### 2. Docker 빌드 캐시 문제
```
=> CACHED [builder  8/11] COPY frontend/ .        0.0s 
=> CACHED [builder 11/11] RUN npm run build       0.0s
```

→ **--no-cache 옵션을 사용해도 일부 단계에서 캐시 사용**

#### 3. JS 파일 해시 불변
- `2117-4b57cbcc8bb4437b.js` (변경 없음)
- `page-a2d62aa0597b38d0.js` (변경 없음)

→ **빌드가 실제로 새로운 코드를 반영하지 못함**

### 근본 원인
1. **개발 방식 문제**: Docker 프로덕션 빌드로 개발 진행
2. **빌드 캐시**: 다층 캐시 구조로 인한 변경사항 미반영
3. **피드백 루프**: 수정 → 재빌드 → 테스트 사이클이 너무 김 (30분+)

---

## 최종 해결책

### 개발 환경 전환: Docker → 로컬

#### Before (비효율적)
```
코드 수정 → Docker 재빌드 (30분) → 테스트 → 수정 → 재빌드...
```

#### After (효율적)
```
코드 수정 → 즉시 반영 (1-2초) → 테스트 → 수정 → 즉시 반영...
```

### 실행 단계

#### 1. Docker 중지
```powershell
docker-compose down
```

#### 2. DB만 Docker로 실행
```powershell
docker-compose up -d postgres
```

#### 3. 프론트엔드 로컬 실행
```powershell
cd frontend
npm run dev
# → http://localhost:3000
```

#### 4. 백엔드 로컬 실행 (필요 시)
```powershell
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# → http://localhost:8000
```

### 결과
✅ **에러 해결 확인 가능**
✅ **코드 수정 즉시 반영 (Hot Reload)**
✅ **개발 속도 대폭 향상**

---

## 주요 명령어

### 로컬 개발 환경 (일상 개발용)
```powershell
# 1. DB만 실행
docker-compose up -d postgres

# 2. 프론트엔드 개발
cd frontend
npm run dev

# 3. 백엔드 개발 (AI 기능 등)
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Docker 환경 (배포 전 검증용)
```powershell
# 완전 재빌드
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 로그 확인
docker-compose logs -f pmms-app
```

### 파일 확인 명령어
```powershell
# 파일 내용 확인
Get-Content frontend/src/app/dashboard/page.tsx -Head 10

# 파일 검색
Get-ChildItem -Recurse -Filter "*PmmsTrendChart*"

# 문자열 검색
Select-String -Path "src/**/*.tsx" -Pattern "PmmsTrendChart"
```

---

## 교훈

### 1. 개발 환경 분리
- **로컬 개발**: Hot Reload, 빠른 피드백
- **Docker**: 최종 검증, 배포

### 2. Docker 사용 시기
✅ **사용해야 할 때:**
- Railway 배포 전 최종 테스트
- 프로덕션 환경 검증
- 팀원과 환경 공유

❌ **사용하지 말아야 할 때:**
- 일상적인 개발
- UI/기능 개발 중
- 빠른 반복 테스트 필요 시

### 3. 문제 해결 접근법
1. **근본 원인 파악**: 증상이 아닌 원인 찾기
2. **환경 우회**: 막히면 다른 방법 시도
3. **효율성 우선**: 시간이 오래 걸리면 방법 변경

### 4. 파일 수정 확인
- IDE 표시 ≠ 실제 저장
- 명령어로 실제 파일 내용 확인
- PowerShell 캐시 주의

---

## 추가 참고사항

### 환경변수 설정

#### frontend/.env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL="postgresql://pmms_user:pmms_password@localhost:5432/pmms_db"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

#### backend/.env
```env
DATABASE_URL=postgresql://pmms_user:pmms_password@localhost:5432/pmms_db
```

### 포트 정보
- Frontend: `3000`
- Backend: `8000`
- PostgreSQL: `5432`
- Prisma Studio: `5555`

### 유용한 스크립트
```powershell
# 전체 환경 초기화
docker-compose down -v
docker system prune -af
Remove-Item -Recurse -Force frontend/.next
Remove-Item -Recurse -Force frontend/node_modules
cd frontend && npm install

# DB 리셋
docker-compose down -v
docker-compose up -d postgres
cd frontend && npx prisma db push
```

---

## 타임라인

- **03:50 AM**: Docker 재빌드 완료, 에러 지속
- **04:34 AM**: 2차 재빌드, 캐시 문제 발견
- **06:41 AM**: 개발 방식 문제 인식
- **06:43 AM**: 로컬 개발 환경 전환 결정
- **07:22 AM**: 로컬 환경 구축 완료

**총 소요 시간**: 약 3.5시간
**Docker 재빌드 횟수**: 3회
**해결 방법**: 환경 전환

---

## 결론

Docker 프로덕션 빌드로 개발하는 것은 비효율적입니다.
로컬 개발 환경을 사용하면 동일한 문제를 몇 초 만에 확인하고 해결할 수 있습니다.

**핵심**: 올바른 도구를 올바른 시기에 사용하기
