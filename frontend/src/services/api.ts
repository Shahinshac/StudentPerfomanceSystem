import type {
  AcademicInput,
  EvaluationStudentResponse,
  ModelComparisonData,
  DatasetSummaryData,
  SimulationResponse,
  ExplanationResponse,
} from '../types';

const RAW_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  'http://127.0.0.1:8000';

const CLEAN_BASE = RAW_BASE_URL.replace(/\/+$/, '');
export const API_BASE_URL = CLEAN_BASE.endsWith('/api') ? CLEAN_BASE : `${CLEAN_BASE}/api`;

export async function checkBackendHealth(): Promise<{ status: string; model_loaded: boolean }> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed with status: ${res.status}`);
  return res.json();
}

export async function fetchModelMetrics(): Promise<ModelComparisonData> {
  const res = await fetch(`${API_BASE_URL}/model/metrics`);
  if (!res.ok) throw new Error(`Failed to load model metrics: ${res.statusText}`);
  return res.json();
}

export async function fetchDatasetSummary(): Promise<DatasetSummaryData> {
  const res = await fetch(`${API_BASE_URL}/dataset/summary`);
  if (!res.ok) throw new Error(`Failed to load dataset summary: ${res.statusText}`);
  return res.json();
}

export async function evaluateStudent(input: AcademicInput): Promise<EvaluationStudentResponse> {
  const res = await fetch(`${API_BASE_URL}/evaluate-student`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Evaluation failed with status: ${res.status}`);
  }
  return res.json();
}

export async function simulateImprovement(
  baseline: AcademicInput,
  simulated: AcademicInput
): Promise<SimulationResponse> {
  const res = await fetch(`${API_BASE_URL}/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ baseline, simulated }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Simulation failed with status: ${res.status}`);
  }
  return res.json();
}

export async function fetchExplanation(
  input: AcademicInput,
  modelPreference: string = 'decision_tree'
): Promise<ExplanationResponse> {
  const res = await fetch(`${API_BASE_URL}/explain`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...input,
      model_preference: modelPreference,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Explainability analysis failed: ${res.status}`);
  }
  return res.json();
}
