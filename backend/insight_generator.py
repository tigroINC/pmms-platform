"""
AI 기반 예측 인사이트 보고서 생성기
- 예측 결과 분석
- 트렌드 분석
- 위험도 평가
- 자연어 보고서 생성
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class InsightGenerator:
    """
    예측 결과를 분석하여 인사이트 보고서 생성
    """
    
    def __init__(self):
        self.insights = []
    
    def generate_report(
        self,
        predictions: List[Dict],
        historical_data: pd.DataFrame,
        raw_data: List[Any],
        model_info: Dict,
        accuracy_metrics: Dict,
        customer_name: str,
        item_name: str,
        limit_value: float = None,
        chart_image: str = None
    ) -> Dict[str, Any]:
        """
        종합 인사이트 보고서 생성
        """
        try:
            # 1. 과거 데이터 분석
            historical_analysis = self._analyze_historical_data(historical_data)
            
            # 2. 예측 결과 분석
            prediction_analysis = self._analyze_predictions(predictions, limit_value)
            
            # 3. 트렌드 분석
            trend_analysis = self._analyze_trend(historical_data, predictions)
            
            # 4. 위험도 평가
            risk_assessment = self._assess_risk(predictions, limit_value, historical_data)
            
            # 5. 영향 요인 분석
            influence_factors = self._analyze_influence_factors(model_info)
            
            # 6. 환경변수 상관관계 분석
            correlation_analysis = self._analyze_correlation(historical_data)
            
            # 7. 굴뚝별 기여도 분석
            try:
                stack_contribution = self._analyze_stack_contribution(raw_data)
                logger.info(f"Stack contribution analysis completed: {stack_contribution.get('stack_count', 0)} stacks")
            except Exception as e:
                logger.error(f"Stack contribution analysis failed: {e}", exc_info=True)
                stack_contribution = {}
            
            # 8. 자연어 보고서 생성
            narrative_report = self._generate_narrative(
                customer_name,
                item_name,
                historical_analysis,
                prediction_analysis,
                trend_analysis,
                risk_assessment,
                influence_factors,
                correlation_analysis,
                stack_contribution,
                accuracy_metrics,
                chart_image
            )
            
            return {
                "report_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "customer": customer_name,
                "item": item_name,
                "summary": {
                    "historical": historical_analysis,
                    "prediction": prediction_analysis,
                    "trend": trend_analysis,
                    "risk": risk_assessment,
                    "influence_factors": influence_factors,
                    "correlation": correlation_analysis,
                    "stack_contribution": stack_contribution
                },
                "narrative": narrative_report,
                "accuracy_metrics": accuracy_metrics,
                "recommendations": self._generate_recommendations(risk_assessment, trend_analysis)
            }
            
        except Exception as e:
            logger.error(f"Report generation failed: {e}")
            raise
    
    def _analyze_historical_data(self, df: pd.DataFrame) -> Dict:
        """과거 데이터 분석"""
        values = df['y'].values
        
        return {
            "period": f"{df['ds'].min().strftime('%Y-%m-%d')} ~ {df['ds'].max().strftime('%Y-%m-%d')}",
            "data_count": len(values),
            "average": round(float(np.mean(values)), 2),
            "std_dev": round(float(np.std(values)), 2),
            "min": round(float(np.min(values)), 2),
            "max": round(float(np.max(values)), 2),
            "median": round(float(np.median(values)), 2),
            "trend": "증가" if values[-1] > values[0] else "감소" if values[-1] < values[0] else "안정",
            "volatility": "높음" if np.std(values) > np.mean(values) * 0.5 else "보통" if np.std(values) > np.mean(values) * 0.2 else "낮음"
        }
    
    def _analyze_predictions(self, predictions: List[Dict], limit_value: float = None) -> Dict:
        """예측 결과 분석"""
        pred_values = [p['predicted_value'] for p in predictions]
        lower_bounds = [p['lower_bound'] for p in predictions]
        upper_bounds = [p['upper_bound'] for p in predictions]
        
        analysis = {
            "period": f"{predictions[0]['date']} ~ {predictions[-1]['date']}",
            "average": round(float(np.mean(pred_values)), 2),
            "min": round(float(np.min(pred_values)), 2),
            "max": round(float(np.max(pred_values)), 2),
            "trend": "상승" if pred_values[-1] > pred_values[0] else "하락" if pred_values[-1] < pred_values[0] else "안정",
            "uncertainty_avg": round(float(np.mean([u - l for u, l in zip(upper_bounds, lower_bounds)])), 2)
        }
        
        if limit_value:
            exceed_count = sum(1 for v in pred_values if v > limit_value)
            exceed_prob = exceed_count / len(pred_values) * 100
            analysis["limit_value"] = limit_value
            analysis["exceed_probability"] = round(exceed_prob, 1)
            analysis["exceed_days"] = exceed_count
        
        return analysis
    
    def _analyze_trend(self, historical: pd.DataFrame, predictions: List[Dict]) -> Dict:
        """트렌드 분석 - 과거 평균 대비 예측 평균 비교"""
        hist_values = historical['y'].values
        pred_values = [p['predicted_value'] for p in predictions]
        
        # 과거 평균
        hist_mean = np.mean(hist_values)
        
        # 예측 평균
        pred_mean = np.mean(pred_values)
        
        # 평균 변화율
        change_rate = ((pred_mean - hist_mean) / hist_mean * 100) if hist_mean != 0 else 0
        
        # 추세 판단 (5% 이상 변화를 의미있는 변화로 간주)
        threshold = 5.0
        
        if change_rate > threshold:
            overall_trend = "상승"
        elif change_rate < -threshold:
            overall_trend = "하락"
        else:
            overall_trend = "안정"
        
        # 예측 기간 내 선형 추세 (참고용)
        pred_trend_slope = np.polyfit(range(len(pred_values)), pred_values, 1)[0]
        
        return {
            "historical_mean": round(float(hist_mean), 2),
            "prediction_mean": round(float(pred_mean), 2),
            "change_rate": round(float(change_rate), 1),
            "trend": overall_trend,
            "prediction_slope": round(float(pred_trend_slope), 3)
        }
    
    def _assess_risk(self, predictions: List[Dict], limit_value: float, historical: pd.DataFrame) -> Dict:
        """위험도 평가"""
        pred_values = [p['predicted_value'] for p in predictions]
        upper_bounds = [p['upper_bound'] for p in predictions]
        
        if not limit_value:
            return {
                "level": "정보없음",
                "score": 0,
                "description": "배출허용기준이 설정되지 않았습니다."
            }
        
        # 위험도 점수 계산
        risk_score = 0
        
        # 1. 예측값이 기준 초과
        exceed_count = sum(1 for v in pred_values if v > limit_value)
        if exceed_count > 0:
            risk_score += (exceed_count / len(pred_values)) * 40
        
        # 2. 신뢰구간 상한이 기준 초과
        upper_exceed = sum(1 for u in upper_bounds if u > limit_value)
        if upper_exceed > 0:
            risk_score += (upper_exceed / len(upper_bounds)) * 30
        
        # 3. 상승 추세
        if pred_values[-1] > pred_values[0]:
            risk_score += 20
        
        # 4. 과거 초과 이력
        hist_exceed = sum(1 for v in historical['y'].values if v > limit_value)
        if hist_exceed > 0:
            risk_score += (hist_exceed / len(historical)) * 10
        
        # 위험도 레벨 결정
        if risk_score >= 70:
            level = "매우 높음"
            color = "red"
        elif risk_score >= 50:
            level = "높음"
            color = "orange"
        elif risk_score >= 30:
            level = "보통"
            color = "yellow"
        else:
            level = "낮음"
            color = "green"
        
        return {
            "level": level,
            "score": round(risk_score, 1),
            "color": color,
            "exceed_probability": round((exceed_count / len(pred_values)) * 100, 1),
            "description": self._get_risk_description(level, exceed_count, len(pred_values))
        }
    
    def _get_risk_description(self, level: str, exceed_count: int, total_days: int) -> str:
        """위험도 설명"""
        if level == "매우 높음":
            return f"향후 {total_days}일 중 {exceed_count}일 기준 초과 예상. 즉각적인 조치 필요."
        elif level == "높음":
            return f"향후 {total_days}일 중 {exceed_count}일 기준 초과 가능성. 주의 필요."
        elif level == "보통":
            return f"일부 기간 기준 초과 가능성 있음. 모니터링 권장."
        else:
            return f"배출허용기준 이내 유지 예상. 정상 관리 지속."
    
    def _analyze_stack_contribution(self, raw_data: List[Any]) -> Dict:
        """굴뚝별 데이터 기여도 및 이상치 분석"""
        try:
            if not raw_data:
                return {}
            
            logger.info(f"Analyzing stack contribution for {len(raw_data)} data points")
            
            # 굴뚝별 데이터 그룹화 (이름 사용)
            stack_data = {}
            stack_id_to_name = {}  # ID -> 이름 매핑
            
            for row in raw_data:
                # sqlite3.Row 객체를 dict로 변환
                if hasattr(row, 'keys'):
                    row_dict = dict(row)
                else:
                    row_dict = row
                
                stack_id = row_dict.get('stackId') or row_dict.get('stack_id')
                stack_name = row_dict.get('stack_name') or row_dict.get('stackName')
                
                if not stack_id:
                    stack_id = 'Unknown'
                if not stack_name:
                    stack_name = stack_id  # 이름이 없으면 ID 사용
                
                # ID -> 이름 매핑 저장
                stack_id_to_name[stack_id] = stack_name
                
                value = row_dict.get('value')
                
                if value is not None:
                    try:
                        if stack_name not in stack_data:
                            stack_data[stack_name] = []
                        stack_data[stack_name].append(float(value))
                    except (ValueError, TypeError):
                        continue
            
            if not stack_data:
                return {}
            
            # 전체 통계
            all_values = []
            for values in stack_data.values():
                all_values.extend(values)
            
            overall_mean = np.mean(all_values)
            overall_std = np.std(all_values)
            overall_median = np.median(all_values)
            
            # 굴뚝별 분석
            stack_analysis = {}
            outlier_stacks = []
            
            for stack_name, values in stack_data.items():
                stack_mean = np.mean(values)
                stack_std = np.std(values)
                stack_max = np.max(values)
                stack_count = len(values)
                
                # 전체 대비 편차
                deviation_pct = ((stack_mean - overall_mean) / overall_mean * 100) if overall_mean != 0 else 0
                
                # 이상치 판정 (평균이 전체 평균 + 1.5*표준편차 이상)
                is_outlier = stack_mean > (overall_mean + 1.5 * overall_std)
                
                # 고농도 데이터 비율 (전체 상위 10% 기준)
                high_threshold = np.percentile(all_values, 90)
                high_count = sum(1 for v in values if v > high_threshold)
                high_ratio = (high_count / stack_count * 100) if stack_count > 0 else 0
                
                stack_analysis[stack_name] = {
                    'count': stack_count,
                    'mean': round(float(stack_mean), 2),
                    'std': round(float(stack_std), 2),
                    'max': round(float(stack_max), 2),
                    'deviation_pct': round(float(deviation_pct), 1),
                    'is_outlier': bool(is_outlier),  # numpy bool을 Python bool로 변환
                    'high_ratio': round(float(high_ratio), 1),
                    'contribution_pct': round(float(stack_count / len(all_values) * 100), 1)
                }
                
                if is_outlier:
                    outlier_stacks.append(stack_name)
            
            return {
                'overall': {
                    'mean': round(float(overall_mean), 2),
                    'std': round(float(overall_std), 2),
                    'median': round(float(overall_median), 2),
                    'total_count': len(all_values)
                },
                'stacks': stack_analysis,
                'outlier_stacks': outlier_stacks,
                'stack_count': len(stack_data)
            }
        except Exception as e:
            logger.error(f"Stack contribution analysis failed: {e}")
            return {}
    
    def _analyze_correlation(self, df: pd.DataFrame) -> Dict:
        """환경변수와 배출농도 간 상관관계 분석"""
        correlations = {}
        
        # 환경변수 목록
        env_vars = {
            'temp': '기온',
            'humidity': '습도',
            'wind_speed': '풍속',
            'gas_temp': '배가스온도',
            'o2_measured': '산소농도'
        }
        
        for var_key, var_name in env_vars.items():
            if var_key in df.columns:
                # 결측치 제거 후 상관계수 계산
                valid_data = df[['y', var_key]].dropna()
                if len(valid_data) > 10:
                    corr = valid_data['y'].corr(valid_data[var_key])
                    correlations[var_name] = {
                        'coefficient': round(float(corr), 3),
                        'strength': self._interpret_correlation(corr),
                        'direction': '양의 상관관계' if corr > 0 else '음의 상관관계' if corr < 0 else '무상관'
                    }
        
        # 이상치 분석 (상위 10% 값)
        high_values = df[df['y'] > df['y'].quantile(0.9)]
        if len(high_values) > 5:
            anomaly_analysis = {}
            for var_key, var_name in env_vars.items():
                if var_key in df.columns:
                    normal_mean = df[var_key].mean()
                    high_mean = high_values[var_key].mean()
                    if not pd.isna(normal_mean) and not pd.isna(high_mean):
                        diff_pct = ((high_mean - normal_mean) / normal_mean * 100) if normal_mean != 0 else 0
                        anomaly_analysis[var_name] = {
                            'normal_avg': round(float(normal_mean), 2),
                            'high_avg': round(float(high_mean), 2),
                            'difference_pct': round(float(diff_pct), 1)
                        }
            correlations['anomaly_analysis'] = anomaly_analysis
        
        return correlations
    
    def _interpret_correlation(self, corr: float) -> str:
        """상관계수 해석"""
        abs_corr = abs(corr)
        if abs_corr >= 0.7:
            return "매우 강함"
        elif abs_corr >= 0.5:
            return "강함"
        elif abs_corr >= 0.3:
            return "보통"
        elif abs_corr >= 0.1:
            return "약함"
        else:
            return "매우 약함"
    
    def _analyze_influence_factors(self, model_info: Dict) -> List[Dict]:
        """영향 요인 분석"""
        factors = []
        
        # Prophet 모델의 주요 특성
        features = model_info.get('features', [])
        
        if '계절성' in features:
            factors.append({
                "factor": "계절성 패턴",
                "impact": "높음",
                "description": "연간 또는 주간 반복 패턴이 예측에 반영되었습니다."
            })
        
        if '트렌드' in features:
            factors.append({
                "factor": "장기 트렌드",
                "impact": "높음",
                "description": "과거 데이터의 장기적인 증감 추세가 반영되었습니다."
            })
        
        if '외부변수' in features:
            factors.append({
                "factor": "기상 조건",
                "impact": "중간",
                "description": "기온, 습도, 풍속 등 기상 데이터가 예측에 활용되었습니다."
            })
        
        # AutoML 튜닝 정보
        if model_info.get('auto_tuned'):
            factors.append({
                "factor": "AutoML 최적화",
                "impact": "높음",
                "description": "20가지 모델 조합 중 최적 파라미터가 자동 선택되었습니다."
            })
        
        return factors
    
    def _generate_narrative(
        self,
        customer: str,
        item: str,
        historical: Dict,
        prediction: Dict,
        trend: Dict,
        risk: Dict,
        factors: List[Dict],
        correlation: Dict,
        stack_contribution: Dict,
        metrics: Dict,
        chart_image: str = None
    ) -> str:
        """자연어 보고서 생성 - 두괄식 구조"""
        
        # 차트 이미지 HTML
        chart_html = ""
        if chart_image:
            chart_html = f"""
