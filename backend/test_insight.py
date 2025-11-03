import requests
import json

# API 엔드포인트
url = "http://localhost:8000/api/predict/insight"

# 테스트 데이터
data = {
    "customer_id": "cmh8luyln0000tn34ox9whnuy",
    "stack": "#A2020007",
    "item_key": "EA-I-0001",
    "periods": 30
}

print("=== AI 인사이트 보고서 생성 테스트 ===")
print(f"요청 데이터: {json.dumps(data, indent=2, ensure_ascii=False)}")
print("\n보고서 생성 중... (20-40초 소요)")

try:
    response = requests.post(url, json=data, timeout=120)
    
    if response.status_code == 200:
        result = response.json()
        report = result['insight_report']
        
        print("\n✅ 보고서 생성 성공!")
        print("\n" + "="*80)
        print(report['narrative'])
        print("="*80)
        
        print(f"\n\n📊 요약 정보:")
        print(f"  위험도: {report['summary']['risk']['level']} ({report['summary']['risk']['score']}/100)")
        print(f"  예측 추세: {report['summary']['prediction']['trend']}")
        print(f"  과거 추세: {report['summary']['trend']['historical_trend']}")
        
        if 'exceed_probability' in report['summary']['prediction']:
            print(f"  기준 초과 확률: {report['summary']['prediction']['exceed_probability']}%")
        
        print(f"\n💡 권장 사항:")
        for i, rec in enumerate(report['recommendations'], 1):
            print(f"  {i}. {rec}")
        
    else:
        print(f"\n❌ 보고서 생성 실패: {response.status_code}")
        print(f"응답 헤더: {response.headers}")
        try:
            error_detail = response.json()
            print("응답 본문 (JSON):")
            print(json.dumps(error_detail, indent=2, ensure_ascii=False))
        except:
            print("응답 본문 (텍스트):")
            print(response.text)
        
except Exception as e:
    print(f"\n❌ 오류 발생: {e}")
