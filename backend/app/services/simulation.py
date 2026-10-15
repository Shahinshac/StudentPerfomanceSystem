"""
backend/app/services/simulation.py

What-If Academic Improvement Simulator Service for UCI Student Performance System.
Simulates hypothetical academic adjustments (improved G1/G2 marks, increased study hours,
cleared backlogs, reduced absences, extra educational support) and computes projected
delta marks, letter grade transitions (A-F), and institutional risk shifts.
"""

from typing import Dict, Any
from backend.app.services.prediction import prediction_service
from backend.app.services.risk_analysis import assess_academic_risk


def simulate_academic_improvement(
    base_G1_scaled: float,
    base_G2_scaled: float,
    base_studytime: int,
    base_failures: int,
    base_absences: int,
    base_schoolsup: str,
    sim_G1_scaled: float,
    sim_G2_scaled: float,
    sim_studytime: int,
    sim_failures: int,
    sim_absences: int,
    sim_schoolsup: str,
) -> Dict[str, Any]:
    """
    Executes what-if scenario comparison between baseline and simulated inputs.
    Uses existing model pipeline without mutating dataset or models.
    """
    # 1. Baseline Evaluation
    base_pred = prediction_service.predict(
        G1_scaled=base_G1_scaled,
        G2_scaled=base_G2_scaled,
        studytime=base_studytime,
        failures=base_failures,
        absences=base_absences,
        schoolsup=base_schoolsup,
    )
    base_risk = assess_academic_risk(
        G1_scaled=base_G1_scaled,
        G2_scaled=base_G2_scaled,
        studytime=base_studytime,
        failures=base_failures,
        absences=base_absences,
        schoolsup=base_schoolsup,
    )

    # 2. Simulated Scenario Evaluation
    sim_pred = prediction_service.predict(
        G1_scaled=sim_G1_scaled,
        G2_scaled=sim_G2_scaled,
        studytime=sim_studytime,
        failures=sim_failures,
        absences=sim_absences,
        schoolsup=sim_schoolsup,
    )
    sim_risk = assess_academic_risk(
        G1_scaled=sim_G1_scaled,
        G2_scaled=sim_G2_scaled,
        studytime=sim_studytime,
        failures=sim_failures,
        absences=sim_absences,
        schoolsup=sim_schoolsup,
    )

    # 3. Delta Computations
    mark_diff = round(
        sim_pred["predicted_final_marks"] - base_pred["predicted_final_marks"], 2
    )
    if mark_diff > 0.05:
        direction = "INCREASED"
    elif mark_diff < -0.05:
        direction = "DECREASED"
    else:
        direction = "UNCHANGED"

    base_grade = base_pred["letter_grade"]
    sim_grade = sim_pred["letter_grade"]
    if base_grade != sim_grade:
        grade_change = f"{base_grade} → {sim_grade}"
    else:
        grade_change = "UNCHANGED"

    flags_diff = sim_risk["risk_flags_count"] - base_risk["risk_flags_count"]
    if flags_diff < 0:
        risk_status_change = "IMPROVED"
    elif flags_diff > 0:
        risk_status_change = "WORSENED"
    else:
        risk_status_change = "UNCHANGED"

    # Feature-by-feature shifts
    feature_shifts = {
        "G1_scaled": round(sim_G1_scaled - base_G1_scaled, 2),
        "G2_scaled": round(sim_G2_scaled - base_G2_scaled, 2),
        "studytime": int(sim_studytime - base_studytime),
        "failures": int(sim_failures - base_failures),
        "absences": int(sim_absences - base_absences),
        "schoolsup": f"{base_schoolsup} → {sim_schoolsup}",
    }

    # Generate human-readable narrative summary
    if direction == "INCREASED":
        narrative = (
            f"The proposed academic adjustments project an increase of +{mark_diff:.2f} final marks "
            f"(from {base_pred['predicted_final_marks']:.1f} to {sim_pred['predicted_final_marks']:.1f} out of 60). "
        )
    elif direction == "DECREASED":
        narrative = (
            f"The simulated parameters result in a projected decrease of {abs(mark_diff):.2f} marks "
            f"(from {base_pred['predicted_final_marks']:.1f} to {sim_pred['predicted_final_marks']:.1f} out of 60). "
        )
    else:
        narrative = (
            f"Projected marks remained steady at {base_pred['predicted_final_marks']:.1f} / 60 marks. "
        )

    if grade_change != "UNCHANGED":
        narrative += f"Provisional letter grade shifts from {base_grade} to {sim_grade}. "

    if risk_status_change == "IMPROVED":
        narrative += f"Academic risk successfully reduced from {base_risk['risk_level']} to {sim_risk['risk_level']}."
    elif risk_status_change == "WORSENED":
        narrative += f"Academic risk elevated from {base_risk['risk_level']} to {sim_risk['risk_level']}."
    else:
        narrative += f"Risk level remains {base_risk['risk_level']}."

    return {
        "baseline_prediction": base_pred,
        "simulated_prediction": sim_pred,
        "baseline_risk": base_risk,
        "simulated_risk": sim_risk,
        "delta_marks": mark_diff,
        "letter_grade_change": grade_change,
        "direction": direction,
        "risk_status_change": risk_status_change,
        "feature_shifts": feature_shifts,
        "summary": narrative,
        "disclaimer": (
            "What-If simulation results are empirical model projections (0–60 scaled marks), not guarantees of "
            "future examination performance. Intended solely for student motivation and counseling goal-setting."
        ),
    }
