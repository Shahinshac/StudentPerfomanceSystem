"""
backend/app/main.py

FastAPI Application for UCI Student Academic Performance Prediction System.
Exposes RESTful endpoints for ML inference on 0–60 marks scale, provisional letter grading (A–F),
institutional rule-based risk analysis, dataset insights, What-If Simulator, and Explainable AI.
"""

import json
from pathlib import Path
from typing import Any, Dict
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from backend.app.schemas import (
    HealthResponse,
    PredictionRequest,
    PredictionResponse,
    RiskAnalysisRequest,
    RiskAnalysisResponse,
    SimulationRequest,
    SimulationResponse,
    ExplanationRequest,
    ExplanationResponse,
)
from backend.app.services.prediction import prediction_service
from backend.app.services.risk_analysis import assess_academic_risk
from backend.app.services.simulation import simulate_academic_improvement
from backend.app.services.explanation import explain_prediction

BASE_DIR = Path(__file__).resolve().parent.parent.parent
METRICS_PATH = BASE_DIR / "models" / "metrics.json" if (BASE_DIR / "models" / "metrics.json").exists() else Path("models/metrics.json")
DATA_SUMMARY_PATH = BASE_DIR / "data" / "processed" / "data_summary.json" if (BASE_DIR / "data" / "processed" / "data_summary.json").exists() else Path("data/processed/data_summary.json")
EDA_INSIGHTS_PATH = BASE_DIR / "reports" / "eda_insights.json" if (BASE_DIR / "reports" / "eda_insights.json").exists() else Path("reports/eda_insights.json")

app = FastAPI(
    title="UCI Student Performance Prediction & Diagnostic API",
    description=(
        "Production-grade FastAPI backend providing machine learning predictions of "
        "final exam marks (0–60 scale), provisional letter grade classification (A–F), "
        "institutional risk diagnostics, What-If simulation, and mathematical feature explanations."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
env_origins = os.getenv("ALLOWED_ORIGINS", "")
if env_origins:
    ALLOWED_ORIGINS.extend([origin.strip() for origin in env_origins.split(",") if origin.strip()])

# CORS Configuration allowing local development, configured origins, and Vercel domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse, tags=["System Health"])
def get_health() -> HealthResponse:
    """Returns runtime health status and model availability."""
    model_loaded = prediction_service.model is not None
    return HealthResponse(
        status="healthy",
        service="UCI Student Performance Prediction API",
        version="2.0.0",
        model_loaded=model_loaded,
        selected_model=prediction_service.model_name,
    )


@app.get("/api/model/metrics", tags=["Model Analytics"])
def get_model_metrics() -> Dict[str, Any]:
    """
    Returns verified evaluation metrics comparing Linear Regression and Decision Tree models on UCI holdout.
    """
    if not METRICS_PATH.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model metrics file not found. Please execute model training first.",
        )
    with open(METRICS_PATH, "r") as f:
        metrics_data = json.load(f)
    return metrics_data


@app.get("/api/dataset/summary", tags=["Dataset Insights"])
def get_dataset_summary() -> Dict[str, Any]:
    """
    Returns authentic statistical summaries, feature boundaries, and EDA correlations for UCI dataset.
    """
    summary_data = {}
    if DATA_SUMMARY_PATH.exists():
        with open(DATA_SUMMARY_PATH, "r") as f:
            summary_data["data_summary"] = json.load(f)

    if EDA_INSIGHTS_PATH.exists():
        with open(EDA_INSIGHTS_PATH, "r") as f:
            summary_data["eda_insights"] = json.load(f)

    if not summary_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset summary or EDA insights not found. Run prepare_data and run_eda first.",
        )
    return summary_data


