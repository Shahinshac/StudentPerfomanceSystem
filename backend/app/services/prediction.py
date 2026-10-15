"""
backend/app/services/prediction.py

Reusable prediction service for UCI Student Performance System.
Handles:
- Loading trained model pipelines (Linear Regression / Decision Tree) from models/
- Feature DataFrame construction adhering to UCI training order:
  [G1_scaled, G2_scaled, studytime, failures, absences, schoolsup]
- Prediction clipping to physical 0.0 - 60.0 marks range
- Configurable provisional grade classification (A, B, C, D, F) via grading service
"""

from pathlib import Path
from typing import Dict, Any, Optional
import joblib
import numpy as np
import pandas as pd
from backend.app.services.grading import classify_grade

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
MODELS_DIR = ROOT_DIR / "models" if (ROOT_DIR / "models").exists() else Path("models")
DEFAULT_MODEL_PATH = MODELS_DIR / "best_model.joblib"

FEATURE_NAMES = [
    "G1_scaled",
    "G2_scaled",
    "studytime",
    "failures",
    "absences",
    "schoolsup",
]

MAX_POSSIBLE_MARKS = 60.0


class AcademicPredictionService:
    """Service to load ML models and produce verified UCI academic predictions."""

    def __init__(self, model_path: Optional[Path] = None):
        self.model_path = model_path or DEFAULT_MODEL_PATH
        self.model = None
        self.model_name = "Selected Model"
        self._load_model()

    def _load_model(self):
        """Loads serialized model from disk with graceful error handling."""
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Model file not found at '{self.model_path.resolve()}'. "
                f"Ensure model training has been executed."
            )
        self.model = joblib.load(self.model_path)
        class_name = self.model.__class__.__name__
        if hasattr(self.model, "named_steps"):
            estimator_name = self.model.named_steps.get("reg", self.model).__class__.__name__
            self.model_name = f"Pipeline ({estimator_name})"
        else:
            self.model_name = class_name

    def predict(
        self,
        G1_scaled: float,
        G2_scaled: float,
        studytime: int,
        failures: int,
        absences: int,
        schoolsup: str = "no",
    ) -> Dict[str, Any]:
        """
        Executes prediction using the trained model pipeline.
        
        Guarantees:
        - Exact feature column alignment
        - Physical boundary clipping [0.0, 60.0]
        - Letter grade categorization using shared grading rules
        """
        if self.model is None:
            self._load_model()

        # Build DataFrame with identical column names and ordering used during training
        input_data = pd.DataFrame(
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

        raw_pred = float(self.model.predict(input_data)[0])

        # Post-processing: Clamp to physical exam constraints [0.0, 60.0]
        clipped_pred = max(0.0, min(MAX_POSSIBLE_MARKS, raw_pred))
        rounded_pred = round(clipped_pred, 2)

        letter_grade, category_label, description = classify_grade(rounded_pred)
        percentage = round((rounded_pred / MAX_POSSIBLE_MARKS) * 100, 1)

        return {
            "predicted_final_marks": rounded_pred,
            "raw_prediction": round(raw_pred, 2),
            "max_possible_marks": MAX_POSSIBLE_MARKS,
            "letter_grade": letter_grade,
            "performance_category": category_label,
            "performance_percentage": percentage,
            "category_description": description,
            "model_used": self.model_name,
            "inputs_evaluated": {
                "G1_scaled": round(float(G1_scaled), 2),
                "G2_scaled": round(float(G2_scaled), 2),
                "studytime": int(studytime),
                "failures": int(failures),
                "absences": int(absences),
                "schoolsup": str(schoolsup),
            },
        }


# Global singleton instance for efficient reuse across API requests
prediction_service = AcademicPredictionService()
