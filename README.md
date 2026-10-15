# College Student Academic Performance Prediction System

An end-to-end, production-ready machine learning and diagnostic web platform built on the **UCI Student Performance Dataset** (Portuguese language course, $N=649$). The system forecasts final examination outcomes on a standardized **0.0 – 60.0 marks scale**, assigns project-defined provisional letter grades (**A–F**), flags early academic disengagement, simulates counterfactual student improvements in real time, and provides transparent mathematical feature explanations.

---

## Key Features

1. **Machine Learning Marks Forecasting (0–60 Scale)**
   - Predicts final examination performance directly on a continuous $0.0 - 60.0$ marks scale ($G3_{\text{scaled}} = G3 \times 3$).
   - Trained on an 80/20 train/test split ($N_{\text{train}}=519$, $N_{\text{test}}=130$) with strict data leakage isolation.
   - Deploys an optimized **Linear Regression Pipeline** (StandardScaler + One-Hot Encoding + OLS) achieving **Test MAE = 2.228 marks**, **Test RMSE = 3.458 marks**, and **Test $R^2 = 0.8638$**.

2. **Provisional Letter Grade Classification (A–F)**
   - **Grade A**: 54.0 – 60.0 Marks (90% – 100%) • *Excellent*
   - **Grade B**: 48.0 – 53.9 Marks (80% – 89%) • *Good*
   - **Grade C**: 36.0 – 47.9 Marks (60% – 79%) • *Average / Satisfactory*
   - **Grade D**: 30.0 – 35.9 Marks (50% – 59%) • *Passing Tier*
   - **Grade F**: 0.0 – 29.9 Marks (< 50%) • *Needs Improvement / At-Risk*
   *(Note: These grade boundaries are project-defined provisional classifications for diagnostic evaluation, not official UCI or institutional bylaws).*

3. **What-If Academic Improvement Simulator**
   - Allows students and academic advisors to hypothesize improvements in study habits, trimester test scores, and attendance.
   - Side-by-side comparison of baseline vs. simulated marks and letter grades.
   - Live delta indicator showing projected mark shifts and directional trends.
   - Single-click `Reset to Baseline` restoring original assessment inputs.

4. **Explainable AI (XAI Feature Attribution)**
   - **Linear Regression Exact Attribution**: Decomposes predictions into exact additive marks ($\beta_j \times z_j$) relative to the cohort baseline mean ($\bar{y}_{\text{train}} = 35.40$ marks).
   - **Decision Tree Step Traversal**: Inspects human-readable sequential split thresholds (e.g., $G2 > 34.5 \implies \text{Node Mean } 42.6$), local subgroup sample sizes, and terminal leaf assignments.

5. **Rule-Based Institutional Risk Diagnostics**
   - Identifies at-risk academic indicators (e.g., $G2 < 30$, past failures $\ge 2$, chronic absenteeism $\ge 15$ days).
   - Generates contextual counseling recommendations and intervention guidelines.

6. **Interactive Dark-Themed Web Application**
   - Built with React 19, TypeScript, Vite, Tailwind CSS, and Recharts.
   - Four dedicated views: **Dashboard**, **Predict & Simulator**, **Model Evaluation**, and **Dataset Insights**.

---

## Technology Stack

- **Backend**: Python 3.11, FastAPI, Uvicorn, Pydantic v2
- **Machine Learning**: scikit-learn, pandas, numpy, joblib
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Testing**: pytest, Playwright, HTTPX TestClient
- **Deployment**: Render (FastAPI Web Service), Vercel (Vite SPA)

---

## UCI Dataset & Feature Engineering

The system utilizes the authentic Portuguese language secondary school student cohort (`student-por.csv`, Cortez and Silva, 2008) from the UCI Machine Learning Repository:
- **Records**: 649 complete student records (0 duplicates, 0 missing values).
- **Scale Normalization**: Periodic evaluation grades $G1$, $G2$, and $G3$ are scaled by $3\times$ ($0 - 20 \implies 0 - 60$ marks).

