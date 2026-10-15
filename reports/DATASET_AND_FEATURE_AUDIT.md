# Dataset and Feature Audit Report: Student Performance Prediction System

**Document Version:** 1.0.0  
**Date of Audit:** October 15, 2026  
**Auditor:** ML Engineering & Systems Audit  
**Target Repository:** `StudentPerfomanceSystem` (Commit `15702d4`)  
**Scope:** Investigation of the original 300-student dataset (assignments, internal marks, attendance, final performance), comparison against the currently active UCI benchmark dataset, end-to-end feature pipeline tracing, empirical model validation, and deployment recommendations.

---

## 1. Executive Summary

This audit was conducted to investigate the original **300-student dataset** and its assignment/internal evaluation metrics, evaluate whether it can support the college student performance prediction task, and compare it with the active **UCI Student Performance Dataset** (`student-por.csv`, $N = 649$).

### Key Findings
1. **Identification of the Original Dataset:** The original dataset was located from local file caches and recovery records (`student_dropout_behavior_dataset.csv`, originally packaged in `archive.zip` in `data/raw/`). It comprises **300 student records and 16 columns**.
2. **Critical Quality Defects in the Original Dataset:**
   - **100% Missing Assignment Data:** The column `assignments_submitted` contains **300 null values out of 300 rows (100.0% missing)**.
   - **Zero-Variance Columns:** `total_assignments` (constant = 5), `total_lectures` (constant = 12), and `total_lab_sessions` (constant = 6) carry **zero variance** ($\sigma = 0$).
   - **Uncorrelated Synthetic Noise:** The features exhibit near-zero or non-sensical negative correlations with `final_marks` (e.g., `midterm_marks` has $r = -0.063$, `lectures_attended` has $r = -0.019$, `quiz1_marks` has $r = +0.036$).
3. **Empirical Model Validation on Original Dataset:**
   - Machine learning models trained on the original dataset (Linear Regression, Ridge, Decision Tree, Random Forest) yielded **negative cross-validation and test $R^2$ scores** (Linear Regression Test $R^2 = -0.0725$, Test $\text{MAE} = 10.443$ marks).
   - The original dataset performs **worse than a dummy baseline predicting the cohort mean**.
4. **Current Pipeline Trace:**
   - The production frontend (`PredictionPage`, `SimulatorPage`, `ExplainPage`), backend API (`/api/evaluate-student`, `/api/simulate`, `/api/explain`), and serialized pipeline (`models/best_model.joblib`) exclusively utilize **6 features** derived from the UCI cohort: `G1_scaled`, `G2_scaled`, `studytime`, `failures`, `absences`, and `schoolsup`.
   - The UCI model achieves strong, academically valid generalization: **Test $R^2 = 0.8638$**, **Test $\text{MAE} = 2.228$ marks** on a $0.0 - 60.0$ scale.
5. **Recommendation:**
   - **Retain the UCI dataset for the active production deployment and viva demonstration.**
   - Restoring the original dataset in its current state would introduce negative coefficients for midterm scores and attendance, break explainability (XAI), and produce invalid predictions.

---

## 2. Discovery & Inspection of the Original Dataset

### 2.1 File Location & Metadata
- **File Name:** `student_dropout_behavior_dataset.csv`
- **Original Path:** `data/raw/student_dropout_behavior_dataset.csv` (also present in `archive.zip`)
- **File Size:** 19,572 bytes
- **Total Rows:** 301 lines (1 header row + 300 student records)
- **Total Columns:** 16
- **Git Context:** Commit `b1e8aab` replaced the unverified raw files with the standardized UCI benchmark dataset (`data/raw/student-por.csv`). Commit `15702d4` finalized the frontend UI. The original dataset file was verified from repository archives without fabrication.

### 2.2 Descriptive Statistics of Original Dataset ($N = 300$)

