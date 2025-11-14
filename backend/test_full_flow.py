"""
전체 플로우 디버그 - API 호출 없이 직접 실행
"""
import asyncio
import aiosqlite
from pathlib import Path
import sys

# 경로 추가
sys.path.insert(0, str(Path(__file__).parent))

from automl_engine import PmmsAutoMLPredictor
from insight_generator import InsightGenerator

# 데이터베이스 경로
DB_PATH = Path(__file__).parent.parent / "frontend" / "prisma" / "dev.db"

# 테스트 파라미터
customer_id = "cmh8luyln0000tn34ox9whnuy"
item_key = "EA-I-0001"
periods = 30

async def test_full_flow():
    """전체 플로우 테스트"""
    try:
        print("=== 전체 플로우 테스트 시작 ===\n")
        
        # 1. 데이터 조회
        print("1. 데이터베이스에서 데이터 조회 중...")
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            
            # 측정 데이터 조회
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
            
            cursor = await db.execute(query, (customer_id, item_key))
            rows = await cursor.fetchall()
            print(f"   ✓ {len(rows)}개 데이터 조회 완료")
            
            # 고객사 이름 조회
            customer_cursor = await db.execute(
                "SELECT name FROM Customer WHERE id = ?",
                (customer_id,)
            )
            customer_row = await customer_cursor.fetchone()
            customer_name = customer_row[0] if customer_row else "Unknown"
            print(f"   ✓ 고객사: {customer_name}")
            
            # 항목 이름 및 허용기준 조회
            item_cursor = await db.execute(
                'SELECT name, "limit" FROM Item WHERE key = ?',
                (item_key,)
            )
            item_row = await item_cursor.fetchone()
            item_name = item_row[0] if item_row else "Unknown"
            limit_value = item_row[1] if item_row else None
            print(f"   ✓ 항목: {item_name} (기준: {limit_value})")
        
        # 2. AutoML 예측 수행
        print("\n2. AutoML 예측 수행 중...")
        predictor = PmmsAutoMLPredictor()
        result = await predictor.predict(data=rows, periods=periods)
        print(f"   ✓ 예측 완료: {len(result['predictions'])}일")
        print(f"   ✓ 모델 정확도 - RMSE: {result.get('metrics', {}).get('rmse', 'N/A')}")
        
        # 3. 인사이트 보고서 생성
        print("\n3. 인사이트 보고서 생성 중...")
        insight_gen = InsightGenerator()
        
        print("   - 과거 데이터 분석...")
        print("   - 예측 결과 분석...")
        print("   - 트렌드 분석...")
        print("   - 위험도 평가...")
        print("   - 환경변수 상관관계 분석...")
        print("   - 굴뚝별 기여도 분석...")
        
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
        
        print(f"   ✓ 보고서 생성 완료")
        
        # 4. 결과 확인
        print("\n=== 결과 요약 ===")
        print(f"위험도: {report['summary']['risk']['level']} ({report['summary']['risk']['score']}/100)")
        print(f"예측 추세: {report['summary']['prediction']['trend']}")
        
        if 'stack_contribution' in report['summary']:
            sc = report['summary']['stack_contribution']
            print(f"굴뚝 수: {sc.get('stack_count', 0)}개")
            print(f"이상치 굴뚝 수: {len(sc.get('outlier_stacks', []))}개")
        
        print("\n✅ 전체 플로우 테스트 성공!")
        
        # 보고서 일부 출력
        print("\n=== 보고서 미리보기 (처음 500자) ===")
        print(report['narrative'][:500])
        print("...")
        
        return True
        
    except Exception as e:
        import traceback
        print(f"\n❌ 오류 발생: {e}")
        print("\n상세 오류:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_full_flow())
    sys.exit(0 if success else 1)
