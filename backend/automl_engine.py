"""
보아스 AutoML 예측 엔진
- Prophet 기반 시계열 예측
- Optuna 자동 하이퍼파라미터 튜닝
- 자동 모델 선택 및 최적화
"""
import pandas as pd
import numpy as np
import os
os.environ['CMDSTAN'] = ''  # Disable cmdstan requirement
from prophet import Prophet
import optuna
from datetime import datetime, timedelta
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Optuna 로그 레벨 조정
optuna.logging.set_verbosity(optuna.logging.WARNING)


class BoazAutoMLPredictor:
    """
    보아스 환경 AutoML 예측기
    
    Features:
    - 자동 하이퍼파라미터 튜닝 (Optuna)
    - 자동 계절성 탐지 (Prophet)
    - 자동 트렌드 변화점 탐지
    - 외부 변수 자동 학습
    """
    
    def __init__(self):
        self.model = None
        self.training_data = None  # 학습에 사용된 데이터 저장
        self.best_params = None
    
    async def predict(
        self,
        data: List[Any],
        periods: int = 30
    ) -> Dict:
        """
        AutoML 예측 수행
        
        Args:
            data: 학습 데이터 (DB rows)
            periods: 예측 기간 (일)
        
        Returns:
            예측 결과 및 모델 정보
        """
        try:
            # 1. 데이터 전처리
            df = self._prepare_data(data)
            self.training_data = df  # 학습 데이터 저장
            logger.info(f"Prepared {len(df)} data points for training")
            
            # 2. AutoML 하이퍼파라미터 튜닝
            best_params = self._auto_tune_hyperparameters(df)
            logger.info(f"Best params found: {best_params}")
            
            # 3. 최적 모델 학습
            model = self._train_model(df, best_params)
            logger.info("Model trained successfully")
            
            # 4. 예측 수행
            predictions = self._make_predictions(model, df, periods)
            logger.info(f"Predictions generated: {len(predictions)} points")
            
            # 5. 정확도 평가
            metrics = self._evaluate_model(model, df)
            
            return {
                'predictions': predictions,
                'model_info': {
                    'model_type': 'Prophet AutoML',
                    'best_params': best_params,
                    'features': ['계절성', '트렌드', '외부변수'],
                    'auto_tuned': True
                },
                'metrics': metrics
            }
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise
    
    def _prepare_data(self, data: List[Any]) -> pd.DataFrame:
        """데이터 전처리"""
        # DB rows를 DataFrame으로 변환
        # aiosqlite.Row 객체를 안전하게 dict로 변환
        rows_as_dicts = []
        for row in data:
            if hasattr(row, 'keys'):
                # sqlite3.Row 또는 aiosqlite.Row 객체
                rows_as_dicts.append({key: row[key] for key in row.keys()})
            elif isinstance(row, dict):
                rows_as_dicts.append(row)
            else:
                # 기타 객체는 dict()로 변환 시도
                rows_as_dicts.append(dict(row))
        
        df = pd.DataFrame(rows_as_dicts)
        
        # Prophet 형식으로 변환
        # measured_at이 Unix timestamp (밀리초)인 경우 변환
        if df['measured_at'].dtype in ['int64', 'float64']:
            df_prophet = pd.DataFrame({
                'ds': pd.to_datetime(df['measured_at'], unit='ms'),
                'y': df['value'].astype(float)
            })
        else:
            df_prophet = pd.DataFrame({
                'ds': pd.to_datetime(df['measured_at']),
                'y': df['value'].astype(float)
            })
        
        # 외부 변수 추가 (있는 경우)
        for col in ['temp', 'humidity', 'wind_speed', 'gas_temp', 'o2_measured']:
            if col in df.columns:
                df_prophet[col] = df[col].fillna(df[col].mean())
        
        # 결측치 제거
        df_prophet = df_prophet.dropna(subset=['ds', 'y'])
        
        # 중복 제거 (같은 날짜)
        df_prophet = df_prophet.drop_duplicates(subset=['ds'], keep='last')
        
        # 정렬
        df_prophet = df_prophet.sort_values('ds').reset_index(drop=True)
        
        self.training_data = df_prophet
        return df_prophet
    
    def _auto_tune_hyperparameters(self, df: pd.DataFrame) -> Dict:
        """
        Optuna를 사용한 자동 하이퍼파라미터 튜닝
        """
        def objective(trial):
            # 하이퍼파라미터 탐색 공간
            params = {
                'changepoint_prior_scale': trial.suggest_float(
                    'changepoint_prior_scale', 0.001, 0.5, log=True
                ),
                'seasonality_prior_scale': trial.suggest_float(
                    'seasonality_prior_scale', 0.01, 10, log=True
                ),
                'seasonality_mode': trial.suggest_categorical(
                    'seasonality_mode', ['additive', 'multiplicative']
                ),
                'yearly_seasonality': trial.suggest_categorical(
                    'yearly_seasonality', [True, False]
                ),
                'weekly_seasonality': trial.suggest_categorical(
                    'weekly_seasonality', [True, False]
                ),
            }
            
            # 모델 학습
            try:
                # Prophet 모델 생성 (간단한 파라미터만 사용)
                import os
                os.environ['PROPHET_SUPPRESS_WARNINGS'] = '1'
                from prophet.serialize import model_to_json, model_from_json
                model = Prophet(
                    changepoint_prior_scale=params['changepoint_prior_scale'],
                    seasonality_prior_scale=params['seasonality_prior_scale'],
                    seasonality_mode=params['seasonality_mode'],
                    yearly_seasonality=params['yearly_seasonality'],
                    weekly_seasonality=params['weekly_seasonality'],
                    daily_seasonality=False
                )
                
                # 외부 변수 추가
                for col in ['temp', 'humidity', 'wind_speed']:
                    if col in df.columns:
                        model.add_regressor(col)
                
                # 학습 (80% 데이터)
                train_size = int(len(df) * 0.8)
                train_df = df.iloc[:train_size]
                test_df = df.iloc[train_size:]
                
                # 경고 메시지 억제
                import warnings
                warnings.filterwarnings('ignore')
                model.fit(train_df)
                
                # 검증
                if len(test_df) > 0:
                    forecast = model.predict(test_df)
                    # RMSE 계산
                    rmse = np.sqrt(np.mean((forecast['yhat'].values - test_df['y'].values) ** 2))
                    return rmse
                else:
                    return float('inf')
                    
            except Exception as e:
                logger.warning(f"Trial failed: {e}")
                return float('inf')
        
        # Optuna 최적화 (빠른 튜닝을 위해 20회 시도)
        study = optuna.create_study(direction='minimize')
        study.optimize(objective, n_trials=20, show_progress_bar=False)
        
        self.best_params = study.best_params
        return study.best_params
    
    def _train_model(self, df: pd.DataFrame, params: Dict) -> Prophet:
        """최적 파라미터로 모델 학습"""
        import os
        os.environ['PROPHET_SUPPRESS_WARNINGS'] = '1'
        from prophet.serialize import model_to_json, model_from_json
        model = Prophet(
            changepoint_prior_scale=params['changepoint_prior_scale'],
            seasonality_prior_scale=params['seasonality_prior_scale'],
            seasonality_mode=params['seasonality_mode'],
            yearly_seasonality=params['yearly_seasonality'],
            weekly_seasonality=params['weekly_seasonality'],
            daily_seasonality=False
        )
        
        # 외부 변수 추가
        for col in ['temp', 'humidity', 'wind_speed']:
            if col in df.columns:
                model.add_regressor(col)
        
        # 전체 데이터로 학습
        import warnings
        warnings.filterwarnings('ignore')
        model.fit(df)
        
        self.model = model
        return model
    
    def _make_predictions(
        self,
        model: Prophet,
        df: pd.DataFrame,
        periods: int
    ) -> List[Dict]:
        """예측 수행"""
        # 미래 데이터프레임 생성
        future = model.make_future_dataframe(periods=periods, freq='D')
        
        # 외부 변수 값 설정 (평균값 사용)
        for col in ['temp', 'humidity', 'wind_speed']:
            if col in df.columns:
                future[col] = df[col].mean()
        
        # 예측
        forecast = model.predict(future)
        
        # 미래 예측만 추출
        future_forecast = forecast.tail(periods)
        
        # 결과 포맷팅 (대기오염물질 농도는 음수가 될 수 없으므로 0 이상으로 제한)
        predictions = []
        for _, row in future_forecast.iterrows():
            predictions.append({
                'date': row['ds'].strftime('%Y-%m-%d'),
                'predicted_value': round(max(0.0, float(row['yhat'])), 2),
                'lower_bound': round(max(0.0, float(row['yhat_lower'])), 2),
                'upper_bound': round(max(0.0, float(row['yhat_upper'])), 2),
                'trend': round(float(row['trend']), 2)
            })
        
        return predictions
    
    def _evaluate_model(self, model: Prophet, df: pd.DataFrame) -> Dict:
        """모델 정확도 평가"""
        try:
            # 전체 데이터에 대한 예측
            forecast = model.predict(df)
            
            # 실제값과 예측값 비교
            actual = df['y'].values
            predicted = forecast['yhat'].values[:len(actual)]
            
            # 메트릭 계산
            rmse = np.sqrt(np.mean((actual - predicted) ** 2))
            mae = np.mean(np.abs(actual - predicted))
            mape = np.mean(np.abs((actual - predicted) / (actual + 1e-10))) * 100
            
            return {
                'rmse': round(float(rmse), 2),
                'mae': round(float(mae), 2),
                'mape': round(float(mape), 2),
                'r2': round(float(1 - (np.sum((actual - predicted) ** 2) / np.sum((actual - np.mean(actual)) ** 2))), 3)
            }
        except Exception as e:
            logger.warning(f"Evaluation failed: {e}")
            return {}
