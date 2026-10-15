import React from 'react';
import {
  BrainCircuit,
  GraduationCap,
  Users,
  Award,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { MetricCard } from '../components/Badges';
import type { ModelComparisonData, DatasetSummaryData } from '../types';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  metrics: ModelComparisonData | null;
  summary: DatasetSummaryData | null;
  loading: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  metrics,
  summary,
  loading,
}) => {
  const selectedModel = metrics?.models.linear_regression;
  const targetMeta = summary?.eda_insights?.target_variable;

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-900/60 text-primary-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm border border-primary-700/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>UCI Benchmark • Academic Intelligence</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Student Academic Performance Prediction System
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            A machine learning and rule-based diagnostic platform powered exclusively by the
            benchmark UCI Student Performance dataset (Portuguese course, N = 649). Provides 0–60 marks
            forecasting, early at-risk detection, What-If academic improvement simulation, and
            step-by-step mathematical model explanations.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('predict')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-500 transition-all shadow-md"
            >
              <span>Predict & Simulate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('evaluation')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-all border border-slate-700"
            >
              <span>Model Comparison</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Dataset Size"
          value={loading ? '...' : `${summary?.data_summary.total_records || 649} Students`}
          subtitle="UCI Portuguese Course (Cortez & Silva)"
          icon={Users}
          badge="N=649 Cohort"
          badgeColor="blue"
        />
        <MetricCard
          title="Selected Architecture"
          value="Linear Regression"
          subtitle="StandardScaler + OHE Pipeline"
          icon={BrainCircuit}
          badge="Best Test R²: 0.864"
          badgeColor="green"
        />
        <MetricCard
          title="Mean Absolute Error"
          value={loading ? '...' : `${selectedModel?.test_metrics.MAE ?? 2.23} Marks`}
          subtitle="Held-out test split error (N = 130)"
          icon={Award}
          badge="Scale: 0–60"
          badgeColor="purple"
        />
        <MetricCard
          title="Exam Scoring Scale"
          value="0.0 – 60.0 Marks"
          subtitle={
            loading
              ? '...'
              : `Cohort Mean: ${targetMeta?.mean ?? 35.38} / 60.0 marks`
          }
          icon={GraduationCap}
          badge="Provisional Scale"
          badgeColor="amber"
        />
      </div>

      {/* Two Column Layout: Core Highlights & Methodology */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Model Selection Card */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Machine Learning Evaluation Summary
              </h3>
              <p className="text-xs text-slate-400">
                Rigorous 80/20 train/test split (519 train, 130 test) preventing data leakage
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              Verified Metrics
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-slate-800">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/80">
                  <th className="px-4 py-3 rounded-l-lg">Model Architecture</th>
                  <th className="px-4 py-3">Test MAE</th>
                  <th className="px-4 py-3">Test RMSE</th>
                  <th className="px-4 py-3">Test R²</th>
                  <th className="px-4 py-3 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                <tr className="bg-emerald-950/20 hover:bg-emerald-950/30">
                  <td className="px-4 py-3.5 text-white font-semibold flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                    <span>Linear Regression (StandardScaler + OHE)</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-200 font-bold">
                    {metrics?.models.linear_regression.test_metrics.MAE ?? 2.228}
                  </td>
                  <td className="px-4 py-3.5 text-slate-200 font-bold">
                    {metrics?.models.linear_regression.test_metrics.RMSE ?? 3.458}
                  </td>
                  <td className="px-4 py-3.5 text-emerald-400 font-mono text-xs font-bold">
                    {metrics?.models.linear_regression.test_metrics.R2 ?? 0.8638}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Selected
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="px-4 py-3.5 text-slate-300 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                    <span>Decision Tree Regressor (depth=4)</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400">
                    {metrics?.models.decision_tree.test_metrics.MAE ?? 2.392}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400">
                    {metrics?.models.decision_tree.test_metrics.RMSE ?? 4.116}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 font-mono text-xs">
                    {metrics?.models.decision_tree.test_metrics.R2 ?? 0.8070}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs">Explainability Tree</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex items-start space-x-3 text-xs text-slate-300 leading-relaxed">
            <Info className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Empirical Generalization Note:</span> Models were
              trained directly on the scaled 0–60 target (G3 × 3) on the 519-student training split.
              Linear Regression achieves superior out-of-sample performance with an average error of only
              ~2.2 marks out of 60, reflecting consistent cumulative progression across periodic evaluations G1 and G2.
            </div>
          </div>
        </div>

        {/* Right Column: Performance Categories Rubric */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white">Provisional Grade Boundaries</h3>
          <p className="text-xs text-slate-400">
            Standard project-defined letter grade rubric mapped across the 0–60 examination marks scale.
          </p>

          <div className="space-y-2.5 pt-1">
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-emerald-300">Grade A (90% – 100%)</p>
                <p className="text-xs text-emerald-400/80">54.0 – 60.0 Marks</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-emerald-300 border border-emerald-800">
                Excellent
              </span>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800/80 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-blue-300">Grade B (80% – 89%)</p>
                <p className="text-xs text-blue-400/80">48.0 – 53.9 Marks</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-blue-300 border border-blue-800">
                Good
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-amber-300">Grade C (60% – 79%)</p>
                <p className="text-xs text-amber-400/80">36.0 – 47.9 Marks</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-amber-800">
                Average
              </span>
            </div>

            <div className="p-3 rounded-xl bg-orange-950/60 border border-orange-800/80 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-orange-300">Grade D (50% – 59%)</p>
                <p className="text-xs text-orange-400/80">30.0 – 35.9 Marks</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-orange-300 border border-orange-800">
                Passing Tier
              </span>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-rose-300">Grade F (&lt; 50%)</p>
                <p className="text-xs text-rose-400/80">0.0 – 29.9 Marks</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-rose-300 border border-rose-800">
                Needs Improvement
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