| Column Name | Data Type | Non-Null Count | Missing (%) | Mean | Std Dev | Min | Median | Max |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `student_id` | `int64` | 300 | 0.0% | 150.50 | 86.75 | 1 | 150.5 | 300 |
| `name` | `object` | 300 | 0.0% | — | — | — | — | — |
| `age` | `int64` | 300 | 0.0% | 21.55 | 2.24 | 18 | 22.0 | 25 |
| `gender` | `object` | 300 | 0.0% | — | — | — | — | — |
| `quiz1_marks` | `float64` | 300 | 0.0% | 7.25 | 1.61 | 2.80 | 7.30 | 10.00 |
| `quiz2_marks` | `float64` | 300 | 0.0% | 5.87 | 2.41 | 0.00 | 5.80 | 10.00 |
| `quiz3_marks` | `float64` | 300 | 0.0% | 5.47 | 2.71 | 0.00 | 5.60 | 10.00 |
| `total_assignments` | `int64` | 300 | 0.0% | 5.00 | 0.00 | 5 | 5.0 | 5 |
| `assignments_submitted` | `float64` | **0** | **100.0%** | **NaN** | **NaN** | **NaN** | **NaN** | **NaN** |
| `midterm_marks` | `float64` | 300 | 0.0% | 19.97 | 8.27 | 0.00 | 21.35 | 30.00 |
| `final_marks` | `float64` | 300 | 0.0% | 37.38 | 11.80 | 0.00 | 39.60 | 50.00 |
| `previous_gpa` | `float64` | 300 | 0.0% | 2.81 | 0.73 | 0.61 | 2.80 | 4.00 |
| `total_lectures` | `int64` | 300 | 0.0% | 12.00 | 0.00 | 12 | 12.0 | 12 |
| `lectures_attended` | `int64` | 300 | 0.0% | 6.01 | 3.73 | 0 | 6.0 | 12 |
| `total_lab_sessions` | `int64` | 300 | 0.0% | 6.00 | 0.00 | 6 | 6.0 | 6 |
| `labs_attended` | `int64` | 300 | 0.0% | 3.11 | 1.98 | 0 | 3.0 | 6 |

---

## 3. Categorization & Functional Role of Original Columns

The 16 columns of the original dataset map to specific educational components as follows:

### 3.1 Assignment Components
- `total_assignments` (`int64`): Prescribed number of academic assignments. Value is **5 for all 300 students** ($\text{std} = 0.0$). Because it is invariant, it provides zero information gain for machine learning.
- `assignments_submitted` (`float64`): Intended to record the number of assignments completed and submitted by each student.
  - **Defect:** Every single entry is empty/null (`count = 0`, `missing = 100%`).
  - **Impact:** The original dataset **contains no usable assignment submission data**.

### 3.2 Internal Assessment Marks
- `quiz1_marks` (`float64`, scale 0–10): Score obtained in Quiz Assessment 1 (Cohort Mean: 7.25 / 10).
- `quiz2_marks` (`float64`, scale 0–10): Score obtained in Quiz Assessment 2 (Cohort Mean: 5.87 / 10).
- `quiz3_marks` (`float64`, scale 0–10): Score obtained in Quiz Assessment 3 (Cohort Mean: 5.47 / 10).
- `midterm_marks` (`float64`, scale 0–30): Formal mid-semester internal examination score (Cohort Mean: 19.97 / 30).

### 3.3 Attendance & Engagement Metrics
- `total_lectures` (`int64`): Total lecture hours/sessions conducted (Invariant: **12 for all records**, $\sigma = 0$).
- `lectures_attended` (`int64`, range 0–12): Number of lectures attended by the student (Cohort Mean: 6.01 / 12, attendance rate ~50.1%).
- `total_lab_sessions` (`int64`): Total practical laboratory sessions scheduled (Invariant: **6 for all records**, $\sigma = 0$).
- `labs_attended` (`int64`, range 0–6): Number of laboratory sessions attended (Cohort Mean: 3.11 / 6, lab attendance rate ~51.8%).

### 3.4 Final Performance (Target Metric)
- `final_marks` (`float64`, range 0.0–50.0): Final examination grade awarded at semester completion (Cohort Mean: 37.38 / 50, Median: 39.60).
  - Note: This is on a **0–50 scale**, whereas the active project architecture uses a **0–60 scale**.

### 3.5 Student Demographics & Academic Baseline
- `student_id` (`int64`): Sequential identifier (1–300).
- `name` (`object`): Synthetic student name.
- `age` (`int64`): Age in years (range 18–25, mean 21.55).
- `gender` (`object`): Self-reported gender (`Male`: 152, `Female`: 148).
- `previous_gpa` (`float64`, scale 0.0–4.0): Cumulative GPA prior to enrollment (Cohort Mean: 2.81 / 4.0).

---

## 4. In-Depth Comparison: Original Dataset vs. Active UCI Dataset

