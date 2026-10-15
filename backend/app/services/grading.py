"""
backend/app/services/grading.py

Shared Academic Grading Classification Module for UCI Student Performance System.
Implements the project-defined provisional boundaries on the 0–60 scaled marks range:
- A: 54.0 <= marks <= 60.0
- B: 48.0 <= marks < 54.0
- C: 36.0 <= marks < 48.0
- D: 30.0 <= marks < 36.0
- F: 0.0 <= marks < 30.0

Note: These are project-defined provisional boundaries established for academic performance
demonstration, not official UCI course bylaws or official college grading policy.
"""

from typing import Dict, Tuple


GRADE_BOUNDARIES = [
    {
        "grade": "A",
        "min_score": 54.0,
        "max_score": 60.0,
        "label": "High Honors",
        "description": "Exemplary performance demonstrating comprehensive subject mastery.",
        "status": "PASS",
    },
    {
        "grade": "B",
        "min_score": 48.0,
        "max_score": 54.0,
        "label": "Very Good",
        "description": "Strong academic achievement surpassing regular proficiency benchmarks.",
        "status": "PASS",
    },
    {
        "grade": "C",
        "min_score": 36.0,
        "max_score": 48.0,
        "label": "Satisfactory",
        "description": "Standard passing attainment meeting core curriculum expectations.",
        "status": "PASS",
    },
    {
        "grade": "D",
        "min_score": 30.0,
        "max_score": 36.0,
        "label": "Marginal Pass",
        "description": "Borderline performance meeting minimum threshold; requires academic reinforcement.",
        "status": "PASS",
    },
    {
        "grade": "F",
        "min_score": 0.0,
        "max_score": 30.0,
        "label": "Failing",
        "description": "Unsatisfactory attainment below minimum passing threshold; requires mandatory remedial intervention.",
        "status": "FAIL",
    },
]


def classify_grade(marks: float) -> Tuple[str, str, str]:
    """
    Classifies final examination marks (0.0 to 60.0) into a provisional letter grade.
    
    Returns:
        (letter_grade, category_label, description)
    """
    # Safe clipping to physical 0-60 boundaries
    clipped = max(0.0, min(60.0, float(marks)))

    if clipped >= 54.0:
        return (
            "A",
            "High Honors",
            "Exemplary performance demonstrating comprehensive subject mastery (54–60 Marks).",
        )
    elif clipped >= 48.0:
        return (
            "B",
            "Very Good",
            "Strong academic achievement surpassing regular proficiency benchmarks (48–<54 Marks).",
        )
    elif clipped >= 36.0:
        return (
            "C",
            "Satisfactory",
            "Standard passing attainment meeting core curriculum expectations (36–<48 Marks).",
        )
    elif clipped >= 30.0:
        return (
            "D",
            "Marginal Pass",
            "Borderline performance meeting minimum threshold (30–<36 Marks); reinforcement advised.",
        )
    else:
        return (
            "F",
            "Failing",
            "Unsatisfactory marks below passing threshold (0–<30 Marks); remedial intervention required.",
        )


def get_grade_metadata() -> Dict[str, dict]:
    """Returns metadata for all configured grade tiers."""
    return {item["grade"]: item for item in GRADE_BOUNDARIES}
