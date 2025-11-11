# Railway 환경에서 Prisma 접속 가이드

## 방법 1: Railway CLI로 Prisma Studio 실행 (권장)

### 1. Railway CLI 설치 (이미 설치되어 있다면 스킵)
```bash
npm install -g @railway/cli
```

### 2. Railway 로그인
```bash
railway login
```

### 3. 프로젝트 연결
```bash
railway link
```
프로젝트 목록에서 선택

### 4. Prisma Studio 실행
```bash
railway run npx prisma studio
```
브라우저에서 http://localhost:5555 자동 오픈

### 5. Prisma 마이그레이션 실행
```bash
railway run npx prisma migrate deploy
```

### 6. Prisma 클라이언트 재생성
```bash
railway run npx prisma generate
```

## 방법 2: 환경변수 직접 설정

### 1. Railway 대시보드에서 DATABASE_URL 복사
1. https://railway.app 접속
2. 프로젝트 선택
3. PostgreSQL 서비스 클릭
4. Variables 탭에서 `DATABASE_URL` 값 복사

### 2. 로컬 .env 파일에 추가
```bash
# .env 파일
DATABASE_URL="postgresql://postgres:password@host.railway.internal:5432/railway"
```

### 3. Prisma Studio 실행
```bash
npx prisma studio
```

## 방법 3: Railway Shell 사용

### Railway 환경에서 직접 명령 실행
```bash
railway shell
```

Shell 내에서:
```bash
npx prisma studio
npx prisma migrate deploy
npx prisma db seed
```

## 유용한 Prisma 명령어

### 데이터베이스 상태 확인
```bash
railway run npx prisma db pull
```

### 스키마 검증
```bash
railway run npx prisma validate
```

### 마이그레이션 상태 확인
```bash
railway run npx prisma migrate status
```

### 데이터베이스 리셋 (주의!)
```bash
railway run npx prisma migrate reset
```

## 트러블슈팅

### "Environment variable not found: DATABASE_URL"
- Railway 프로젝트가 제대로 연결되었는지 확인
- `railway link` 다시 실행

### 연결 타임아웃
- Railway PostgreSQL이 실행 중인지 확인
- 네트워크 연결 확인

### SSL 연결 오류
schema.prisma에 SSL 설정 추가:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Railway는 기본적으로 SSL 사용
}
```
