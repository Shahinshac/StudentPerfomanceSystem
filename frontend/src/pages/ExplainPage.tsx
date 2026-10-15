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
} from 'lucide-react';
import type { AcademicInput, ExplanationResponse, LinearFeatureContribution } from '../types';
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
            Plain-language explanation of the academic factors that influenced this student's score forecast (0–60 scale).
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
          <span>Decomposing factor contributions...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Plain-Language Narrative View */}
      {explanation && !loading && (
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
                  Final Forecast
                </span>
                <div className="text-2xl font-black text-white">
                  {explanation.linear_regression.clamped_prediction.toFixed(1)} / 60.0
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Every student projection starts from the cohort average baseline (
              {explanation.linear_regression.baseline_cohort_marks.toFixed(1)} marks). Individual factors like your mid-term grade, study commitment, absences, and past records either add marks or subtract marks to reach your final predicted score.
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
                  <span>No negative drag factors identified. Academic record is optimal.</span>
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
              Green bars represent marks added above the baseline; red bars indicate mark subtractions.
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
                  Technical & Mathematical Proof (For Evaluators / Advanced)
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <span>{showTechnicalDetails ? 'Hide Formulas' : 'Show Formulas & Splits'}</span>
                {showTechnicalDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {showTechnicalDetails && (
              <div className="p-6 border-t border-slate-800 space-y-6 bg-slate-950/60 text-xs">
                {activeModel === 'linear_regression' ? (
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
                ) : (
                  <div className="space-y-4">
                    <p className="font-semibold text-white">Decision Tree Step-by-Step Split Path:</p>
                    <div className="space-y-2">
                      {explanation.decision_tree.decision_path.map((step) => (
                        <div
                          key={step.step}
                          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 space-y-1"
                        >
                          <div className="flex items-center justify-between font-semibold text-xs text-white">
                            <span>Step {step.step}: {step.is_leaf ? 'Leaf Node Forecast' : `Split on ${formatFeatureName(step.feature || '')}`}</span>
                            <span className="font-mono text-primary-400">
                              Subcohort Mean: {step.subcohort_avg_marks.toFixed(1)} Marks (N={step.subcohort_sample_size})
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs">{step.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
      )}
    </div>
  );
};

export default ExplainPage;