<div style="margin: 20px 0; text-align: center;">
<h2 style="color: #1e40af; margin-bottom: 15px;">📊 측정 데이터 추이 및 예측</h2>
<img src="data:image/png;base64,{chart_image}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
</div>
"""
        
        report = f"""
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px;" class="report-main">

<h1 style="color: #1e40af; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-top: 0;">📋 {customer} - {item} 예측 분석 보고서</h1>

{chart_html}

<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin: 20px 0;">

<h2 style="margin: 0; color: white;">🎯 종합 분석 결과 (Executive Summary)</h2>

</div>

<div style="border: 3px solid #667eea; border-radius: 10px; padding: 25px; margin: 20px 0; background-color: #f8f9ff;">

<h3>📊 핵심 요약</h3>

<p><strong>분석 기간</strong>: {historical['period']} ({historical['data_count']}회 측정)<br>
<strong>예측 기간</strong>: {prediction['period']} (향후 30일)</p>

<table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
<tr style="background-color: #667eea; color: white;">
<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">구분</th>
<th style="padding: 12px; text-align: center; border: 1px solid #ddd;">과거 평균</th>
<th style="padding: 12px; text-align: center; border: 1px solid #ddd;">예측 평균</th>
<th style="padding: 12px; text-align: center; border: 1px solid #ddd;">추세</th>
</tr>
<tr style="background-color: white;">
<td style="padding: 12px; border: 1px solid #ddd;"><strong>배출 농도</strong></td>
<td style="padding: 12px; text-align: center; border: 1px solid #ddd;">{trend['historical_mean']} mg/S㎥</td>
<td style="padding: 12px; text-align: center; border: 1px solid #ddd;">{trend['prediction_mean']} mg/S㎥</td>
<td style="padding: 12px; text-align: center; border: 1px solid #ddd;"><strong style="color: {'#4caf50' if trend['trend'] == '하락' else '#ff9800' if trend['trend'] == '상승' else '#666'};">{trend['trend']}</strong> ({trend['change_rate']:+.1f}%)</td>
</tr>
</table>

