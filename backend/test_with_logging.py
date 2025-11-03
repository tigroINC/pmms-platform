"""
로깅과 함께 API 테스트
"""
import requests
import json
import time

url = "http://localhost:8000/api/predict/insight"
payload = {
    "customer_id": "cmh8luyln0000tn34ox9whnuy",
    "stack": "dummy",
    "item_key": "EA-I-0001",
    "periods": 30
}

print("=== API 호출 시작 ===")
print("서버 로그를 확인하세요...")
print()

start = time.time()
response = requests.post(url, json=payload, timeout=120)
elapsed = time.time() - start

print(f"응답 시간: {elapsed:.2f}초")
print(f"상태 코드: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    pdf = data.get('pdf_base64')
    
    if pdf:
        print(f"✅ PDF 생성 성공! (크기: {len(pdf)} chars)")
    else:
        print(f"❌ PDF 없음 (pdf_base64 = {pdf})")
        
    # 응답 키 확인
    print(f"\n응답 키: {list(data.keys())}")
else:
    print(f"에러: {response.text}")
