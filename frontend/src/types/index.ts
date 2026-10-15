export interface AcademicInput {
  G1_scaled: number;
  G2_scaled: number;
  studytime: number;
  failures: number;
  absences: number;
  schoolsup: string;
}

export interface PredictionResult {
  predicted_final_marks: number;
  raw_prediction: number;
  max_possible_marks: number;
  letter_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  performance_category: string;
  performance_percentage: number;
  category_description: string;
  model_used: string;
  inputs_evaluated: Record<string, any>;
}

export interface TriggeredRiskFactor {
  factor: string;
  feature: string;
  current_value: any;
  threshold: any;
  severity: 'CRITICAL' | 'WARNING';
  reason: string;
}

export interface RiskAnalysisResult {
  risk_level: 'High Risk' | 'Medium Risk' | 'Low Risk';
  badge_color: 'red' | 'amber' | 'green';
  risk_flags_count: number;
  is_critical: boolean;
  summary: string;
  triggered_factors: TriggeredRiskFactor[];
  recommended_interventions: string[];
}

export interface EvaluationStudentResponse {
  prediction: PredictionResult;
  risk: RiskAnalysisResult;
}

export interface ModelMetrics {
  MAE: number;
  MSE: number;
  RMSE: number;
  R2: number;
}

export interface ModelComparisonData {
  dataset: string;
  target: string;
  scale_max: number;
  selected_model: string;
  selection_reason: string;
  models: {
    linear_regression: {
      name: string;
      architecture: string;
      train_metrics: ModelMetrics;
      test_metrics: ModelMetrics;
      intercept: number;
      coefficients: Record<string, number>;
    };
    decision_tree: {
      name: string;
      architecture: string;
      train_metrics: ModelMetrics;
      test_metrics: ModelMetrics;
      feature_importances: Record<string, number>;
      tree_depth: number;
      leaf_count: number;
    };
  };
  test_scatter_sample: Array<{
    student_index: number;
    actual: number;
    lr_predicted: number;
    dt_predicted: number;
  }>;
}

export interface DatasetSummaryData {
  data_summary: {
    dataset_name: string;
    source: string;
    subject: string;
    total_records: number;
    train_records: number;
    test_records: number;
    max_exam_marks: number;
    features: Record<
      string,
      {
        type: string;
        scale: string;
        description: string;
        mean?: number;
        std?: number;
        min?: number;
        max?: number;
        yes_count?: number;
        no_count?: number;
      }
    >;
    target: {
      name: string;
      scale: string;
      description: string;
      mean: number;
      std: number;
      min: number;
      max: number;
    };
    leakage_prevention: string;
  };
  eda_insights?: {
    dataset_name: string;
    subject: string;
    sample_size: number;
    total_cohort: number;
    max_exam_marks: number;
    target_variable: {
      name: string;
      scale: string;
      mean: number;
      median: number;
      std: number;
      min: number;
      max: number;
    };
    feature_correlations: Record<string, number>;
    feature_statistics: Record<
      string,
      { mean: number; median: number; std: number; skewness: number }
    >;
    key_findings: string[];
  };
}

// ====================================================
// Feature 1: What-If Simulator Types
// ====================================================

export interface SimulationResponse {
  baseline_prediction: PredictionResult;
  simulated_prediction: PredictionResult;
  baseline_risk: RiskAnalysisResult;
  simulated_risk: RiskAnalysisResult;
  delta_marks: number;
  letter_grade_change: string;
  direction: 'INCREASED' | 'DECREASED' | 'UNCHANGED';
  risk_status_change: 'IMPROVED' | 'WORSENED' | 'UNCHANGED';
  feature_shifts: Record<string, any>;
  summary: string;
  disclaimer: string;
}

// ====================================================
// Feature 2: Explainable AI Types
// ====================================================

export interface LinearFeatureContribution {
  feature: string;
  label: string;
  raw_value: number;
  cohort_mean: number;
  standardized_value: number;
  coefficient: number;
  mark_contribution: number;
  direction: 'POSITIVE' | 'NEGATIVE';
  explanation: string;
}

export interface DecisionTreeStep {
  step: number;
  node_id: number;
  is_leaf: boolean;
  feature?: string;
  label?: string;
  student_value?: number;
  threshold?: number;
  condition_met?: string;
  subcohort_avg_marks: number;
  subcohort_sample_size: number;
  explanation: string;
}

export interface ExplanationResponse {
  preferred_model: string;
  scale_max: number;
  linear_regression: {
    model_name: string;
    explanation_method: string;
    baseline_cohort_marks: number;
    raw_prediction: number;
    clamped_prediction: number;
    feature_contributions: LinearFeatureContribution[];
    global_importance: Record<string, number>;
    interpretation_guide: string;
  };
  decision_tree: {
    model_name: string;
    explanation_method: string;
    predicted_marks: number;
    decision_path: DecisionTreeStep[];
    global_importance_percent: Record<string, number>;
    interpretation_guide: string;
  };
}