<h3>⚠️ 위험도 평가</h3>

<div style="background-color: {'#ff4444' if risk['level'] == '매우 높음' else '#ff9800' if risk['level'] == '높음' else '#ffc107' if risk['level'] == '보통' else '#4caf50'}; color: white; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center;">
<h3 style="margin: 0; font-size: 24px; color: white;">위험 수준: {risk['level']}</h3>
<p style="margin: 10px 0 0 0; font-size: 18px;">점수: {risk['score']}/100</p>
</div>

<p><strong>평가 근거</strong>: {risk['description']}</p>

</div>

<div style="border: 3px solid #4caf50; border-radius: 10px; padding: 25px; margin: 20px 0; background-color: #f1f8f4;">

<h3>🔮 AI 예측 결과 요약</h3>

<ul>
<li><strong>예측 평균 농도</strong>: {trend['prediction_mean']} mg/S㎥</li>
<li><strong>예측 범위</strong>: {prediction['min']} ~ {prediction['max']} mg/S㎥</li>
<li><strong>과거 대비 변화</strong>: {trend['change_rate']:+.1f}% ({trend['trend']})</li>
<li><strong>불확실성</strong>: ±{prediction['uncertainty_avg']} mg/S㎥</li>
</ul>
"""

        # 예측 추세 해석
        if trend['trend'] == "상승":
            report += f"""
<p><strong>해석</strong>: AI 모델은 향후 30일간 배출 농도가 과거 평균({trend['historical_mean']} mg/S㎥) 대비 <strong>{trend['change_rate']:+.1f}% 상승</strong>할 것으로 예측합니다.
현재 추세가 지속될 경우 배출 농도가 점진적으로 증가할 수 있으므로, 사전 대응이 필요합니다.</p>
"""
        elif trend['trend'] == "하락":
            report += f"""
<p><strong>해석</strong>: AI 모델은 향후 30일간 배출 농도가 과거 평균({trend['historical_mean']} mg/S㎥) 대비 <strong>{trend['change_rate']:+.1f}% 하락</strong>할 것으로 예측합니다.
현재의 배출 저감 노력이 지속적인 효과를 나타낼 것으로 판단됩니다.</p>
"""
        else:
            report += f"""
<p><strong>해석</strong>: AI 모델은 향후 30일간 배출 농도가 과거 평균({trend['historical_mean']} mg/S㎥) 대비 <strong>안정적으로 유지</strong>될 것으로 예측합니다 (변화율: {trend['change_rate']:+.1f}%).
현재 수준의 배출 관리를 지속하시면 됩니다.</p>
"""
        
        # 배출허용기준 대비 분석 (종합 섹션에 포함)
        if 'limit_value' in prediction:
            report += f"""

