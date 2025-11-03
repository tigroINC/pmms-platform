import sqlite3

conn = sqlite3.connect('../frontend/prisma/dev.db')
cursor = conn.cursor()

print("=== 고객사 목록 ===")
cursor.execute('SELECT id, name FROM Customer ORDER BY name')
customers = cursor.fetchall()
for row in customers:
    print(f"{row[0]}: {row[1]}")

print(f"\n총 {len(customers)}개 고객사")

# 고려아연 확인
cursor.execute("SELECT id, name FROM Customer WHERE name LIKE '%고려%'")
koryo = cursor.fetchall()
print(f"\n고려아연 관련: {len(koryo)}개")
for row in koryo:
    print(f"  - {row[0]}: {row[1]}")

conn.close()
