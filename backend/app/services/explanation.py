"""
backend/app/services/explanation.py

Explainable AI (XAI) service providing authentic mathematical and structural
explanations for student performance predictions on the UCI Dataset (0–60 Marks Scale).

Methods:
1. Linear Regression: Exact standardized feature decomposition
   contribution_j = beta_j * z_j
   predicted_marks = intercept + sum(contributions)

2. Decision Tree Regressor: Exact decision path traversal
   Extracts active split nodes, thresholds, student values, and intermediate cohort marks.
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
import joblib
import numpy as np
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
MODELS_DIR = ROOT_DIR / "models" if (ROOT_DIR / "models").exists() else Path("models")
FEATURE_NAMES = [
    "G1_scaled",
    "G2_scaled",
    "studytime",
    "failures",
    "absences",
    "schoolsup",
]

FEATURE_LABELS = {
    "G1_scaled": "First-Period Marks (0-60)",
    "G2_scaled": "Second-Period Marks (0-60)",
    "studytime": "Weekly Study Time (1-4)",
    "failures": "Past Class Failures (0-3)",
    "absences": "School Absences (0-50)",
    "schoolsup": "Extra Educational Support (no/yes)",
    "schoolsup_yes": "Extra Educational Support (yes)",
}


def explain_linear_regression(
    model_pipeline,
    student_df: pd.DataFrame,
) -> Dict[str, Any]:
    """
    Computes exact mathematical feature contributions for Linear Regression Pipeline.
    y = intercept + sum(coef_j * scaled_x_j)
    """
    prep = model_pipeline.named_steps["prep"]
    regressor = model_pipeline.named_steps["reg"]

    transformed_vals = prep.transform(student_df)[0]
    transformed_names = list(prep.get_feature_names_out())
    intercept = float(regressor.intercept_)
    coefficients = regressor.coef_

    # Numerical feature stats from StandardScaler inside ColumnTransformer
    num_scaler = prep.named_transformers_["num"]
    num_means = num_scaler.mean_
    num_scales = num_scaler.scale_
    num_cols = ["G1_scaled", "G2_scaled", "studytime", "failures", "absences"]

    contributions: List[Dict[str, Any]] = []
    total_contribution = 0.0

    for idx, feat_name in enumerate(transformed_names):
        std_val = float(transformed_vals[idx])
        coef = float(coefficients[idx])
        contrib = std_val * coef
        total_contribution += contrib

        if feat_name in num_cols:
            num_idx = num_cols.index(feat_name)
            raw_val = float(student_df[feat_name].iloc[0])
            mean_val = float(num_means[num_idx])
            scale_val = float(num_scales[num_idx])
        else:
            raw_val = 1.0 if student_df["schoolsup"].iloc[0].lower() == "yes" else 0.0
            mean_val = 0.10  # ~10% of cohort receives schoolsup
            scale_val = 1.0

        direction = "POSITIVE" if contrib >= 0 else "NEGATIVE"
        if abs(contrib) < 0.1:
            impact_desc = "Neutral impact: student score is very close to cohort mean."
        elif contrib > 0:
            impact_desc = f"Positive impact: added +{contrib:.2f} marks relative to cohort mean."
        else:
            impact_desc = f"Negative impact: reduced projection by {abs(contrib):.2f} marks relative to cohort mean."

        label = FEATURE_LABELS.get(feat_name, feat_name)
        contributions.append({
            "feature": feat_name,
            "label": label,
            "raw_value": round(raw_val, 2),
            "cohort_mean": round(mean_val, 2),
            "standardized_value": round(std_val, 3),
            "coefficient": round(coef, 4),
            "mark_contribution": round(contrib, 2),
            "direction": direction,
            "explanation": impact_desc,
        })

    # Sort contributions by absolute impact
    contributions.sort(key=lambda x: abs(x["mark_contribution"]), reverse=True)

    raw_prediction = intercept + total_contribution
    clamped_prediction = max(0.0, min(60.0, raw_prediction))

    return {
        "model_name": "Linear Regression (StandardScaler + OneHotEncoder Pipeline)",
        "explanation_method": "Standardized Linear Feature Attribution",
        "baseline_cohort_marks": round(intercept, 2),
        "raw_prediction": round(raw_prediction, 2),
        "clamped_prediction": round(clamped_prediction, 2),
        "feature_contributions": contributions,
        "global_importance": {
            feat: round(abs(float(coef)), 4)
            for feat, coef in zip(transformed_names, coefficients)
        },
        "interpretation_guide": (
            f"Each feature contribution represents the exact directional marks added or subtracted "
            f"from the baseline cohort average ({intercept:.2f} marks) based on the student's normalized indicators."
        ),
    }


def explain_decision_tree(
    model_pipeline,
    student_df: pd.DataFrame,
) -> Dict[str, Any]:
    """
    Extracts the exact decision path traversed by the student in the Decision Tree Pipeline.
    """
    prep = model_pipeline.named_steps["prep"]
    tree_estimator = model_pipeline.named_steps["reg"]
    t = tree_estimator.tree_

    transformed_vals = prep.transform(student_df)
    transformed_names = list(prep.get_feature_names_out())

    # Decision path
    dp = tree_estimator.decision_path(transformed_vals)
    node_indices = dp.indices.tolist()

    num_scaler = prep.named_transformers_["num"]
    num_means = num_scaler.mean_
    num_scales = num_scaler.scale_
    num_cols = ["G1_scaled", "G2_scaled", "studytime", "failures", "absences"]

    path_steps: List[Dict[str, Any]] = []

    for step_num, node_id in enumerate(node_indices):
        feature_idx = t.feature[node_id]
        node_value = float(t.value[node_id][0][0])
        n_samples = int(t.n_node_samples[node_id])

        if feature_idx != -2:  # Split node
            feat_name = transformed_names[feature_idx]
            threshold = float(t.threshold[node_id])
            student_val = float(transformed_vals[0, feature_idx])
            passed_condition = student_val <= threshold

            # Convert standardized threshold back to original scale if numeric
            if feat_name in num_cols:
                col_idx = num_cols.index(feat_name)
                orig_threshold = threshold * num_scales[col_idx] + num_means[col_idx]
                raw_student_val = float(student_df[feat_name].iloc[0])
                orig_cond_str = (
                    f"{raw_student_val:.1f} <= {orig_threshold:.1f}"
                    if passed_condition
                    else f"{raw_student_val:.1f} > {orig_threshold:.1f}"
                )
                if "scaled" in feat_name:
                    unit_str = "marks"
                elif feat_name == "absences":
                    unit_str = "days absent"
                elif feat_name == "studytime":
                    unit_str = "study tier (1-4)"
                elif feat_name == "failures":
                    unit_str = "past failures"
                else:
                    unit_str = "units"

                step_expl = (
                    f"Student's {FEATURE_LABELS.get(feat_name, feat_name)} of {raw_student_val:.1f} was "
                    f"{'<=' if passed_condition else '>'} the split threshold of {orig_threshold:.1f} {unit_str}."
                )
            else:
                orig_threshold = threshold
                raw_student_val = student_val
                orig_cond_str = f"{student_val:.0f} {'<=' if passed_condition else '>'} {threshold:.0f}"
                step_expl = f"Student's {FEATURE_LABELS.get(feat_name, feat_name)} split condition was met."

            path_steps.append({
                "step": step_num + 1,
                "node_id": int(node_id),
                "is_leaf": False,
                "feature": feat_name,
                "label": FEATURE_LABELS.get(feat_name, feat_name),
                "student_value": round(raw_student_val, 2),
                "threshold": round(orig_threshold, 2),
                "condition_met": orig_cond_str,
                "subcohort_avg_marks": round(node_value, 2),
                "subcohort_sample_size": n_samples,
                "explanation": step_expl,
            })
        else:  # Leaf node
            path_steps.append({
                "step": step_num + 1,
                "node_id": int(node_id),
                "is_leaf": True,
                "subcohort_avg_marks": round(node_value, 2),
                "subcohort_sample_size": n_samples,
                "explanation": (
                    f"Final terminal leaf reached: Student assigned to a partition of {n_samples} training students "
                    f"with an average final score of {node_value:.2f} / 60 marks."
                ),
            })

    # Global feature importances
    global_importances = {
        feat: round(float(imp) * 100, 2)
        for feat, imp in zip(transformed_names, tree_estimator.feature_importances_)
    }

    final_prediction = round(float(tree_estimator.predict(transformed_vals)[0]), 2)
    clamped_prediction = max(0.0, min(60.0, final_prediction))

    return {
        "model_name": "Decision Tree Regressor (max_depth=4, min_samples_leaf=5)",
        "explanation_method": "Decision Tree Path Traversal & Impurity Importance",
        "predicted_marks": clamped_prediction,
        "decision_path": path_steps,
        "global_importance_percent": global_importances,
        "interpretation_guide": (
            "The decision tree partitions students through step-wise checkpoints. The path above "
            "displays the exact sequential criteria the student met from root to terminal leaf."
        ),
    }


def explain_prediction(
    G1_scaled: float,
    G2_scaled: float,
    studytime: int,
    failures: int,
    absences: int,
    schoolsup: str = "no",
    model_preference: Optional[str] = "linear_regression",
) -> Dict[str, Any]:
    """
    Unified entry point for explaining predictions across models.
    """
    student_df = pd.DataFrame(
        [
            {
                "G1_scaled": float(G1_scaled),
                "G2_scaled": float(G2_scaled),
                "studytime": int(studytime),
                "failures": int(failures),
                "absences": int(absences),
                "schoolsup": str(schoolsup).lower().strip(),
            }
        ],
        columns=FEATURE_NAMES,
    )

    dt_path = MODELS_DIR / "decision_tree.joblib"
    lr_path = MODELS_DIR / "linear_regression.joblib"

    if not dt_path.exists() or not lr_path.exists():
        raise FileNotFoundError("Trained models not found. Ensure model training has been run.")

    dt_pipeline = joblib.load(dt_path)
    lr_pipeline = joblib.load(lr_path)

    lr_explanation = explain_linear_regression(lr_pipeline, student_df)
    dt_explanation = explain_decision_tree(dt_pipeline, student_df)

    return {
        "preferred_model": model_preference,
        "linear_regression": lr_explanation,
        "decision_tree": dt_explanation,
        "scale_max": 60.0,
    }
