import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import get_db

def check_connections():
    db = next(get_db())
    
    print("=== 고객사 목록 ===")
    customers = db.execute("SELECT id, name FROM Customer").fetchall()
    for c in customers:
        print(f"ID: {c[0]}, Name: {c[1]}")
    
    print("\n=== 환경측정기업 목록 ===")
    orgs = db.execute("SELECT id, name FROM Organization").fetchall()
    for o in orgs:
        print(f"ID: {o[0]}, Name: {o[1]}")
    
    print("\n=== CustomerOrganization 연결 ===")
    connections = db.execute("""
        SELECT co.id, c.name as customer_name, o.name as org_name, co.status, co.nickname
        FROM CustomerOrganization co
        JOIN Customer c ON co.customerId = c.id
        JOIN Organization o ON co.organizationId = o.id
    """).fetchall()
    
    if not connections:
        print("연결이 없습니다!")
    else:
        for conn in connections:
            print(f"ID: {conn[0]}, Customer: {conn[1]}, Org: {conn[2]}, Status: {conn[3]}, Nickname: {conn[4]}")
    
    print("\n=== 고려아연 사용자 확인 ===")
    users = db.execute("""
        SELECT u.id, u.email, u.name, u.role, c.name as customer_name
        FROM User u
        LEFT JOIN Customer c ON u.customerId = c.id
        WHERE u.email LIKE '%koreazinc%'
    """).fetchall()
    
    for u in users:
        print(f"Email: {u[1]}, Name: {u[2]}, Role: {u[3]}, Customer: {u[4]}")

if __name__ == "__main__":
    check_connections()
