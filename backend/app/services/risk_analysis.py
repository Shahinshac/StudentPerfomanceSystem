"""
backend/app/services/risk_analysis.py

Explainable Rule-Based Academic Risk Assessment Service for UCI Student Performance System.

NOTE: This is a transparent, educator-configurable heuristic rule engine.
It does NOT claim to be a black-box machine learning classifier, adhering
strictly to academic integrity and ethical evaluation standards.
"""

from typing import Dict, Any, List, Optional

DEFAULT_RISK_THRESHOLDS = {
    "g2_critical": 30.0,      # <50% of 60 marks (Failing grade)
    "g2_warning": 36.0,       # <60% of 60 marks (Marginal grade D)
    "g1_critical": 30.0,      # <50% of 60 marks
    "g1_warning": 36.0,
    "failures_critical": 2,   # 2 or more past class failures
    "failures_warning": 1,    # 1 past class failure
    "absences_critical": 15,  # 15+ school absences (Severe absenteeism)
    "absences_warning": 8,    # 8-14 school absences
    "studytime_warning": 1,   # Tier 1 (<2 hours weekly study time)
}


def assess_academic_risk(
    G1_scaled: float,
    G2_scaled: float,
    studytime: int,
    failures: int,
    absences: int,
    schoolsup: str = "no",
    custom_thresholds: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """
    Evaluates student metrics against transparent institutional academic risk guidelines.

    Returns:
    - risk_level: "High Risk", "Medium Risk", or "Low Risk"
    - risk_score: Count of triggered risk flags
    - triggered_factors: List of detailed factors with explanations
    - recommended_interventions: Practical guidance for academic counselors
    """
    thresholds = DEFAULT_RISK_THRESHOLDS.copy()
    if custom_thresholds:
        thresholds.update(custom_thresholds)

    triggered_factors: List[Dict[str, Any]] = []
    has_critical_factor = False

    # 1. Second-Period Exam Score (G2_scaled out of 60)
    if G2_scaled < thresholds["g2_critical"]:
        has_critical_factor = True
        triggered_factors.append({
            "factor": "Severe Mid-Term Deficit (G2)",
            "feature": "G2_scaled",
            "current_value": round(float(G2_scaled), 1),
            "threshold": thresholds["g2_critical"],
            "severity": "CRITICAL",
            "reason": f"Second-period marks of {G2_scaled:.1f}/60 is below the passing threshold of 30.0, indicating acute failing risk.",
        })
    elif G2_scaled < thresholds["g2_warning"]:
        triggered_factors.append({
            "factor": "Marginal Mid-Term Performance (G2)",
            "feature": "G2_scaled",
            "current_value": round(float(G2_scaled), 1),
            "threshold": thresholds["g2_warning"],
            "severity": "WARNING",
            "reason": f"Second-period marks of {G2_scaled:.1f}/60 represents borderline grade D standing (30–36 marks).",
        })

    # 2. First-Period Exam Score (G1_scaled out of 60)
    if G1_scaled < thresholds["g1_critical"]:
        has_critical_factor = True
        triggered_factors.append({
            "factor": "Initial Evaluation Failure (G1)",
            "feature": "G1_scaled",
            "current_value": round(float(G1_scaled), 1),
            "threshold": thresholds["g1_critical"],
            "severity": "CRITICAL",
            "reason": f"First-period score of {G1_scaled:.1f}/60 was below the 30.0 mark passing floor.",
        })
    elif G1_scaled < thresholds["g1_warning"]:
        triggered_factors.append({
            "factor": "Sub-Optimal First-Period Grade (G1)",
            "feature": "G1_scaled",
            "current_value": round(float(G1_scaled), 1),
            "threshold": thresholds["g1_warning"],
            "severity": "WARNING",
            "reason": f"First-period marks of {G1_scaled:.1f}/60 was below satisfactory threshold (36.0).",
        })

    # 3. Past Class Failures (Academic History)
    if failures >= thresholds["failures_critical"]:
        has_critical_factor = True
        triggered_factors.append({
            "factor": "Chronic Past Class Failures",
            "feature": "failures",
            "current_value": int(failures),
            "threshold": thresholds["failures_critical"],
            "severity": "CRITICAL",
            "reason": f"Student has accumulated {failures} previous course failures, indicating persistent curriculum barriers.",
        })
    elif failures >= thresholds["failures_warning"]:
        triggered_factors.append({
            "factor": "Prior Course Failure on Record",
            "feature": "failures",
            "current_value": int(failures),
            "threshold": thresholds["failures_warning"],
            "severity": "WARNING",
            "reason": "1 past course failure recorded in student collegiate history.",
        })

    # 4. Absenteeism Evaluation
    if absences >= thresholds["absences_critical"]:
        has_critical_factor = True
        triggered_factors.append({
            "factor": "Severe Absenteeism",
            "feature": "absences",
            "current_value": int(absences),
            "threshold": thresholds["absences_critical"],
            "severity": "CRITICAL",
            "reason": f"{absences} recorded absences exceeds institutional threshold of {thresholds['absences_critical']}, risking exam debarment.",
        })
    elif absences >= thresholds["absences_warning"]:
        triggered_factors.append({
            "factor": "Elevated Class Absences",
            "feature": "absences",
            "current_value": int(absences),
            "threshold": thresholds["absences_warning"],
            "severity": "WARNING",
            "reason": f"{absences} recorded absences is higher than cohort average (3.7 absences).",
        })

    # 5. Study Time Allocation
    if studytime <= thresholds["studytime_warning"]:
        triggered_factors.append({
            "factor": "Insufficient Study Commitment",
            "feature": "studytime",
            "current_value": int(studytime),
            "threshold": thresholds["studytime_warning"],
            "severity": "WARNING",
            "reason": "Weekly study time is reported as < 2 hours per week, severely limiting subject consolidation.",
        })

    # Aggregate Risk Level Determination
    flag_count = len(triggered_factors)

    if flag_count >= 3 or has_critical_factor:
        risk_level = "High Risk"
        badge_color = "red"
        summary = "Student displays acute multidimensional academic risk requiring structured counseling and remedial assistance."
        interventions = [
            "Schedule mandatory faculty-student advisory consultation.",
            "Enroll student in peer-assisted tutoring or subject remedial workshops.",
            "Review attendance barriers and establish a formal recovery contract.",
            "Recommend enrolling in extra educational school support (schoolsup).",
        ]
    elif flag_count >= 1:
        risk_level = "Medium Risk"
        badge_color = "amber"
        summary = "Student exhibits isolated performance deficits that can be corrected with targeted early intervention."
        interventions = [
            "Issue proactive warning notice highlighting specific underperforming areas.",
            "Recommend structured weekly study schedule (aim for 2-5+ hours).",
            "Monitor ongoing attendance and checkpoint scores closely.",
        ]
    else:
        risk_level = "Low Risk"
        badge_color = "green"
        summary = "All key academic indicators meet or surpass institutional benchmarks. Normal academic trajectory maintained."
        interventions = [
            "Maintain current study schedule and attendance consistency.",
            "Encourage participation in advanced problem-solving seminars or honors topics.",
        ]

    return {
        "risk_level": risk_level,
        "badge_color": badge_color,
        "risk_flags_count": flag_count,
        "is_critical": has_critical_factor,
        "summary": summary,
        "triggered_factors": triggered_factors,
        "recommended_interventions": interventions,
    }