<h3>📋 배출허용기준 대비</h3>

<table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
<tr style="background-color: #667eea; color: white;">
<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">항목</th>
<th style="padding: 12px; text-align: center; border: 1px solid #ddd;">값</th>
</tr>
<tr style="background-color: white;">
<td style="padding: 12px; border: 1px solid #ddd;">배출허용기준</td>
<td style="padding: 12px; text-align: center; border: 1px solid #ddd;"><strong>{prediction['limit_value']} mg/S㎥</strong></td>
</tr>
<tr style="background-color: #f5f5f5;">
<td style="padding: 12px; border: 1px solid #ddd;">기준 초과 예상 일수</td>
<td style="padding: 12px; text-align: center; border: 1px solid #ddd;"><strong>{prediction['exceed_days']}일 / 30일</strong></td>
</tr>
<tr style="background-color: white;">
<td style="padding: 12px; border: 1px solid #ddd;">기준 초과 확률</td>
<td style="padding: 12px; text-align: center; border: 1px solid #ddd;"><strong style="color: {'#ff4444' if prediction['exceed_probability'] > 50 else '#ff9800' if prediction['exceed_probability'] > 20 else '#4caf50'};">{prediction['exceed_probability']}%</strong></td>
</tr>
</table>
"""
            
            # 기준 초과 해석
            if prediction['exceed_probability'] > 50:
                report += f"""
<div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 15px 0;">
<strong>⚠️ 주의</strong>: 예측 기간 중 {prediction['exceed_days']}일 동안 배출허용기준을 초과할 것으로 예상됩니다.
이는 전체 기간의 {prediction['exceed_probability']}%에 해당하는 높은 비율입니다.
배출 저감 조치를 즉시 시행하여 기준 초과를 방지해야 합니다.
</div>
"""
            elif prediction['exceed_probability'] > 20:
                report += f"""
<div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 15px 0;">
<strong>주의</strong>: 예측 기간 중 일부 기간({prediction['exceed_days']}일)에 배출허용기준 초과 가능성이 있습니다.
기준 초과 확률이 {prediction['exceed_probability']}%로 나타나, 예방적 관리가 필요합니다.
</div>
"""
            elif prediction['exceed_probability'] > 0:
                report += f"""
<div style="background-color: #fffde7; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0;">
예측 기간 중 소수의 일자({prediction['exceed_days']}일)에서 기준 초과 가능성이 있으나, 전체적으로는 안정적입니다.
정기적인 모니터링을 통해 관리하시면 됩니다.
</div>
"""
            else:
                report += f"""
<div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 15px 0;">
<strong>✅ 양호</strong>: 예측 기간 전체에서 배출허용기준 이내로 유지될 것으로 예상됩니다.
현재의 배출 관리 수준이 우수한 것으로 평가됩니다.
</div>
"""
        
        report += """

</div>

<div style="border: 3px solid #ff9800; border-radius: 10px; padding: 25px; margin: 20px 0; background-color: #fff8f0;">

<h3>💡 권장 조치사항</h3>

"""
        
        # 위험도별 권장 조치
        if risk['level'] in ["매우 높음", "높음"]:
            report += """
<ol style="line-height: 1.8;">
<li><strong>배출 저감 설비 긴급 점검</strong>: 집진기, 탈황설비 등의 작동 상태 확인</li>
<li><strong>공정 운영 조건 재검토</strong>: 연료 사용량, 가동 시간 등 조정 검토</li>
<li><strong>측정 빈도 증가</strong>: 일일 또는 주 2-3회 측정으로 변경</li>
<li><strong>관련 부서 사전 협의</strong>: 환경안전팀, 생산팀 간 대응 방안 논의</li>
<li><strong>비상 저감 계획 수립</strong>: 기준 초과 시 즉시 시행할 수 있는 조치 마련</li>
</ol>
"""
        elif risk['level'] == "보통":
            report += """
<ol style="line-height: 1.8;">
<li><strong>정기 점검 강화</strong>: 배출 저감 설비의 정기 점검 주기 준수</li>
<li><strong>모니터링 지속</strong>: 현재 수준의 측정 빈도 유지</li>
<li><strong>예방 정비 계획</strong>: 설비 노후화에 대비한 예방 정비 일정 수립</li>
</ol>
"""
        else:
            report += """
<ol style="line-height: 1.8;">
<li><strong>현재 관리 수준 유지</strong>: 우수한 배출 관리 상태를 지속적으로 유지</li>
<li><strong>정기 모니터링</strong>: 정기적인 측정과 설비 점검 지속</li>
<li><strong>예방적 관리</strong>: 안정적인 배출 상태 유지를 위한 예방적 관리</li>
</ol>
"""
        
        report += f"""

</div>

<hr style="border: none; border-top: 2px solid #e5e7eb; margin: 30px 0;">

<div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 20px; border-radius: 10px; margin: 20px 0;">

<h2 style="margin: 0;">📑 상세 분석 (Detailed Analysis)</h2>

</div>

<div style="border: 2px solid #e0e0e0; border-radius: 10px; padding: 25px; margin: 20px 0; background-color: #fafafa;">

<h2>📈 과거 데이터 분석</h2>

<h3>분석 기간</h3>
<p>{historical['period']} ({historical['data_count']}회 측정)</p>

<h3>측정 현황 상세</h3>
<ul>
<li><strong>평균 농도</strong>: {historical['average']} mg/S㎥</li>
<li><strong>표준편차</strong>: {historical['std_dev']} mg/S㎥</li>
<li><strong>최소값</strong>: {historical['min']} mg/S㎥</li>
<li><strong>최대값</strong>: {historical['max']} mg/S㎥</li>
<li><strong>중앙값</strong>: {historical['median']} mg/S㎥</li>
<li><strong>변동성</strong>: {historical['volatility']}</li>
</ul>

<h3>해석</h3>
<p>분석 기간 동안 총 {historical['data_count']}회의 측정이 이루어졌습니다. 
평균 배출 농도는 {historical['average']} mg/S㎥이며, 최소 {historical['min']} mg/S㎥에서 최대 {historical['max']} mg/S㎥까지 측정되었습니다.</p>
"""
        
        # 변동성 해석
        if historical['volatility'] == "높음":
            report += f"""
<p>데이터의 표준편차가 {historical['std_dev']} mg/S㎥로, 평균 대비 변동폭이 큰 편입니다.
이는 배출 농도가 시간에 따라 불규칙하게 변화하고 있음을 의미합니다.
배출 공정의 안정성을 검토하고, 변동 원인을 파악하는 것이 필요합니다.</p>
"""
        elif historical['volatility'] == "보통":
            report += f"""
