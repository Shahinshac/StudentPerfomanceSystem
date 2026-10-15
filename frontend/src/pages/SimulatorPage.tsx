import React, { useState, useEffect } from 'react';
import {
  Sliders,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import type { AcademicInput, SimulationResponse } from '../types';
import { simulateImprovement } from '../services/api';
import { GradeBadge } from '../components/Badges';

interface SimulatorPageProps {
  baselineInput: AcademicInput;
  onNavigate: (tab: string) => void;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({ baselineInput, onNavigate }) => {
  const [simulatedInput, setSimulatedInput] = useState<AcademicInput>({ ...baselineInput });
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // String states for natural keyboard typing, backspacing, and decimal entry
  const [g2Text, setG2Text] = useState<string>(baselineInput.G2_scaled.toString());
  const [g1Text, setG1Text] = useState<string>(baselineInput.G1_scaled.toString());
  const [absencesText, setAbsencesText] = useState<string>(baselineInput.absences.toString());

  // Real-time validation errors per field
  const [g2Error, setG2Error] = useState<string | null>(null);
  const [g1Error, setG1Error] = useState<string | null>(null);
  const [absencesError, setAbsencesError] = useState<string | null>(null);

  // Sync simulated input whenever baseline changes or reset is invoked
  useEffect(() => {
    setSimulatedInput({ ...baselineInput });
    setG2Text(baselineInput.G2_scaled.toString());
    setG1Text(baselineInput.G1_scaled.toString());
    setAbsencesText(baselineInput.absences.toString());
    setG2Error(null);
    setG1Error(null);
    setAbsencesError(null);
  }, [baselineInput]);

  // Run simulation only when inputs are valid numbers
  const hasErrors = Boolean(
    g2Error ||
    g1Error ||
    absencesError ||
    !g2Text.trim() ||
    !g1Text.trim() ||
    !absencesText.trim()
  );

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
          setError(err.message || 'Simulation request failed. Check backend connection.');
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
    setG2Text(baselineInput.G2_scaled.toString());
    setG1Text(baselineInput.G1_scaled.toString());
    setAbsencesText(baselineInput.absences.toString());
    setG2Error(null);
    setG1Error(null);
    setAbsencesError(null);
  };

  const adjustG2 = (delta: number) => {
    const current = parseFloat(g2Text) || simulatedInput.G2_scaled;
    const nextVal = Math.max(0, Math.min(60, Math.round((current + delta) * 10) / 10));
    setG2Text(nextVal.toString());
    setG2Error(null);
    setSimulatedInput((prev) => ({ ...prev, G2_scaled: nextVal }));
  };

  const adjustG1 = (delta: number) => {
    const current = parseFloat(g1Text) || simulatedInput.G1_scaled;
    const nextVal = Math.max(0, Math.min(60, Math.round((current + delta) * 10) / 10));
    setG1Text(nextVal.toString());
    setG1Error(null);
    setSimulatedInput((prev) => ({ ...prev, G1_scaled: nextVal }));
  };

  const adjustAbsences = (delta: number) => {
    const current = parseInt(absencesText, 10) || simulatedInput.absences;
    const nextVal = Math.max(0, Math.min(50, current + delta));
    setAbsencesText(nextVal.toString());
    setAbsencesError(null);
    setSimulatedInput((prev) => ({ ...prev, absences: nextVal }));
  };

  const delta = simulationResult?.delta_marks ?? 0;
  const direction = simulationResult?.direction ?? 'UNCHANGED';

  const studytimeOptions = [
    { value: 1, label: '< 2 hrs/wk', desc: 'Minimal' },
    { value: 2, label: '2–5 hrs/wk', desc: 'Moderate' },
    { value: 3, label: '5–10 hrs/wk', desc: 'Strong' },
    { value: 4, label: '> 10 hrs/wk', desc: 'Intensive' },
  ];

  const failureOptions = [0, 1, 2, 3];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
            <Sliders className="w-7 h-7 text-primary-400" />
            <span>What-If Academic Simulator</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Type simulated marks and study parameters directly into numeric fields to project counterfactual grade improvements (0.0–60.0 scale).
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shadow-sm cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-primary-400" />
          <span>Reset to Baseline</span>
        </button>
      </div>

      {/* Comparison Cards: Baseline vs. Simulated */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {/* Baseline Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Current Baseline</span>
            <span className="text-slate-500 text-[11px]">Original Input</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-white">
              {simulationResult ? simulationResult.baseline_prediction.predicted_final_marks.toFixed(1) : '...'}
            </span>
            <span className="text-slate-400 text-sm font-medium">/ 60.0</span>
          </div>
          <div className="flex items-center space-x-2 pt-1">
            {simulationResult && (
              <>
                <GradeBadge grade={simulationResult.baseline_prediction.letter_grade} size="sm" />
                <span className="text-xs text-slate-300 font-medium">
                  {simulationResult.baseline_prediction.performance_percentage}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* Delta Change Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg flex flex-col justify-center items-center text-center space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Predicted Mark Shift
          </span>
          <div className="flex items-center space-x-2">
            {direction === 'INCREASED' ? (
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            ) : direction === 'DECREASED' ? (
              <TrendingDown className="w-6 h-6 text-rose-400" />
            ) : (
              <Minus className="w-6 h-6 text-slate-400" />
            )}
            <span
              className={`text-3xl sm:text-4xl font-black ${
                direction === 'INCREASED'
                  ? 'text-emerald-400'
                  : direction === 'DECREASED'
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
            </span>
            <span className="text-slate-400 text-sm font-medium">Marks</span>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              direction === 'INCREASED'
                ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                : direction === 'DECREASED'
                ? 'bg-rose-950/70 border-rose-800 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            {direction === 'INCREASED'
              ? 'Marks Improved'
              : direction === 'DECREASED'
              ? 'Marks Decreased'
              : 'Unchanged'}
          </span>
        </div>

        {/* Simulated Card */}
        <div className="bg-slate-900 rounded-2xl border border-primary-900/60 p-5 shadow-lg space-y-3 ring-1 ring-primary-500/20">
          <div className="flex items-center justify-between text-xs text-primary-400 font-semibold uppercase tracking-wider">
            <span>Simulated Outcome</span>
            {loading && <span className="text-[10px] text-slate-400 animate-pulse">Calculating...</span>}
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-primary-400">
              {simulationResult ? simulationResult.simulated_prediction.predicted_final_marks.toFixed(1) : '...'}
            </span>
            <span className="text-slate-400 text-sm font-medium">/ 60.0</span>
          </div>
          <div className="flex items-center space-x-2 pt-1">
            {simulationResult && (
              <>
                <GradeBadge grade={simulationResult.simulated_prediction.letter_grade} size="sm" />
                <span className="text-xs text-slate-300 font-medium">
                  {simulationResult.simulated_prediction.performance_percentage}%
                </span>
                <span className="text-[11px] text-slate-400">
                  ({simulationResult.letter_grade_change})
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Plain-Language Takeaway Banner */}
      {simulationResult && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-start space-x-3 text-xs text-slate-300 leading-relaxed">
          <Sparkles className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white block mb-0.5">Simulation Takeaway:</span>
            {simulationResult.summary}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Interactive Numeric Controls Grid */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">
            Direct Parameters for Simulation
          </h3>
          <span className="text-xs text-primary-400 font-mono font-semibold bg-primary-950/60 px-2 py-0.5 rounded border border-primary-800/50">
            0.0–60.0 Marks Scale
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. G2 Marks - Direct Numeric Input */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="sim-g2-input" className="font-semibold text-slate-200">
                Second-Period Marks (G2 / Midterm)
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                Base: <span className="text-slate-300 font-semibold">{baselineInput.G2_scaled.toFixed(1)}</span>
              </span>
            </div>
            <div className="relative">
              <input
                id="sim-g2-input"
                type="number"
                min="0"
                max="60"
                step="any"
                value={g2Text}
                onChange={handleG2Change}
                onBlur={handleG2Blur}
                placeholder="0.0 – 60.0"
                className={`w-full px-3.5 py-2.5 text-sm font-mono font-bold text-white bg-slate-900 border rounded-xl transition-all focus:outline-none ${
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
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Range: 0.0 – 60.0 marks. Decimals allowed.
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => adjustG2(-2)}
                    className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                  >
                    -2
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustG2(+2)}
                    className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                  >
                    +2
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustG2(+5)}
                    className="px-2 py-0.5 text-[10px] font-mono rounded bg-primary-950 hover:bg-primary-900 text-primary-300 border border-primary-800 cursor-pointer"
                  >
                    +5
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. G1 Marks - Direct Numeric Input */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="sim-g1-input" className="font-semibold text-slate-200">
                First-Period Marks (G1)
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                Base: <span className="text-slate-300 font-semibold">{baselineInput.G1_scaled.toFixed(1)}</span>
              </span>
            </div>
            <div className="relative">
              <input
                id="sim-g1-input"
                type="number"
                min="0"
                max="60"
                step="any"
                value={g1Text}
                onChange={handleG1Change}
                onBlur={handleG1Blur}
                placeholder="0.0 – 60.0"
                className={`w-full px-3.5 py-2.5 text-sm font-mono font-bold text-white bg-slate-900 border rounded-xl transition-all focus:outline-none ${
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
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Range: 0.0 – 60.0 marks. Decimals allowed.
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => adjustG1(-2)}
                    className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                  >
                    -2
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustG1(+2)}
                    className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                  >
                    +2
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustG1(+5)}
                    className="px-2 py-0.5 text-[10px] font-mono rounded bg-primary-950 hover:bg-primary-900 text-primary-300 border border-primary-800 cursor-pointer"
                  >
                    +5
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Study Time - Discrete Selector */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-200">Weekly Study Commitment</label>
              <span className="text-[11px] text-slate-400">
                Base: <span className="text-slate-300 font-semibold">{studytimeOptions.find((o) => o.value === baselineInput.studytime)?.label}</span>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {studytimeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleFieldChange('studytime', opt.value)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                    simulatedInput.studytime === opt.value
                      ? 'bg-primary-600 text-white border-primary-500 shadow-sm font-semibold'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="leading-tight">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Absences - Direct Numeric Input */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="sim-absences-input" className="font-semibold text-slate-200">
                School Absences
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                Base: <span className="text-slate-300 font-semibold">{baselineInput.absences} days</span>
              </span>
            </div>
            <div className="relative">
              <input
                id="sim-absences-input"
                type="number"
                min="0"
                max="50"
                step="1"
                value={absencesText}
                onChange={handleAbsencesChange}
                onBlur={handleAbsencesBlur}
                placeholder="0 – 50"
                className={`w-full px-3.5 py-2.5 text-sm font-mono font-bold text-white bg-slate-900 border rounded-xl transition-all focus:outline-none ${
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
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Range: 0 – 50 days (Cohort baseline: ~3.7 days).
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => adjustAbsences(-2)}
                    className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                  >
                    -2d
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustAbsences(+2)}
                    className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                  >
                    +2d
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAbsencesText('0');
                      setAbsencesError(null);
                      setSimulatedInput((prev) => ({ ...prev, absences: 0 }));
                    }}
                    className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 cursor-pointer"
                  >
                    0d
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5. Past Failures - Discrete Selector */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-200">Past Class Failures</label>
              <span className="text-[11px] text-slate-400">
                Base: <span className="text-slate-300 font-semibold">{baselineInput.failures}</span>
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {failureOptions.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleFieldChange('failures', val)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                    simulatedInput.failures === val
                      ? 'bg-primary-600 text-white border-primary-500 shadow-sm font-semibold'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {val === 3 ? '3+ Failures' : `${val} Failures`}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Extra Support Toggle */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Extra School Support (schoolsup)
              </span>
              <span className="text-[11px] text-slate-500">
                Base: <span className="text-slate-300 font-semibold">{baselineInput.schoolsup === 'yes' ? 'Enrolled' : 'Not Enrolled'}</span>
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => handleFieldChange('schoolsup', 'no')}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
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
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                  simulatedInput.schoolsup === 'yes'
                    ? 'bg-primary-950 text-primary-300 border border-primary-800'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Yes
              </button>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-slate-800 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>Counterfactual simulation updates live without altering your baseline input.</span>
          <button
            type="button"
            onClick={() => onNavigate('explain')}
            className="inline-flex items-center space-x-1.5 text-primary-400 hover:text-primary-300 font-semibold cursor-pointer"
          >
            <span>See Factor Explanation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulatorPage;
