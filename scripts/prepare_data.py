"""
scripts/prepare_data.py

Reproducible Data Preparation Pipeline for UCI Student Performance Dataset.
- Primary Dataset: data/raw/student-por.csv (649 Portuguese-subject student records)
- Scales academic examination grades from 0-20 to 0-60 marks:
    * G1_scaled = G1 * 3
    * G2_scaled = G2 * 3
    * G3_scaled = G3 * 3 (Prediction Target)
- Predictor Features:
    * G1_scaled: First-period evaluation score (Scale: 0.0 - 60.0)
    * G2_scaled: Second-period evaluation score (Scale: 0.0 - 60.0)
    * studytime: Weekly study time (1: <2h, 2: 2-5h, 3: 5-10h, 4: >10h)
    * failures: Number of past class failures (0: none, 1, 2, 3: 3 or more)
    * absences: Number of school absences (Scale: 0 - 32)
    * schoolsup: Extra educational support (binary: 'no', 'yes')
- Leakage Prevention: G3 is used exclusively as target; never as feature.
- Reproducible split: 80% train (N=519), 20% test (N=130), random_state=42.
"""

import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

RAW_DATA_PATH = Path("data/raw/student-por.csv")
PROCESSED_DIR = Path("data/processed")

NUMERICAL_FEATURES = [
    "G1_scaled",
    "G2_scaled",
    "studytime",
    "failures",
    "absences",
]
CATEGORICAL_FEATURES = [
    "schoolsup",
]
FEATURE_NAMES = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
TARGET_NAME = "G3_scaled"


def load_raw_data(file_path: Path) -> pd.DataFrame:
    """Loads and validates the UCI student-por raw dataset."""
    if not file_path.exists():
        raise FileNotFoundError(f"Raw UCI dataset not found at: {file_path}")
    df = pd.read_csv(file_path, sep=None, engine="python")
    print(f"Loaded raw UCI dataset: shape={df.shape}")
    assert df.shape[0] == 649, f"Expected 649 rows, found {df.shape[0]}"
    return df


def engineer_scaled_grades(df: pd.DataFrame) -> pd.DataFrame:
    """Applies consistent 3x scaling from 0-20 to 0-60 marks scale."""
    df_feat = df.copy()
    df_feat["G1_scaled"] = df_feat["G1"] * 3.0
    df_feat["G2_scaled"] = df_feat["G2"] * 3.0
    df_feat["G3_scaled"] = df_feat["G3"] * 3.0
    return df_feat


def run_pipeline():
    """Main execution function for data preparation."""
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    print(f"[UCI Data Prep] Reading raw dataset from: {RAW_DATA_PATH}")
    raw_df = load_raw_data(RAW_DATA_PATH)

    # Apply 3x scaling for G1, G2, G3
    featured_df = engineer_scaled_grades(raw_df)

    # Validate feature presence and missingness
    selected_cols = FEATURE_NAMES + [TARGET_NAME]
    clean_data = featured_df[selected_cols].copy()

    missing_count = clean_data.isnull().sum()
    if missing_count.any():
        print(f"Warning: Found missing values:\n{missing_count}")
        clean_data = clean_data.dropna()
    else:
        print("Data integrity check: 0 missing values across all selected features and target.")

    X = clean_data[FEATURE_NAMES]
    y = clean_data[TARGET_NAME]

    # Leakage-safe 80/20 train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )

    print(f"Training split: {X_train.shape[0]} samples")
    print(f"Testing split:  {X_test.shape[0]} samples")

    # Combine into full train and test sets
    train_df = pd.concat([X_train, y_train], axis=1)
    test_df = pd.concat([X_test, y_test], axis=1)

    # Save to data/processed/
    X_train.to_csv(PROCESSED_DIR / "X_train.csv", index=False)
    X_test.to_csv(PROCESSED_DIR / "X_test.csv", index=False)
    y_train.to_csv(PROCESSED_DIR / "y_train.csv", index=False)
    y_test.to_csv(PROCESSED_DIR / "y_test.csv", index=False)
    train_df.to_csv(PROCESSED_DIR / "train.csv", index=False)
    test_df.to_csv(PROCESSED_DIR / "test.csv", index=False)

    # Summary statistics for documentation and API
    summary = {
        "dataset_name": "UCI Student Performance Dataset (student-por)",
        "source": "UCI Machine Learning Repository (Cortez and Silva, 2008)",
        "subject": "Portuguese Language Course",
        "total_records": int(clean_data.shape[0]),
        "train_records": int(X_train.shape[0]),
        "test_records": int(X_test.shape[0]),
        "max_exam_marks": 60.0,
        "features": {
            "G1_scaled": {
                "type": "numerical",
                "scale": "0.0 - 60.0 marks",
                "description": "First-period evaluation score (original G1 x 3)",
                "mean": float(round(X_train["G1_scaled"].mean(), 2)),
                "std": float(round(X_train["G1_scaled"].std(), 2)),
                "min": float(X_train["G1_scaled"].min()),
                "max": float(X_train["G1_scaled"].max()),
            },
            "G2_scaled": {
                "type": "numerical",
                "scale": "0.0 - 60.0 marks",
                "description": "Second-period evaluation score (original G2 x 3)",
                "mean": float(round(X_train["G2_scaled"].mean(), 2)),
                "std": float(round(X_train["G2_scaled"].std(), 2)),
                "min": float(X_train["G2_scaled"].min()),
                "max": float(X_train["G2_scaled"].max()),
            },
            "studytime": {
                "type": "ordinal",
                "scale": "1 - 4",
                "description": "Weekly study time (1: <2h, 2: 2-5h, 3: 5-10h, 4: >10h)",
                "mean": float(round(X_train["studytime"].mean(), 2)),
                "std": float(round(X_train["studytime"].std(), 2)),
                "min": int(X_train["studytime"].min()),
                "max": int(X_train["studytime"].max()),
            },
            "failures": {
                "type": "discrete",
                "scale": "0 - 3",
                "description": "Number of past class failures (0: none, 1, 2, 3: 3+)",
                "mean": float(round(X_train["failures"].mean(), 2)),
                "std": float(round(X_train["failures"].std(), 2)),
                "min": int(X_train["failures"].min()),
                "max": int(X_train["failures"].max()),
            },
            "absences": {
                "type": "numerical",
                "scale": "0 - 32",
                "description": "Number of school absences",
                "mean": float(round(X_train["absences"].mean(), 2)),
                "std": float(round(X_train["absences"].std(), 2)),
                "min": int(X_train["absences"].min()),
                "max": int(X_train["absences"].max()),
            },
            "schoolsup": {
                "type": "categorical",
                "scale": "no, yes",
                "description": "Extra educational school support",
                "yes_count": int((X_train["schoolsup"] == "yes").sum()),
                "no_count": int((X_train["schoolsup"] == "no").sum()),
            },
        },
        "target": {
            "name": "G3_scaled",
            "scale": "0.0 - 60.0 marks",
            "description": "Final examination grade (original G3 x 3)",
            "mean": float(round(y_train.mean(), 2)),
            "std": float(round(y_train.std(), 2)),
            "min": float(y_train.min()),
            "max": float(y_train.max()),
        },
        "leakage_prevention": (
            "G3_scaled was isolated strictly as the prediction target and never passed into training features. "
            "Data was split reproducibly with random_state=42 before any preprocessing was fitted."
        ),
    }

    with open(PROCESSED_DIR / "data_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print(f"Successfully processed UCI dataset and saved summary to {PROCESSED_DIR / 'data_summary.json'}")


if __name__ == "__main__":
    run_pipeline()