<p>데이터의 표준편차가 {historical['std_dev']} mg/S㎥로, 보통 수준의 변동성을 보이고 있습니다.
일반적인 배출 패턴으로 판단되며, 현재 관리 수준을 유지하시면 됩니다.</p>
"""
        else:
            report += f"""
<p>데이터의 표준편차가 {historical['std_dev']} mg/S㎥로, 변동폭이 작아 안정적인 배출 상태를 유지하고 있습니다.
우수한 배출 관리 상태로 평가됩니다.</p>
"""

        # 추세 해석
        if historical['trend'] == "증가":
            report += f"""
<p><strong>추세 분석</strong>: 분석 기간 동안 배출 농도가 <strong>증가하는 추세</strong>를 보이고 있습니다.
이는 배출원의 활동이 증가하거나, 저감 설비의 효율이 저하되고 있을 가능성을 시사합니다.</p>
"""
        elif historical['trend'] == "감소":
            report += f"""
<p><strong>추세 분석</strong>: 분석 기간 동안 배출 농도가 <strong>감소하는 추세</strong>를 보이고 있습니다.
이는 배출 저감 노력이 효과를 보고 있거나, 배출원의 활동이 감소하고 있음을 의미합니다.</p>
"""
        else:
            report += f"""
<p><strong>추세 분석</strong>: 분석 기간 동안 배출 농도가 <strong>안정적으로 유지</strong>되고 있습니다.
현재의 배출 관리 수준이 적절하게 유지되고 있는 것으로 판단됩니다.</p>
"""

        report += """

</div>
"""
        
        # 굴뚝별 기여도 분석 섹션 (상세 분석으로 이동)
        if stack_contribution and stack_contribution.get('stack_count', 0) > 1:
            report += """

<div style="border: 2px solid #e0e0e0; border-radius: 10px; padding: 25px; margin: 20px 0; background-color: #fafafa;">

<h2>🏭 굴뚝별 데이터 기여도 분석</h2>

<h3>개요</h3>
<p>본 예측은 고객사 전체 굴뚝의 데이터를 통합하여 수행되었습니다.
각 굴뚝별 데이터 특성과 전체 예측에 미치는 영향을 분석하였습니다.</p>

"""
            overall = stack_contribution['overall']
            stacks = stack_contribution['stacks']
            outlier_stacks = stack_contribution.get('outlier_stacks', [])
            
            report += f"""
<h3>전체 통계</h3>
<ul>
<li><strong>총 데이터</strong>: {overall['total_count']}건</li>
<li><strong>평균 농도</strong>: {overall['mean']} mg/S㎥</li>
<li><strong>표준편차</strong>: {overall['std']} mg/S㎥</li>
<li><strong>중앙값</strong>: {overall['median']} mg/S㎥</li>
<li><strong>분석 굴뚝 수</strong>: {stack_contribution['stack_count']}개</li>
</ul>

<h3>굴뚝별 상세 분석 (상위 10개)</h3>

<p>평균 배출 농도가 높은 상위 10개 굴뚝의 상세 정보입니다:</p>

"""
            
            # 굴뚝을 평균 농도 기준으로 정렬 (상위 10개만 표시)
            sorted_stacks = sorted(stacks.items(), key=lambda x: x[1]['mean'], reverse=True)
            top_stacks = sorted_stacks[:10]  # 상위 10개만
            
            for stack_name, data in top_stacks:
                is_outlier = data['is_outlier']
                deviation = data['deviation_pct']
                
                report += f"""
<div style="background-color: #f9fafb; border-left: 4px solid {'#ef4444' if is_outlier else '#3b82f6'}; padding: 15px; margin: 10px 0;">
<h4 style="margin-top: 0;">{stack_name}</h4>
<ul>
<li>데이터 건수: {data['count']}건 (전체의 {data['contribution_pct']}%)</li>
<li>평균 농도: {data['mean']} mg/S㎥</li>
<li>최대 농도: {data['max']} mg/S㎥</li>
<li>전체 평균 대비: {deviation:+.1f}%</li>
<li>고농도 데이터 비율: {data['high_ratio']}%</li>
"""
                
                # 해석
                if is_outlier:
                    report += f"<li><strong style='color: #ef4444;'>⚠️ 이상치 굴뚝</strong>: 이 굴뚝의 평균 배출 농도가 전체 평균보다 현저히 높습니다.</li>"
                    if abs(deviation) >= 50:
                        report += f"<li><strong>영향도</strong>: 이 굴뚝의 데이터가 전체 예측값을 <strong>크게 상승</strong>시키고 있습니다.</li>"
                    else:
                        report += f"<li><strong>영향도</strong>: 이 굴뚝의 데이터가 전체 예측값을 <strong>일부 상승</strong>시키고 있습니다.</li>"
                elif abs(deviation) >= 20:
                    if deviation > 0:
                        report += f"<li><strong>특성</strong>: 평균보다 높은 배출 수준을 보이는 굴뚝입니다.</li>"
                    else:
                        report += f"<li><strong>특성</strong>: 평균보다 낮은 배출 수준을 보이는 굴뚝입니다.</li>"
                else:
                    report += f"<li><strong>특성</strong>: 전체 평균과 유사한 배출 수준을 보이는 굴뚝입니다.</li>"
                
                report += "</ul></div>"
            
            # 종합 해석
            report += """

<h3>종합 해석 및 예측 영향도</h3>

"""
            
            if outlier_stacks:
                outlier_names = ', '.join([f"{s}" for s in outlier_stacks[:5]])  # 처음 5개만 표시
                if len(outlier_stacks) > 5:
                    outlier_names += f" 외 {len(outlier_stacks) - 5}개"
                
                report += f"""
<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0;">
<p><strong style="color: #ef4444;">⚠️ 주의</strong>: {outlier_names}의 배출 농도가 다른 굴뚝들에 비해 현저히 높습니다.</p>

<p><strong>예측에 미치는 영향</strong>:</p>
<ul>
<li>이러한 고농도 굴뚝의 데이터가 전체 예측값을 상승시키고 있습니다.</li>
<li>만약 이들 굴뚝의 배출 농도가 개선된다면, 전체 예측값도 크게 낮아질 것으로 예상됩니다.</li>
<li>반대로 이들 굴뚝의 배출이 더 악화된다면, 전체 예측값이 더욱 상승할 수 있습니다.</li>
</ul>

<p><strong>권장 조치</strong>:</p>
<ol>
<li><strong>우선 관리 대상</strong>: 고농도 굴뚝을 우선적으로 관리하시기 바랍니다.</li>
<li><strong>원인 분석</strong>: 해당 굴뚝의 배출 저감 설비 상태, 공정 조건 등을 점검하세요.</li>
<li><strong>집중 모니터링</strong>: 고농도 굴뚝의 측정 빈도를 증가시켜 변화를 면밀히 관찰하세요.</li>
<li><strong>개선 효과</strong>: 이들 굴뚝의 배출을 개선하면 전체 배출 수준이 크게 향상될 것입니다.</li>
</ol>
</div>
"""
            else:
                report += """
