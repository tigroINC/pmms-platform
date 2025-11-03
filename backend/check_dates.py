import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "frontend" / "prisma" / "dev.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

cursor.execute("""
    SELECT measuredAt, value 
    FROM Measurement 
    WHERE customerId = 'cmh8luyln0000tn34ox9whnuy' 
      AND itemKey = 'EA-I-0001'
    ORDER BY measuredAt
    LIMIT 10
""")

rows = cursor.fetchall()
print("=== 측정 데이터 샘플 ===")
for row in rows:
    print(f"measuredAt: {row[0]}, value: {row[1]}")

conn.close()
