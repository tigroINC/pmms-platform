"""
API 엔드포인트를 직접 호출하여 에러 확인
"""
import asyncio
import sys
from pathlib import Path

# 경로 추가
sys.path.insert(0, str(Path(__file__).parent))

# FastAPI 앱 import
from main import generate_insight_report
from pydantic import BaseModel

class PredictionRequest(BaseModel):
    customer_id: str
    stack: str
    item_key: str
    periods: int = 30
    include_history: bool = True

async def test_api_direct():
    """API 함수를 직접 호출"""
    try:
        print("=== API 함수 직접 호출 테스트 ===\n")
        
        request = PredictionRequest(
            customer_id="cmh8luyln0000tn34ox9whnuy",
            stack="#A2020007",
            item_key="EA-I-0001",
            periods=30
        )
        
        print(f"요청: {request}")
        print("\n처리 중...")
        
        result = await generate_insight_report(request)
        
        print("\n✅ 성공!")
        print(f"위험도: {result['insight_report']['summary']['risk']['level']}")
        
        return True
        
    except Exception as e:
        import traceback
        print(f"\n❌ 오류 발생: {e}")
        print(f"오류 타입: {type(e).__name__}")
        print("\n상세 오류:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_api_direct())
    sys.exit(0 if success else 1)
