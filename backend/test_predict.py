import requests
import json

# API 엔드포인트
url = "http://localhost:8000/api/predict"

# 테스트 데이터
data = {
    "customer_id": "cmh8luyln0000tn34ox9whnuy",
    "stack": "#A2020007",
    "item_key": "EA-I-0001",
    "periods": 30
}

print("=== AutoML 예측 테스트 시작 ===")
print(f"요청 데이터: {json.dumps(data, indent=2, ensure_ascii=False)}")
print("\n예측 중... (10-30초 소요)")

try:
    response = requests.post(url, json=data, timeout=120)
    
    if response.status_code == 200:
        result = response.json()
        print("\n✅ 예측 성공!")
        print(f"\n모델 타입: {result['model_info']['model_type']}")
        print(f"학습 데이터: {result['training_samples']}개")
        print(f"AutoML 튜닝: {result['model_info']['auto_tuned']}")
        
        if 'accuracy_metrics' in result and result['accuracy_metrics']:
            print(f"\n정확도 지표:")
            print(f"  RMSE: {result['accuracy_metrics'].get('rmse', 'N/A')}")
            print(f"  MAE: {result['accuracy_metrics'].get('mae', 'N/A')}")
            print(f"  MAPE: {result['accuracy_metrics'].get('mape', 'N/A')}%")
            print(f"  R²: {result['accuracy_metrics'].get('r2', 'N/A')}")
        
        print(f"\n예측 결과 (처음 5개):")
        for i, pred in enumerate(result['predictions'][:5]):
            print(f"  {pred['date']}: {pred['predicted_value']} (범위: {pred['lower_bound']} ~ {pred['upper_bound']})")
        
        print(f"\n총 예측 개수: {len(result['predictions'])}개")
        
    else:
        print(f"\n❌ 예측 실패: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"\n❌ 오류 발생: {e}")