### Selected Feature Set ($p = 6$)
1. `G1_scaled` (Continuous, $0.0 - 60.0$): Period 1 formal assessment marks ($r = +0.822$).
2. `G2_scaled` (Continuous, $0.0 - 60.0$): Period 2 mid-term evaluation score ($r = +0.915$).
3. `studytime` (Ordinal, $1 - 4$): Weekly study time ($1: <2\text{h}$, $2: 2-5\text{h}$, $3: 5-10\text{h}$, $4: >10\text{h}$; $r = +0.248$).
4. `failures` (Discrete, $0 - 3$): Number of past class failures ($r = -0.400$).
5. `absences` (Numerical, $0 - 32$): Total days absent during academic term ($r = -0.089$).
6. `schoolsup` (Categorical, `'no'` / `'yes'`): Extra educational school support.

*Data Leakage Prevention: $G3_{\text{scaled}}$ was strictly quarantined as the target variable ($y$). All preprocessing transformers were fitted exclusively on the 519-student training split.*

---

## Empirical Model Comparison

Evaluated on the held-out test split ($N = 130$ students, 20% holdout):

| Architecture | Pipeline Details | Test MAE | Test RMSE | Test $R^2$ | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Linear Regression** | StandardScaler + OneHotEncoder + OLS | **2.228** | **3.458** | **0.8638** | **Selected for Production** |
| **Decision Tree Regressor** | Regularized Tree (`max_depth=4`, `min_leaf=5`) | **2.392** | **4.116** | **0.8070** | Explainability Tree |

---

## Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/Shahinshac/StudentPerfomanceSystem.git
cd StudentPerfomanceSystem

# Create and activate virtual environment (optional but recommended)
python -m venv .venv
# On Windows: .venv\Scripts\activate
# On Linux/macOS: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Retrain models or execute EDA scripts
python scripts/prepare_data.py
python scripts/run_eda.py
python scripts/train_models.py

# Run backend tests
python -m pytest backend/tests/ -v

# Start FastAPI server
python -m uvicorn backend.app.main:app --port 8000 --reload
```
The interactive Swagger API documentation will be available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Build to verify compilation
npm run build

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Production Deployment Guide

### Deploying the Backend on Render

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository: `https://github.com/Shahinshac/StudentPerfomanceSystem`.
3. Configure the service settings:
   - **Name**: `student-performance-api`
   - **Environment**: `Python`
   - **Region**: Any (e.g., `Oregon (US West)`)
   - **Branch**: `main`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `PYTHON_VERSION`: `3.11.8`
   - `ALLOWED_ORIGINS`: `https://your-frontend-app.vercel.app,http://localhost:5173`
5. Click **Create Web Service**.
6. Verify deployment by opening: `https://<YOUR-RENDER-APP>.onrender.com/api/health`.

*(Alternatively, apply the included `render.yaml` blueprint directly).*

---

### Deploying the Frontend on Vercel

