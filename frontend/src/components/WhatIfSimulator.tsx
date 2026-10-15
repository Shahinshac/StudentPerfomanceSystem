import React, { useState, useEffect } from 'react';
import {
  Sliders,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ArrowRight,
  Info,
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

  // Sync simulated input when baselineInput prop changes
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
                  Interactive (0–60 Scale)
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
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
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

      {/* Simulator Grid: Sliders on Left, Delta Comparison on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-3.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Simulate Parameter Adjustments</span>
            <span className="text-[11px] text-primary-400 font-normal">Real-Time ML Pipeline</span>
          </div>

          {/* 1. G1_scaled */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">First-Period Marks (G1)</span>
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 line-through text-[11px]">
                  {baselineInput.G1_scaled.toFixed(0)}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="font-mono font-bold text-primary-400">
                  {simulatedInput.G1_scaled.toFixed(0)} / 60 Marks
                </span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={simulatedInput.G1_scaled}
              onChange={(e) => handleSliderChange('G1_scaled', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
          </div>

          {/* 2. G2_scaled */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Second-Period Marks (G2)</span>
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 line-through text-[11px]">
                  {baselineInput.G2_scaled.toFixed(0)}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="font-mono font-bold text-primary-400">
                  {simulatedInput.G2_scaled.toFixed(0)} / 60 Marks
                </span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={simulatedInput.G2_scaled}
              onChange={(e) => handleSliderChange('G2_scaled', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
          </div>

          {/* 3. Study Time */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Weekly Study Time</span>
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 line-through text-[11px]">
                  {studytimeLabels[baselineInput.studytime] || baselineInput.studytime}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="font-mono font-bold text-primary-400">
                  {studytimeLabels[simulatedInput.studytime] || simulatedInput.studytime}
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
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
          </div>

          {/* 4. Past Failures */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Past Class Failures</span>
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 line-through text-[11px]">
                  {baselineInput.failures}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="font-mono font-bold text-primary-400">
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
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
          </div>

          {/* 5. Absences */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">School Absences</span>
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 line-through text-[11px]">
                  {baselineInput.absences}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="font-mono font-bold text-primary-400">
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
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
          </div>

          {/* 6. Extra Educational Support Toggle */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Extra Educational School Support (schoolsup)
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => handleSliderChange('schoolsup', 'no')}
                className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
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
                className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
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
