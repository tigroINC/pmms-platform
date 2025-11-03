# 보아스 AutoML 예측 API 서버

## 개요
Prophet 기반 AutoML 시계열 예측 시스템

## 기술 스택
- **FastAPI**: 고성능 Python 웹 프레임워크
- **Prophet**: Meta Research의 자동 시계열 예측 라이브러리
- **Optuna**: 자동 하이퍼파라미터 최적화
- **AsyncPG**: 비동기 PostgreSQL 드라이버

## AutoML 기능
1. **자동 하이퍼파라미터 튜닝** (Optuna)
   - 베이지안 최적화
   - 20회 시도로 최적 파라미터 탐색

2. **자동 계절성 탐지** (Prophet)
   - 연간/주간 계절성 자동 감지
   - 트렌드 변화점 자동 탐지

3. **자동 외부 변수 학습**
   - 기온, 습도, 풍속 자동 반영
   - 상관관계 자동 학습

## 설치 및 실행

### 1. 가상환경 생성
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
```

### 2. 패키지 설치
```bash
pip install -r requirements.txt
```

### 3. 환경변수 설정
```bash
copy .env.example .env
# .env 파일 수정 (DATABASE_URL 설정)
```

### 4. 서버 실행
```bash
python main.py
# 또는
uvicorn main:app --reload --port 8000
```

### 5. API 문서 확인
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 엔드포인트

### POST /api/predict
AutoML 예측 수행

**Request:**
```json
{
  "customer_id": "customer-uuid",
  "stack": "굴뚝1",
  "item_key": "EA-I-0001",
  "periods": 30,
  "include_history": true
}
```

**Response:**
```json
{
  "predictions": [
    {
      "date": "2025-11-01",
      "predicted_value": 12.5,
      "lower_bound": 10.2,
      "upper_bound": 14.8,
      "trend": 12.3
    }
  ],
  "model_info": {
    "model_type": "Prophet AutoML",
    "best_params": {...},
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

## 프론트엔드 연동

```typescript
// Next.js에서 호출
const response = await fetch('http://localhost:8000/api/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer_id: customerId,
    stack: stackName,
    item_key: itemKey,
    periods: 30
  })
});

const data = await response.json();
console.log(data.predictions);
```

## 성능
- 학습 시간: 약 10-30초 (데이터 크기에 따라)
- 예측 시간: 약 1-2초
- 최소 학습 데이터: 10개 이상

## 라이선스
MIT
