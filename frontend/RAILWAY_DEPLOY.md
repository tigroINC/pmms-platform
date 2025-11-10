# Railway 배포 가이드

## 1. Railway 계정 및 프로젝트 생성

1. https://railway.app 접속
2. GitHub 계정으로 로그인
3. "New Project" 클릭
4. "Deploy from GitHub repo" 선택
5. 이 저장소 선택

## 2. PostgreSQL 추가

1. 프로젝트 대시보드에서 "+ New" 클릭
2. "Database" → "Add PostgreSQL" 선택
3. 자동으로 `DATABASE_URL` 환경변수 생성됨

## 3. 환경변수 설정

프로젝트 Settings → Variables에서 추가:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
NEXTAUTH_SECRET=<아래 명령어로 생성>
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NODE_ENV=production
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### NEXTAUTH_SECRET 생성:
```bash
openssl rand -base64 32
```

## 4. Prisma 마이그레이션

Railway CLI 설치:
```bash
npm install -g @railway/cli
```

로그인 및 연결:
```bash
railway login
railway link
```

마이그레이션 실행:
```bash
railway run npx prisma migrate deploy
```

## 5. 배포

GitHub에 push하면 자동 배포됩니다:
```bash
git add .
git commit -m "Railway 배포 설정"
git push
```

## 6. 도메인 확인

1. Railway 대시보드에서 Settings → Domains
2. 자동 생성된 도메인 확인 (예: your-app.up.railway.app)
3. 커스텀 도메인 추가 가능

## 7. 로그 확인

Railway 대시보드에서 "View Logs" 클릭하여 배포 상태 확인

## 트러블슈팅

### 빌드 실패 시
- Dockerfile 경로 확인
- 환경변수 설정 확인
- 로그에서 에러 메시지 확인

### 데이터베이스 연결 실패
- DATABASE_URL 환경변수 확인
- Prisma 마이그레이션 실행 확인

### Python 관련 에러
- Dockerfile에서 Python 설치 확인
- requirements.txt 경로 확인
