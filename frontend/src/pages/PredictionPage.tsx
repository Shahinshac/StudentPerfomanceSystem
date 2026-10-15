import React, { useState } from 'react';
import {
  Calculator,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import type { AcademicInput, EvaluationStudentResponse } from '../types';
import { evaluateStudent } from '../services/api';
import { GradeBadge, PerformanceBadge, RiskBadge } from '../components/Badges';
import { WhatIfSimulator } from '../components/WhatIfSimulator';
import { ExplainableCard } from '../components/ExplainableCard';

export const PredictionPage: React.FC = () => {
  const [formData, setFormData] = useState<AcademicInput>({
    G1_scaled: 36.0,
    G2_scaled: 39.0,
    studytime: 2,
    failures: 0,
    absences: 4,
    schoolsup: 'no',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationStudentResponse | null>(null);

  // Viva demonstration presets
  const applyPreset = (presetType: 'high' | 'average' | 'risk') => {
    if (presetType === 'high') {
      setFormData({
        G1_scaled: 51.0,
        G2_scaled: 54.0,
        studytime: 4,
        failures: 0,
        absences: 1,
        schoolsup: 'no',
      });
    } else if (presetType === 'average') {
      setFormData({
        G1_scaled: 36.0,
        G2_scaled: 39.0,
        studytime: 2,
        failures: 0,
        absences: 4,
        schoolsup: 'no',
      });
    } else if (presetType === 'risk') {
      setFormData({
        G1_scaled: 21.0,
        G2_scaled: 24.0,
        studytime: 1,
        failures: 2,
        absences: 16,
        schoolsup: 'no',
      });
    }
  };

  const handleInputChange = (field: keyof AcademicInput, value: number | string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const evaluation = await evaluateStudent(formData);
      setResult(evaluation);
    } catch (err: any) {
      setError(err.message || 'Failed to complete student evaluation');
    } finally {
      setLoading(false);
    }
  };

  const studytimeLabels: Record<number, string> = {
    1: '< 2 hrs/wk',
    2: '2–5 hrs/wk',
    3: '5–10 hrs/wk',
    4: '> 10 hrs/wk',
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Student Performance Prediction & Diagnostic Suite
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Machine Learning final marks forecasting (0–60 scale), provisional letter grading (A–F),
          institutional risk diagnostics, What-If simulation, and transparent feature attribution.
        </p>
      </div>

      {/* Preset Demo Bar */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
          <Sparkles className="w-4 h-4 text-primary-400" />
          <span>Viva Demonstration Presets:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset('high')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900/60 transition-all shadow-sm"
          >
            🌟 Top Honors Profile (Grade A)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('average')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-950/70 text-blue-300 border border-blue-800/80 hover:bg-blue-900/60 transition-all shadow-sm"
          >
            📘 Average Steady Profile (Grade C/B)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('risk')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-950/70 text-rose-300 border border-rose-800/80 hover:bg-rose-900/60 transition-all shadow-sm"
          >
            ⚠️ High-Risk Profile (Grade F)
          </button>
        </div>
      </div>

      {/* Main Form & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Academic Input Form */}
        <div className="lg:col-span-6 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-primary-400" />
              <span>Academic Parameters (UCI Features)</span>
            </h3>
            <span className="text-xs text-slate-400">Scale 0–60 Marks</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. G1_scaled */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-300">First-Period Marks (G1)</label>
                <span className="font-mono text-primary-400 font-bold text-sm">
                  {formData.G1_scaled.toFixed(1)} / 60.0
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={formData.G1_scaled}
                onChange={(e) => handleInputChange('G1_scaled', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <p className="text-[11px] text-slate-500">
                First trimester formal assessment marks (original G1 x 3)
              </p>
            </div>

            {/* 2. G2_scaled */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-300">Second-Period Marks (G2)</label>
                <span className="font-mono text-primary-400 font-bold text-sm">
                  {formData.G2_scaled.toFixed(1)} / 60.0
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={formData.G2_scaled}
                onChange={(e) => handleInputChange('G2_scaled', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <p className="text-[11px] text-slate-500">
                Mid-term evaluation score (original G2 x 3, r = +0.919 with final marks)
              </p>
            </div>

            {/* 3. Study Time */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-300">Weekly Study Time</label>
                <span className="font-mono text-primary-400 font-bold text-sm">
                  {studytimeLabels[formData.studytime] || formData.studytime}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={formData.studytime}
                onChange={(e) => handleInputChange('studytime', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <p className="text-[11px] text-slate-500">
                1: &lt; 2h, 2: 2–5h, 3: 5–10h, 4: &gt; 10h weekly study commitment
              </p>
            </div>

            {/* 4. Past Failures */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-300">Past Class Failures</label>
                <span className="font-mono text-primary-400 font-bold text-sm">
                  {formData.failures} {formData.failures === 1 ? 'failure' : 'failures'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={formData.failures}
                onChange={(e) => handleInputChange('failures', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <p className="text-[11px] text-slate-500">
                Number of previous course failures on academic record (0 to 3+)
              </p>
            </div>

            {/* 5. Absences */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-300">School Absences</label>
                <span className="font-mono text-primary-400 font-bold text-sm">
                  {formData.absences} days
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                step="1"
                value={formData.absences}
                onChange={(e) => handleInputChange('absences', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <p className="text-[11px] text-slate-500">
                Cumulative days absent during the academic term (Cohort avg: 3.7 days)
              </p>
            </div>

            {/* 6. Extra Support Toggle */}
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">
                  Extra Educational Support (schoolsup)
                </span>
                <span className="text-[11px] text-slate-500">
                  Institutional remedial or tutoring enrollment
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => handleInputChange('schoolsup', 'no')}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                    formData.schoolsup === 'no'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('schoolsup', 'yes')}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                    formData.schoolsup === 'yes'
                      ? 'bg-primary-950 text-primary-300 border border-primary-800'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm transition-all shadow-md disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Machine Learning Model...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span>Execute Performance Assessment</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Prediction Results Display */}
        <div className="lg:col-span-6 space-y-6">
          {result ? (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
              {/* Header Tiers */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Prediction Target
                  </span>
                  <h4 className="text-lg font-bold text-white">Final Examination Forecast</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <GradeBadge grade={result.prediction.letter_grade} size="md" />
                  <PerformanceBadge
                    category={result.prediction.performance_category}
                    percentage={result.prediction.performance_percentage}
                    size="md"
                  />
                  <RiskBadge
                    level={result.risk.risk_level}
                    flagsCount={result.risk.risk_flags_count}
                    size="md"
                  />
                </div>
              </div>

              {/* Numerical Marks Highlight Card */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 text-white flex items-center justify-between shadow-inner">
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Predicted Final Exam Score
                  </span>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-4xl sm:text-5xl font-black text-white">
                      {result.prediction.predicted_final_marks.toFixed(1)}
                    </span>
                    <span className="text-slate-400 text-lg font-medium">/ 60.0 Marks</span>
                  </div>
                  <p className="text-xs text-primary-400 mt-2 font-medium">
                    Model: {result.prediction.model_used}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl sm:text-4xl font-extrabold text-primary-400">
                    {result.prediction.performance_percentage}%
                  </span>
                  <p className="text-xs text-slate-400 mt-1">Grade {result.prediction.letter_grade}</p>
                </div>
              </div>

              {/* Progress bar visual */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>0 Marks (F)</span>
                  <span>Pass: 30.0 (D)</span>
                  <span>Credit: 48.0 (B)</span>
                  <span>Honors: 54.0 (A)</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      result.prediction.predicted_final_marks >= 54
                        ? 'bg-emerald-500'
                        : result.prediction.predicted_final_marks >= 48
                        ? 'bg-blue-500'
                        : result.prediction.predicted_final_marks >= 36
                        ? 'bg-amber-500'
                        : result.prediction.predicted_final_marks >= 30
                        ? 'bg-orange-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${result.prediction.performance_percentage}%` }}
                  />
                </div>
              </div>

              {/* Performance Explanation */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <p className="font-semibold text-white mb-1">Academic Projection Insight:</p>
                {result.prediction.category_description}
              </div>

              {/* Rule-Based Academic Risk Section */}
              <div className="border-t border-slate-800 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                    {result.risk.risk_level === 'Low Risk' ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    )}
                    <span>Rule-Based Institutional Risk Assessment</span>
                  </h4>
                  <span className="text-xs text-slate-500">Advisory Guidelines</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{result.risk.summary}</p>

                {/* Triggered Factors List */}
                {result.risk.triggered_factors.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-semibold text-slate-300">Triggered Academic Flags:</p>
                    {result.risk.triggered_factors.map((factor, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs ${
                          factor.severity === 'CRITICAL'
                            ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                            : 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>{factor.factor}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 font-bold">
                            {factor.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-300 leading-normal">{factor.reason}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>No risk triggers activated. Student is safely on track.</span>
                  </div>
                )}

                {/* Recommended Interventions */}
                <div className="space-y-1.5 pt-2">
                  <p className="text-xs font-semibold text-slate-300">Recommended Next Steps:</p>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-slate-400">
                    {result.risk.recommended_interventions.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3 flex items-start space-x-1.5">
                <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-500" />
                <span>
                  Disclaimers: Predicted mark is a rescaled (0–60) statistical estimate based on the UCI Student Performance dataset.
                  Letter grades (A–F) reflect project-defined provisional thresholds, not official UCI or institutional bylaws.
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500 space-y-3">
              <Calculator className="w-12 h-12 mx-auto text-slate-700 stroke-1" />
              <h4 className="text-base font-semibold text-slate-300">Awaiting Student Data</h4>
              <p className="text-xs max-w-sm mx-auto text-slate-500">
                Adjust academic parameters on the left or select a viva demo preset,
                then click "Execute Performance Assessment".
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Feature 1: What-If Academic Improvement Simulator */}
      <WhatIfSimulator baselineInput={formData} />

      {/* Feature 2: Explainable Prediction Breakdown */}
      <ExplainableCard studentInput={formData} />
    </div>
  );
};