<div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0;">
<p><strong style="color: #10b981;">✅ 양호</strong>: 모든 굴뚝의 배출 농도가 비교적 균등한 수준을 보이고 있습니다.</p>

<p><strong>예측에 미치는 영향</strong>:</p>
<ul>
<li>특정 굴뚝이 전체 예측을 크게 왜곡하는 현상은 없습니다.</li>
<li>예측값은 전체 굴뚝의 평균적인 배출 패턴을 잘 반영하고 있습니다.</li>
<li>안정적이고 신뢰할 수 있는 예측 결과로 판단됩니다.</li>
</ul>

<p><strong>권장 조치</strong>:</p>
<ul>
<li>현재의 균등한 배출 관리 수준을 유지하시기 바랍니다.</li>
<li>정기적인 모니터링을 통해 특정 굴뚝의 배출이 급증하지 않도록 관리하세요.</li>
</ul>
</div>
"""
            
            report += """

</div>
"""
        
        report += f"""

<div style="border: 2px solid #e0e0e0; border-radius: 10px; padding: 25px; margin: 20px 0; background-color: #fafafa;">

<h2>📉 트렌드 변화 분석</h2>

<h3>과거 vs 예측 비교</h3>
<ul>
<li><strong>과거 평균</strong>: {trend['historical_mean']} mg/S㎥</li>
<li><strong>예측 평균</strong>: {trend['prediction_mean']} mg/S㎥</li>
<li><strong>변화율</strong>: {trend['change_rate']:+.1f}%</li>
<li><strong>추세</strong>: {trend['trend']}</li>
</ul>

<h3>해석</h3>
"""

        if trend['trend'] == "상승":
            report += f"""
<p>과거 평균({trend['historical_mean']} mg/S㎥) 대비 예측 평균({trend['prediction_mean']} mg/S㎥)이 <strong>{trend['change_rate']:+.1f}% 상승</strong>할 것으로 예측됩니다.
배출 농도가 증가하는 추세이므로, 원인 분석과 사전 대응이 필요합니다.
배출원의 활동 증가, 저감 설비 효율 저하 등을 점검해야 합니다.</p>
"""
        elif trend['trend'] == "하락":
            report += f"""
<p>과거 평균({trend['historical_mean']} mg/S㎥) 대비 예측 평균({trend['prediction_mean']} mg/S㎥)이 <strong>{trend['change_rate']:+.1f}% 하락</strong>할 것으로 예측됩니다.
배출 저감 노력이 효과를 발휘하고 있는 긍정적인 신호입니다.</p>
"""
        else:
            report += f"""
<p>과거 평균({trend['historical_mean']} mg/S㎥) 대비 예측 평균({trend['prediction_mean']} mg/S㎥)이 <strong>안정적으로 유지</strong>될 것으로 예측됩니다 (변화율: {trend['change_rate']:+.1f}%).
현재의 배출 패턴이 지속될 것으로 예상되므로, 기존 관리 방식을 계속 적용하시면 됩니다.</p>
"""

        report += """

</div>

<div style="border: 2px solid #e0e0e0; border-radius: 10px; padding: 25px; margin: 20px 0; background-color: #fafafa;">

<h2>⚠️ 종합 위험도 평가</h2>

<h3>위험 수준</h3>
"""
        
        report += f"""<p style="font-size: 20px;"><strong>{risk['level']}</strong> (점수: {risk['score']}/100)</p>

<h3>평가 근거</h3>
"""

        if risk['level'] == "매우 높음":
            report += f"""
<p>AI 분석 결과, 향후 배출허용기준 초과 가능성이 <strong>매우 높은 것</strong>으로 평가되었습니다.<br>
{risk['description']}</p>

<p>이는 다음과 같은 요인들이 복합적으로 작용한 결과입니다:</p>
<ul>
<li>예측값이 배출허용기준에 근접하거나 초과</li>
<li>신뢰구간 상한이 기준을 초과</li>
<li>상승 추세 지속</li>
<li>과거 기준 초과 이력 존재</li>
</ul>

<p><strong>즉각적인 조치가 필요합니다.</strong></p>
"""
        elif risk['level'] == "높음":
            report += f"""
<p>AI 분석 결과, 향후 배출허용기준 초과 가능성이 <strong>높은 것</strong>으로 평가되었습니다.<br>
{risk['description']}</p>

<p>현재 추세가 지속될 경우 배출허용기준을 초과할 위험이 있으므로, 사전 예방 조치가 필요합니다.</p>
"""
        elif risk['level'] == "보통":
            report += f"""
<p>AI 분석 결과, 배출허용기준 초과 가능성이 <strong>보통 수준</strong>으로 평가되었습니다.<br>
{risk['description']}</p>

<p>일부 기간에 주의가 필요하나, 전체적으로는 관리 가능한 수준입니다.
정기적인 모니터링을 통해 상황을 지켜보시기 바랍니다.</p>
"""
        else:
            report += f"""
<p>AI 분석 결과, 배출허용기준 초과 가능성이 <strong>낮은 것</strong>으로 평가되었습니다.<br>
{risk['description']}</p>

<p>현재의 배출 관리 수준이 우수하며, 향후에도 안정적인 배출 상태가 유지될 것으로 예상됩니다.</p>
"""

        if risk['level'] in ["매우 높음", "높음"]:
            report += """

<h3>권장 조치사항</h3>
<ol>
<li><strong>배출 저감 설비 긴급 점검</strong>: 집진기, 탈황설비 등의 작동 상태 확인</li>
<li><strong>공정 운영 조건 재검토</strong>: 연료 사용량, 가동 시간 등 조정 검토</li>
<li><strong>측정 빈도 증가</strong>: 일일 또는 주 2-3회 측정으로 변경</li>
<li><strong>관련 부서 사전 협의</strong>: 환경안전팀, 생산팀 간 대응 방안 논의</li>
<li><strong>비상 저감 계획 수립</strong>: 기준 초과 시 즉시 시행할 수 있는 조치 마련</li>
</ol>
"""
        elif risk['level'] == "보통":
            report += """

<h3>권장 조치사항</h3>
<ol>
<li><strong>정기 점검 강화</strong>: 배출 저감 설비의 정기 점검 주기 준수</li>
<li><strong>모니터링 지속</strong>: 현재 수준의 측정 빈도 유지</li>
<li><strong>예방 정비 계획</strong>: 설비 노후화에 대비한 예방 정비 일정 수립</li>
</ol>
"""

        report += """

</div>
"""

        # 상관관계 분석 섹션 추가
        if correlation:
            report += """

