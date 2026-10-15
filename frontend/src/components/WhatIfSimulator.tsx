import React, { useState, useEffect } from 'react';
import {
  Sliders,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Info,
  AlertCircle,
} from 'lucide-react';
import type { AcademicInput, SimulationResponse } from '../types';
import { simulateImprovement } from '../services/api';
import { GradeBadge, PerformanceBadge } from './Badges';

interface WhatIfSimulatorProps {
  baselineInput: AcademicInput;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ baselineInput }) => {
  const [simulatedInput, setSimulatedInput] = useState<AcademicInput>({ ...baselineInput });
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // String states for natural keyboard typing, clearing, and decimal entry
  const [g1Text, setG1Text] = useState<string>(baselineInput.G1_scaled.toString());
  const [g2Text, setG2Text] = useState<string>(baselineInput.G2_scaled.toString());
  const [absencesText, setAbsencesText] = useState<string>(baselineInput.absences.toString());

  // Real-time validation errors per field
  const [g1Error, setG1Error] = useState<string | null>(null);
  const [g2Error, setG2Error] = useState<string | null>(null);
  const [absencesError, setAbsencesError] = useState<string | null>(null);

  // Sync simulated input when baselineInput prop changes
  useEffect(() => {
    setSimulatedInput({ ...baselineInput });
    setG1Text(baselineInput.G1_scaled.toString());
    setG2Text(baselineInput.G2_scaled.toString());
    setAbsencesText(baselineInput.absences.toString());
    setG1Error(null);
    setG2Error(null);
    setAbsencesError(null);
  }, [baselineInput]);

  const hasErrors = Boolean(
    g1Error ||
    g2Error ||
    absencesError ||
    !g1Text.trim() ||
    !g2Text.trim() ||
    !absencesText.trim()
  );

  // Run simulation whenever valid simulatedInput changes
  useEffect(() => {
    if (hasErrors) return;

    let isCancelled = false;
    const runSimulation = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await simulateImprovement(baselineInput, simulatedInput);
        if (!isCancelled) {
          setSimulationResult(res);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Simulation request failed');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    runSimulation();
    return () => {
      isCancelled = true;
    };
  }, [simulatedInput, baselineInput, hasErrors]);

  const handleG1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setG1Text(raw);

    if (raw.trim() === '') {
      setG1Error('Marks required (0.0 – 60.0).');
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
    setSimulatedInput((prev) => ({ ...prev, G1_scaled: val }));
  };

  const handleG1Blur = () => {
    if (g1Text.trim() === '' || isNaN(parseFloat(g1Text))) {
      setG1Text(simulatedInput.G1_scaled.toString());
      setG1Error(null);
    } else {
      const val = parseFloat(g1Text);
      const clamped = Math.max(0, Math.min(60, val));
      setG1Text(clamped.toString());
      setG1Error(null);
      setSimulatedInput((prev) => ({ ...prev, G1_scaled: clamped }));
    }
  };

  const handleG2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setG2Text(raw);

    if (raw.trim() === '') {
      setG2Error('Marks required (0.0 – 60.0).');
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
    setSimulatedInput((prev) => ({ ...prev, G2_scaled: val }));
  };

  const handleG2Blur = () => {
    if (g2Text.trim() === '' || isNaN(parseFloat(g2Text))) {
      setG2Text(simulatedInput.G2_scaled.toString());
      setG2Error(null);
    } else {
      const val = parseFloat(g2Text);
      const clamped = Math.max(0, Math.min(60, val));
      setG2Text(clamped.toString());
      setG2Error(null);
      setSimulatedInput((prev) => ({ ...prev, G2_scaled: clamped }));
    }
  };

  const handleAbsencesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setAbsencesText(raw);

    if (raw.trim() === '') {
      setAbsencesError('Absences required (0 – 50 days).');
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
    setSimulatedInput((prev) => ({ ...prev, absences: val }));
  };

  const handleAbsencesBlur = () => {
    if (absencesText.trim() === '' || isNaN(parseInt(absencesText, 10))) {
      setAbsencesText(simulatedInput.absences.toString());
      setAbsencesError(null);
    } else {
      const val = parseInt(absencesText, 10);
      const clamped = Math.max(0, Math.min(50, val));
      setAbsencesText(clamped.toString());
      setAbsencesError(null);
      setSimulatedInput((prev) => ({ ...prev, absences: clamped }));
    }
  };

  const handleFieldChange = (field: keyof AcademicInput, val: number | string) => {
    setSimulatedInput((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleReset = () => {
    setSimulatedInput({ ...baselineInput });
    setG1Text(baselineInput.G1_scaled.toString());
    setG2Text(baselineInput.G2_scaled.toString());
    setAbsencesText(baselineInput.absences.toString());
    setG1Error(null);
    setG2Error(null);
    setAbsencesError(null);
  };

  const delta = simulationResult?.delta_marks ?? 0;
  const direction = simulationResult?.direction ?? 'UNCHANGED';

  const studytimeOptions = [
    { value: 1, label: '< 2 hrs/wk' },
    { value: 2, label: '2–5 hrs/wk' },
    { value: 3, label: '5–10 hrs/wk' },
    { value: 4, label: '> 10 hrs/wk' },
  ];

  const failureOptions = [0, 1, 2, 3];

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-primary-950 border border-primary-800 text-primary-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>What-If Academic Improvement Simulator</span>
              {loading ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 animate-pulse">
                  Updating...
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary-950 text-primary-300 border border-primary-800">
                  Direct Numeric (0.0–60.0 Scale)
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Hypothesize improved exam scores, increased study commitment, and remediated backlogs to observe projected final marks
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Baseline</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Simulator Grid: Direct Controls on Left, Delta Comparison on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Simulate Parameter Adjustments</span>
            <span className="text-[11px] text-primary-400 font-normal">Real-Time ML Pipeline</span>
          </div>

          {/* 1. G1_scaled - Direct Numeric Input */}
          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="comp-g1-input" className="font-semibold text-slate-300">
                First-Period Marks (G1)
              </label>
              <div className="flex items-center space-x-1 text-[11px] font-mono">
                <span className="text-slate-500">Base: {baselineInput.G1_scaled.toFixed(1)}</span>
                <span className="text-slate-400">/ 60.0</span>
              </div>
            </div>
            <div className="relative">
              <input
                id="comp-g1-input"
                type="number"
                min="0"
                max="60"
                step="any"
                value={g1Text}
                onChange={handleG1Change}
                onBlur={handleG1Blur}
                placeholder="0.0 – 60.0"
                className={`w-full px-3 py-2 text-sm font-mono font-bold text-white bg-slate-900 border rounded-lg transition-all focus:outline-none ${
                  g1Error
                    ? 'border-rose-500 focus:border-rose-400 bg-rose-950/20'
                    : 'border-slate-700 focus:border-primary-500'
                }`}
              />
              <span className="absolute right-3 top-2 text-xs font-mono font-semibold text-slate-500 pointer-events-none">
                Marks
              </span>
            </div>
            {g1Error && (
              <p className="text-[11px] text-rose-400 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>{g1Error}</span>
              </p>
            )}
          </div>

          {/* 2. G2_scaled - Direct Numeric Input */}
          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="comp-g2-input" className="font-semibold text-slate-300">
                Second-Period Marks (G2 / Midterm)
              </label>
              <div className="flex items-center space-x-1 text-[11px] font-mono">
                <span className="text-slate-500">Base: {baselineInput.G2_scaled.toFixed(1)}</span>
                <span className="text-slate-400">/ 60.0</span>
              </div>
            </div>
            <div className="relative">
              <input
                id="comp-g2-input"
                type="number"
                min="0"
                max="60"
                step="any"
                value={g2Text}
                onChange={handleG2Change}
                onBlur={handleG2Blur}
                placeholder="0.0 – 60.0"
                className={`w-full px-3 py-2 text-sm font-mono font-bold text-white bg-slate-900 border rounded-lg transition-all focus:outline-none ${
                  g2Error
                    ? 'border-rose-500 focus:border-rose-400 bg-rose-950/20'
                    : 'border-slate-700 focus:border-primary-500'
                }`}
              />
              <span className="absolute right-3 top-2 text-xs font-mono font-semibold text-slate-500 pointer-events-none">
                Marks
              </span>
            </div>
            {g2Error && (
              <p className="text-[11px] text-rose-400 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>{g2Error}</span>
              </p>
            )}
          </div>

          {/* 3. Study Time - Discrete Selector */}
          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-300">Weekly Study Commitment</label>
              <span className="text-slate-500 text-[11px]">
                Base: {studytimeOptions.find((o) => o.value === baselineInput.studytime)?.label}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {studytimeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleFieldChange('studytime', opt.value)}
                  className={`py-1.5 px-2 text-xs rounded-lg font-medium border text-center transition-all cursor-pointer ${
                    simulatedInput.studytime === opt.value
                      ? 'bg-primary-600 text-white border-primary-500 font-semibold'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Past Failures - Discrete Selector */}
          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-300">Past Class Failures</label>
              <span className="text-slate-500 text-[11px]">
                Base: {baselineInput.failures} failures
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {failureOptions.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleFieldChange('failures', val)}
                  className={`py-1.5 px-2 text-xs rounded-lg font-medium border text-center transition-all cursor-pointer ${
                    simulatedInput.failures === val
                      ? 'bg-primary-600 text-white border-primary-500 font-semibold'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {val === 3 ? '3+' : val}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Absences - Direct Numeric Input */}
          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="comp-absences-input" className="font-semibold text-slate-300">
                School Absences (0 – 50 days)
              </label>
              <span className="text-slate-500 text-[11px] font-mono">
                Base: {baselineInput.absences} days
              </span>
            </div>
            <div className="relative">
              <input
                id="comp-absences-input"
                type="number"
                min="0"
                max="50"
                step="1"
                value={absencesText}
                onChange={handleAbsencesChange}
                onBlur={handleAbsencesBlur}
                placeholder="0 – 50"
                className={`w-full px-3 py-2 text-sm font-mono font-bold text-white bg-slate-900 border rounded-lg transition-all focus:outline-none ${
                  absencesError
                    ? 'border-rose-500 focus:border-rose-400 bg-rose-950/20'
                    : 'border-slate-700 focus:border-primary-500'
                }`}
              />
              <span className="absolute right-3 top-2 text-xs font-mono font-semibold text-slate-500 pointer-events-none">
                days
              </span>
            </div>
            {absencesError && (
              <p className="text-[11px] text-rose-400 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>{absencesError}</span>
              </p>
            )}
          </div>

          {/* 6. Extra Educational Support Toggle */}
          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-300 block">
                Extra School Support (schoolsup)
              </span>
              <span className="text-[11px] text-slate-500">
                Base: {baselineInput.schoolsup === 'yes' ? 'Enrolled' : 'Not Enrolled'}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => handleFieldChange('schoolsup', 'no')}
                className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                  simulatedInput.schoolsup === 'no'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => handleFieldChange('schoolsup', 'yes')}
                className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                  simulatedInput.schoolsup === 'yes'
                    ? 'bg-primary-950 text-primary-300 border border-primary-800'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Yes (Enrolled)
              </button>
            </div>
          </div>
        </div>

        {/* Results Comparison Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Trajectory Comparison (0–60 Marks Scale)
          </div>

          {/* Side-by-side Score Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Baseline Card */}
            <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Baseline Prediction
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-300">
                  {simulationResult?.baseline_prediction.predicted_final_marks.toFixed(1) ?? '...'}
                </span>
                <span className="text-xs text-slate-500">/ 60.0</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {simulationResult && (
                  <>
                    <GradeBadge grade={simulationResult.baseline_prediction.letter_grade} size="sm" />
                    <PerformanceBadge
                      category={simulationResult.baseline_prediction.performance_category}
                      size="sm"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Simulated Card */}
            <div className="bg-slate-950/90 rounded-xl p-4 border border-primary-800/60 shadow-lg space-y-2">
              <span className="text-[11px] font-semibold text-primary-400 uppercase flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Simulated Target</span>
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {simulationResult?.simulated_prediction.predicted_final_marks.toFixed(1) ?? '...'}
                </span>
                <span className="text-xs text-slate-400">/ 60.0</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {simulationResult && (
                  <>
                    <GradeBadge grade={simulationResult.simulated_prediction.letter_grade} size="sm" />
                    <PerformanceBadge
                      category={simulationResult.simulated_prediction.performance_category}
                      size="sm"
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Delta Marks Callout */}
          <div
            className={`rounded-xl p-4 border flex items-center justify-between ${
              direction === 'INCREASED'
                ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-200'
                : direction === 'DECREASED'
                ? 'bg-rose-950/50 border-rose-800/80 text-rose-200'
                : 'bg-slate-950/50 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-lg ${
                  direction === 'INCREASED'
                    ? 'bg-emerald-900/60 text-emerald-400'
                    : direction === 'DECREASED'
                    ? 'bg-rose-900/60 text-rose-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {direction === 'INCREASED' ? (
                  <TrendingUp className="w-5 h-5" />
                ) : direction === 'DECREASED' ? (
                  <TrendingDown className="w-5 h-5" />
                ) : (
                  <Minus className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider block opacity-75">
                  Projected Marks Delta
                </span>
                <span className="text-xl font-bold">
                  {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)} Marks
                </span>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="font-bold uppercase tracking-wider block">
                {simulationResult?.letter_grade_change !== 'UNCHANGED'
                  ? simulationResult?.letter_grade_change
                  : direction === 'INCREASED'
                  ? 'Improvement'
                  : direction === 'DECREASED'
                  ? 'Decline'
                  : 'No Change'}
              </span>
              <span className="opacity-80 text-[11px]">
                {simulationResult?.risk_status_change === 'IMPROVED'
                  ? 'Risk Status: Lowered'
                  : simulationResult?.risk_status_change === 'WORSENED'
                  ? 'Risk Status: Elevated'
                  : 'Risk Status: Stable'}
              </span>
            </div>
          </div>

          {/* Narrative Summary */}
          {simulationResult && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
              <p className="font-semibold text-white">Scenario Analysis:</p>
              <p>{simulationResult.summary}</p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="text-[11px] text-slate-500 flex items-start space-x-1.5 pt-1">
            <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
            <span>
              Disclaimer: What-If simulation results are empirical model projections (0–60 scaled marks), not guarantees of
              future academic performance. Intended solely for student motivation and counseling goal-setting.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
