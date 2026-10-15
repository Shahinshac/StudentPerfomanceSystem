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

  // Sync simulated input whenever baseline changes
  useEffect(() => {
    setSimulatedInput({ ...baselineInput });
  }, [baselineInput]);

  // Run simulation whenever simulatedInput changes
  useEffect(() => {
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
  }, [simulatedInput, baselineInput]);

  const handleSliderChange = (field: keyof AcademicInput, val: number | string) => {
    setSimulatedInput((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleReset = () => {
    setSimulatedInput({ ...baselineInput });
  };

  const delta = simulationResult?.delta_marks ?? 0;
  const direction = simulationResult?.direction ?? 'UNCHANGED';

  const studytimeLabels: Record<number, string> = {
    1: '< 2 hrs/wk',
    2: '2–5 hrs/wk',
    3: '5–10 hrs/wk',
    4: '> 10 hrs/wk',
  };

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
            Explore how adjusting attendance, study habits, or term marks directly changes your projected final score (0–60 scale).
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

      {/* Interactive Controls Grid */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">
            Adjust Parameters for Simulation
          </h3>
          <span className="text-xs text-slate-400">Drag sliders to test academic adjustments</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. G2 Marks */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Second-Period Marks (G2)</span>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500">
                  Base: {baselineInput.G2_scaled.toFixed(1)}
                </span>
                <span className="font-mono text-primary-400 font-bold text-sm">
                  {simulatedInput.G2_scaled.toFixed(1)} / 60
                </span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="0.5"
              value={simulatedInput.G2_scaled}
              onChange={(e) => handleSliderChange('G2_scaled', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 Marks</span>
              <span>Pass: 30</span>
              <span>Credit: 48</span>
              <span>60 Marks</span>
            </div>
          </div>

          {/* 2. G1 Marks */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">First-Period Marks (G1)</span>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500">
                  Base: {baselineInput.G1_scaled.toFixed(1)}
                </span>
                <span className="font-mono text-primary-400 font-bold text-sm">
                  {simulatedInput.G1_scaled.toFixed(1)} / 60
                </span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="0.5"
              value={simulatedInput.G1_scaled}
              onChange={(e) => handleSliderChange('G1_scaled', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 Marks</span>
              <span>Pass: 30</span>
              <span>Credit: 48</span>
              <span>60 Marks</span>
            </div>
          </div>

          {/* 3. Study Time */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Weekly Study Commitment</span>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500">
                  Base: {studytimeLabels[baselineInput.studytime]}
                </span>
                <span className="font-mono text-primary-400 font-bold text-xs">
                  {studytimeLabels[simulatedInput.studytime]}
                </span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="4"
              step="1"
              value={simulatedInput.studytime}
              onChange={(e) => handleSliderChange('studytime', parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>&lt; 2 hrs</span>
              <span>2–5 hrs</span>
              <span>5–10 hrs</span>
              <span>&gt; 10 hrs</span>
            </div>
          </div>

          {/* 4. Absences */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">School Absences</span>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500">
                  Base: {baselineInput.absences} days
                </span>
                <span className="font-mono text-primary-400 font-bold text-xs">
                  {simulatedInput.absences} days
                </span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="32"
              step="1"
              value={simulatedInput.absences}
              onChange={(e) => handleSliderChange('absences', parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 days (Perfect)</span>
              <span>Cohort Avg: 4 days</span>
              <span>32 days (High Drag)</span>
            </div>
          </div>

          {/* 5. Past Failures */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Past Class Failures</span>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500">Base: {baselineInput.failures}</span>
                <span className="font-mono text-primary-400 font-bold text-xs">
                  {simulatedInput.failures} {simulatedInput.failures === 1 ? 'failure' : 'failures'}
                </span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={simulatedInput.failures}
              onChange={(e) => handleSliderChange('failures', parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 failures</span>
              <span>1 failure</span>
              <span>2 failures</span>
              <span>3+ failures</span>
            </div>
          </div>

          {/* 6. Extra Support Toggle */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Extra School Support (schoolsup)
              </span>
              <span className="text-[11px] text-slate-500">
                Base: {baselineInput.schoolsup === 'yes' ? 'Enrolled' : 'Not Enrolled'}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => handleSliderChange('schoolsup', 'no')}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                  simulatedInput.schoolsup === 'no'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => handleSliderChange('schoolsup', 'yes')}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
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
            className="inline-flex items-center space-x-1.5 text-primary-400 hover:text-primary-300 font-semibold"
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