1. Create a new Project on [Vercel](https://vercel.com).
2. Import the repository: `https://github.com/Shahinshac/StudentPerfomanceSystem`.
3. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://<YOUR-RENDER-APP>.onrender.com`
5. Click **Deploy**.
6. Once deployed, add your Vercel URL to `ALLOWED_ORIGINS` in your Render backend settings.

---

## API Reference

### 1. System Health
- **GET** `/api/health`
  - Returns backend health, version, model loading status, and active architecture.

### 2. Student Evaluation (Unified)
- **POST** `/api/evaluate-student`
  - Body:
    ```json
    {
      "G1_scaled": 36.0,
      "G2_scaled": 39.0,
      "studytime": 2,
      "failures": 0,
      "absences": 4,
      "schoolsup": "no"
    }
    ```
  - Returns predicted marks (0–60), letter grade (A–F), percentage, and rule-based risk analysis with recommended interventions.

### 3. What-If Academic Simulator
- **POST** `/api/simulate`
  - Body:
    ```json
    {
      "baseline": { "G1_scaled": 36.0, "G2_scaled": 39.0, "studytime": 2, "failures": 0, "absences": 4, "schoolsup": "no" },
      "simulated": { "G1_scaled": 42.0, "G2_scaled": 48.0, "studytime": 3, "failures": 0, "absences": 2, "schoolsup": "no" }
    }
    ```
  - Returns baseline vs. simulated predictions, mark delta, letter grade shift, and scenario counseling summary.

### 4. Explainable Prediction (XAI)
- **POST** `/api/explain`
  - Body: student academic inputs + `model_preference` (`"decision_tree"` or `"linear_regression"`).
  - Returns exact linear standardized feature contributions ($\beta_j \times z_j$) and step-by-step decision tree path traversal.

### 5. Analytics & Metadata
- **GET** `/api/model/metrics`: Model comparison statistics, coefficients, feature importances, and scatter data.
- **GET** `/api/dataset/summary`: UCI dataset metadata, feature statistics, and Pearson correlations.

---

## Repository Structure

```
├── .gitignore                          # Comprehensive exclusion rules
├── render.yaml                         # Render Blueprint deployment definition
├── requirements.txt                    # Root-level Python production dependencies
├── README.md                           # Comprehensive documentation
├── backend/
│   ├── requirements.txt                # Backend dependencies
│   ├── app/
│   │   ├── main.py                     # FastAPI application & CORS
│   │   ├── schemas.py                  # Pydantic schemas (0-60 marks scale)
│   │   └── services/
│   │       ├── grading.py              # Provisional letter grade rubric (A-F)
│   │       ├── prediction.py           # Inference engine (clipped to [0, 60])
│   │       ├── risk_analysis.py        # Rule-based academic risk diagnostics
│   │       ├── simulation.py           # What-If simulator engine
│   │       └── explanation.py          # Linear decomposition + Tree traversal
│   └── tests/
│       ├── test_services.py            # Grading, prediction, and risk unit tests
│       ├── test_features.py            # Simulator and XAI unit tests
│       └── test_api.py                 # FastAPI TestClient API tests
├── frontend/
│   ├── package.json                    # Frontend dependencies
│   ├── vercel.json                     # Vercel SPA routing fallback
│   ├── .env.example                    # Vite environment template
│   └── src/
│       ├── types/index.ts              # TypeScript interfaces
│       ├── services/api.ts             # Dynamic API client with VITE_API_BASE_URL
│       ├── components/
│       │   ├── Navbar.tsx              # Navigation bar with live health indicator
│       │   ├── Badges.tsx              # GradeBadge (A-F) & RiskBadge components
│       │   ├── WhatIfSimulator.tsx     # What-If Simulator with reset button
│       │   └── ExplainableCard.tsx     # Linear and Tree XAI visualizations
│       └── pages/
│           ├── DashboardPage.tsx       # KPIs, model summary, and grade tiers
│           ├── PredictionPage.tsx      # Assessment workflow & Viva demo presets
│           ├── EvaluationPage.tsx      # Scatter chart, beta weights & Viva guide
│           └── InsightsPage.tsx        # Cohort statistics & Pearson correlations
├── data/
│   ├── raw/student-por.csv             # Benchmark UCI Portuguese dataset (N=649)
│   └── processed/                      # 80/20 train/test split matrices & metadata
├── models/
│   ├── best_model.joblib               # Production Linear Regression pipeline
│   ├── decision_tree.joblib            # Explainability Decision Tree pipeline
│   ├── linear_regression.joblib        # Linear Regression pipeline
│   └── metrics.json                    # Serialized holdout metrics
├── reports/
│   ├── eda_insights.json               # Exploratory data analysis insights
│   ├── model_comparison.json           # Model evaluation results
│   └── figures/                        # Generated figures and browser screenshots
└── scripts/
    ├── prepare_data.py                 # Ingestion & 3x scaling script
    ├── run_eda.py                      # Statistical analysis script
    └── train_models.py                 # Scikit-learn training script
```

---

## License

This project is licensed under the MIT License. Developed for undergraduate machine learning academic performance prediction and diagnostic research.
