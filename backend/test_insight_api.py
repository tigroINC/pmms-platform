"""
인사이트 API 테스트 - PDF 생성 확인
"""
import requests
import json

# API 엔드포인트
url = "http://localhost:8000/api/predict/insight"

# 테스트 데이터 (고려아연 먼지)
payload = {
    "customer_id": "cmh8luyln0000tn34ox9whnuy",
    "stack": "dummy",
    "item_key": "EA-I-0001",
    "periods": 30
}

print("=== 인사이트 보고서 API 테스트 ===")
print(f"URL: {url}")
print(f"Payload: {json.dumps(payload, indent=2, ensure_ascii=False)}")
print("\n요청 전송 중...")

try:
    response = requests.post(url, json=payload, timeout=60)
    
    print(f"\n응답 상태 코드: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        
        print("\n✅ API 호출 성공!")
        print(f"- 학습 데이터: {data.get('training_samples')}건")
        print(f"- 예측 데이터: {len(data.get('predictions', []))}개")
        
        # PDF 생성 여부 확인
        pdf_base64 = data.get('pdf_base64')
        if pdf_base64:
            print(f"\n✅ PDF 생성 성공!")
            print(f"- PDF 크기: {len(pdf_base64)} bytes (base64)")
            print(f"- 실제 크기: 약 {len(pdf_base64) * 3 // 4} bytes")
        else:
            print(f"\n❌ PDF 생성 실패!")
            print("- pdf_base64 필드가 None 또는 없음")
            
        # 보고서 정보
        report = data.get('insight_report', {})
        print(f"\n보고서 정보:")
        print(f"- 고객사: {report.get('customer')}")
        print(f"- 항목: {report.get('item')}")
        print(f"- 생성일: {report.get('report_date')}")
        
    else:
        print(f"\n❌ API 호출 실패!")
        print(f"응답: {response.text}")
        
except requests.exceptions.Timeout:
    print("\n❌ 타임아웃 발생 (60초 초과)")
except Exception as e:
    print(f"\n❌ 오류 발생: {e}")
