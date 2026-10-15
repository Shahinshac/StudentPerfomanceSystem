"""
backend/tests/test_features.py

Automated unit and integration tests for the two features on the UCI dataset:
1. What-If Academic Improvement Simulator
2. Explainable Prediction (Linear Regression feature attribution & Decision Tree path traversal)
"""

import pytest
import sys
from pathlib import Path
from starlette.testclient import TestClient

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.main import app
from backend.app.services.simulation import simulate_academic_improvement
from backend.app.services.explanation import explain_prediction

client = TestClient(app)


def test_simulation_identical_inputs():
    """
    Verifies that unchanged inputs return identical baseline and simulated predictions,
    with 0 delta and UNCHANGED letter grade.
    """
    base = {
        "G1_scaled": 36.0,
        "G2_scaled": 39.0,
        "studytime": 2,
        "failures": 0,
        "absences": 4,
        "schoolsup": "no",
    }

    result = simulate_academic_improvement(
        base_G1_scaled=base["G1_scaled"],
        base_G2_scaled=base["G2_scaled"],
        base_studytime=base["studytime"],
        base_failures=base["failures"],
        base_absences=base["absences"],
        base_schoolsup=base["schoolsup"],
        sim_G1_scaled=base["G1_scaled"],
        sim_G2_scaled=base["G2_scaled"],
        sim_studytime=base["studytime"],
        sim_failures=base["failures"],
        sim_absences=base["absences"],
        sim_schoolsup=base["schoolsup"],
    )

    assert result["delta_marks"] == 0.0
    assert result["direction"] == "UNCHANGED"
    assert result["letter_grade_change"] == "UNCHANGED"
    assert result["risk_status_change"] == "UNCHANGED"
    assert (
        result["baseline_prediction"]["predicted_final_marks"]
        == result["simulated_prediction"]["predicted_final_marks"]
    )
    assert result["baseline_prediction"]["letter_grade"] == result["simulated_prediction"]["letter_grade"]


def test_simulation_improved_inputs():
    """Verifies that improving academic parameters produces positive delta marks and grade gain."""
    result = simulate_academic_improvement(
        base_G1_scaled=21.0,
        base_G2_scaled=24.0,
        base_studytime=1,
        base_failures=2,
        base_absences=16,
        base_schoolsup="no",
        sim_G1_scaled=45.0,
        sim_G2_scaled=48.0,
        sim_studytime=3,
        sim_failures=0,
        sim_absences=2,
        sim_schoolsup="yes",
    )

    assert result["delta_marks"] > 0.0
    assert result["simulated_prediction"]["predicted_final_marks"] > result["baseline_prediction"]["predicted_final_marks"]
    assert result["risk_status_change"] == "IMPROVED"
    assert result["simulated_risk"]["risk_level"] == "Low Risk"
    assert result["direction"] == "INCREASED"


def test_simulation_boundary_values():
    """Verifies simulation at minimum and maximum boundary values on 0-60 marks scale."""
    result = simulate_academic_improvement(
        base_G1_scaled=0.0,
        base_G2_scaled=0.0,
        base_studytime=1,
        base_failures=3,
        base_absences=32,
        base_schoolsup="no",
        sim_G1_scaled=60.0,
        sim_G2_scaled=60.0,
        sim_studytime=4,
        sim_failures=0,
        sim_absences=0,
        sim_schoolsup="no",
    )

    assert 0.0 <= result["baseline_prediction"]["predicted_final_marks"] <= 60.0
    assert 0.0 <= result["simulated_prediction"]["predicted_final_marks"] <= 60.0
    assert result["delta_marks"] > 0.0


def test_linear_regression_exact_mathematical_attribution():
    """
    Verifies that the sum of Linear Regression feature contributions + intercept
    mathematically reconstructs the pipeline prediction within floating point tolerance.
    """
    for g1, g2, fails, abs_days in [(36.0, 42.0, 0, 4), (58.0, 60.0, 0, 0), (0.0, 0.0, 3, 35)]:
        expl = explain_prediction(
            G1_scaled=g1,
            G2_scaled=g2,
            studytime=3,
            failures=fails,
            absences=abs_days,
            schoolsup="no",
        )

        lr_data = expl["linear_regression"]
        intercept = lr_data["baseline_cohort_marks"]
        contributions = lr_data["feature_contributions"]

        assert len(contributions) == 6
        sum_contributions = sum(item["mark_contribution"] for item in contributions)
        reconstructed_pred = round(intercept + sum_contributions, 2)

        assert abs(reconstructed_pred - lr_data["raw_prediction"]) <= 0.05
        assert 0.0 <= lr_data["clamped_prediction"] <= 60.0

        for item in contributions:
            assert "feature" in item
            assert "raw_value" in item
            assert "coefficient" in item
            assert item["direction"] in ("POSITIVE", "NEGATIVE")
            assert len(item["explanation"]) > 0


def test_decision_tree_decision_path():
    """Verifies that Decision Tree decision path correctly traces from root to leaf across score regimes."""
    for g1, g2, fails, abs_days in [(45.0, 48.0, 0, 2), (15.0, 18.0, 2, 20), (0.0, 0.0, 3, 40)]:
        expl = explain_prediction(
            G1_scaled=g1,
            G2_scaled=g2,
            studytime=3,
            failures=fails,
            absences=abs_days,
            schoolsup="no",
        )

        dt_data = expl["decision_tree"]
        path = dt_data["decision_path"]

        assert len(path) >= 2
        # First step should not be a leaf
        assert path[0]["is_leaf"] is False
        # Last step must be a leaf
        leaf = path[-1]
        assert leaf["is_leaf"] is True
        assert "subcohort_avg_marks" in leaf
        assert leaf["subcohort_sample_size"] > 0
        assert 0.0 <= dt_data["predicted_marks"] <= 60.0
        # Terminal leaf mean should equal predicted marks within rounding
        assert abs(leaf["subcohort_avg_marks"] - dt_data["predicted_marks"]) <= 0.05

        # Split steps must have condition_met, threshold, and non-empty explanation
        for step in path[:-1]:
            assert not step["is_leaf"]
            assert step["feature"] is not None
            assert step["threshold"] is not None
            assert step["student_value"] is not None
            assert step["condition_met"] is not None
            assert step["subcohort_sample_size"] > 0
            assert any(unit in step["explanation"] for unit in ("marks", "days absent", "past failures", "study tier", "units", "split condition"))


def test_api_simulate_endpoint():
    """Tests /api/simulate endpoint integration with UCI schema."""
    payload = {
        "baseline": {
            "G1_scaled": 24.0,
            "G2_scaled": 27.0,
            "studytime": 1,
            "failures": 1,
            "absences": 12,
            "schoolsup": "no",
        },
        "simulated": {
            "G1_scaled": 42.0,
            "G2_scaled": 45.0,
            "studytime": 3,
            "failures": 0,
            "absences": 2,
            "schoolsup": "yes",
        },
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "delta_marks" in data
    assert "letter_grade_change" in data
    assert "direction" in data
    assert "risk_status_change" in data
    assert "feature_shifts" in data


def test_api_explain_endpoint():
    """Tests /api/explain endpoint integration with UCI schema."""
    payload = {
        "G1_scaled": 36.0,
        "G2_scaled": 39.0,
        "studytime": 2,
        "failures": 0,
        "absences": 4,
        "schoolsup": "no",
        "model_preference": "linear_regression",
    }
    response = client.post("/api/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "decision_tree" in data
    assert "linear_regression" in data
    assert "decision_path" in data["decision_tree"]
    assert "feature_contributions" in data["linear_regression"]
