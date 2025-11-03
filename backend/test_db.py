import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "frontend" / "prisma" / "dev.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# 고객사 확인
print("=== 고객사 목록 ===")
cursor.execute("SELECT id, name FROM Customer LIMIT 5")
customers = cursor.fetchall()
for c in customers:
    print(f"ID: {c[0]}, Name: {c[1]}")

if customers:
    customer_id = customers[0][0]
    print(f"\n=== 선택된 고객사: {customers[0][1]} ===")
    
    # 굴뚝 확인
    print("\n=== 굴뚝 목록 ===")
    cursor.execute("SELECT id, name FROM Stack WHERE customerId = ? LIMIT 5", (customer_id,))
    stacks = cursor.fetchall()
    for s in stacks:
        print(f"ID: {s[0]}, Name: {s[1]}")
    
    if stacks:
        stack_name = stacks[0][1]
        print(f"\n=== 선택된 굴뚝: {stack_name} ===")
        
        # 측정항목 확인
        print("\n=== 측정항목 목록 ===")
        cursor.execute("SELECT DISTINCT itemKey FROM Measurement WHERE customerId = ? LIMIT 5", (customer_id,))
        items = cursor.fetchall()
        for i in items:
            print(f"ItemKey: {i[0]}")
        
        if items:
            item_key = items[0][0]
            print(f"\n=== 선택된 항목: {item_key} ===")
            
            # 측정 데이터 개수 확인
            cursor.execute("""
                SELECT COUNT(*) 
                FROM Measurement 
                WHERE customerId = ? AND itemKey = ?
            """, (customer_id, item_key))
            count = cursor.fetchone()[0]
            print(f"\n측정 데이터 개수: {count}개")
            
            print(f"\n=== 테스트 예측 요청 ===")
            print(f"customer_id: {customer_id}")
            print(f"stack: {stack_name}")
            print(f"item_key: {item_key}")

conn.close()
