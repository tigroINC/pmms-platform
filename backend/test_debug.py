"""
굴뚝별 기여도 분석 디버그 스크립트
"""
import sys
import sqlite3
from pathlib import Path

# 데이터베이스 경로
DB_PATH = Path(__file__).parent.parent / "frontend" / "prisma" / "dev.db"

print(f"데이터베이스 경로: {DB_PATH}")
print(f"데이터베이스 존재: {DB_PATH.exists()}")

# 테스트 파라미터
customer_id = "cmh8luyln0000tn34ox9whnuy"
item_key = "EA-I-0001"

try:
    # 데이터베이스 연결
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 쿼리 실행
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
        LIMIT 5
    """
    
    cursor.execute(query, (customer_id, item_key))
    rows = cursor.fetchall()
    
    print(f"\n조회된 데이터 수: {len(rows)}개")
    
    if rows:
        print("\n첫 번째 데이터:")
        first_row = rows[0]
        print(f"  Type: {type(first_row)}")
        print(f"  Keys: {first_row.keys()}")
        
        # dict로 변환 테스트
        row_dict = dict(first_row)
        print(f"\n  Dict 변환 후:")
        for key, value in row_dict.items():
            print(f"    {key}: {value} (type: {type(value).__name__})")
        
        # stackId 추출 테스트
        stack_id = row_dict.get('stackId') or row_dict.get('stack_id')
        print(f"\n  stackId 추출: {stack_id}")
        
        # 굴뚝별 데이터 그룹화 테스트
        print("\n\n=== 굴뚝별 데이터 그룹화 테스트 ===")
        stack_data = {}
        
        # 전체 데이터 조회
        cursor.execute(query.replace("LIMIT 5", ""), (customer_id, item_key))
        all_rows = cursor.fetchall()
        print(f"전체 데이터 수: {len(all_rows)}개")
        
        for row in all_rows:
            if hasattr(row, 'keys'):
                row_dict = dict(row)
            else:
                row_dict = row
            
            stack_id = row_dict.get('stackId') or row_dict.get('stack_id')
            if not stack_id:
                stack_id = 'Unknown'
            
            value = row_dict.get('value')
            
            if value is not None:
                try:
                    if stack_id not in stack_data:
                        stack_data[stack_id] = []
                    stack_data[stack_id].append(float(value))
                except (ValueError, TypeError) as e:
                    print(f"  값 변환 오류: {value} - {e}")
        
        print(f"\n굴뚝 수: {len(stack_data)}개")
        for stack_id, values in stack_data.items():
            print(f"  {stack_id}: {len(values)}개 데이터")
        
        # insight_generator 테스트
        print("\n\n=== InsightGenerator 테스트 ===")
        sys.path.insert(0, str(Path(__file__).parent))
        from insight_generator import InsightGenerator
        
        generator = InsightGenerator()
        result = generator._analyze_stack_contribution(all_rows)
        
        print(f"분석 결과:")
        print(f"  stack_count: {result.get('stack_count', 0)}")
        print(f"  outlier_stacks: {result.get('outlier_stacks', [])}")
        if 'overall' in result:
            print(f"  overall mean: {result['overall']['mean']}")
            print(f"  overall std: {result['overall']['std']}")
        
        print("\n✅ 테스트 성공!")
        
    else:
        print("❌ 데이터가 없습니다.")
    
    conn.close()
    
except Exception as e:
    import traceback
    print(f"\n❌ 오류 발생: {e}")
    print("\n상세 오류:")
    traceback.print_exc()
