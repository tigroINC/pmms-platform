/**
 * 인사이트 보고서 API 타입 정의
 * 
 * ⚠️ CRITICAL: pdf_base64는 필수 필드입니다.
 * 백엔드에서 PDF 생성에 실패하면 에러를 반환해야 합니다.
 * HTML fallback은 지원하지 않습니다.
 */

export interface InsightReportResponse {
  predictions: PredictionData[];
  model_info: ModelInfo;
  training_samples: number;
  accuracy_metrics?: AccuracyMetrics;
  insight_report: InsightReport;
  /** 
   * PDF Base64 인코딩 문자열 (필수)
   * 백엔드에서 Playwright를 사용하여 생성
   */
  pdf_base64: string; // ⚠️ 필수 필드 - optional(?)이 아님
}

export interface PredictionData {
  date: string;
  predicted_value: number;
  lower_bound: number;
  upper_bound: number;
  trend: number;
}

export interface ModelInfo {
  model_type: string;
  best_params: Record<string, any>;
  features: string[];
  auto_tuned: boolean;
}

export interface AccuracyMetrics {
  rmse: number;
  mae: number;
  mape: number;
  r2: number;
}

export interface InsightReport {
  report_date: string;
  customer: string;
  item: string;
  summary: {
    historical: HistoricalAnalysis;
    prediction: PredictionAnalysis;
    trend: TrendAnalysis;
    risk: RiskAssessment;
    influence_factors: InfluenceFactor[];
    correlation: CorrelationAnalysis;
    stack_contribution?: StackContribution;
  };
  narrative: string; // HTML 형식의 보고서 내용
  accuracy_metrics: AccuracyMetrics;
  recommendations: string[];
}

export interface HistoricalAnalysis {
  period: string;
  data_count: number;
  average: number;
  std_dev: number;
  min: number;
  max: number;
  median: number;
  trend: string;
  volatility: string;
}

export interface PredictionAnalysis {
  period: string;
  average: number;
  min: number;
  max: number;
  trend: string;
  uncertainty_avg: number;
  limit_value?: number;
  exceed_probability?: number;
  exceed_days?: number;
}

export interface TrendAnalysis {
  historical_trend: string;
  historical_trend_value: number;
  prediction_trend: string;
  prediction_trend_value: number;
  trend_change: string;
}

export interface RiskAssessment {
  level: string;
  score: number;
  color: string;
  exceed_probability: number;
  description: string;
}

export interface InfluenceFactor {
  factor: string;
  impact: string;
  description: string;
}

export interface CorrelationAnalysis {
  [key: string]: {
    coefficient: number;
    strength: string;
    direction: string;
  } | AnomalyAnalysis;
}

export interface AnomalyAnalysis {
  [key: string]: {
    normal_avg: number;
    high_avg: number;
    difference_pct: number;
  };
}

export interface StackContribution {
  overall: {
    mean: number;
    std: number;
    median: number;
    total_count: number;
  };
  stacks: {
    [stackName: string]: {
      count: number;
      mean: number;
      std: number;
      max: number;
      deviation_pct: number;
      is_outlier: boolean;
      high_ratio: number;
      contribution_pct: number;
    };
  };
  outlier_stacks: string[];
  stack_count: number;
}

/**
 * 타입 가드: PDF가 유효한지 검증
 */
export function isValidPdfResponse(response: any): response is InsightReportResponse {
  return (
    response &&
    typeof response === 'object' &&
    typeof response.pdf_base64 === 'string' &&
    response.pdf_base64.length > 100 && // 최소 길이 검증
    Array.isArray(response.predictions) &&
    response.model_info &&
    response.insight_report
  );
}

/**
 * PDF Base64 검증 함수
 */
export function validatePdfBase64(pdf_base64: string): void {
  if (!pdf_base64) {
    throw new Error('PDF 데이터가 없습니다.');
  }
  
  if (pdf_base64.length < 100) {
    throw new Error('PDF 데이터가 너무 짧습니다. 유효하지 않은 데이터일 수 있습니다.');
  }
  
  // Base64 형식 검증
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(pdf_base64)) {
    throw new Error('유효하지 않은 Base64 형식입니다.');
  }
}
