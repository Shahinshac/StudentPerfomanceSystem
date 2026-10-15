import React, { useState, useEffect } from 'react';
import {
  Calculator,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sliders,
  Lightbulb,
} from 'lucide-react';
import type { AcademicInput, EvaluationStudentResponse } from '../types';
import { evaluateStudent } from '../services/api';
import { GradeBadge, PerformanceBadge, RiskBadge } from '../components/Badges';

interface PredictionPageProps {
  formData: AcademicInput;
  setFormData: React.Dispatch<React.SetStateAction<AcademicInput>>;
  result: EvaluationStudentResponse | null;
  setResult: React.Dispatch<React.SetStateAction<EvaluationStudentResponse | null>>;
  onNavigate: (tab: string) => void;
}

export const PredictionPage: React.FC<PredictionPageProps> = ({
  formData,
  setFormData,
  result,
  setResult,
  onNavigate,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // String states for natural keyboard typing, backspacing, and decimal entry
  const [g1Text, setG1Text] = useState<string>(formData.G1_scaled.toString());
  const [g2Text, setG2Text] = useState<string>(formData.G2_scaled.toString());
  const [absencesText, setAbsencesText] = useState<string>(formData.absences.toString());

  // Granular validation errors per input field
  const [g1Error, setG1Error] = useState<string | null>(null);
  const [g2Error, setG2Error] = useState<string | null>(null);
  const [absencesError, setAbsencesError] = useState<string | null>(null);

  // Synchronize string inputs when formData updates externally (e.g., preset buttons)
  useEffect(() => {
    setG1Text(formData.G1_scaled.toString());
    setG1Error(null);
  }, [formData.G1_scaled]);

  useEffect(() => {
    setG2Text(formData.G2_scaled.toString());
    setG2Error(null);
  }, [formData.G2_scaled]);

  useEffect(() => {
    setAbsencesText(formData.absences.toString());
    setAbsencesError(null);
  }, [formData.absences]);

  // Quick demonstration presets
  const applyPreset = (presetType: 'high' | 'average' | 'risk') => {
    setError(null);
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

  const handleG1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setG1Text(raw);

    if (raw.trim() === '') {
      setG1Error('First-period marks are required (0.0 – 60.0).');
      return;
    }
    const val = parseFloat(raw);
    if (isNaN(val)) {
      setG1Error('Please enter a valid numeric mark.');
      return;
    }
    if (val < 0.0 || val > 60.0) {
      setG1Error(`Marks must be between 0.0 and 60.0 (entered: ${val}).`);
      return;
    }
    setG1Error(null);
    setFormData((prev) => ({ ...prev, G1_scaled: val }));
  };

  const handleG1Blur = () => {
    if (g1Text.trim() === '' || isNaN(parseFloat(g1Text))) {
      setG1Text(formData.G1_scaled.toString());
      setG1Error(null);
    } else {
      const val = parseFloat(g1Text);
      const clamped = Math.max(0, Math.min(60, val));
      setG1Text(clamped.toString());
      setG1Error(null);
      setFormData((prev) => ({ ...prev, G1_scaled: clamped }));
    }
  };

  const handleG2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setG2Text(raw);

    if (raw.trim() === '') {
      setG2Error('Second-period marks are required (0.0 – 60.0).');
      return;
    }
    const val = parseFloat(raw);
    if (isNaN(val)) {
      setG2Error('Please enter a valid numeric mark.');
      return;
    }
    if (val < 0.0 || val > 60.0) {
      setG2Error(`Marks must be between 0.0 and 60.0 (entered: ${val}).`);
      return;
    }
    setG2Error(null);
    setFormData((prev) => ({ ...prev, G2_scaled: val }));
  };

  const handleG2Blur = () => {
    if (g2Text.trim() === '' || isNaN(parseFloat(g2Text))) {
      setG2Text(formData.G2_scaled.toString());
      setG2Error(null);
    } else {
      const val = parseFloat(g2Text);
      const clamped = Math.max(0, Math.min(60, val));
      setG2Text(clamped.toString());
      setG2Error(null);
      setFormData((prev) => ({ ...prev, G2_scaled: clamped }));
    }
  };

  const handleAbsencesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setAbsencesText(raw);

    if (raw.trim() === '') {
      setAbsencesError('Absences are required (0 – 50 days).');
      return;
    }
    const val = parseInt(raw, 10);
    if (isNaN(val)) {
      setAbsencesError('Please enter a valid whole number.');
      return;
    }
    if (val < 0 || val > 50) {
      setAbsencesError(`Absences must be between 0 and 50 days (entered: ${val}).`);
      return;
    }
    setAbsencesError(null);
    setFormData((prev) => ({ ...prev, absences: val }));
  };

  const handleAbsencesBlur = () => {
    if (absencesText.trim() === '' || isNaN(parseInt(absencesText, 10))) {
      setAbsencesText(formData.absences.toString());
      setAbsencesError(null);
    } else {
      const val = parseInt(absencesText, 10);
      const clamped = Math.max(0, Math.min(50, val));
      setAbsencesText(clamped.toString());
      setAbsencesError(null);
      setFormData((prev) => ({ ...prev, absences: clamped }));
    }
  };

  const hasValidationErrors = Boolean(
    g1Error ||
    g2Error ||
    absencesError ||
    !g1Text.trim() ||
    !g2Text.trim() ||
    !absencesText.trim()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasValidationErrors) {
      setError('Please resolve all field validation errors before forecasting.');
      return;
    }
    setLoading(true);
    setError(null);

    // Validation checks against schema
    if (formData.G1_scaled < 0 || formData.G1_scaled > 60) {
      setError('First-period marks (G1) must be between 0.0 and 60.0.');
      setLoading(false);
      return;
    }
    if (formData.G2_scaled < 0 || formData.G2_scaled > 60) {
      setError('Second-period marks (G2) must be between 0.0 and 60.0.');
      setLoading(false);
      return;
    }
    if (formData.absences < 0 || formData.absences > 50) {
      setError('Absences must be between 0 and 50 days.');
      setLoading(false);
      return;
    }

    try {
      const evaluation = await evaluateStudent(formData);
      setResult(evaluation);
    } catch (err: any) {
      setError(err.message || 'Failed to complete student evaluation. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const studytimeOptions = [
    { value: 1, label: '< 2 hrs/wk', desc: 'Minimal' },
    { value: 2, label: '2–5 hrs/wk', desc: 'Moderate' },
    { value: 3, label: '5–10 hrs/wk', desc: 'Strong' },
    { value: 4, label: '> 10 hrs/wk', desc: 'Intensive' },
  ];

  const failureOptions = [0, 1, 2, 3];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Predict Academic Performance
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Enter examination marks and academic habits directly into numeric fields to estimate final marks on the 0.0–60.0 scale and provisional letter grades (A–F).
        </p>
      </div>

      {/* Quick Demonstration Presets */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
          <Sparkles className="w-4 h-4 text-primary-400" />
          <span>Quick Sample Profiles:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset('high')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900/60 transition-all shadow-sm cursor-pointer"
          >
            🌟 Honors Profile (Grade A)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('average')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-950/70 text-blue-300 border border-blue-800/80 hover:bg-blue-900/60 transition-all shadow-sm cursor-pointer"
          >
            📘 Steady Profile (Grade C/B)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('risk')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-950/70 text-rose-300 border border-rose-800/80 hover:bg-rose-900/60 transition-all shadow-sm cursor-pointer"
          >
            ⚠️ Needs Support (Grade F)
          </button>
        </div>
      </div>

      {/* Form & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Direct Numeric Input Form */}
        <div className="lg:col-span-6 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-primary-400" />
              <span>Student Parameters</span>
            </h3>
            <span className="text-xs text-primary-400 font-mono font-semibold bg-primary-950/60 px-2 py-0.5 rounded border border-primary-800/50">
              0.0–60.0 Marks Scale
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. G1_scaled - Direct Numeric Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="g1-input" className="font-semibold text-slate-200">
                  First-Period Exam Marks (G1)
                </label>
                <span className="text-slate-400 font-mono text-[11px]">
                  Unit: <span className="text-slate-300 font-semibold">Marks (out of 60.0)</span>
                </span>
              </div>
              <div className="relative">
                <input
                  id="g1-input"
                  type="number"
                  min="0"
                  max="60"
                  step="any"
                  value={g1Text}
                  onChange={handleG1Change}
                  onBlur={handleG1Blur}
                  placeholder="e.g. 36.0"
                  className={`w-full px-3.5 py-2.5 text-sm font-mono font-bold text-white bg-slate-950 border rounded-xl transition-all focus:outline-none ${
                    g1Error
                      ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500 bg-rose-950/10'
                      : 'border-slate-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                  }`}
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-mono font-semibold text-slate-500 pointer-events-none">
                  / 60.0
                </span>
              </div>
              {g1Error ? (
                <p className="text-xs text-rose-400 flex items-center space-x-1 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{g1Error}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Range: 0.0 – 60.0 marks. Decimals allowed (e.g. 36.5). Pass threshold: 30.0.
                </p>
              )}
            </div>

            {/* 2. G2_scaled - Direct Numeric Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="g2-input" className="font-semibold text-slate-200">
                  Second-Period Exam Marks (G2 / Midterm)
                </label>
                <span className="text-slate-400 font-mono text-[11px]">
                  Unit: <span className="text-slate-300 font-semibold">Marks (out of 60.0)</span>
                </span>
              </div>
              <div className="relative">
                <input
                  id="g2-input"
                  type="number"
                  min="0"
                  max="60"
                  step="any"
                  value={g2Text}
                  onChange={handleG2Change}
                  onBlur={handleG2Blur}
                  placeholder="e.g. 39.0"
                  className={`w-full px-3.5 py-2.5 text-sm font-mono font-bold text-white bg-slate-950 border rounded-xl transition-all focus:outline-none ${
                    g2Error
                      ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500 bg-rose-950/10'
                      : 'border-slate-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                  }`}
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-mono font-semibold text-slate-500 pointer-events-none">
                  / 60.0
                </span>
              </div>
              {g2Error ? (
                <p className="text-xs text-rose-400 flex items-center space-x-1 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{g2Error}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Range: 0.0 – 60.0 marks. Decimals allowed. Strongest statistical correlation (r = +0.915).
                </p>
              )}
            </div>

            {/* 3. Study Time */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-200">Weekly Study Commitment</label>
                <span className="font-mono text-primary-400 font-bold text-xs">
                  {studytimeOptions.find((o) => o.value === formData.studytime)?.label}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {studytimeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleInputChange('studytime', opt.value)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      formData.studytime === opt.value
                        ? 'bg-primary-600 text-white border-primary-500 shadow-sm font-semibold'
                        : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="leading-tight">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Past Failures */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-200">Past Class Failures</label>
                <span className="font-mono text-primary-400 font-bold text-xs">
                  {formData.failures} {formData.failures === 1 ? 'failure' : 'failures'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {failureOptions.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleInputChange('failures', val)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      formData.failures === val
                        ? 'bg-primary-600 text-white border-primary-500 shadow-sm font-semibold'
                        : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {val === 3 ? '3+ Failures' : `${val} Failures`}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Absences - Direct Numeric Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="absences-input" className="font-semibold text-slate-200">
                  School Absences
                </label>
                <span className="text-slate-400 font-mono text-[11px]">
                  Unit: <span className="text-slate-300 font-semibold">Days missed (0 – 50)</span>
                </span>
              </div>
              <div className="relative">
                <input
                  id="absences-input"
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={absencesText}
                  onChange={handleAbsencesChange}
                  onBlur={handleAbsencesBlur}
                  placeholder="e.g. 4"
                  className={`w-full px-3.5 py-2.5 text-sm font-mono font-bold text-white bg-slate-950 border rounded-xl transition-all focus:outline-none ${
                    absencesError
                      ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500 bg-rose-950/10'
                      : 'border-slate-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                  }`}
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-mono font-semibold text-slate-500 pointer-events-none">
                  days
                </span>
              </div>
              {absencesError ? (
                <p className="text-xs text-rose-400 flex items-center space-x-1 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{absencesError}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Total days absent during term (Cohort avg: ~3.7 days. ≥ 15 days flags chronic disengagement).
                </p>
              )}
            </div>

            {/* 6. Extra Educational Support */}
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Extra Educational Support
                </span>
                <span className="text-[11px] text-slate-500">
                  Institutional tutoring or remedial assistance
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => handleInputChange('schoolsup', 'no')}
                  className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
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
                  className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                    formData.schoolsup === 'yes'
                      ? 'bg-primary-950 text-primary-300 border border-primary-800'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>

            {/* Prominent Predict Button */}
            <button
              type="submit"
              disabled={loading || hasValidationErrors}
              className="w-full py-3.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm transition-all shadow-lg hover:shadow-primary-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Calculating Prediction...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span>Predict Final Grade</span>
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
              {/* Header Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Forecast Result
                  </span>
                  <h4 className="text-lg font-bold text-white">Final Exam Projection</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <GradeBadge grade={result.prediction.letter_grade} size="md" />
                  <PerformanceBadge
                    category={result.prediction.performance_category}
                    percentage={result.prediction.performance_percentage}
                    size="md"
                  />
                </div>
              </div>

              {/* Numerical Marks Highlight Card */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 text-white flex items-center justify-between shadow-inner">
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Predicted Final Score
                  </span>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-4xl sm:text-5xl font-black text-white">
                      {result.prediction.predicted_final_marks.toFixed(1)}
                    </span>
                    <span className="text-slate-400 text-lg font-medium">/ 60.0</span>
                  </div>
                  <p className="text-xs text-primary-400 mt-2 font-medium">
                    Provisional Grade: {result.prediction.letter_grade} ({result.prediction.performance_category})
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl sm:text-4xl font-extrabold text-primary-400">
                    {result.prediction.performance_percentage}%
                  </span>
                  <p className="text-xs text-slate-400 mt-1">Standard Scale</p>
                </div>
              </div>

              {/* Progress bar visual across 0–60 */}
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

              {/* Plain-Language Interpretation */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <p className="font-semibold text-white mb-1">Plain-Language Summary:</p>
                {result.prediction.category_description}
              </div>

              {/* Risk Status Indicator */}
              <div className="border-t border-slate-800 pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {result.risk.risk_level === 'Low Risk' ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    )}
                    <span className="text-xs font-bold text-white">
                      Risk Status: {result.risk.risk_level}
                    </span>
                  </div>
                  <RiskBadge
                    level={result.risk.risk_level}
                    flagsCount={result.risk.risk_flags_count}
                    size="sm"
                  />
                </div>
                <p className="text-xs text-slate-400">{result.risk.summary}</p>
              </div>

              {/* Quick Jump Action Cards for Feature Exploration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('simulator')}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-primary-900/60 hover:border-primary-600 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-primary-300">
                    <span className="flex items-center space-x-1.5">
                      <Sliders className="w-4 h-4 text-primary-400" />
                      <span>What-If Simulator</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    See how improving attendance or study time boosts your score.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('explain')}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-900/60 hover:border-indigo-600 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                    <span className="flex items-center space-x-1.5">
                      <Lightbulb className="w-4 h-4 text-indigo-400" />
                      <span>Explain Prediction</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Understand the key factors that drove this score in plain English.
                  </p>
                </button>
              </div>

              {/* Disclaimer */}
              <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3 flex items-start space-x-1.5">
                <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-500" />
                <span>
                  Scale: 0–60 Marks (UCI Portuguese dataset benchmark). Letter grades reflect provisional academic thresholds (A: 54+, B: 48+, C: 36+, D: 30+, F: &lt;30).
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500 space-y-4 shadow-xl">
              <Calculator className="w-12 h-12 mx-auto text-slate-700 stroke-1" />
              <div>
                <h4 className="text-base font-semibold text-slate-300">Ready to Forecast</h4>
                <p className="text-xs max-w-sm mx-auto text-slate-500 mt-1">
                  Adjust student parameters on the left or click one of the sample profile buttons above, then click "Predict Final Grade".
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => applyPreset('average')}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all inline-flex items-center space-x-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                  <span>Load Sample Profile</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionPage;
