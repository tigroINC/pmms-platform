# 보아스 AutoML 예측 시스템 설치 및 테스트 가이드

## 🎯 시스템 개요

Prophet 기반 AutoML 시계열 예측 시스템이 성공적으로 구축되었습니다.

### 주요 기능
- ✅ **자동 하이퍼파라미터 튜닝** (Optuna)
- ✅ **자동 계절성 탐지** (Prophet)
- ✅ **자동 트렌드 변화점 탐지**
- ✅ **외부 변수 자동 학습** (기온, 습도, 풍속)
- ✅ **신뢰구간 예측** (상한/하한)
- ✅ **실시간 차트 시각화**

---

## 📦 설치 방법

### 1단계: 백엔드 설치

```bash
# 백엔드 폴더로 이동
cd backend

# Python 가상환경 생성 (Python 3.9+ 필요)
python -m venv venv

# 가상환경 활성화
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 패키지 설치
pip install -r requirements.txt

# 환경변수 설정
copy .env.example .env
# .env 파일을 열어서 DATABASE_URL 수정
# DATABASE_URL=postgresql://postgres:password@localhost:5432/boaz
```

### 2단계: 프론트엔드 설정

```bash
# 프론트엔드 폴더로 이동
cd ../frontend

# 환경변수 파일 생성
copy .env.local.example .env.local

# .env.local 파일 확인 (기본값 사용 가능)
# NEXT_PUBLIC_AUTOML_API_URL=http://localhost:8000
```

---

## 🚀 실행 방법

### 터미널 1: 백엔드 서버 실행

```bash
cd backend
venv\Scripts\activate  # 가상환경 활성화
python main.py

# 또는
uvicorn main:app --reload --port 8000
```

**확인:** http://localhost:8000/docs 접속하여 API 문서 확인

### 터미널 2: 프론트엔드 서버 실행

```bash
cd frontend
npm run dev
```

**확인:** http://localhost:3000 접속

---

## 🧪 테스트 방법

### 1. API 헬스 체크

브라우저에서 http://localhost:8000/health 접속

**예상 결과:**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### 2. 대시보드에서 AutoML 예측 테스트

1. **대시보드 접속**: http://localhost:3000/dashboard

2. **필터 설정**:
   - 고객사: 고려아연 (또는 데이터가 있는 고객사)
   - 굴뚝: 굴뚝1 (또는 데이터가 있는 굴뚝)
   - 항목: 먼지 (또는 데이터가 있는 항목)
   - 기간: 2025-01-01 ~ 2025-10-31

3. **AutoML 예측 실행**:
   - 🤖 **AutoML 예측** 버튼 클릭
   - 10-30초 대기 (학습 중)
   - 예측 완료 알림 확인

4. **결과 확인**:
   - "AI 예측" 체크박스 활성화됨
   - 체크박스 클릭하여 예측선 표시
   - 녹색 점선으로 30일 예측 표시
   - 신뢰구간 (상한/하한) 표시

### 3. API 직접 테스트 (선택사항)

```bash
# PowerShell에서 실행
$body = @{
    customer_id = "고객사ID"
    stack = "굴뚝1"
    item_key = "EA-I-0001"
    periods = 30
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/predict" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

---

## 📊 예상 결과

### 성공 시 화면

```
┌─────────────────────────────────────┐
│  대시보드                            │
├─────────────────────────────────────┤
│  [고객사: 고려아연] [굴뚝: 굴뚝1]   │
│  [항목: 먼지]                        │
│                                     │
│  [🤖 AutoML 예측] ← 클릭           │
│                                     │
│  ✅ AutoML 예측 완료!               │
│  모델: Prophet AutoML               │
│  학습 데이터: 150건                 │
│  RMSE: 2.5                          │
│                                     │
│  ☑ AI 예측 ← 체크                  │
│                                     │
│  [차트]                             │
│  ━━━━━━━━━━━━━━━━ (실측값)        │
│              ╌╌╌╌╌╌╌╌╌ (AI 예측)  │
│              ▒▒▒▒▒▒▒ (신뢰구간)    │
└─────────────────────────────────────┘
```

### API 응답 예시

```json
{
  "predictions": [
    {
      "date": "2025-11-01",
      "predicted_value": 12.5,
      "lower_bound": 10.2,
      "upper_bound": 14.8,
      "trend": 12.3
    },
    ...
  ],
  "model_info": {
    "model_type": "Prophet AutoML",
    "best_params": {
      "changepoint_prior_scale": 0.05,
      "seasonality_prior_scale": 1.2,
      "seasonality_mode": "additive"
    },
    "features": ["계절성", "트렌드", "외부변수"],
    "auto_tuned": true
  },
  "training_samples": 150,
  "accuracy_metrics": {
    "rmse": 2.5,
    "mae": 1.8,
    "mape": 15.2,
    "r2": 0.85
  }
}
```

---

## ⚠️ 문제 해결

### 1. "Database not connected" 에러

**원인:** PostgreSQL 연결 실패

**해결:**
```bash
# .env 파일의 DATABASE_URL 확인
# PostgreSQL이 실행 중인지 확인
# 포트, 사용자명, 비밀번호 확인
```

### 2. "학습 데이터가 부족합니다" 에러

**원인:** 선택한 고객사/굴뚝/항목에 데이터가 10개 미만

**해결:**
- 다른 고객사/굴뚝/항목 선택
- 또는 측정 데이터 추가 입력

### 3. "ModuleNotFoundError: No module named 'prophet'" 에러

**원인:** Python 패키지 미설치

**해결:**
```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

### 4. CORS 에러

**원인:** 프론트엔드와 백엔드 포트 불일치

**해결:**
```bash
# backend/.env 확인
FRONTEND_URL=http://localhost:3000

# frontend/.env.local 확인
NEXT_PUBLIC_AUTOML_API_URL=http://localhost:8000
```

---

## 📈 성능 지표

- **학습 시간**: 10-30초 (데이터 크기에 따라)
- **예측 시간**: 1-2초
- **최소 데이터**: 10개 이상
- **권장 데이터**: 50개 이상 (더 정확한 예측)
- **예측 기간**: 30일 (기본값)

---

## 🎓 정부과제 보고서용 설명

### 기술 명칭
**"AutoML 기반 대기오염물질 농도 예측 시스템"**

### 핵심 기술
1. **Prophet (Meta Research)**
   - 자동 계절성 탐지
   - 자동 트렌드 변화점 탐지
   - 자동 이상치 제거

2. **Optuna**
   - 베이지안 하이퍼파라미터 최적화
   - 자동 파라미터 탐색

3. **자동화 파이프라인**
   - 데이터 전처리 자동화
   - 모델 선택 자동화
   - 성능 평가 자동화

### 차별성
- 시계열 전문 AutoML (범용 AutoML 대비)
- 대기오염 도메인 특화
- 외부 변수 자동 학습 (기온, 습도, 풍속)
- 신뢰구간 제공 (예측 불확실성 표시)

---

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. 백엔드 로그: 터미널 1 확인
2. 프론트엔드 로그: 브라우저 개발자 도구 (F12)
3. API 문서: http://localhost:8000/docs
4. 헬스 체크: http://localhost:8000/health

---

**구축 완료일**: 2025-10-28
**버전**: 1.0.0
**상태**: ✅ 프로덕션 준비 완료
