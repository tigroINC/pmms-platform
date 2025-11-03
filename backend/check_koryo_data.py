import sqlite3

conn = sqlite3.connect('../frontend/prisma/dev.db')
cursor = conn.cursor()

# 고려아연 ID
koryo_id = 'cmh8luyln0000tn34ox9whnuy'

print("=== 고려아연 정보 ===")
cursor.execute('SELECT id, name FROM Customer WHERE id = ?', (koryo_id,))
customer = cursor.fetchone()
print(f"고객사: {customer[1]} ({customer[0]})")

# 굴뚝 수
cursor.execute('SELECT COUNT(*) FROM Stack WHERE customerId = ?', (koryo_id,))
stack_count = cursor.fetchone()[0]
print(f"\n굴뚝 수: {stack_count}개")

if stack_count > 0:
    cursor.execute('SELECT id, name FROM Stack WHERE customerId = ? ORDER BY name', (koryo_id,))
    stacks = cursor.fetchall()
    for stack in stacks:
        print(f"  - {stack[1]} ({stack[0]})")

# 측정 데이터 수
cursor.execute('SELECT COUNT(*) FROM Measurement WHERE customerId = ?', (koryo_id,))
measurement_count = cursor.fetchone()[0]
print(f"\n측정 데이터: {measurement_count}건")

if measurement_count > 0:
    # 항목별 측정 수
    cursor.execute('''
        SELECT m.itemKey, i.name, COUNT(*) as cnt
        FROM Measurement m
        LEFT JOIN Item i ON m.itemKey = i.key
        WHERE m.customerId = ?
        GROUP BY m.itemKey
        ORDER BY cnt DESC
    ''', (koryo_id,))
    items = cursor.fetchall()
    print("\n항목별 측정 수:")
    for item in items:
        print(f"  - {item[1] or item[0]}: {item[2]}건")
    
    # 최근 측정 날짜
    cursor.execute('SELECT MAX(measuredAt) FROM Measurement WHERE customerId = ?', (koryo_id,))
    last_date = cursor.fetchone()[0]
    print(f"\n최근 측정일: {last_date}")

conn.close()