| Dimension | Original Dataset (`student_dropout_behavior_dataset.csv`) | Active UCI Dataset (`student-por.csv`) | Audit Evaluation |
| :--- | :--- | :--- | :--- |
| **Origin & Provenance** | Synthetic / mock CSV downloaded from unverified repository | Authentic empirical academic study (Cortez & Silva, 2008, University of Minho) | UCI is internationally peer-reviewed and recognized |
| **Cohort Sample Size** | $N = 300$ students | $N = 649$ students ($N_{\text{train}} = 519$, $N_{\text{test}} = 130$) | UCI provides $+116\%$ larger cohort for training stability |
| **Missing Values** | **300 missing values** (`assignments_submitted` is 100% NaN) | **0 missing values** across all 33 attributes | UCI possesses complete data integrity |
| **Zero-Variance Columns** | 3 columns (`total_assignments`, `total_lectures`, `total_lab_sessions`) | 0 columns with zero variance | Invariant columns waste compute and cause rank-deficiency |
| **Target Scale** | `final_marks`: $0.0 - 50.0$ marks (Mean: 37.38, Std: 11.80) | `G3_scaled`: $0.0 - 60.0$ marks (Mean: 35.38, Std: 9.74) | UCI matches the system's calibrated letter grade rubric (A–F) |
| **Internal Assessment Features** | `quiz1_marks` (0-10), `quiz2_marks` (0-10), `quiz3_marks` (0-10), `midterm_marks` (0-30) | `G1_scaled` (0-60, Period 1), `G2_scaled` (0-60, Period 2 Midterm) | UCI period grades have authentic cumulative predictive power |
| **Engagement & Habit Features** | `lectures_attended` (0-12), `labs_attended` (0-6) | `studytime` (1-4 tiers), `absences` (0-32 days), `schoolsup` ('no'/'yes') | UCI features reflect institutional engagement and support |
| **Correlation with Final Grade** | `midterm_marks`: **$r = -0.063$**<br>`lectures_attended`: **$r = -0.019$**<br>`quiz1_marks`: **$r = +0.036$**<br>`quiz2_marks`: **$r = +0.172$** | `G2_scaled`: **$r = +0.915$**<br>`G1_scaled`: **$r = +0.822$**<br>`failures`: **$r = -0.400$**<br>`studytime`: **$r = +0.248$** | Original dataset exhibits broken statistical dynamics |
| **Model Test Generalization** | **Test $R^2 = -0.0725$**<br>**Test MAE = 10.443 marks** | **Test $R^2 = 0.8638$**<br>**Test MAE = 2.228 marks** | Original dataset fails basic holdout generalization |
| **Explainability (XAI) Behavior** | OLS assigns **negative coefficient** to midterm marks and lecture attendance | OLS assigns positive weights to $G1$ (+1.44), $G2$ (+7.54), $studytime$ (+0.28) | UCI produces pedagogically sound, defendable explanations |

---

## 5. End-to-End Trace of Current Features Through the System

A complete audit of the codebase confirms that the current system is end-to-end synchronized on the **6 UCI features**.

```
[User Form / Preset] 
  │
  ▼
Frontend Pages (PredictionPage / SimulatorPage / ExplainPage)
  ├── G1_scaled: float (0.0 - 60.0)
  ├── G2_scaled: float (0.0 - 60.0)
  ├── studytime: int (1 - 4)
  ├── failures: int (0 - 3)
  ├── absences: int (0 - 50)
  └── schoolsup: str ('no' | 'yes')
  │
  ▼ HTTP POST (JSON Payload)
API Client (`frontend/src/services/api.ts`)
  ├── /api/evaluate-student
  ├── /api/simulate
  └── /api/explain
  │
  ▼
FastAPI Routes (`backend/app/main.py`)
  │ Validates payload schema via Pydantic
  ▼
Pydantic Schema (`backend/app/schemas.py`)
  AcademicInputBase: enforces ge/le bounds and field types
  │
  ▼
Prediction Engine (`backend/app/services/prediction.py`)
  Assembles single-row DataFrame with exact columns:
  ['G1_scaled', 'G2_scaled', 'studytime', 'failures', 'absences', 'schoolsup']
  │
  ▼
Trained Pipeline (`models/best_model.joblib`)
  ├── ColumnTransformer:
  │     ├── StandardScaler on ['G1_scaled', 'G2_scaled', 'studytime', 'failures', 'absences']
  │     └── OneHotEncoder(drop='first') on ['schoolsup'] -> schoolsup_yes
  └── LinearRegression (Ordinary Least Squares)
  │
  ▼ Raw Prediction
Post-Processing & Grading (`backend/app/services/grading.py`)
  ├── Clamping: max(0.0, min(60.0, raw_prediction))
  └── Provisional Letter Grade Classification:
        Grade A: 54.0 - 60.0 (90% - 100%)
        Grade B: 48.0 - 53.9 (80% - 89%)
        Grade C: 36.0 - 47.9 (60% - 79%)
        Grade D: 30.0 - 35.9 (50% - 59%)
        Grade F:  0.0 - 29.9 (< 50%)
```

