"""굴뚝별 분석 단독 테스트"""
import asyncio
import aiosqlite
from pathlib import Path

async def test_stack_data():
    DB_PATH = Path("../frontend/prisma/dev.db")
    
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
            LIMIT 10
        """
        
        cursor = await db.execute(query, ("cmh8luyln0000tn34ox9whnuy", "EA-I-0001"))
        rows = await cursor.fetchall()
        
        print(f"총 {len(rows)}개 데이터 조회")
        for i, row in enumerate(rows[:3]):
            print(f"\n데이터 {i+1}:")
            row_dict = dict(row)
            for key, value in row_dict.items():
                print(f"  {key}: {value} (type: {type(value).__name__})")

asyncio.run(test_stack_data())
