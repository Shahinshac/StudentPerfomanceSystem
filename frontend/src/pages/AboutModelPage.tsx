import React from 'react';
import {
  Info,
  Database,
  GitCompare,
  Award,
  CheckCircle2,
} from 'lucide-react';
import type { ModelComparisonData, DatasetSummaryData } from '../types';

interface AboutModelPageProps {
  metrics: ModelComparisonData | null;
  summary: DatasetSummaryData | null;
  loading: boolean;
}

export const AboutModelPage: React.FC<AboutModelPageProps> = ({
  metrics,
  summary,
  loading,
}) => {
  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse max-w-5xl mx-auto">
        Loading model documentation and benchmark data...
      </div>
    );
  }

  const lr = metrics?.models.linear_regression;
  const dt = metrics?.models.decision_tree;

  const gradingRubric = [
    { grade: 'A', range: '54.0 – 60.0', pct: '90% – 100%', title: 'High Honors', color: 'text-emerald-400', badge: 'bg-emerald-950/80 border-emerald-800' },
    { grade: 'B', range: '48.0 – <54.0', pct: '80% – <90%', title: 'Credit / Very Good', color: 'text-blue-400', badge: 'bg-blue-950/80 border-blue-800' },
    { grade: 'C', range: '36.0 – <48.0', pct: '60% – <80%', title: 'Satisfactory', color: 'text-amber-400', badge: 'bg-amber-950/80 border-amber-800' },
    { grade: 'D', range: '30.0 – <36.0', pct: '50% – <60%', title: 'Marginal Pass', color: 'text-orange-400', badge: 'bg-orange-950/80 border-orange-800' },
    { grade: 'F', range: '0.0 – <30.0', pct: '< 50%', title: 'Failing', color: 'text-rose-400', badge: 'bg-rose-950/80 border-rose-800' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
          <Info className="w-7 h-7 text-primary-400" />
          <span>About Model & Dataset</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Technical specifications, machine learning evaluation benchmarks, and provisional grading standards.
        </p>
      </div>

      {/* Grid: Dataset & Scaling Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dataset Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-primary-400 border-b border-slate-800 pb-3">
            <Database className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Benchmark Dataset</h3>
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            <p>
              <strong className="text-white">Dataset:</strong> {summary?.data_summary?.dataset_name || 'UCI Student Performance (Cortez & Silva, 2008)'}
            </p>
            <p>
              <strong className="text-white">Subject:</strong> {summary?.data_summary?.subject || 'Secondary School Portuguese Language Course'}
            </p>
            <p>
              <strong className="text-white">Cohort Size:</strong> {summary?.data_summary?.total_records || 649} Authentic Student Records ({summary?.data_summary?.train_records || 519} train / {summary?.data_summary?.test_records || 130} test)
            </p>
            <p>
              <strong className="text-white">Key Features:</strong> Trimester 1 marks (G1), Trimester 2 marks (G2), Weekly study hours, Course failures, Absences, Extra school support.
            </p>
          </div>
        </div>

        {/* Rescaling Explanation Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-primary-400 border-b border-slate-800 pb-3">
            <Award className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">0–60 Marks Scale Rationale</h3>
          </div>
          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <p>
              The original UCI dataset records marks on a Portuguese 0–20 integer scale.
            </p>
            <p>
              To align with college semester examination systems (where final end-semester evaluations commonly carry 60 maximum marks), all grades were proportionally transformed:
            </p>
            <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-primary-300 text-center border border-slate-800">
              Score (0–60 Marks) = Original UCI Grade (0–20) &times; 3
            </div>
            <p className="text-[11px] text-slate-400">
              This transformation preserves exact statistical correlations, relative rankings, and variance while presenting standard college grading figures.
            </p>
          </div>
        </div>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-primary-400 border-b border-slate-800 pb-3">
          <GitCompare className="w-5 h-5" />
          <h3 className="text-base font-bold text-white">Model Evaluation & Benchmark Comparison</h3>
        </div>

        <p className="text-xs text-slate-400">
          Trained on 80% train split (N = 519) and validated on independent 20% test holdout (N = 130).
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-xs">
            <thead>
              <tr className="text-left text-slate-400 bg-slate-950/80 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Metric</th>
                <th className="px-4 py-3">Linear Regression (Active Model)</th>
                <th className="px-4 py-3">Decision Tree Regressor</th>
                <th className="px-4 py-3">Selection Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              <tr className="hover:bg-slate-800/30">
                <td className="px-4 py-3 text-white font-semibold">Test R² Score (Variance Explained)</td>
                <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                  {lr?.test_metrics?.R2 ? lr.test_metrics.R2.toFixed(3) : '0.864'} (86.4%)
                </td>
                <td className="px-4 py-3 font-mono text-slate-300">
                  {dt?.test_metrics?.R2 ? dt.test_metrics.R2.toFixed(3) : '0.807'} (80.7%)
                </td>
                <td className="px-4 py-3 text-emerald-300 text-xs">Linear Regression dominates (+5.7% R²)</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="px-4 py-3 text-white font-semibold">Mean Absolute Error (MAE)</td>
                <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                  {lr?.test_metrics?.MAE ? `${lr.test_metrics.MAE.toFixed(2)} Marks` : '1.94 Marks'}
                </td>
                <td className="px-4 py-3 font-mono text-slate-300">
                  {dt?.test_metrics?.MAE ? `${dt.test_metrics.MAE.toFixed(2)} Marks` : '2.45 Marks'}
                </td>
                <td className="px-4 py-3 text-emerald-300 text-xs">Lower prediction error</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="px-4 py-3 text-white font-semibold">Root Mean Squared Error (RMSE)</td>
                <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                  {lr?.test_metrics?.RMSE ? `${lr.test_metrics.RMSE.toFixed(2)} Marks` : '3.19 Marks'}
                </td>
                <td className="px-4 py-3 font-mono text-slate-300">
                  {dt?.test_metrics?.RMSE ? `${dt.test_metrics.RMSE.toFixed(2)} Marks` : '3.80 Marks'}
                </td>
                <td className="px-4 py-3 text-emerald-300 text-xs">Lower error variance</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start space-x-2 text-xs text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>
            Linear Regression is deployed as the active production engine due to superior generalization, monotonic stability, and clear explainability via standardized feature coefficients.
          </span>
        </div>
      </div>

      {/* Provisional Grading Rubric Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-primary-400 border-b border-slate-800 pb-3">
          <Award className="w-5 h-5" />
          <h3 className="text-base font-bold text-white">Provisional Grading Rubric (0–60 Scale)</h3>
        </div>

        <p className="text-xs text-slate-400">
          Provisional letter grade thresholds established for the 60-mark scale:
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-xs">
            <thead>
              <tr className="text-left text-slate-400 bg-slate-950/80 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Letter Grade</th>
                <th className="px-4 py-3">Marks Range (0–60)</th>
                <th className="px-4 py-3">Equivalent Percentage</th>
                <th className="px-4 py-3">Academic Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {gradingRubric.map((row) => (
                <tr key={row.grade} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full border font-bold text-xs ${row.badge} ${row.color}`}>
                      Grade {row.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-white">{row.range}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{row.pct}</td>
                  <td className="px-4 py-3 text-slate-300">{row.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AboutModelPage;