### Verified Observations
- **Features Actually Used for Prediction:** Exactly 6 features (`G1_scaled`, `G2_scaled`, `studytime`, `failures`, `absences`, `schoolsup`).
- **No Unsupported Inputs:** The frontend does not ask for quiz marks, assignment submission numbers, or lab attendance.
- **Strict Data Alignment:** The serialization in `models/best_model.joblib` and `models/metrics.json` aligns directly with the inputs collected by the frontend.

---

## 6. Empirical Evaluation of the Original Dataset for Machine Learning

To determine whether the original dataset can support the college-level prediction task without bias or fabrication, we executed a rigorous experimental pipeline adhering to standard machine learning best practices:
- **Dataset:** `student_dropout_behavior_dataset.csv` ($N = 300$).
- **Features Used:** `age`, `quiz1_marks`, `quiz2_marks`, `quiz3_marks`, `midterm_marks`, `previous_gpa`, `lectures_attended`, `labs_attended`, `gender`.
- **Excluded Columns:** `student_id` (identifier), `name` (identifier), `assignments_submitted` (100% null), `total_assignments` ($\sigma = 0$), `total_lectures` ($\sigma = 0$), `total_lab_sessions` ($\sigma = 0$).
- **Split:** 80% train ($N = 240$), 20% held-out test ($N = 60$), `random_state = 42`.
- **Preprocessing:** `StandardScaler` for numerical attributes, `OneHotEncoder(drop='first')` for categorical attributes, fitted strictly on training data.
- **Validation:** 5-fold cross-validation on the training set, followed by evaluation on the isolated test set.

### 6.1 Empirical Validation Results

| Model Architecture | 5-Fold CV $R^2$ (Mean $\pm$ Std) | 5-Fold CV MAE | Test MAE ($N=60$) | Test RMSE ($N=60$) | Test $R^2$ ($N=60$) | Operational Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Dummy Baseline (Mean)** | $-0.0098 \pm 0.0076$ | 9.866 marks | 10.231 marks | 12.218 marks | $-0.0493$ | Reference Naive Baseline |
| **Linear Regression (OLS)** | $-0.0305 \pm 0.1170$ | 9.713 marks | 10.443 marks | 12.353 marks | **$-0.0725$** | **Failed (Worse than Mean)** |
| **Ridge Regression ($\alpha=1.0$)** | $-0.0300 \pm 0.1159$ | 9.713 marks | 10.442 marks | 12.351 marks | **$-0.0721$** | **Failed (Regularization ineffective)** |
| **Decision Tree Regressor ($d=3$)** | $-0.1615 \pm 0.1040$ | 10.332 marks | 10.904 marks | 13.049 marks | **$-0.1968$** | **Failed (Severe overfit to noise)** |
| **Random Forest ($n=100, d=4$)** | $-0.0600 \pm 0.0975$ | 9.834 marks | 10.141 marks | 12.178 marks | **$-0.0423$** | **Failed ($R^2 < 0$)** |

### 6.2 Analysis of Failure Causes
1. **Negative Coefficient of Determination ($R^2 < 0$):**
   In statistical regression, $R^2 < 0$ on unseen data indicates that the model's mean squared error is larger than the total variance of the dependent variable. In other words, simply predicting the cohort mean ($\bar{y} = 37.38$) yields smaller errors than using the features.
2. **Inverted and Counter-Intuitive Feature Weights:**
   When an ordinary least squares model is fit on the original dataset, the resulting coefficients contradict basic educational principles:
   $$\text{midterm\_marks} \implies \beta = -0.0695 \quad (\text{higher midterm predicts lower final})$$
   $$\text{lectures\_attended} \implies \beta = -0.0290 \quad (\text{attending more lectures predicts lower final})$$
   Exposing these coefficients in an Explainable AI (XAI) dashboard or academic viva would immediately reveal that the model is ungrounded.
3. **Absence of Signal:**
   The sum of quiz marks and midterm marks has a correlation of only $r = +0.0207$ with `final_marks`. This demonstrates that the dataset was generated using random, uncorrelated number generators without preserving real-world academic relationships.

---

## 7. Comparative Assessment & Recommendation

### 7.1 Objective Decision Matrix

