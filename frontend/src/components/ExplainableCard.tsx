import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  GitBranch,
  BarChart2,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import type { AcademicInput, ExplanationResponse } from '../types';
import { fetchExplanation } from '../services/api';

interface ExplainableCardProps {
  studentInput: AcademicInput;
}

export const ExplainableCard: React.FC<ExplainableCardProps> = ({ studentInput }) => {
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [activeModel, setActiveModel] = useState<'linear_regression' | 'decision_tree'>(
    'linear_regression'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const loadExplanation = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchExplanation(studentInput, activeModel);
        if (!isCancelled) {
          setExplanation(res);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Failed to fetch explanation breakdown');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadExplanation();
    return () => {
      isCancelled = true;
    };
  }, [studentInput, activeModel]);

  const formatFeatureName = (feat: string): string => {
    switch (feat) {
      case 'G1_scaled':
        return 'G1 (1st Period)';
      case 'G2_scaled':
        return 'G2 (2nd Period)';
      case 'studytime':
        return 'Study Time';
      case 'failures':
        return 'Past Failures';
      case 'absences':
        return 'Absences';
      case 'schoolsup':
      case 'schoolsup_yes':
        return 'School Support';
      default:
        return feat;
    }
  };

  // Linear Regression chart data
  const lrContributions =
    explanation?.linear_regression.feature_contributions.map((item) => ({
      feature: formatFeatureName(item.feature),
      contribution: item.mark_contribution,
      rawValue: item.raw_value,
      direction: item.direction,
      explanation: item.explanation,
    })) ?? [];

  // Decision Tree global importances
  const dtGlobalImportance = explanation?.decision_tree.global_importance_percent
    ? Object.entries(explanation.decision_tree.global_importance_percent).map(
        ([feature, pct]) => ({
          feature: formatFeatureName(feature),
          importance: pct,
        })
      )
    : [];

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Explainable Prediction (XAI Feature Attribution)</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                Mathematical XAI
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Inspect model decision paths and exact feature contributions explaining this specific student projection (0–60 Marks)
            </p>
          </div>
        </div>

        {/* Model Switcher Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveModel('linear_regression')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeModel === 'linear_regression'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Linear Attribution</span>
          </button>
          <button
            onClick={() => setActiveModel('decision_tree')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeModel === 'decision_tree'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Decision Tree Path</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
          Computing mathematical feature decomposition...
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Model A: Linear Regression Exact Attribution */}
      {explanation && activeModel === 'linear_regression' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <span className="font-semibold text-white">
              Feature Mark Contributions Relative to Baseline Mean ({explanation.linear_regression.baseline_cohort_marks.toFixed(2)} Marks)
            </span>
            <span className="text-primary-400 font-mono">
              Net Prediction: {explanation.linear_regression.clamped_prediction.toFixed(1)} / 60.0 Marks
            </span>
          </div>

          {/* Recharts Waterfall/Contribution Chart */}
          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lrContributions} layout="vertical" margin={{ top: 10, right: 30, bottom: 10, left: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} unit=" marks" />
                  <YAxis dataKey="feature" type="category" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                  <ReferenceLine x={0} stroke="#64748b" strokeWidth={1.5} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: 12 }}
                    formatter={(val: any) => [`${val > 0 ? '+' : ''}${val} marks`, 'Net Mark Impact']}
                  />
                  <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                    {lrContributions.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.contribution >= 0 ? '#10b981' : '#f43f5e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Green bars indicate marks added above class mean; Red bars indicate mark reductions.
            </p>
          </div>

          {/* Tabular Feature Decomposition */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs divide-y divide-slate-800">
              <thead>
                <tr className="text-left text-slate-400 bg-slate-950/80 font-semibold uppercase tracking-wider">
                  <th className="px-3 py-2.5 rounded-l-lg">Feature</th>
                  <th className="px-3 py-2.5">Student Value</th>
                  <th className="px-3 py-2.5">Class Mean</th>
                  <th className="px-3 py-2.5">Standardized (z)</th>
                  <th className="px-3 py-2.5">Beta Weight</th>
                  <th className="px-3 py-2.5 rounded-r-lg">Mark Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {explanation.linear_regression.feature_contributions.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="px-3 py-2 text-white font-semibold">{row.label}</td>
                    <td className="px-3 py-2 text-slate-300 font-mono">{row.raw_value}</td>
                    <td className="px-3 py-2 text-slate-400 font-mono">{row.cohort_mean}</td>
                    <td className="px-3 py-2 text-slate-400 font-mono">{row.standardized_value > 0 ? `+${row.standardized_value}` : row.standardized_value}</td>
                    <td className="px-3 py-2 text-slate-400 font-mono">{row.coefficient > 0 ? `+${row.coefficient}` : row.coefficient}</td>
                    <td className="px-3 py-2 font-mono font-bold">
                      <span className={row.mark_contribution >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {row.mark_contribution > 0 ? `+${row.mark_contribution}` : row.mark_contribution} marks
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800 flex items-start space-x-2.5 text-xs text-slate-400">
            <Info className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-200">Mathematical Proof:</strong> Sum of contributions (
              {explanation.linear_regression.feature_contributions.reduce((acc, c) => acc + c.mark_contribution, 0).toFixed(2)}) +
              Baseline intercept ({explanation.linear_regression.baseline_cohort_marks.toFixed(2)}) ={' '}
              <span className="text-white font-bold">{explanation.linear_regression.raw_prediction.toFixed(2)} marks</span>.
            </p>
          </div>
        </div>
      )}

      {/* Model B: Decision Tree Traversal Explanation */}
      {explanation && activeModel === 'decision_tree' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-white">
              Sequential Tree Decision Path (From Root to Terminal Leaf)
            </span>
            <span className="text-primary-400 font-mono">
              Final Assigned Mark: {explanation.decision_tree.predicted_marks.toFixed(1)} / 60.0
            </span>
          </div>

          {/* Sequential Path Steps */}
          <div className="space-y-3">
            {explanation.decision_tree.decision_path.map((node) => (
              <div
                key={node.step}
                className={`p-4 rounded-xl border text-xs transition-all ${
                  node.is_leaf
                    ? 'bg-primary-950/70 border-primary-800 text-primary-200 shadow-md'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        node.is_leaf ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {node.step}
                    </span>
                    <span>
                      {node.is_leaf ? 'Terminal Leaf Partition Reached' : `Step ${node.step}: ${node.label}`}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      node.is_leaf
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Cohort Subgroup: N = {node.subcohort_sample_size} students
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-slate-300">
                  <p className="leading-relaxed">{node.explanation}</p>
                  <div className="flex items-center space-x-2 font-mono text-[11px] bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    <span className="text-slate-400">Partition Mean:</span>
                    <span className="font-bold text-white">{node.subcohort_avg_marks.toFixed(1)} marks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Global Feature Importance vs Local Path Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Global Tree Feature Importance (Gini / Variance Reduction)
              </span>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dtGlobalImportance} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                    <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis dataKey="feature" type="category" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: 12 }}
                      formatter={(val: any) => [`${val}%`, 'Global Importance']}
                    />
                    <Bar dataKey="importance" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2 text-xs text-slate-300">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Global vs. Individual Explanation
              </span>
              <p className="leading-relaxed">
                <strong className="text-white">Global Feature Importance:</strong> Reflects which variables
                achieved the greatest total variance reduction across all 519 training students. Second-period grade
                (G2) strongly anchors final performance across the tree.
              </p>
              <p className="leading-relaxed">
                <strong className="text-white">Individual Decision Path:</strong> Shows the exact path taken by
                THIS specific student through the regularized decision tree, leading directly to their predicted mark of{' '}
                <span className="text-primary-400 font-bold">
                  {explanation.decision_tree.predicted_marks.toFixed(1)} marks
                </span>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Limitation Notice */}
      <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3 flex items-start space-x-1.5">
        <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
        <span>
          Model Limitation Note: Feature attribution reflects statistical associations learned from the 519-student
          UCI training set (0–60 scaled marks). It describes how the model formulates its estimate and does not imply strict physical causation.
        </span>
      </div>
    </div>
  );
};
