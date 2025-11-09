"""
보아스 환경 AutoML 예측 API 서버
- Prophet 기반 시계열 예측
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import aiosqlite
from pathlib import Path
from typing import Optional, List, Dict
import logging
import base64
import os
# from weasyprint import HTML, CSS  # Windows에서 GTK 의존성 문제로 주석 처리
from dotenv import load_dotenv
import logging
from pathlib import Path

# 로깅 설정
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 환경변수 로드
load_dotenv()

app = FastAPI(
    title="보아스 AutoML 예측 API",
    description="AutoML 기반 대기오염물질 농도 예측 시스템",
    version="1.0.0"
)

# CORS 설정 - 개발 환경에서 모든 origin 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:50010",  # Browser preview
        "*"  # 개발 환경에서 모든 origin 허용
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터베이스 경로
DB_PATH = Path(__file__).parent.parent / "frontend" / "prisma" / "dev.db"

@app.on_event("startup")
async def startup():
    if not DB_PATH.exists():
        logger.error(f"Database file not found: {DB_PATH}")
    else:
        logger.info(f"Database file found: {DB_PATH}")

@app.on_event("shutdown")
async def shutdown():
    logger.info("Server shutdown")

# Request/Response 모델
class PredictionRequest(BaseModel):
    customer_id: str
    stack: str
    item_key: str
    item_name: str = None  # 항목명 (인사이트 보고서용)
    periods: int = 30  # 예측 기간 (일)
    include_history: bool = True
    chart_image: str = None  # Base64 차트 이미지 (인사이트 보고서용)
    user_id: str = None  # 생성한 사용자 ID (인사이트 보고서용)
    value: float = None  # 검증할 측정값 (이상치 검증용)

class PredictionResponse(BaseModel):
    predictions: List[Dict]
    model_info: Dict
    training_samples: int
    accuracy_metrics: Optional[Dict] = None

@app.get("/")
async def root():
    return {
        "service": "보아스 AutoML 예측 API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """헬스 체크"""
    db_status = "connected" if DB_PATH.exists() else "disconnected"
    return {
        "status": "healthy",
        "database": db_status,
        "db_path": str(DB_PATH)
    }

@app.post("/api/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    AutoML 기반 예측 수행
    - Prophet 자동 학습
    - Optuna 하이퍼파라미터 최적화
    - 30일 예측
    """
    if not DB_PATH.exists():
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        # AutoML 예측 엔진 import
        from automl_engine import BoazAutoMLPredictor
        
        # 데이터베이스에서 학습 데이터 가져오기
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            # 고객사 전체 굴뚝 데이터를 사용하여 충분한 학습 데이터 확보
            # (특정 굴뚝만 사용하면 데이터가 부족할 수 있음)
            query = """
                SELECT 
                    m.measuredAt as measured_at,
                    m.value,
                    m.temperatureC as temp,
                    m.humidityPct as humidity,
                    m.windSpeedMs as wind_speed,
                    m.gasTempC as gas_temp,
                    m.oxygenMeasuredPct as o2_measured,
                    m.stackId as stack_id,
                    s.name as stack_name
                FROM Measurement m
                LEFT JOIN Stack s ON m.stackId = s.id
                WHERE m.customerId = ? 
                  AND m.itemKey = ?
                  AND m.value IS NOT NULL
                ORDER BY m.measuredAt
            """
            
            cursor = await db.execute(
                query,
                (request.customer_id, request.item_key)
            )
            rows = await cursor.fetchall()
            
            logger.info(f"Found {len(rows)} measurements for customer {request.customer_id}, item {request.item_key}")
        
        if len(rows) < 10:
            raise HTTPException(
                status_code=400,
                detail=f"학습 데이터가 부족합니다. (최소 10개 필요, 현재 {len(rows)}개)"
            )
        
        # AutoML 예측 수행
        predictor = BoazAutoMLPredictor()
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
    - 예측 수행
    - 트렌드 분석
    - 위험도 평가
    - 자연어 보고서 생성
    """
    if not DB_PATH.exists():
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        from automl_engine import BoazAutoMLPredictor
        from insight_generator import InsightGenerator
        
        # 데이터베이스에서 학습 데이터 가져오기
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            
            # 측정 데이터 조회 (굴뚝별 분석을 위해 stackId와 stack_name 포함)
            query = """
                SELECT 
                    m.measuredAt as measured_at,
                    m.value,
                    m.stackId as stack_id,
                    s.name as stack_name,
                    m.temperatureC as temp,
                    m.humidityPct as humidity,
                    m.windSpeedMs as wind_speed,
                    m.gasTempC as gas_temp,
                    m.oxygenMeasuredPct as o2_measured
                FROM Measurement m
                LEFT JOIN Stack s ON m.stackId = s.id
                WHERE m.customerId = ? 
                  AND m.itemKey = ?
                  AND m.value IS NOT NULL
                ORDER BY m.measuredAt
            """
            
            cursor = await db.execute(query, (request.customer_id, request.item_key))
            rows = await cursor.fetchall()
            
            # 고객사 이름 조회
            customer_cursor = await db.execute(
                "SELECT name FROM Customer WHERE id = ?",
                (request.customer_id,)
            )
            customer_row = await customer_cursor.fetchone()
            customer_name = customer_row[0] if customer_row else "Unknown"
            
            # 항목 이름 및 허용기준 조회
            item_cursor = await db.execute(
                'SELECT name, "limit" FROM Item WHERE key = ?',
                (request.item_key,)
            )
            item_row = await item_cursor.fetchone()
            item_name = item_row[0] if item_row else "Unknown"
            limit_value = item_row[1] if item_row else None
        
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
            historical_data=predictor.training_data,  # 전처리된 데이터 사용
            raw_data=rows,  # 굴뚝별 분석을 위한 원본 데이터
            model_info=result['model_info'],
            accuracy_metrics=result.get('metrics', {}),
            customer_name=customer_name,
            item_name=item_name,
            limit_value=limit_value,
            chart_image=request.chart_image
        )
        
        # PDF 생성 (Playwright 사용) - 필수 기능
        # ⚠️ CRITICAL: PDF 생성은 필수입니다. 실패 시 에러를 반환합니다.
        # HTML fallback은 지원하지 않습니다.
        try:
            logger.info("Starting PDF generation...")
            from playwright.async_api import async_playwright
            logger.info("Playwright imported successfully")
            
            async with async_playwright() as p:
                logger.info("Launching browser...")
                browser = await p.chromium.launch()
                logger.info("Browser launched")
                
                page = await browser.new_page()
                logger.info("Page created")
                
                # HTML 콘텐츠 설정
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
                
                logger.info("Setting HTML content...")
                await page.set_content(html_with_style)
                logger.info("HTML content set")
                
                logger.info("Generating PDF...")
                pdf_bytes = await page.pdf(
                    format='A4',
                    margin={'top': '25mm', 'right': '20mm', 'bottom': '25mm', 'left': '20mm'},
                    print_background=True
                )
                logger.info(f"PDF generated: {len(pdf_bytes)} bytes")
                
                await browser.close()
                logger.info("Browser closed")
                
                pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
                logger.info(f"PDF encoded to base64: {len(pdf_base64)} chars")
                
                # PDF 생성 검증
                if not pdf_base64 or len(pdf_base64) < 100:
                    raise ValueError("PDF generation failed: Empty or invalid PDF data")
                    
        except Exception as pdf_error:
            logger.error(f"PDF generation error: {pdf_error}", exc_info=True)
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            # PDF 생성 실패 시 명확한 에러 반환
            raise HTTPException(
                status_code=500,
                detail=f"PDF 생성 실패: {str(pdf_error)}. Playwright가 올바르게 설치되었는지 확인하세요."
            )
        
        # DB에 인사이트 보고서 저장 (24시간 캐싱용)
        try:
            import json
            async with aiosqlite.connect(DB_PATH) as db:
                await db.execute("""
                    INSERT INTO insight_reports 
                    (id, customerId, itemKey, itemName, periods, reportData, chartImage, pdfBase64, createdBy, createdAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                """, (
                    base64.b64encode(os.urandom(12)).decode('utf-8'),  # 간단한 ID 생성
                    request.customer_id,
                    request.item_key,
                    request.item_name or item_name,
                    request.periods,
                    json.dumps(report),
                    request.chart_image,
                    pdf_base64,
                    request.user_id or 'system'
                ))
                await db.commit()
                logger.info("Insight report saved to database")
        except Exception as save_error:
            logger.warning(f"Failed to save insight report to DB: {save_error}")
            # 저장 실패해도 응답은 반환
        
        # NaN 값을 None으로 변환하여 JSON 직렬화 가능하게 만듦
        def sanitize_for_json(obj):
            """NaN, Infinity 값을 JSON 호환 값으로 변환"""
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
        error_detail = traceback.format_exc()
        logger.error(f"Insight generation error: {e}\n{error_detail}")
        # 에러 메시지를 문자열로 반환
        raise HTTPException(
            status_code=500, 
            detail=f"Error: {str(e)}"
        )

@app.post("/api/validate-measurement")
async def validate_measurement(request: PredictionRequest):
    """
    측정 데이터 이상치 검증
    Prophet 예측값과 비교하여 신뢰구간 벗어나면 워닝
    """
    try:
        from automl_engine import AutoMLPredictor
        import pandas as pd
        from datetime import datetime, timedelta
        
        # DB 경로
        DB_PATH = Path(__file__).parent.parent / "frontend" / "prisma" / "dev.db"
        
        # 고객사 전체 굴뚝 데이터 조회 (학습용)
        async with aiosqlite.connect(DB_PATH) as db:
            cursor = await db.execute("""
                SELECT m.measuredAt, m.value
                FROM measurements m
                JOIN stacks s ON m.stackId = s.id
                WHERE s.customerId = ? AND m.itemKey = ?
                ORDER BY m.measuredAt ASC
            """, (request.customer_id, request.item_key))
            
            rows = await cursor.fetchall()
        
        if len(rows) < 10:
            # 데이터 부족 시 검증 스킵
            return {
                "anomaly_detected": False,
                "skip_reason": "insufficient_data",
                "message": "데이터가 부족하여 검증을 건너뜁니다."
            }
        
        # Prophet 학습 및 예측
        predictor = AutoMLPredictor()
        result = await predictor.predict(
            data=rows,
            periods=30,
            include_history=True
        )
        
        # 오늘 날짜의 예측값 찾기
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
        
        # 신뢰구간 비교
        lower = prediction_for_today['yhat_lower']
        upper = prediction_for_today['yhat_upper']
        predicted = prediction_for_today['yhat']
        
        # 입력값이 request에 없으므로 별도 필드 추가 필요
        # 임시로 value 필드 사용
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
        # 검증 실패 시에도 저장은 허용
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