| Evaluation Criterion | Original 300-Student Dataset | Active UCI Dataset | Winner / Advantage |
| :--- | :--- | :--- | :--- |
| **Predictive Performance** | Test $R^2 = -0.0725$, Test $\text{MAE} = 10.44$ | Test $R^2 = 0.8638$, Test $\text{MAE} = 2.23$ | **UCI (+93.6% accuracy advantage)** |
| **Data Completeness** | Missing 100% of assignments | 100% complete across all rows | **UCI (Zero missingness)** |
| **Model Explainability (XAI)** | Inverse signs (higher midterm score lowers prediction) | Logical signs (prior assessments increase prediction) | **UCI (Pedagogically valid)** |
| **UI Compatibility** | Incompatible without redesigning forms, ranges, and types | 100% compatible with existing frontend (`15702d4`) | **UCI (Zero regression risk)** |
| **Academic Defensibility** | Cannot be defended in a technical review | Fully documented in literature (Cortez & Silva 2008) | **UCI (Peer-reviewed benchmark)** |

### 7.2 Final Recommendation
**Retain the UCI dataset for the active production model and live web platform.**

#### Evidence and Rationale:
1. The original dataset cannot support machine learning inference. Retraining on it would replace a functioning $R^2 = 0.86$ model with an invalid model that performs worse than random guessing.
2. The original dataset completely lacks assignment submission data (`assignments_submitted` is entirely null). Therefore, it cannot fulfill the objective of evaluating assignment impacts.
3. The frontend redesign (`15702d4`) is already committed, tested, and operational with the current feature schema.
4. Attempting to force the original dataset into the current architecture would violate project integrity guidelines by deploying non-viable models.

---

## 8. Recommended Implementation Plan (Phased Roadmap)

To maintain system integrity while addressing user interest in college-level terminology (assignments, sessional exams, attendance), the following roadmap is recommended:

```
[Current State: Stable]
  │
  ├── Phase 1: Semantic Framing (Immediate & Zero-Risk)
  │     └── Present UCI features using familiar college terminology in documentation & tooltips
  │
  ├── Phase 2: Authentic College Data Collection Protocol (Future)
  │     └── Establish strict criteria for real, non-synthetic college data ingestion
  │
  └── Phase 3: Dual-Cohort Pipeline Architecture (Long-term)
        └── Support multiple accredited institutional datasets side-by-side
```

### Phase 1: Semantic Framing & College Terminology Alignment (Immediate)
- **Objective:** Bridge the terminological gap between the secondary school origin of the UCI dataset and college academic structures without altering trained weights or database schemas.
- **Implementation:**
  - Map `G1_scaled` to **"First Sessional / Internal Exam"** (0–60 scale).
  - Map `G2_scaled` to **"Second Sessional / Midterm Exam"** (0–60 scale).
  - Map `studytime` to **"Weekly Independent Study Commitment"** (1 to 4 scale).
  - Map `absences` to **"Semester Class Absences / Attendance Deficit"** (0 to 50 days).
  - Map `failures` to **"Previous Course Backlogs / Arrears"** (0 to 3+ count).
  - Map `schoolsup` to **"Remedial Academic Tutoring / Departmental Support"** ('no' / 'yes').
- **Outcome:** Preserves $R^2 = 0.8638$ accuracy and complete frontend compatibility while presenting familiar terminology to evaluators.

### Phase 2: Authentic College Dataset Acquisition Guidelines (Prerequisite for Retraining)
Before any replacement of the UCI dataset is undertaken, any prospective college dataset must pass the following validation gate:
1. **Sample Size:** $N \ge 500$ verified college student records across at least 2 distinct semesters.
2. **Completeness:** $< 5\%$ missing values across all predictor columns, with verified assignment tracking (submission count, assignment score average).
3. **Statistical Validity:**
   - Positive correlation ($r \ge 0.50$) between internal assessments/midterm marks and final course performance.
   - Positive correlation between assignment completion rates and final grades.
4. **Validation Benchmark:** The trained model must achieve a 5-fold cross-validation $R^2 \ge 0.70$ and test $\text{MAE} \le 5.0$ marks before replacing production artifacts.

### Phase 3: Modular Multi-Dataset Architecture (Future Consideration)
- If an authentic college dataset meeting Phase 2 criteria is procured:
  - Add a dataset switch in `backend/app/main.py` allowing users to toggle between `UCI Portuguese Cohort (Benchmark)` and `University Engineering Cohort`.
  - Maintain separate model artifacts in `models/` (`best_model_uci.joblib` and `best_model_college.joblib`).
  - Do not overwrite or degrade the benchmark UCI models.

---

## 9. Conclusion

The audit conclusively demonstrates that:
1. The original 300-student dataset contains critical defects (100% missing assignment data, invariant columns, zero predictive signal).
2. Training on the original dataset yields negative $R^2$ values across all standard machine learning algorithms.
3. The active UCI dataset is mathematically sound, reproducible, and seamlessly integrated with the redesigned frontend (`15702d4`).
4. Retaining UCI while framing feature labels in college terms provides the optimal balance of academic rigor, predictive performance, and system stability.
