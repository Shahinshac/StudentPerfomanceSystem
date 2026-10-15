"""
backend/tests/test_services.py

Comprehensive Unit and Integration Tests for UCI Prediction, Grading, and Risk Logic.
"""

import pytest
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.services.grading import classify_grade, get_grade_metadata
from backend.app.services.prediction import prediction_service
from backend.app.services.risk_analysis import assess_academic_risk


def test_grade_boundaries_all_tiers():
    """Verifies rigorous testing of every project-defined provisional grade boundary (0-60)."""
    # Tier A: 54.0 to 60.0
    grade_60, label_60, _ = classify_grade(60.0)
    assert grade_60 == "A"
    assert label_60 == "High Honors"

    grade_54, label_54, _ = classify_grade(54.0)
    assert grade_54 == "A"

    # Tier B: 48.0 to <54.0
    grade_53_9, label_53_9, _ = classify_grade(53.9)
    assert grade_53_9 == "B"
    assert label_53_9 == "Very Good"

    grade_48, label_48, _ = classify_grade(48.0)
    assert grade_48 == "B"

    # Tier C: 36.0 to <48.0
    grade_47_9, label_47_9, _ = classify_grade(47.9)
    assert grade_47_9 == "C"
    assert label_47_9 == "Satisfactory"

    grade_36, label_36, _ = classify_grade(36.0)
    assert grade_36 == "C"

    # Tier D: 30.0 to <36.0
    grade_35_9, label_35_9, _ = classify_grade(35.9)
    assert grade_35_9 == "D"
    assert label_35_9 == "Marginal Pass"

    grade_30, label_30, _ = classify_grade(30.0)
    assert grade_30 == "D"

    # Tier F: 0.0 to <30.0
    grade_29_9, label_29_9, _ = classify_grade(29.9)
    assert grade_29_9 == "F"
    assert label_29_9 == "Failing"

    grade_0, label_0, _ = classify_grade(0.0)
    assert grade_0 == "F"

    # Clipping out of range
    assert classify_grade(65.0)[0] == "A"
    assert classify_grade(-5.0)[0] == "F"


def test_prediction_service_valid_input():
    """Tests ML pipeline execution for a standard UCI student profile."""
    result = prediction_service.predict(
        G1_scaled=36.0,
        G2_scaled=39.0,
        studytime=2,
        failures=0,
        absences=4,
        schoolsup="no",
    )
    assert "predicted_final_marks" in result
    assert 0.0 <= result["predicted_final_marks"] <= 60.0
    assert result["max_possible_marks"] == 60.0
    assert result["letter_grade"] in ["A", "B", "C", "D", "F"]
    assert "G1_scaled" in result["inputs_evaluated"]
    assert "G2_scaled" in result["inputs_evaluated"]


def test_prediction_clipping_bounds():
    """Verifies that predicted final marks strictly adhere to [0.0, 60.0]."""
    # Extremely low inputs
    low_res = prediction_service.predict(
        G1_scaled=0.0,
        G2_scaled=0.0,
        studytime=1,
        failures=3,
        absences=32,
        schoolsup="no",
    )
    assert low_res["predicted_final_marks"] >= 0.0
    assert low_res["letter_grade"] == "F"

    # High inputs
    high_res = prediction_service.predict(
        G1_scaled=57.0,
        G2_scaled=57.0,
        studytime=4,
        failures=0,
        absences=0,
        schoolsup="no",
    )
    assert high_res["predicted_final_marks"] <= 60.0
    assert high_res["letter_grade"] in ["A", "B"]


def test_academic_risk_analysis_low_risk():
    """A diligent student with high G1/G2, no failures, and low absences should be Low Risk."""
    risk = assess_academic_risk(
        G1_scaled=45.0,
        G2_scaled=48.0,
        studytime=3,
        failures=0,
        absences=2,
        schoolsup="no",
    )
    assert risk["risk_level"] == "Low Risk"
    assert risk["risk_flags_count"] == 0
    assert len(risk["triggered_factors"]) == 0
    assert not risk["is_critical"]


def test_academic_risk_analysis_high_risk_multiple_flags():
    """A student with failing marks, past failures, and high absences triggers High Risk."""
    risk = assess_academic_risk(
        G1_scaled=21.0,  # Critical G1 (<30)
        G2_scaled=24.0,  # Critical G2 (<30)
        studytime=1,    # Warning studytime
        failures=2,     # Critical failures (>=2)
        absences=18,    # Critical absences (>=15)
        schoolsup="no",
    )
    assert risk["risk_level"] == "High Risk"
    assert risk["is_critical"] is True
    assert risk["risk_flags_count"] >= 3
    assert len(risk["triggered_factors"]) >= 3
    assert len(risk["recommended_interventions"]) > 0


def test_academic_risk_analysis_medium_risk():
    """A student with 1 or 2 warning indicators triggers Medium Risk."""
    risk = assess_academic_risk(
        G1_scaled=38.0,
        G2_scaled=34.0,  # Warning G2 (30-36)
        studytime=2,
        failures=1,     # Warning failures
        absences=4,
        schoolsup="no",
    )
    assert risk["risk_level"] == "Medium Risk"
    assert risk["risk_flags_count"] == 2
    assert not risk["is_critical"]


if __name__ == "__main__":
    pytest.main(["-v", str(Path(__file__))])
