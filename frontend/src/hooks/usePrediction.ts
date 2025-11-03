/**
 * AutoML 예측 Hook
 * Prophet 기반 시계열 예측 API 연동
 */
import { useState } from 'react';

export interface PredictionData {
  date: string;
  predicted_value: number;
  lower_bound: number;
  upper_bound: number;
  trend: number;
}

export interface PredictionResult {
  predictions: PredictionData[];
  model_info: {
    model_type: string;
    best_params: any;
    features: string[];
    auto_tuned: boolean;
  };
  training_samples: number;
  accuracy_metrics?: {
    rmse: number;
    mae: number;
    mape: number;
    r2: number;
  };
}

export interface PredictionRequest {
  customer_id: string;
  stack: string;
  item_key: string;
  periods?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_AUTOML_API_URL || 'http://localhost:8000';

export function usePrediction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const predict = async (request: PredictionRequest): Promise<PredictionResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: request.customer_id,
          stack: request.stack,
          item_key: request.item_key,
          periods: request.periods || 30,
          include_history: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '예측 실패');
      }

      const data: PredictionResult = await response.json();
      setResult(data);
      return data;
      
    } catch (err: any) {
      const errorMessage = err.message || 'AutoML 예측 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('Prediction error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return {
    predict,
    checkHealth,
    reset,
    loading,
    error,
    result,
  };
}
