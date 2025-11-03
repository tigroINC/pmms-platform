"""굴뚝별 기여도 분석 테스트"""
import sys
sys.path.append('.')

from insight_generator import InsightGenerator
import asyncio
import aiosqlite
from pathlib import Path

async def test():
    DB_PATH = Path("../frontend/prisma/dev.db")
    
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        query = """
            SELECT 
                measuredAt as measured_at,
                value,
                stackId,
                temperatureC as temp
            FROM Measurement
            WHERE customerId = ? 
              AND itemKey = ?
              AND value IS NOT NULL
            ORDER BY measuredAt
        """
        
        cursor = await db.execute(query, ("cmh8luyln0000tn34ox9whnuy", "EA-I-0001"))
        rows = await cursor.fetchall()
        
        print(f"총 {len(rows)}개 데이터 조회")
        
        # InsightGenerator 테스트
        gen = InsightGenerator()
        result = gen._analyze_stack_contribution(rows)
        
        print(f"\n분석 결과:")
        print(f"  굴뚝 수: {result.get('stack_count', 0)}")
        print(f"  이상치 굴뚝: {result.get('outlier_stacks', [])}")
        
        if result.get('stacks'):
            print(f"\n굴뚝별 상세:")
            for stack_id, data in list(result['stacks'].items())[:3]:
                print(f"  {stack_id}: 평균 {data['mean']}, 건수 {data['count']}")

asyncio.run(test())
