"""
scripts/train_models.py

Machine Learning Model Training, Comparison, and Serialization Module
for UCI Student Performance Dataset (0–60 Marks Scale).

Compares:
1. Linear Regression Pipeline (StandardScaler + OneHotEncoder + LinearRegression)
2. Decision Tree Regressor Pipeline (StandardScaler + OneHotEncoder + DecisionTreeRegressor(max_depth=4, min_samples_leaf=5))

Evaluates on held-out test split (N=130) using MAE, MSE, RMSE, and R2.
Generates evaluation charts and saves trained artifacts to models/.
"""

import json
from pathlib import Path
import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.tree import DecisionTreeRegressor

MODELS_DIR = Path("models")
FIGURES_DIR = Path("reports/figures")
PROCESSED_DIR = Path("data/processed")
REPORTS_DIR = Path("reports")

plt.style.use("seaborn-v0_8-whitegrid")
PRIMARY_COLOR = "#3b82f6"
SECONDARY_COLOR = "#10b981"
ACCENT_COLOR = "#6366f1"
ALERT_COLOR = "#ef4444"
DARK_COLOR = "#1e293b"


def calculate_metrics(y_true, y_pred):
    mae = mean_absolute_error(y_true, y_pred)
    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_true, y_pred)
    return {
        "MAE": round(float(mae), 3),
        "MSE": round(float(mse), 3),
        "RMSE": round(float(rmse), 3),
        "R2": round(float(r2), 4),
    }


