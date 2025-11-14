"""
PMMS 환경 AutoML 예측 API 서버
- Prophet 기반 시계열 예측
- PostgreSQL 연동
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import asyncpg
from typing import Optional, List, Dict
import logging
import base64
import os
from dotenv import load_dotenv

# 로깅 설정
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 환경변수 로드
load_dotenv()

app = FastAPI(
    title="PMMS AutoML 예측 API",
    description="AutoML 기반 대기오염물질 농도 예측 시스템",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ PostgreSQL 연결 설정
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://postgres:postgres@localhost:5432/boaz'
)

logger.info(f"Database URL: {DATABASE_URL}")

# Connection pool
db_pool: Optional[asyncpg.Pool] = None

@app.on_event("startup")
async def startup():
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=2,
            max_size=10,
            command_timeout=60
        )
        logger.info("Database connection pool created")
    except Exception as e:
        logger.error(f"Failed to create database pool: {e}")
        raise

@app.on_event("shutdown")
async def shutdown():
    global db_pool
    if db_pool:
        await db_pool.close()
        logger.info("Database connection pool closed")

# Request/Response 모델
class PredictionRequest(BaseModel):
    customer_id: str
    stack: str
    item_key: str
    item_name: str = None
    periods: int = 30
    include_history: bool = True
    chart_image: str = None
    user_id: str = None
    value: float = None

class PredictionResponse(BaseModel):
    predictions: List[Dict]
    model_info: Dict
    training_samples: int
    accuracy_metrics: Optional[Dict] = None

@app.get("/")
async def root():
    return {
        "service": "PMMS AutoML 예측 API",
        "version": "1.0.0",
        "status": "running",
        "database": "PostgreSQL"
    }

@app.get("/health")
async def health_check():
    """헬스 체크"""
    global db_pool
    
    if not db_pool:
        return {
            "status": "unhealthy",
            "database": "disconnected"
        }
    
    try:
        async with db_pool.acquire() as conn:
            await conn.fetchval('SELECT 1')
        return {
            "status": "healthy",
            "database": "connected",
            "database_url": DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'N/A'
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

@app.post("/api/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    AutoML 기반 예측 수행
    - Prophet 자동 학습
    - Optuna 하이퍼파라미터 최적화
    - 30일 예측
    """
    global db_pool
    
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        from automl_engine import PmmsAutoMLPredictor
        
        # PostgreSQL에서 학습 데이터 가져오기
        async with db_pool.acquire() as conn:
            # 고객사 전체 굴뚝 데이터를 사용하여 충분한 학습 데이터 확보
            query = """
                SELECT 
                    m."measuredAt" as measured_at,
                    m.value,
                    m."temperatureC" as temp,
                    m."humidityPct" as humidity,
                    m."windSpeedMs" as wind_speed,
                    m."gasTempC" as gas_temp,
                    m."oxygenMeasuredPct" as o2_measured,
                    m."stackId" as stack_id,
                    s.name as stack_name
                FROM "Measurement" m
                LEFT JOIN "Stack" s ON m."stackId" = s.id
                WHERE m."customerId" = $1
                  AND m."itemKey" = $2
                  AND m.value IS NOT NULL
                ORDER BY m."measuredAt"
            """
            
            rows = await conn.fetch(query, request.customer_id, request.item_key)
            
            logger.info(f"Found {len(rows)} measurements for customer {request.customer_id}, item {request.item_key}")
        
        if len(rows) < 10:
            raise HTTPException(
                status_code=400,
                detail=f"학습 데이터가 부족합니다. (최소 10개 필요, 현재 {len(rows)}개)"
            )
        
        # AutoML 예측 수행
        predictor = PmmsAutoMLPredictor()
        result = await predictor.predict(
            data=rows,
            periods=request.periods
        )
        
        return PredictionResponse(
            predictions=result['predictions'],
            model_info=result['model_info'],
            training_samples=len(rows),
            accuracy_metrics=result.get('metrics')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict/insight")
async def generate_insight_report(request: PredictionRequest):
    """
    예측 결과 + AI 인사이트 보고서 생성
    """
    global db_pool
    
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        from automl_engine import BoazAutoMLPredictor
        from insight_generator import InsightGenerator
        
        async with db_pool.acquire() as conn:
            # 측정 데이터 조회
            query = """
                SELECT 
                    m."measuredAt" as measured_at,
                    m.value,
                    m."stackId" as stack_id,
                    s.name as stack_name,
                    m."temperatureC" as temp,
                    m."humidityPct" as humidity,
                    m."windSpeedMs" as wind_speed,
                    m."gasTempC" as gas_temp,
                    m."oxygenMeasuredPct" as o2_measured
                FROM "Measurement" m
                LEFT JOIN "Stack" s ON m."stackId" = s.id
                WHERE m."customerId" = $1
                  AND m."itemKey" = $2
                  AND m.value IS NOT NULL
                ORDER BY m."measuredAt"
            """
            
            rows = await conn.fetch(query, request.customer_id, request.item_key)
            
            # 고객사 이름 조회
            customer_row = await conn.fetchrow(
                'SELECT name FROM "Customer" WHERE id = $1',
                request.customer_id
            )
            customer_name = customer_row['name'] if customer_row else "Unknown"
            
            # 항목 이름 및 허용기준 조회
            item_row = await conn.fetchrow(
                'SELECT name, "limit" FROM "Item" WHERE key = $1',
                request.item_key
            )
            item_name = item_row['name'] if item_row else "Unknown"
            limit_value = item_row['limit'] if item_row else None
        
        if len(rows) < 10:
            raise HTTPException(
                status_code=400,
                detail=f"학습 데이터가 부족합니다. (최소 10개 필요, 현재 {len(rows)}개)"
            )
        
        # AutoML 예측 수행
        predictor = BoazAutoMLPredictor()
        result = await predictor.predict(data=rows, periods=request.periods)
        
        # 인사이트 보고서 생성
        insight_gen = InsightGenerator()
        report = insight_gen.generate_report(
            predictions=result['predictions'],
            historical_data=predictor.training_data,
            raw_data=rows,
            model_info=result['model_info'],
            accuracy_metrics=result.get('metrics', {}),
            customer_name=customer_name,
            item_name=item_name,
            limit_value=limit_value,
            chart_image=request.chart_image
        )
        
        # PDF 생성 (Playwright)
        try:
            logger.info("Starting PDF generation...")
            from playwright.async_api import async_playwright
            
            async with async_playwright() as p:
                logger.info("Launching browser...")
                browser = await p.chromium.launch()
                page = await browser.new_page()
                
                html_with_style = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        @page {{
                            margin: 25mm 20mm;
                            size: A4;
                        }}
                        body {{
                            font-family: 'Malgun Gothic', 'Noto Sans KR', sans-serif;
                            margin: 0;
                            padding: 0;
                        }}
                    </style>
                </head>
                <body>
                    {report['narrative']}
                </body>
                </html>
                """
                
                await page.set_content(html_with_style)
                pdf_bytes = await page.pdf(
                    format='A4',
                    margin={'top': '25mm', 'right': '20mm', 'bottom': '25mm', 'left': '20mm'},
                    print_background=True
                )
                
                await browser.close()
                logger.info(f"PDF generated: {len(pdf_bytes)} bytes")
                
                pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
                
                if not pdf_base64 or len(pdf_base64) < 100:
                    raise ValueError("PDF generation failed: Empty or invalid PDF data")
                    
        except Exception as pdf_error:
            logger.error(f"PDF generation error: {pdf_error}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"PDF 생성 실패: {str(pdf_error)}"
            )
        
        # DB에 인사이트 보고서 저장
        try:
            import json
            async with db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO "InsightReport" 
                    (id, "customerId", "itemKey", "itemName", periods, "reportData", "chartImage", "pdfBase64", "createdBy", "createdAt")
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                """, 
                    base64.b64encode(os.urandom(12)).decode('utf-8'),
                    request.customer_id,
                    request.item_key,
                    request.item_name or item_name,
                    request.periods,
                    json.dumps(report),
                    request.chart_image,
                    pdf_base64,
                    request.user_id or 'system'
                )
                logger.info("Insight report saved to database")
        except Exception as save_error:
            logger.warning(f"Failed to save insight report: {save_error}")
        
        # NaN 값 처리
        def sanitize_for_json(obj):
            import math
            if isinstance(obj, dict):
                return {k: sanitize_for_json(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [sanitize_for_json(item) for item in obj]
            elif isinstance(obj, float):
                if math.isnan(obj) or math.isinf(obj):
                    return None
                return obj
            return obj
        
        response_data = {
            "predictions": result['predictions'],
            "model_info": result['model_info'],
            "training_samples": len(rows),
            "accuracy_metrics": result.get('metrics'),
            "insight_report": report,
            "pdf_base64": pdf_base64
        }
        
        return sanitize_for_json(response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(f"Insight generation error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/validate-measurement")
async def validate_measurement(request: PredictionRequest):
    """측정 데이터 이상치 검증"""
    global db_pool
    
    try:
        from automl_engine import PmmsAutoMLPredictor
        from datetime import datetime
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT m."measuredAt", m.value
                FROM "Measurement" m
                JOIN "Stack" s ON m."stackId" = s.id
                WHERE s."customerId" = $1 AND m."itemKey" = $2
                ORDER BY m."measuredAt" ASC
            """, request.customer_id, request.item_key)
        
        if len(rows) < 10:
            return {
                "anomaly_detected": False,
                "skip_reason": "insufficient_data",
                "message": "데이터가 부족하여 검증을 건너뜁니다."
            }
        
        predictor = AutoMLPredictor()
        result = await predictor.predict(data=rows, periods=30, include_history=True)
        
        today = datetime.now().date()
        prediction_for_today = None
        
        for pred in result['predictions']:
            pred_date = datetime.fromisoformat(pred['date'].replace('Z', '+00:00')).date()
            if pred_date == today:
                prediction_for_today = pred
                break
        
        if not prediction_for_today:
            return {
                "anomaly_detected": False,
                "skip_reason": "no_prediction",
                "message": "예측값을 찾을 수 없습니다."
            }
        
        lower = prediction_for_today['yhat_lower']
        upper = prediction_for_today['yhat_upper']
        predicted = prediction_for_today['yhat']
        input_value = getattr(request, 'value', None)
        
        if input_value is None:
            return {
                "anomaly_detected": False,
                "skip_reason": "no_value",
                "message": "검증할 값이 없습니다."
            }
        
        if input_value < lower or input_value > upper:
            return {
                "anomaly_detected": True,
                "severity": "warning",
                "message": f"입력하신 값({input_value:.2f})이 예상 범위({lower:.2f}~{upper:.2f})를 벗어났습니다.",
                "details": {
                    "input_value": input_value,
                    "predicted_value": predicted,
                    "lower_bound": lower,
                    "upper_bound": upper
                }
            }
        
        return {
            "anomaly_detected": False,
            "message": "정상 범위입니다."
        }
        
    except Exception as e:
        logger.error(f"Validation error: {e}")
        return {
            "anomaly_detected": False,
            "skip_reason": "validation_error",
            "message": f"검증 중 오류 발생: {str(e)}"
        }

@app.get("/api/models")
async def list_models():
    """사용 가능한 AutoML 모델 목록"""
    return {
        "models": [
            {
                "name": "Prophet",
                "type": "AutoML Time Series",
                "features": [
                    "자동 계절성 탐지",
                    "자동 트렌드 변화점 탐지",
                    "자동 이상치 제거",
                    "외부 변수 자동 학습"
                ]
            },
            {
                "name": "Optuna",
                "type": "AutoML Hyperparameter Tuning",
                "features": [
                    "베이지안 최적화",
                    "자동 파라미터 탐색",
                    "조기 종료"
                ]
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
