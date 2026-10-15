import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
  BarChart2,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  Target,
  GitFork,
} from 'lucide-react';
import type { AcademicInput, ExplanationResponse, LinearFeatureContribution, DecisionTreeStep } from '../types';
import { fetchExplanation } from '../services/api';

interface ExplainPageProps {
  studentInput: AcademicInput;
  onNavigate: (tab: string) => void;
}

export const ExplainPage: React.FC<ExplainPageProps> = ({ studentInput, onNavigate }) => {
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [activeModel, setActiveModel] = useState<'linear_regression' | 'decision_tree'>(
    'linear_regression'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

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
          setError(err.message || 'Failed to fetch explanation. Check backend connection.');
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
        return 'First-Period Grade (G1)';
      case 'G2_scaled':
        return 'Second-Period Grade (G2)';
      case 'studytime':
        return 'Weekly Study Time';
      case 'failures':
        return 'Past Class Failures';
      case 'absences':
        return 'School Absences';
      case 'schoolsup':
      case 'schoolsup_yes':
        return 'Extra School Support';
      default:
        return feat;
    }
  };

  // Group linear contributions into positive drivers and negative drags
  const contributions: LinearFeatureContribution[] =
    explanation?.linear_regression.feature_contributions || [];

  const positiveFactors = contributions
    .filter((c) => c.mark_contribution > 0)
    .sort((a, b) => b.mark_contribution - a.mark_contribution);

  const negativeFactors = contributions
    .filter((c) => c.mark_contribution < 0)
    .sort((a, b) => a.mark_contribution - b.mark_contribution);

  // Decision Tree data
  const decisionPath: DecisionTreeStep[] =
    explanation?.decision_tree.decision_path || [];
  const leafStep = decisionPath.find((step) => step.is_leaf);
  const splitSteps = decisionPath.filter((step) => !step.is_leaf);

  const globalImportances = explanation?.decision_tree.global_importance_percent || {};
  const sortedImportances = Object.entries(globalImportances).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
            <Lightbulb className="w-7 h-7 text-primary-400" />
            <span>Explain Prediction</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Explainable AI (XAI) insights revealing the mathematical decomposition and decision rules behind this student's score forecast (0–60 scale).
          </p>
        </div>

        {/* Model Switcher */}
        <div className="flex items-center bg-slate-900 p-1.5 rounded-xl border border-slate-800 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveModel('linear_regression')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeModel === 'linear_regression'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Linear Attribution</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModel('decision_tree')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
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
        <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse flex items-center justify-center space-x-2">
          <RotateCcw className="w-4 h-4 animate-spin text-primary-400" />
          <span>Computing explainability breakdown...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW A: Linear Regression Exact Attribution                               */}
      {/* ========================================================================= */}
      {explanation && !loading && activeModel === 'linear_regression' && (
        <div className="space-y-6">
          {/* Summary Hero Card */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Model Baseline
                </span>
                <div className="text-lg font-bold text-white flex items-baseline space-x-2 mt-0.5">
                  <span>Class Average Baseline:</span>
                  <span className="text-primary-400 font-mono">
                    {explanation.linear_regression.baseline_cohort_marks.toFixed(1)} Marks
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Linear Model Forecast
                </span>
                <div className="text-2xl font-black text-white">
                  {explanation.linear_regression.clamped_prediction.toFixed(1)} / 60.0
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Every student projection starts from the cohort average baseline (
              {explanation.linear_regression.baseline_cohort_marks.toFixed(1)} marks). Standardized academic factors like mid-term scores, study habits, absences, and past records either add marks or subtract marks to yield your final forecast.
            </p>
          </div>

          {/* Factor Impact Cards: Boosters vs Drags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Positive Drivers (Boosters) */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 text-emerald-400 border-b border-slate-800 pb-3">
                <TrendingUp className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">
                  Score Boosters (Positive Drivers)
                </h3>
              </div>

              {positiveFactors.length > 0 ? (
                <div className="space-y-3">
                  {positiveFactors.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/70 border border-emerald-900/40 space-y-1.5"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">{formatFeatureName(item.feature)}</span>
                        <span className="font-mono font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/80">
                          +{item.mark_contribution.toFixed(1)} Marks
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400">
                  No positive factors above cohort baseline.
                </div>
              )}
            </div>

            {/* Negative Factors (Drags) */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 text-rose-400 border-b border-slate-800 pb-3">
                <TrendingDown className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">
                  Score Reductions (Academic Drags)
                </h3>
              </div>

              {negativeFactors.length > 0 ? (
                <div className="space-y-3">
                  {negativeFactors.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/70 border border-rose-900/40 space-y-1.5"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">{formatFeatureName(item.feature)}</span>
                        <span className="font-mono font-extrabold text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-800/80">
                          {item.mark_contribution.toFixed(1)} Marks
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>No negative drag factors identified. Academic indicators are above average.</span>
                </div>
              )}
            </div>
          </div>

          {/* Simple Visual Contribution Bars */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">
              Visual Mark Contribution Overview
            </h3>
            <p className="text-xs text-slate-400">
              Green bars represent marks added above the baseline; red bars indicate mark deductions.
            </p>

            <div className="space-y-3 pt-2">
              {contributions.map((item, idx) => {
                const maxRange = 15;
                const widthPct = Math.min(100, (Math.abs(item.mark_contribution) / maxRange) * 100);
                const isPositive = item.mark_contribution >= 0;

                return (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-200">{formatFeatureName(item.feature)}</span>
                      <span
                        className={`font-mono font-bold ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? `+${item.mark_contribution.toFixed(1)}` : item.mark_contribution.toFixed(1)} Marks
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(4, widthPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Collapsible Advanced Technical & Mathematical Details */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <Info className="w-4 h-4 text-primary-400" />
                <span className="text-sm font-bold text-white">
                  Technical & Mathematical Proof (Formulas & Betas)
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <span>{showTechnicalDetails ? 'Hide Formulas' : 'Show Formulas & Decomposition'}</span>
                {showTechnicalDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {showTechnicalDetails && (
              <div className="p-6 border-t border-slate-800 space-y-6 bg-slate-950/60 text-xs">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <p className="font-semibold text-white">Linear Regression Exact Attribution Equation:</p>
                    <p className="font-mono text-slate-300">
                      Final Score = Baseline Intercept ({explanation.linear_regression.baseline_cohort_marks.toFixed(2)}) + &Sigma; (Beta_i &times; Standardized_x_i)
                    </p>
                    <p className="text-slate-400">
                      Sum of contributions:{' '}
                      <strong className="text-white">
                        {explanation.linear_regression.feature_contributions
                          .reduce((acc, c) => acc + c.mark_contribution, 0)
                          .toFixed(2)}{' '}
                        Marks
                      </strong>
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800">
                      <thead>
                        <tr className="text-left text-slate-400 bg-slate-900 font-semibold uppercase tracking-wider text-[11px]">
                          <th className="px-3 py-2.5">Feature</th>
                          <th className="px-3 py-2.5">Student Value</th>
                          <th className="px-3 py-2.5">Cohort Mean</th>
                          <th className="px-3 py-2.5">Z-Score</th>
                          <th className="px-3 py-2.5">Beta Weight</th>
                          <th className="px-3 py-2.5">Mark Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {explanation.linear_regression.feature_contributions.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="px-3 py-2 text-white font-sans font-semibold">{row.label}</td>
                            <td className="px-3 py-2 text-slate-300">{row.raw_value}</td>
                            <td className="px-3 py-2 text-slate-400">{row.cohort_mean}</td>
                            <td className="px-3 py-2 text-slate-400">
                              {row.standardized_value > 0 ? `+${row.standardized_value}` : row.standardized_value}
                            </td>
                            <td className="px-3 py-2 text-slate-400">
                              {row.coefficient > 0 ? `+${row.coefficient}` : row.coefficient}
                            </td>
                            <td className="px-3 py-2 font-bold">
                              <span className={row.mark_contribution >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {row.mark_contribution > 0 ? `+${row.mark_contribution}` : row.mark_contribution}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: Decision Tree Exact Sequential Path Traversal                     */}
      {/* ========================================================================= */}
      {explanation && !loading && activeModel === 'decision_tree' && (
        <div className="space-y-6">
          {/* Decision Tree Summary Hero Card */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-primary-400" />
                  <span>Decision Tree Regressor (Depth 4)</span>
                </span>
                <div className="text-lg font-bold text-white flex items-baseline space-x-2 mt-0.5">
                  <span>Assigned Partition Mean:</span>
                  <span className="text-primary-400 font-mono">
                    {explanation.decision_tree.predicted_marks.toFixed(1)} Marks
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Tree Model Forecast
                </span>
                <div className="text-2xl font-black text-white">
                  {explanation.decision_tree.predicted_marks.toFixed(1)} / 60.0
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Unlike linear regression which sums continuous weights, the Decision Tree sorts the student through sequential if-then checkpoints. Starting from the whole cohort (519 students), each condition splits the group into subgroups until reaching this student's final academic partition of{' '}
              <strong className="text-white">{leafStep?.subcohort_sample_size || 0} training peers</strong> with a mean score of{' '}
              <strong className="text-primary-400">{explanation.decision_tree.predicted_marks.toFixed(1)} / 60.0 marks</strong>.
            </p>
          </div>

          {/* Sequential Path Traversal Cards */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <GitFork className="w-5 h-5 text-primary-400" />
                <h3 className="text-base font-bold text-white">
                  Sequential Path Traversal (Root to Terminal Leaf)
                </h3>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                {decisionPath.length} Checkpoints Traversed
              </span>
            </div>

            {/* Visual Step-by-Step Flow */}
            <div className="space-y-4">
              {splitSteps.map((step, idx) => (
                <div
                  key={step.step}
                  className="relative p-5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  {/* Step Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-6 h-6 rounded-full bg-primary-900/60 border border-primary-700 text-primary-300 flex items-center justify-center text-xs font-bold font-mono">
                        {step.step}
                      </span>
                      <span className="font-bold text-white text-sm">
                        {formatFeatureName(step.feature || '')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <span className="bg-slate-900 px-2.5 py-0.5 rounded-full text-slate-400 border border-slate-800 font-mono text-[11px]">
                        Subcohort: N = {step.subcohort_sample_size} students
                      </span>
                      <span className="bg-primary-950 text-primary-300 px-2.5 py-0.5 rounded-full border border-primary-800/60 font-mono font-bold text-[11px]">
                        Avg: {step.subcohort_avg_marks.toFixed(1)} marks
                      </span>
                    </div>
                  </div>

                  {/* Condition Evaluation Banner */}
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-primary-400 flex-shrink-0" />
                      <span className="text-slate-300 font-mono">
                        Rule: <strong className="text-white">{step.condition_met}</strong>
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Condition Met
                    </span>
                  </div>

                  {/* Plain Language Explanation */}
                  <p className="text-xs text-slate-300 leading-relaxed pl-1">
                    {step.explanation}
                  </p>

                  {/* Subtle downward arrow connector between steps */}
                  {idx < splitSteps.length - 1 && (
                    <div className="flex justify-center -mb-7 pt-1">
                      <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 text-[10px]">
                        &darr;
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Terminal Leaf Card */}
              {leafStep && (
                <div className="p-5 rounded-xl bg-gradient-to-br from-primary-950/70 via-slate-950 to-slate-900 border-2 border-primary-700/80 shadow-lg space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                        &check;
                      </span>
                      <div>
                        <span className="font-extrabold text-white text-sm">
                          Terminal Leaf Node Reached
                        </span>
                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          Final Target
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                        Assigned Partition Score
                      </span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        {leafStep.subcohort_avg_marks.toFixed(1)} / 60.0 Marks
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">
                    {leafStep.explanation}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>
                      Partition Cluster Size: <strong className="text-white">{leafStep.subcohort_sample_size} students</strong>
                    </span>
                    <span>
                      Tree Final Output: <strong className="text-emerald-400 font-mono font-bold">{explanation.decision_tree.predicted_marks.toFixed(1)} / 60.0</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Global Feature Importance Breakdown */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-white">
              <Layers className="w-5 h-5 text-primary-400" />
              <h3 className="text-base font-bold">
                Global Tree Feature Importance (Variance Reduction)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Shows how much each feature contributed to reducing score prediction uncertainty across the entire decision tree.
            </p>

            <div className="space-y-3 pt-2">
              {sortedImportances.map(([feat, pct]) => (
                <div key={feat} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-200">{formatFeatureName(feat)}</span>
                    <span className="font-mono font-bold text-primary-400">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all duration-300"
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 pt-2">
              Second-period grade (G2) dominates the top branch splits as the strongest single empirical predictor, with first-period grade (G1) and absences providing subsequent refinements.
            </p>
          </div>

          {/* Collapsible Technical Proof for Decision Tree */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <Info className="w-4 h-4 text-primary-400" />
                <span className="text-sm font-bold text-white">
                  Technical Node Hierarchy (Split Conditions & Node IDs)
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <span>{showTechnicalDetails ? 'Hide Node Table' : 'Show Node Table'}</span>
                {showTechnicalDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {showTechnicalDetails && (
              <div className="p-6 border-t border-slate-800 space-y-4 bg-slate-950/60 text-xs">
                <p className="font-semibold text-white">
                  Sequential Node Path Indexing in Trained Decision Tree:
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800">
                    <thead>
                      <tr className="text-left text-slate-400 bg-slate-900 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="px-3 py-2.5">Step</th>
                        <th className="px-3 py-2.5">Node ID</th>
                        <th className="px-3 py-2.5">Type</th>
                        <th className="px-3 py-2.5">Feature</th>
                        <th className="px-3 py-2.5">Student Value</th>
                        <th className="px-3 py-2.5">Threshold</th>
                        <th className="px-3 py-2.5">Subcohort Mean</th>
                        <th className="px-3 py-2.5">Samples (N)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {decisionPath.map((step) => (
                        <tr key={step.step} className="hover:bg-slate-800/30">
                          <td className="px-3 py-2 text-white font-bold">{step.step}</td>
                          <td className="px-3 py-2 text-slate-400">{step.node_id}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                step.is_leaf
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {step.is_leaf ? 'LEAF' : 'SPLIT'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-white font-sans font-medium">
                            {step.is_leaf ? '—' : formatFeatureName(step.feature || '')}
                          </td>
                          <td className="px-3 py-2 text-slate-300">
                            {step.is_leaf ? '—' : step.student_value}
                          </td>
                          <td className="px-3 py-2 text-slate-400">
                            {step.is_leaf ? '—' : step.threshold}
                          </td>
                          <td className="px-3 py-2 text-primary-400 font-bold">
                            {step.subcohort_avg_marks.toFixed(1)} marks
                          </td>
                          <td className="px-3 py-2 text-slate-300">{step.subcohort_sample_size}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Quick Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs text-slate-400">
        <button
          type="button"
          onClick={() => onNavigate('predict')}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          &larr; Back to Performance Predictor
        </button>
        <button
          type="button"
          onClick={() => onNavigate('simulator')}
          className="text-primary-400 hover:text-primary-300 font-semibold cursor-pointer"
        >
          Test What-If Counterfactual Improvements &rarr;
        </button>
      </div>
    </div>
  );
};

export default ExplainPage;
