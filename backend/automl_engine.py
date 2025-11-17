"""
PMMS AutoML 예측 엔진
- pmdarima (Auto-ARIMA) 기반 시계열 예측
- Optuna 자동 하이퍼파라미터 튜닝
- 최근 1년 데이터만 사용
- 재현성을 위한 랜덤 시드 고정
"""
import pandas as pd
import numpy as np
import warnings
from datetime import datetime, timedelta
import logging
from typing import List, Dict, Any

from pmdarima import auto_arima
import optuna

# 경고 메시지 억제
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

# Optuna 로그 레벨 조정
optuna.logging.set_verbosity(optuna.logging.WARNING)

# 재현성을 위한 랜덤 시드 고정
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)


class PmmsAutoMLPredictor:
    """
    PMMS 환경 AutoML 예측기
    
    Features:
    - 자동 하이퍼파라미터 튜닝 (Optuna)
    - 자동 계절성 탐지 (Auto-ARIMA)
    - 최근 1년 데이터만 사용
    - 외부 변수 자동 학습
    """
    
    def __init__(self):
        self.model = None
        self.training_data = None
        self.best_params = None
        self.exog_cols = []
        self.historical_avg = None
    
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
                'historical_avg': round(float(self.historical_avg), 2),
                'model_info': {
                    'model_type': 'Auto-ARIMA',
                    'best_params': best_params,
                    'features': ['계절성', '트렌드'],
                    'auto_tuned': True,
                    'data_period': '최근 2년'
                },
                'metrics': metrics
            }
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise
    
    def _prepare_data(self, data: List[Any]) -> pd.DataFrame:
        """데이터 전처리 (최근 1년만 사용)"""
        # DB rows를 DataFrame으로 변환
        rows_as_dicts = []
        for row in data:
            if hasattr(row, 'keys'):
                rows_as_dicts.append({key: row[key] for key in row.keys()})
            elif isinstance(row, dict):
                rows_as_dicts.append(row)
            else:
                rows_as_dicts.append(dict(row))
        
        df = pd.DataFrame(rows_as_dicts)
        
        # 날짜 변환
        if df['measured_at'].dtype in ['int64', 'float64']:
            df['ds'] = pd.to_datetime(df['measured_at'], unit='ms')
        else:
            df['ds'] = pd.to_datetime(df['measured_at'])
        
        df['y'] = df['value'].astype(float)
        
        # 최근 2년 데이터 시도 (부족하면 전체 사용)
        two_years_ago = datetime.now() - timedelta(days=730)
        df_filtered = df[df['ds'] >= two_years_ago].copy()
        
        # 데이터가 365개 미만이면 전체 사용
        if len(df_filtered) < 365:
            logger.info(f"Data insufficient ({len(df_filtered)} < 365), using all available data")
            df = df.copy()
        else:
            df = df_filtered
        
        # 외부 변수 임시 제거 (예측값 다양성 확보)
        self.exog_cols = []
        
        # 결측치 제거
        df = df.dropna(subset=['ds', 'y'])
        
        # 중복 제거
        df = df.drop_duplicates(subset=['ds'], keep='last')
        
        # 정렬 및 인덱스 설정
        df = df.sort_values('ds').reset_index(drop=True)
        df = df.set_index('ds')
        
        # 과거 평균 저장
        self.historical_avg = df['y'].mean()
        
        self.training_data = df
        return df
    
    def _auto_tune_hyperparameters(self, df: pd.DataFrame) -> Dict:
        """
        Optuna를 사용한 자동 하이퍼파라미터 튜닝 (재현성 보장)
        """
        def objective(trial):
            # 하이퍼파라미터 탐색 공간
            params = {
                'seasonal': trial.suggest_categorical('seasonal', [True, False]),
                'm': 7 if trial.params.get('seasonal', True) else 1,  # 주별 계절성 고정
                'max_p': trial.suggest_int('max_p', 2, 5),
                'max_q': trial.suggest_int('max_q', 2, 5),
                'max_d': trial.suggest_int('max_d', 1, 2),
            }
            
            try:
                # 학습/검증 분할
                train_size = int(len(df) * 0.8)
                train_y = df['y'].iloc[:train_size]
                test_y = df['y'].iloc[train_size:]
                
                # 외부 변수
                train_X = df[self.exog_cols].iloc[:train_size] if self.exog_cols else None
                test_X = df[self.exog_cols].iloc[train_size:] if self.exog_cols else None
                
                # 모델 학습
                model = auto_arima(
                    train_y,
                    X=train_X,
                    seasonal=params['seasonal'],
                    m=params['m'],
                    max_p=params['max_p'],
                    max_q=params['max_q'],
                    max_d=params['max_d'],
                    suppress_warnings=True,
                    error_action='ignore',
                    stepwise=True,
                    n_jobs=-1
                )
                
                # 검증
                if len(test_y) > 0:
                    pred = model.predict(n_periods=len(test_y), X=test_X)
                    rmse = np.sqrt(np.mean((test_y.values - pred) ** 2))
                    return rmse
                else:
                    return float('inf')
                    
            except Exception as e:
                logger.warning(f"Trial failed: {e}")
                return float('inf')
        
        # Optuna 최적화 (10회 시도로 빠르게, 재현성 보장)
        sampler = optuna.samplers.TPESampler(seed=RANDOM_SEED)
        study = optuna.create_study(direction='minimize', sampler=sampler)
        study.optimize(objective, n_trials=10, show_progress_bar=False)
        
        self.best_params = study.best_params
        return study.best_params
    
    def _train_model(self, df: pd.DataFrame, params: Dict):
        """최적 파라미터로 모델 학습"""
        # 외부 변수
        X = df[self.exog_cols] if self.exog_cols else None
        
        # 모델 학습
        model = auto_arima(
            df['y'],
            X=X,
            seasonal=params.get('seasonal', True),
            m=params.get('m', 12),
            max_p=params.get('max_p', 3),
            max_q=params.get('max_q', 3),
            max_d=params.get('max_d', 2),
            suppress_warnings=True,
            error_action='ignore',
            stepwise=True,
            n_jobs=-1
        )
        
        self.model = model
        return model
    
    def _make_predictions(
        self,
        model,
        df: pd.DataFrame,
        periods: int
    ) -> List[Dict]:
        """예측 수행"""
        # 외부 변수 (미래값은 평균 사용)
        if self.exog_cols:
            future_X = pd.DataFrame({
                col: [df[col].mean()] * periods 
                for col in self.exog_cols
            })
        else:
            future_X = None
        
        # 예측
        predictions_values = model.predict(n_periods=periods, X=future_X)
        
        # 신뢰구간 계산 (표준편차 기반)
        std = np.std(df['y'])
        
        # 미래 날짜 생성 (현재 날짜 기준)
        last_date = datetime.now()
        future_dates = pd.date_range(start=last_date + timedelta(days=1), periods=periods, freq='D')
        
        # 결과 포맷팅
        predictions = []
        for i, (date, pred_value) in enumerate(zip(future_dates, predictions_values)):
            predictions.append({
                'date': date.strftime('%Y-%m-%d'),
                'predicted_value': round(max(0.0, float(pred_value)), 2),
                'lower_bound': round(max(0.0, float(pred_value - 1.96 * std)), 2),
                'upper_bound': round(max(0.0, float(pred_value + 1.96 * std)), 2),
                'trend': round(float(pred_value), 2)
            })
        
        # 예측값 검증
        unique_values = len(set(predictions_values))
        if unique_values == 1:
            logger.warning("All predictions are identical - model may be too simple")
        
        return predictions
    
    def _evaluate_model(self, model, df: pd.DataFrame) -> Dict:
        """모델 정확도 평가"""
        try:
            # In-sample 예측 (외부 변수 포함)
            if self.exog_cols:
                X = df[self.exog_cols].values
                predicted = model.predict_in_sample(X=X)
            else:
                predicted = model.predict_in_sample()
            
            actual = df['y'].values
            
            # 길이 맞추기
            min_len = min(len(actual), len(predicted))
            actual = actual[-min_len:]
            predicted = predicted[-min_len:]
            
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
