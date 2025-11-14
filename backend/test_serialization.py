"""
보고서 직렬화 테스트
"""
import json
import asyncio
import aiosqlite
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))

from automl_engine import PmmsAutoMLPredictor
from insight_generator import InsightGenerator

DB_PATH = Path(__file__).parent.parent / "frontend" / "prisma" / "dev.db"

async def test_serialization():
    """보고서 직렬화 테스트"""
    try:
        print("=== 보고서 직렬화 테스트 ===\n")
        
        # 데이터 조회
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            
            query = """
                SELECT 
                    measuredAt as measured_at,
                    value,
                    stackId,
                    temperatureC as temp,
                    humidityPct as humidity,
                    windSpeedMs as wind_speed,
                    gasTempC as gas_temp,
                    oxygenMeasuredPct as o2_measured
                FROM Measurement
                WHERE customerId = ? 
                  AND itemKey = ?
                  AND value IS NOT NULL
                ORDER BY measuredAt
            """
            
            cursor = await db.execute(query, ("cmh8luyln0000tn34ox9whnuy", "EA-I-0001"))
            rows = await cursor.fetchall()
            
            customer_cursor = await db.execute(
                "SELECT name FROM Customer WHERE id = ?",
                ("cmh8luyln0000tn34ox9whnuy",)
            )
            customer_row = await customer_cursor.fetchone()
            customer_name = customer_row[0]
            
            item_cursor = await db.execute(
                'SELECT name, "limit" FROM Item WHERE key = ?',
                ("EA-I-0001",)
            )
            item_row = await item_cursor.fetchone()
            item_name = item_row[0]
            limit_value = item_row[1]
        
        print(f"데이터 조회 완료: {len(rows)}개")
        
        # 예측 수행
        print("예측 수행 중...")
        predictor = PmmsAutoMLPredictor()
        result = await predictor.predict(data=rows, periods=30)
        print("예측 완료")
        
        # 보고서 생성
        print("보고서 생성 중...")
        insight_gen = InsightGenerator()
        report = insight_gen.generate_report(
            predictions=result['predictions'],
            historical_data=predictor.training_data,
            raw_data=rows,
            model_info=result['model_info'],
            accuracy_metrics=result.get('metrics', {}),
            customer_name=customer_name,
            item_name=item_name,
            limit_value=limit_value
        )
        print("보고서 생성 완료")
        
        # 응답 객체 생성
        response_data = {
            "predictions": result['predictions'],
            "model_info": result['model_info'],
            "training_samples": len(rows),
            "accuracy_metrics": result.get('metrics'),
            "insight_report": report
        }
        
        # JSON 직렬화 테스트
        print("\nJSON 직렬화 테스트 중...")
        try:
            json_str = json.dumps(response_data, ensure_ascii=False, indent=2)
            print(f"✅ 직렬화 성공! (크기: {len(json_str):,} bytes)")
            
            # 역직렬화 테스트
            parsed = json.loads(json_str)
            print("✅ 역직렬화 성공!")
            
            return True
            
        except Exception as e:
            print(f"❌ 직렬화 실패: {e}")
            print(f"에러 타입: {type(e).__name__}")
            
            # 각 필드별로 테스트
            print("\n각 필드별 직렬화 테스트:")
            for key, value in response_data.items():
                try:
                    json.dumps(value)
                    print(f"  ✅ {key}")
                except Exception as field_error:
                    print(f"  ❌ {key}: {field_error}")
            
            return False
        
    except Exception as e:
        import traceback
        print(f"\n❌ 오류 발생: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_serialization())
    sys.exit(0 if success else 1)
