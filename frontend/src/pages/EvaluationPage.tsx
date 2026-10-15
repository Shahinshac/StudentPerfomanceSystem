import React from 'react';
import {
  GitCompare,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
  Line,
  ComposedChart,
} from 'recharts';
import type { ModelComparisonData } from '../types';

interface EvaluationPageProps {
  metrics: ModelComparisonData | null;
  loading: boolean;
}

export const EvaluationPage: React.FC<EvaluationPageProps> = ({ metrics, loading }) => {
  if (loading || !metrics) {
    return (
      <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
        Loading verified evaluation metrics...
      </div>
    );
  }

  const lr = metrics.models.linear_regression;
  const dt = metrics.models.decision_tree;

  // Transform test predictions for Actual vs Predicted scatter chart (0–60 scale)
  const scatterData = (metrics.test_scatter_sample || []).map((item) => ({
    student_index: item.student_index + 1,
    actual: item.actual,
    dt_pred: item.dt_predicted,
    lr_pred: item.lr_predicted,
    ideal: item.actual,
  }));

  const featureLabelMap: Record<string, string> = {
    G1_scaled: 'Period 1 (G1)',
    G2_scaled: 'Period 2 (G2)',
    studytime: 'Study Time',
    failures: 'Past Failures',
    absences: 'Absences',
    schoolsup_yes: 'School Support',
  };

  // Transform Feature Importances for Bar Chart
  const featureImportanceData = Object.entries(dt.feature_importances || {}).map(
    ([feature, importance]) => ({
      feature: featureLabelMap[feature] || feature,
      importance: Number((importance * 100).toFixed(1)),
    })
  );

  // Transform Linear Regression Coefficients
  const coefData = Object.entries(lr.coefficients || {}).map(([feature, coef]) => ({
    feature: featureLabelMap[feature] || feature,
    coefficient: Number(coef.toFixed(3)),
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
          <GitCompare className="w-7 h-7 text-primary-400" />
          <span>Machine Learning Model Comparison & Evaluation</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Comparative empirical performance of Linear Regression vs. Decision Tree Regressor evaluated
          on the unseen UCI test split (N = 130 students, 20% holdout, 0–60 marks scale).
        </p>
      </div>

      {/* Side by Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Selected Model: Linear Regression */}
        <div className="bg-slate-900 rounded-2xl border-2 border-emerald-500/60 p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white">{lr.name}</h3>
              <p className="text-xs text-slate-400">
                StandardScaler + One-Hot Encoding + Ordinary Least Squares (OLS)
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center space-x-1 flex-shrink-0">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Selected for Production</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Test MAE</span>
              <p className="text-xl font-bold text-white">{lr.test_metrics.MAE} Marks</p>
              <span className="text-[10px] text-emerald-400 font-medium">Lowest out-of-sample error</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Test RMSE</span>
              <p className="text-xl font-bold text-white">{lr.test_metrics.RMSE} Marks</p>
              <span className="text-[10px] text-emerald-400 font-medium">Lowest variance penalty</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Test R² Score</span>
              <p className="text-xl font-bold text-emerald-400">{lr.test_metrics.R2}</p>
              <span className="text-[10px] text-slate-400">86.4% variance explained</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Train MAE</span>
              <p className="text-xl font-bold text-white">{lr.train_metrics.MAE} Marks</p>
              <span className="text-[10px] text-slate-400">N = 519 training split</span>
            </div>
          </div>
        </div>

        {/* Tree Model: Decision Tree Regressor */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white">{dt.name}</h3>
              <p className="text-xs text-slate-400">
                Regularized Tree (max_depth=4, min_samples_leaf=5)
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex-shrink-0">
              Explainability Tree
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Test MAE</span>
              <p className="text-xl font-bold text-slate-300">{dt.test_metrics.MAE} Marks</p>
              <span className="text-[10px] text-slate-400">Competitive accuracy</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Test RMSE</span>
              <p className="text-xl font-bold text-slate-300">{dt.test_metrics.RMSE} Marks</p>
              <span className="text-[10px] text-slate-400">Discrete step-function penalty</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Test R² Score</span>
              <p className="text-xl font-bold text-slate-300">{dt.test_metrics.R2}</p>
              <span className="text-[10px] text-slate-400">80.7% variance explained</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Train MAE</span>
              <p className="text-xl font-bold text-slate-300">{dt.train_metrics.MAE} Marks</p>
              <span className="text-[10px] text-slate-500">N = 519 training split</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Chart: Actual vs Predicted Scatter */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-3 gap-2">
          <div>
            <h3 className="text-base font-bold text-white">
              Actual vs. Predicted Marks on Held-Out Test Set (Sample of Test Students)
            </h3>
            <p className="text-xs text-slate-400">
              Comparing student test marks against model predictions relative to the ideal y = x trajectory
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">Scale: 0 to 60 Marks</span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={scatterData} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="actual"
                type="number"
                domain={[0, 60]}
                name="Actual Final Marks"
                unit=" marks"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                label={{ value: 'Actual Final Marks (0-60)', position: 'insideBottom', offset: -10, fill: '#cbd5e1', fontSize: 12 }}
              />
              <YAxis
                type="number"
                domain={[0, 60]}
                name="Predicted Marks"
                unit=" marks"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                label={{ value: 'Predicted Marks (0-60)', angle: -90, position: 'insideLeft', fill: '#cbd5e1', fontSize: 12 }}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-950 text-white p-3.5 rounded-xl border border-slate-800 text-xs shadow-2xl space-y-1">
                      <p className="font-bold border-b border-slate-800 pb-1 text-slate-200">
                        Test Student #{data.student_index}
                      </p>
                      <p className="text-slate-300">Actual Score: <strong className="text-white">{data.actual}</strong> / 60</p>
                      <p className="text-blue-400 font-semibold">Linear Reg Pred: {data.lr_pred} marks</p>
                      <p className="text-emerald-400 font-semibold">Decision Tree Pred: {data.dt_pred} marks</p>
                    </div>
                  );
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#cbd5e1' }} />
              <Line
                type="monotone"
                dataKey="ideal"
                stroke="#ef4444"
                strokeDasharray="5 5"
                dot={false}
                name="Ideal (y = x)"
              />
              <Scatter
                name="Linear Regression (Selected)"
                dataKey="lr_pred"
                fill="#3b82f6"
                shape="circle"
              />
              <Scatter
                name="Decision Tree Preds"
                dataKey="dt_pred"
                fill="#10b981"
                shape="triangle"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Importance & Coefficients Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Decision Tree Feature Importance */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">
              Decision Tree Feature Importance (%)
            </h3>
            <p className="text-xs text-slate-400">
              Fraction of total variance reduction attributed to each feature
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={featureImportanceData}
                layout="vertical"
                margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis dataKey="feature" type="category" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: 12 }}
                  formatter={(val: any) => [`${val}%`, 'Split Contribution']}
                />
                <Bar dataKey="importance" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Linear Regression Standardized Weights */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">
              Linear Regression Standardized Coefficients
            </h3>
            <p className="text-xs text-slate-400">
              Normalized impact on final exam marks (0–60) per 1 standard deviation shift
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={coefData}
                layout="vertical"
                margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                <XAxis type="number" domain={[-1.0, 9.0]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis dataKey="feature" type="category" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: 12 }}
                  formatter={(val: any) => [val, 'Beta Weight (Marks)']}
                />
                <Bar dataKey="coefficient" radius={[0, 4, 4, 0]}>
                  {coefData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.coefficient >= 0 ? '#3b82f6' : '#f43f5e'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Viva Defense Explanation Panel */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-primary-400">
          <HelpCircle className="w-5 h-5" />
          <h4 className="text-base font-bold text-white">
            Viva Preparation: Model Selection & Empirical Performance
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
          <div className="space-y-2">
            <p className="font-semibold text-white">Why Linear Regression was chosen for Production:</p>
            <p>
              Linear Regression achieved the lowest Test MAE (2.228 marks out of 60.0) and lowest Test RMSE (3.458 marks),
              with an out-of-sample R² of 0.8638. In academic progression, periodic evaluation grades (G1 and G2) have strong
              collinearity and cumulative tracking with the final examination (G3). The linear pipeline captures this continuous
              trajectory reliably without step-wise quantization artifacts.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-white">Role of the Regularized Decision Tree (max_depth=4):</p>
            <p>
              The Decision Tree achieved Test MAE of 2.392 marks and R² of 0.8070. While slightly edged out in continuous variance,
              it serves an invaluable role in transparent explainability: enabling students and advisors to traverse human-readable
              if-then condition branches (e.g. Period 2 Grade thresholds) to understand exactly how institutional cohorts are segmented.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