<div style="border: 2px solid #e0e0e0; border-radius: 10px; padding: 25px; margin: 20px 0; background-color: #fafafa;">

<h2>🔬 환경변수 상관관계 분석</h2>

<h3>개요</h3>
<p>배출 농도와 환경변수(기상 조건, 공정 변수) 간의 상관관계를 분석하여, 
어떤 요인이 배출 농도 변화에 영향을 미치는지 파악하였습니다.</p>

<h3>상관계수 분석</h3>
"""
            
            # 일반 상관관계
            has_correlation = False
            for var_name, corr_data in correlation.items():
                if var_name != 'anomaly_analysis' and isinstance(corr_data, dict):
                    has_correlation = True
                    coef = corr_data['coefficient']
                    strength = corr_data['strength']
                    direction = corr_data['direction']
                    
                    report += f"""
<div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 15px; margin: 10px 0;">
<h4 style="margin-top: 0;">{var_name}</h4>
<ul>
<li>상관계수: {coef}</li>
<li>상관 강도: {strength}</li>
<li>관계: {direction}</li>
"""
                    
                    # 해석 추가
                    if abs(coef) >= 0.5:
                        if coef > 0:
                            report += f"<li>해석: {var_name}이(가) 높을수록 배출 농도가 증가하는 경향이 강합니다.</li>"
                        else:
                            report += f"<li>해석: {var_name}이(가) 높을수록 배출 농도가 감소하는 경향이 강합니다.</li>"
                    elif abs(coef) >= 0.3:
                        if coef > 0:
                            report += f"<li>해석: {var_name}이(가) 배출 농도 증가에 일정 부분 영향을 미칩니다.</li>"
                        else:
                            report += f"<li>해석: {var_name}이(가) 배출 농도 감소에 일정 부분 영향을 미칩니다.</li>"
                    else:
                        report += f"<li>해석: {var_name}과(와) 배출 농도 간 상관관계가 약합니다.</li>"
                    
                    report += "</ul></div>"
            
            if not has_correlation:
                report += "\n환경변수 데이터가 부족하여 상관관계 분석을 수행할 수 없습니다.\n"
            
            # 이상치 분석
            if 'anomaly_analysis' in correlation:
                report += """

<h3>고농도 배출 시 환경 조건 분석</h3>

<p>배출 농도가 높았던 시점(상위 10%)의 환경 조건을 분석하였습니다:</p>

"""
                anomaly = correlation['anomaly_analysis']
                for var_name, data in anomaly.items():
                    normal = data['normal_avg']
                    high = data['high_avg']
                    diff = data['difference_pct']
                    
                    report += f"""
<div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 15px; margin: 10px 0;">
<h4 style="margin-top: 0;">{var_name}</h4>
<ul>
<li>평상시 평균: {normal}</li>
<li>고농도 시 평균: {high}</li>
<li>차이: {diff:+.1f}%</li>
"""
                    
                    # 해석
                    if abs(diff) >= 20:
                        if diff > 0:
                            report += f"<li>해석: 고농도 배출 시 {var_name}이(가) 평상시보다 <strong>{abs(diff):.1f}% 높았습니다</strong>. 이는 주요 영향 요인으로 판단됩니다.</li>"
                        else:
                            report += f"<li>해석: 고농도 배출 시 {var_name}이(가) 평상시보다 <strong>{abs(diff):.1f}% 낮았습니다</strong>. 이는 주요 영향 요인으로 판단됩니다.</li>"
                    elif abs(diff) >= 10:
                        report += f"<li>해석: 고농도 배출 시 {var_name}에 일부 차이가 있었습니다.</li>"
                    else:
                        report += f"<li>해석: 고농도 배출 시에도 {var_name}은(는) 평상시와 유사한 수준이었습니다.</li>"
                    
                    report += "</ul></div>"
                
                report += """

<h3>종합 해석</h3>
"""
                # 주요 영향 요인 찾기
                major_factors = []
                for var_name, data in anomaly.items():
                    if abs(data['difference_pct']) >= 20:
                        major_factors.append(f"{var_name}({data['difference_pct']:+.1f}%)")
                
                if major_factors:
                    report += f"""
<p>고농도 배출 시 {', '.join(major_factors)} 등의 환경 조건이 평상시와 크게 달랐습니다.
이러한 환경 조건이 배출 농도 증가의 주요 원인으로 작용했을 가능성이 높습니다.
해당 조건이 예상될 때는 사전에 배출 저감 조치를 강화하시기 바랍니다.</p>
"""
                else:
                    report += """
<p>고농도 배출 시에도 환경 조건이 평상시와 크게 다르지 않았습니다.
이는 배출 농도 변화가 환경 조건보다는 공정 운영 조건이나 설비 상태 등 
내부 요인에 의해 주로 영향을 받았을 가능성을 시사합니다.</p>
"""
            
            report += """

</div>
"""

        report += """

<div style="border: 2px solid #e0e0e0; border-radius: 10px; padding: 25px; margin: 20px 0; background-color: #fafafa;">

<h2>🔍 예측 영향 요인 분석</h2>

<p>본 AI 예측 모델은 다음과 같은 요인들을 종합적으로 분석하여 예측 결과를 도출하였습니다:</p>

"""

        for i, factor in enumerate(factors, 1):
            report += f"<h3>{i}. {factor['factor']} (영향도: {factor['impact']})</h3>\n"
            report += f"<p>{factor['description']}</p>\n\n"
        
        report += f"""

</div>

<div style="border: 2px solid #e0e0e0; border-radius: 10px; padding: 25px; margin: 20px 0; background-color: #fafafa;">

<h2>📐 모델 정확도 평가</h2>

<h3>정확도 지표</h3>
<ul>
<li><strong>RMSE (평균 제곱근 오차)</strong>: {metrics.get('rmse', 'N/A')} mg/S㎥</li>
<li><strong>MAE (평균 절대 오차)</strong>: {metrics.get('mae', 'N/A')} mg/S㎥</li>
<li><strong>R² (결정계수)</strong>: {metrics.get('r2', 'N/A')}</li>
</ul>

<h3>해석</h3>
"""

        rmse = metrics.get('rmse', 0)
        r2 = metrics.get('r2', 0)
        
        if r2 > 0.7:
            report += f"""
<p>모델의 R² 값이 {r2:.3f}로, 데이터 패턴을 <strong>매우 잘 학습</strong>한 것으로 평가됩니다.
예측 결과를 높은 신뢰도로 활용하실 수 있습니다.
평균적으로 실제값과 ±{rmse:.2f} mg/S㎥ 정도의 오차 범위를 보입니다.</p>
"""
        elif r2 > 0.3:
            report += f"""