@app.post("/api/predict", response_model=PredictionResponse, tags=["Academic Prediction"])
def predict_performance(payload: PredictionRequest) -> PredictionResponse:
    """
    Predicts student final marks (0-60 scale) and assigns provisional letter grade (A-F)
    using the trained production ML pipeline.
    """
    try:
        result = prediction_service.predict(
            G1_scaled=payload.G1_scaled,
            G2_scaled=payload.G2_scaled,
            studytime=payload.studytime,
            failures=payload.failures,
            absences=payload.absences,
            schoolsup=payload.schoolsup,
        )
        return PredictionResponse(**result)
    except FileNotFoundError as fnf_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(fnf_err),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction inference failed: {str(exc)}",
        )


@app.post("/api/risk", response_model=RiskAnalysisResponse, tags=["Risk Analysis"])
def analyze_risk(payload: RiskAnalysisRequest) -> RiskAnalysisResponse:
    """
    Evaluates rule-based academic risk factors against transparent institutional thresholds.
    """
    result = assess_academic_risk(
        G1_scaled=payload.G1_scaled,
        G2_scaled=payload.G2_scaled,
        studytime=payload.studytime,
        failures=payload.failures,
        absences=payload.absences,
        schoolsup=payload.schoolsup,
        custom_thresholds=payload.custom_thresholds,
    )
    return RiskAnalysisResponse(**result)


@app.post("/api/evaluate-student", tags=["Unified Assessment"])
def evaluate_student(payload: PredictionRequest) -> Dict[str, Any]:
    """
    Convenience endpoint executing both ML prediction and rule-based risk evaluation
    in a single round trip for the student evaluation interface.
    """
    pred_result = prediction_service.predict(
        G1_scaled=payload.G1_scaled,
        G2_scaled=payload.G2_scaled,
        studytime=payload.studytime,
        failures=payload.failures,
        absences=payload.absences,
        schoolsup=payload.schoolsup,
    )
    risk_result = assess_academic_risk(
        G1_scaled=payload.G1_scaled,
        G2_scaled=payload.G2_scaled,
        studytime=payload.studytime,
        failures=payload.failures,
        absences=payload.absences,
        schoolsup=payload.schoolsup,
    )
    return {
        "prediction": pred_result,
        "risk": risk_result,
    }


# ====================================================
# What-If Improvement Simulator Endpoint
# ====================================================

@app.post("/api/simulate", response_model=SimulationResponse, tags=["What-If Simulator"])
def simulate_improvement(payload: SimulationRequest) -> SimulationResponse:
    """
    Compares baseline academic performance against hypothetical improved inputs,
    calculating the exact delta in marks (out of 60), letter grade shift, and risk transitions.
    """
    try:
        result = simulate_academic_improvement(
            base_G1_scaled=payload.baseline.G1_scaled,
            base_G2_scaled=payload.baseline.G2_scaled,
            base_studytime=payload.baseline.studytime,
            base_failures=payload.baseline.failures,
            base_absences=payload.baseline.absences,
            base_schoolsup=payload.baseline.schoolsup,
            sim_G1_scaled=payload.simulated.G1_scaled,
            sim_G2_scaled=payload.simulated.G2_scaled,
            sim_studytime=payload.simulated.studytime,
            sim_failures=payload.simulated.failures,
            sim_absences=payload.simulated.absences,
            sim_schoolsup=payload.simulated.schoolsup,
        )
        return SimulationResponse(**result)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation scenario execution failed: {str(exc)}",
        )


# ====================================================
# Explainable Prediction Endpoint
# ====================================================

@app.post("/api/explain", response_model=ExplanationResponse, tags=["Explainable AI"])
def explain_prediction_endpoint(payload: ExplanationRequest) -> ExplanationResponse:
    """
    Provides authentic mathematical and structural feature explanations for individual predictions:
    - Linear Regression: Standardized feature attribution (contribution_j = beta_j * z_j)
    - Decision Tree: Sequential decision path rules from root to leaf
    """
    try:
        result = explain_prediction(
            G1_scaled=payload.G1_scaled,
            G2_scaled=payload.G2_scaled,
            studytime=payload.studytime,
            failures=payload.failures,
            absences=payload.absences,
            schoolsup=payload.schoolsup,
            model_preference=payload.model_preference,
        )
        return ExplanationResponse(**result)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Explainability analysis failed: {str(exc)}",
        )
