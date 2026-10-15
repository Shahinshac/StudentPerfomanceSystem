"""
backend/tests/test_api.py

API Integration Tests for FastAPI backend endpoints on the UCI Dataset.
Verifies response status codes, Pydantic validation, letter grades, and payload structures.
"""

import pytest
import sys
from pathlib import Path
from starlette.testclient import TestClient

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verifies that /api/health, /health, and / respond with 200 and report model loaded."""
    for path in ["/api/health", "/health", "/"]:
        response = client.get(path)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["model_loaded"] is True
        assert "Linear" in data["selected_model"] or "Pipeline" in data["selected_model"]


def test_model_metrics_endpoint():
    """Verifies that /api/model/metrics returns authentic UCI evaluation results."""
    response = client.get("/api/model/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert "linear_regression" in data["models"]
    assert "decision_tree" in data["models"]
    assert data["scale_max"] == 60.0
    assert "train_metrics" in data["models"]["linear_regression"]
    assert "test_metrics" in data["models"]["linear_regression"]


def test_dataset_summary_endpoint():
    """Verifies that /api/dataset/summary returns dataset metadata and EDA insights."""
    response = client.get("/api/dataset/summary")
    assert response.status_code == 200
    data = response.json()
    assert "data_summary" in data or "eda_insights" in data


def test_predict_endpoint_valid():
    """Verifies /api/predict with standard UCI student inputs."""
    payload = {
        "G1_scaled": 36.0,
        "G2_scaled": 39.0,
        "studytime": 2,
        "failures": 0,
        "absences": 4,
        "schoolsup": "no",
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_final_marks" in data
    assert 0.0 <= data["predicted_final_marks"] <= 60.0
    assert data["max_possible_marks"] == 60.0
    assert data["letter_grade"] in ["A", "B", "C", "D", "F"]


def test_predict_endpoint_validation_error():
    """Verifies that out-of-range inputs trigger 422 Unprocessable Entity."""
    bad_payload = {
        "G1_scaled": 85.0,  # Invalid: max 60.0
        "G2_scaled": 30.0,
        "studytime": 2,
        "failures": 0,
        "absences": 4,
        "schoolsup": "no",
    }
    response = client.post("/api/predict", json=bad_payload)
    assert response.status_code == 422


def test_risk_endpoint_valid():
    """Verifies /api/risk returns structured explainable risk analysis."""
    payload = {
        "G1_scaled": 21.0,
        "G2_scaled": 24.0,
        "studytime": 1,
        "failures": 2,
        "absences": 18,
        "schoolsup": "no",
    }
    response = client.post("/api/risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "High Risk"
    assert data["badge_color"] == "red"
    assert len(data["triggered_factors"]) >= 3


def test_evaluate_student_unified_endpoint():
    """Verifies unified evaluation endpoint returning both prediction and risk."""
    payload = {
        "G1_scaled": 42.0,
        "G2_scaled": 45.0,
        "studytime": 3,
        "failures": 0,
        "absences": 2,
        "schoolsup": "no",
    }
    response = client.post("/api/evaluate-student", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "risk" in data
    assert data["prediction"]["letter_grade"] in ["A", "B", "C", "D", "F"]
    assert data["risk"]["risk_level"] in ["Low Risk", "Medium Risk", "High Risk"]