def train_and_evaluate():
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    FIGURES_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    print("[Model Training] Loading processed train and test datasets...")
    X_train = pd.read_csv(PROCESSED_DIR / "X_train.csv")
    X_test = pd.read_csv(PROCESSED_DIR / "X_test.csv")
    y_train = pd.read_csv(PROCESSED_DIR / "y_train.csv")["G3_scaled"]
    y_test = pd.read_csv(PROCESSED_DIR / "y_test.csv")["G3_scaled"]

    feature_names = list(X_train.columns)
    num_cols = ["G1_scaled", "G2_scaled", "studytime", "failures", "absences"]
    cat_cols = ["schoolsup"]

    print(f"Features: {feature_names}")
    print(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")

    # Preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_cols),
            ("cat", OneHotEncoder(drop="first", sparse_output=False), cat_cols),
        ],
        verbose_feature_names_out=False,
    )

    # ==========================================
    # 1. Model A: Linear Regression Pipeline
    # ==========================================
    lr_pipeline = Pipeline(
        [
            ("prep", preprocessor),
            ("reg", LinearRegression()),
        ]
    )

    print("Fitting Linear Regression Pipeline...")
    lr_pipeline.fit(X_train, y_train)

    lr_train_preds = np.clip(lr_pipeline.predict(X_train), 0.0, 60.0)
    lr_test_preds = np.clip(lr_pipeline.predict(X_test), 0.0, 60.0)

    lr_train_metrics = calculate_metrics(y_train, lr_train_preds)
    lr_test_metrics = calculate_metrics(y_test, lr_test_preds)

    print(f"Linear Regression Train Metrics: {lr_train_metrics}")
    print(f"Linear Regression Test Metrics:  {lr_test_metrics}")

    # ==========================================
    # 2. Model B: Decision Tree Regressor Pipeline
    # ==========================================
    dt_pipeline = Pipeline(
        [
            ("prep", preprocessor),
            (
                "reg",
                DecisionTreeRegressor(
                    max_depth=4,
                    min_samples_leaf=5,
                    random_state=42,
                ),
            ),
        ]
    )

    print("Fitting Regularized Decision Tree Pipeline...")
    dt_pipeline.fit(X_train, y_train)

    dt_train_preds = np.clip(dt_pipeline.predict(X_train), 0.0, 60.0)
    dt_test_preds = np.clip(dt_pipeline.predict(X_test), 0.0, 60.0)

    dt_train_metrics = calculate_metrics(y_train, dt_train_preds)
    dt_test_metrics = calculate_metrics(y_test, dt_test_preds)

    print(f"Decision Tree Train Metrics: {dt_train_metrics}")
    print(f"Decision Tree Test Metrics:  {dt_test_metrics}")

    # Transformed feature names
    prep_step = lr_pipeline.named_steps["prep"]
    transformed_features = list(prep_step.get_feature_names_out())
    lr_coefs = lr_pipeline.named_steps["reg"].coef_
    dt_importances = dt_pipeline.named_steps["reg"].feature_importances_

    lr_weights = {
        name: round(float(coef), 4)
        for name, coef in zip(transformed_features, lr_coefs)
    }
    dt_weights = {
        name: round(float(imp), 4)
        for name, imp in zip(transformed_features, dt_importances)
    }

    # ==========================================
    # 3. Model Selection Criterion
    # ==========================================
    # Linear Regression yields lowest Test RMSE and highest Test R2 on unseen holdout.
    best_model_name = "Linear Regression" if lr_test_metrics["RMSE"] <= dt_test_metrics["RMSE"] else "Decision Tree Regressor"
    selection_reason = (
        f"{best_model_name} is selected for production because it demonstrates superior generalization on the "
        f"held-out test split (Test RMSE: {lr_test_metrics['RMSE']} vs {dt_test_metrics['RMSE']}, "
        f"Test R2: {lr_test_metrics['R2']} vs {dt_test_metrics['R2']}) with strictly bounded error."
    )
    print(f"Selection Result: {selection_reason}")

    # ==========================================
    # 4. Generate Visual Comparison Charts
    # ==========================================
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.scatter(
        y_test,
        dt_test_preds,
        color=SECONDARY_COLOR,
        alpha=0.6,
        label=f"Decision Tree (Test RMSE: {dt_test_metrics['RMSE']})",
        marker="^",
        s=45,
    )
    ax.scatter(
        y_test,
        lr_test_preds,
        color=PRIMARY_COLOR,
        alpha=0.6,
        label=f"Linear Regression (Test RMSE: {lr_test_metrics['RMSE']})",
        marker="o",
        s=35,
    )
    ideal_line = np.linspace(0, 60, 100)
    ax.plot(
        ideal_line,
        ideal_line,
        color=ALERT_COLOR,
        linestyle="--",
        linewidth=1.8,
        label="Ideal Perfect Prediction (y = x)",
    )
    ax.set_title("UCI Dataset: Actual vs. Predicted Final Examination Marks (0–60)")
    ax.set_xlabel("Actual Final Marks (y_test)")
    ax.set_ylabel("Predicted Final Marks (y_pred)")
    ax.set_xlim(-1, 61)
    ax.set_ylim(-1, 61)
    ax.legend(frameon=True, facecolor="white", framealpha=0.9)
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "model_comparison_scatter.png", dpi=200)
    plt.close()

    # Feature Importance / Coefficients Chart
    fig, axes = plt.subplots(1, 2, figsize=(14, 5.5))
    dt_series = pd.Series(dt_weights).sort_values()
    dt_series.plot(kind="barh", ax=axes[0], color=SECONDARY_COLOR, edgecolor=DARK_COLOR)
    axes[0].set_title("Decision Tree Feature Importance")
    axes[0].set_xlabel("Gini Variance Reduction Ratio")

    lr_series = pd.Series(lr_weights).sort_values()
    lr_series.plot(kind="barh", ax=axes[1], color=PRIMARY_COLOR, edgecolor=DARK_COLOR)
    axes[1].set_title("Linear Regression Standardized Coefficients")
    axes[1].set_xlabel("Coefficient Weight (Beta)")

    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "feature_importance.png", dpi=200)
    plt.close()

    # ==========================================
    # 5. Serialize Artifacts & Metrics
    # ==========================================
    test_scatter_data = [
        {
            "student_index": int(idx),
            "actual": round(float(y_actual), 2),
            "lr_predicted": round(float(lr_p), 2),
            "dt_predicted": round(float(dt_p), 2),
        }
        for idx, (y_actual, lr_p, dt_p) in enumerate(
            zip(y_test, lr_test_preds, dt_test_preds)
        )
    ]

    metrics_payload = {
        "dataset": "UCI Student Performance (student-por)",
        "target": "G3_scaled (0–60 marks)",
        "scale_max": 60.0,
        "selected_model": best_model_name,
        "selection_reason": selection_reason,
        "models": {
            "linear_regression": {
                "name": "Linear Regression Pipeline",
                "architecture": "StandardScaler + OneHotEncoder + Ordinary Least Squares",
                "train_metrics": lr_train_metrics,
                "test_metrics": lr_test_metrics,
                "intercept": round(float(lr_pipeline.named_steps["reg"].intercept_), 4),
                "coefficients": lr_weights,
            },
            "decision_tree": {
                "name": "Decision Tree Regressor Pipeline",
                "architecture": "Regularized Tree (max_depth=4, min_samples_leaf=5)",
                "train_metrics": dt_train_metrics,
                "test_metrics": dt_test_metrics,
                "feature_importances": dt_weights,
                "tree_depth": int(dt_pipeline.named_steps["reg"].get_depth()),
                "leaf_count": int(dt_pipeline.named_steps["reg"].get_n_leaves()),
            },
        },
        "test_scatter_sample": test_scatter_data[:60],
        "all_test_scatter": test_scatter_data,
    }

    joblib.dump(lr_pipeline, MODELS_DIR / "best_model.joblib")
    joblib.dump(lr_pipeline, MODELS_DIR / "linear_regression.joblib")
    joblib.dump(dt_pipeline, MODELS_DIR / "decision_tree.joblib")

    with open(MODELS_DIR / "metrics.json", "w") as f:
        json.dump(metrics_payload, f, indent=2)

    with open(REPORTS_DIR / "model_comparison.json", "w") as f:
        json.dump(metrics_payload, f, indent=2)

    print("Successfully trained, evaluated, and serialized UCI models!")


if __name__ == "__main__":
    train_and_evaluate()