<p>모델의 R² 값이 {r2:.3f}로, 데이터 패턴을 <strong>적절히 학습</strong>한 것으로 평가됩니다.
예측 결과를 참고 자료로 활용하시되, 실제 측정값과 함께 종합적으로 판단하시기 바랍니다.
평균적으로 실제값과 ±{rmse:.2f} mg/S㎥ 정도의 오차 범위를 보입니다.</p>
"""
        elif r2 > 0:
            report += f"""
<p>모델의 R² 값이 {r2:.3f}로, 데이터 패턴 학습이 <strong>보통 수준</strong>입니다.
배출 농도의 변동성이 크거나 외부 요인의 영향이 복잡한 경우 이러한 결과가 나타날 수 있습니다.
예측 결과는 추세 파악용 참고 자료로 활용하시고, 실제 측정을 통한 검증을 병행하시기 바랍니다.</p>
"""
        else:
            report += f"""
<p>모델의 R² 값이 {r2:.3f}로, 데이터 패턴이 <strong>복잡</strong>한 것으로 나타났습니다.
이는 배출 농도가 매우 불규칙하거나, 측정 데이터가 부족한 경우 발생할 수 있습니다.
예측 결과는 대략적인 경향성 파악용으로만 활용하시고, 실제 측정 데이터를 우선적으로 참고하시기 바랍니다.</p>
"""

        report += """

</div>

<hr style="border: none; border-top: 2px solid #e5e7eb; margin: 30px 0;">

<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">

<h2 style="margin: 0; color: white;">📌 보고서 요약</h2>

</div>

<div style="border: 3px solid #667eea; border-radius: 10px; padding: 25px; margin: 20px 0; background-color: #f8f9ff;">

<h2>💡 종합 결론</h2>

"""

        # 결론 생성
        if risk['level'] == "매우 높음":
            report += f"""
<div style="background-color: #ffebee; border-left: 5px solid #f44336; padding: 20px; margin: 15px 0;">

<p>{customer}의 {item} 배출 농도는 향후 30일간 <strong>배출허용기준을 초과할 가능성이 매우 높은 것</strong>으로 분석되었습니다.</p>

<p><strong>주요 발견사항</strong>:</p>
<ul>
<li>AI 모델 예측: 기준 초과 확률 {prediction.get('exceed_probability', 0)}%</li>
<li>예상 초과 일수: 30일 중 {prediction.get('exceed_days', 0)}일</li>
<li>위험도 점수: {risk['score']}/100</li>
</ul>

<p><strong>제언</strong>: 배출허용기준 초과는 법적 제재 및 환경 피해로 이어질 수 있으므로, <strong>즉각적인 대응이 필요</strong>합니다.
배출 저감 설비의 긴급 점검, 공정 운영 조건 조정 등을 통해 배출 농도를 낮추는 조치를 시행하시기 바랍니다.</p>

</div>
"""
        elif risk['level'] == "높음":
            report += f"""
<div style="background-color: #fff3e0; border-left: 5px solid #ff9800; padding: 20px; margin: 15px 0;">

<p>{customer}의 {item} 배출 농도는 향후 30일간 <strong>배출허용기준 초과 가능성이 높은 것</strong>으로 분석되었습니다.</p>

<p><strong>주요 발견사항</strong>:</p>
<ul>
<li>현재 추세가 지속될 경우 일부 기간에 기준 초과 위험</li>
<li>위험도 점수: {risk['score']}/100</li>
</ul>

<p><strong>제언</strong>: 사전 예방 조치를 통해 배출허용기준 초과를 방지하시기 바랍니다.
배출 저감 설비의 정기 점검 일정을 앞당기고, 공정 운영 조건을 재검토하시기를 권장합니다.</p>

</div>
"""
        elif risk['level'] == "보통":
            report += f"""
<div style="background-color: #fffde7; border-left: 5px solid #ffc107; padding: 20px; margin: 15px 0;">

<p>{customer}의 {item} 배출 농도는 향후 30일간 <strong>대체로 안정적으로 유지</strong>될 것으로 예상됩니다.</p>

<p><strong>주요 발견사항</strong>:</p>
<ul>
<li>일부 기간에는 주의 필요</li>
<li>위험도 점수: {risk['score']}/100</li>
</ul>

<p><strong>제언</strong>: 현재의 배출 관리 수준을 유지하시되, 정기적인 모니터링을 통해 상황을 지속적으로 확인하시기 바랍니다.</p>

</div>
"""
        else:
            report += f"""
<div style="background-color: #e8f5e9; border-left: 5px solid #4caf50; padding: 20px; margin: 15px 0;">

<p>{customer}의 {item} 배출 농도는 향후 30일간 <strong>배출허용기준 이내로 안정적으로 유지</strong>될 것으로 예상됩니다.</p>

<p><strong>주요 발견사항</strong>:</p>
<ul>
<li>기준 초과 가능성 매우 낮음</li>
<li>위험도 점수: {risk['score']}/100</li>
<li>현재 배출 관리 수준 우수</li>
</ul>

<p><strong>제언</strong>: 현재의 배출 관리 수준을 지속적으로 유지하시기 바랍니다.
정기적인 측정과 설비 점검을 통해 안정적인 배출 상태를 계속 이어가시기를 권장합니다.</p>

</div>
"""
        
        report += f"""

</div>

<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; color: #666;">

<p><strong>보고서 생성 시각</strong>: {datetime.now().strftime("%Y년 %m월 %d일 %H시 %M분")}<br>
<strong>분석 모델</strong>: Prophet AutoML (Meta Research)<br>
<strong>자동 생성</strong>: 보아스 환경 AI 예측 시스템</p>

</div>

</div>
"""

        return report
    
    def _generate_recommendations(self, risk: Dict, trend: Dict) -> List[str]:
        """권장 사항 생성"""
        recommendations = []
        
        if risk['level'] == "매우 높음":
            recommendations.append("즉시 배출 저감 조치를 시행하세요.")
            recommendations.append("설비 점검 및 정비를 실시하세요.")
            recommendations.append("측정 빈도를 증가시키세요.")
        elif risk['level'] == "높음":
            recommendations.append("배출 저감 설비 점검을 계획하세요.")
            recommendations.append("공정 운영 조건을 재검토하세요.")
        elif risk['level'] == "보통":
            recommendations.append("정기적인 모니터링을 지속하세요.")
            recommendations.append("예방적 유지보수를 계획하세요.")
        else:
            recommendations.append("현재 관리 수준을 유지하세요.")
        
        if trend['trend'] == "상승":
            recommendations.append(f"배출 농도가 {abs(trend['change_rate']):.1f}% 상승 추세이므로 원인 분석이 필요합니다.")
        elif trend['trend'] == "하락":
            recommendations.append(f"배출 농도가 {abs(trend['change_rate']):.1f}% 하락 추세로 양호합니다. 현재 관리 방식을 유지하세요.")
        
        return recommendations
