"""
backend/app/schemas.py

Pydantic Schemas for UCI Student Performance System.
Enforces numerical bounds and categorical constraints on the 0-60 marks scale.
Includes schemas for ML prediction, risk heuristics, What-If simulation, and explainability.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class AcademicInputBase(BaseModel):
    """Base schema for student academic inputs with verified UCI domain bounds."""

    G1_scaled: float = Field(
        ...,
        ge=0.0,
        le=60.0,
        description="First-period evaluation marks (Scale 0.0 - 60.0, original G1 x 3)",
        examples=[36.0],
    )
    G2_scaled: float = Field(
        ...,
        ge=0.0,
        le=60.0,
        description="Second-period evaluation marks (Scale 0.0 - 60.0, original G2 x 3)",
        examples=[39.0],
    )
    studytime: int = Field(
        ...,
        ge=1,
        le=4,
        description="Weekly study time tier (1: <2h, 2: 2-5h, 3: 5-10h, 4: >10h)",
        examples=[2],
    )
    failures: int = Field(
        ...,
        ge=0,
        le=3,
        description="Number of past class failures (0: none, 1, 2, 3: 3 or more)",
        examples=[0],
    )
    absences: int = Field(
        ...,
        ge=0,
        le=50,
        description="Number of school absences (Scale 0 - 50)",
        examples=[4],
    )
    schoolsup: str = Field(
        default="no",
        description="Extra educational school support ('no' or 'yes')",
        examples=["no"],
    )


class PredictionRequest(AcademicInputBase):
    """Request schema for final marks prediction."""
    pass


class PredictionResponse(BaseModel):
    """Response schema returning ML prediction, letter grade, and performance tier."""

    predicted_final_marks: float = Field(
        ..., description="Predicted final score clamped to 0.0 - 60.0 marks"
    )
    raw_prediction: float = Field(
        ..., description="Unclamped linear or tree regression output"
    )
    max_possible_marks: float = Field(
        default=60.0, description="Maximum attainable final exam score (60.0)"
    )
    letter_grade: str = Field(
        ..., description="Project-defined provisional grade (A, B, C, D, F)"
    )
    performance_category: str = Field(
        ..., description="Descriptive tier (High Honors, Very Good, Satisfactory, Marginal Pass, Failing)"
    )
    performance_percentage: float = Field(
        ..., description="Predicted percentage score relative to 60 marks"
    )
    category_description: str = Field(
        ..., description="Actionable explanation of the performance tier"
    )
    model_used: str = Field(
        ..., description="Name of the trained model architecture utilized"
    )
    inputs_evaluated: Dict[str, Any] = Field(
        ..., description="Echo of inputs used for inference"
    )


class TriggeredRiskFactor(BaseModel):
    """Details of a single triggered risk factor."""

    factor: str
    feature: str
    current_value: Any
    threshold: Any
    severity: str
    reason: str


class RiskAnalysisRequest(AcademicInputBase):
    """Request schema for rule-based risk evaluation."""

    custom_thresholds: Optional[Dict[str, float]] = Field(
        default=None,
        description="Optional custom thresholds overriding institutional defaults",
    )


class RiskAnalysisResponse(BaseModel):
    """Response schema for academic risk analysis."""

    risk_level: str = Field(
        ..., description="Overall risk status: High Risk, Medium Risk, or Low Risk"
    )
    badge_color: str = Field(
        ..., description="UI accent color token (red, amber, green)"
    )
    risk_flags_count: int = Field(
        ..., description="Total count of academic risk indicators triggered"
    )
    is_critical: bool = Field(
        ..., description="Indicates presence of critical structural failure"
    )
    summary: str = Field(
        ..., description="Summary statement for students and educators"
    )
    triggered_factors: List[TriggeredRiskFactor] = Field(
        ..., description="Granular list of specific triggered criteria"
    )
    recommended_interventions: List[str] = Field(
        ..., description="Actionable counseling and tutoring recommendations"
    )


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str
    service: str
    version: str
    model_loaded: bool
    selected_model: str


# ====================================================
# What-If Simulator Schemas
# ====================================================

class SimulationRequest(BaseModel):
    """Request schema for What-If scenario improvement simulation."""

    baseline: AcademicInputBase = Field(
        ..., description="Original/current student academic records"
    )
    simulated: AcademicInputBase = Field(
        ..., description="Modified/hypothetical target student parameters"
    )


class SimulationResponse(BaseModel):
    """Response schema comparing baseline vs simulated academic trajectories."""

    baseline_prediction: PredictionResponse
    simulated_prediction: PredictionResponse
    baseline_risk: RiskAnalysisResponse
    simulated_risk: RiskAnalysisResponse
    delta_marks: float = Field(
        ..., description="Marks difference: simulated minus baseline (out of 60)"
    )
    letter_grade_change: str = Field(
        ..., description="Grade progression indicator e.g. 'C -> A' or 'UNCHANGED'"
    )
    direction: str = Field(
        ..., description="Trajectory: INCREASED, DECREASED, or UNCHANGED"
    )
    risk_status_change: str = Field(
        ..., description="Risk shift: IMPROVED, WORSENED, or UNCHANGED"
    )
    feature_shifts: Dict[str, Any] = Field(
        ..., description="Changes applied across features"
    )
    summary: str = Field(
        ..., description="Human-readable narrative of projected impact"
    )
    disclaimer: str = Field(
        ..., description="Disclaimer that simulations are empirical estimates"
    )


# ====================================================
# Explainable AI Schemas
# ====================================================

class ExplanationRequest(AcademicInputBase):
    """Request schema for Explainable Prediction analysis."""

    model_preference: Optional[str] = Field(
        default="linear_regression",
        description="Model to highlight (linear_regression or decision_tree)",
    )


class ExplanationResponse(BaseModel):
    """Response schema containing genuine feature attribution and decision paths."""

    preferred_model: str
    linear_regression: Dict[str, Any]
    decision_tree: Dict[str, Any]
    scale_max: float = 60.0
