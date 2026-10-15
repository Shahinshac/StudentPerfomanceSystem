import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PredictionPage } from './pages/PredictionPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { ExplainPage } from './pages/ExplainPage';
import { AboutModelPage } from './pages/AboutModelPage';
import {
  checkBackendHealth,
  fetchModelMetrics,
  fetchDatasetSummary,
  evaluateStudent,
  API_BASE_URL,
} from './services/api';
import type {
  AcademicInput,
  EvaluationStudentResponse,
  ModelComparisonData,
  DatasetSummaryData,
} from './types';
import { AlertCircle, RotateCcw } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation tabs: 'predict' (default landing), 'simulator', 'explain', 'about'
  const [activeTab, setActiveTab] = useState<string>('predict');
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  // Shared student parameters and prediction results across tabs
  const [formData, setFormData] = useState<AcademicInput>({
    G1_scaled: 36.0,
    G2_scaled: 39.0,
    studytime: 2,
    failures: 0,
    absences: 4,
    schoolsup: 'no',
  });
  const [predictionResult, setPredictionResult] =
    useState<EvaluationStudentResponse | null>(null);

  // Secondary technical model & dataset metadata
  const [metrics, setMetrics] = useState<ModelComparisonData | null>(null);
  const [summary, setSummary] = useState<DatasetSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const health = await checkBackendHealth();
      setIsBackendHealthy(health.status === 'healthy');

      // Pre-evaluate default student so all tabs have initial baseline data
      try {
        const initialEval = await evaluateStudent(formData);
        setPredictionResult(initialEval);
      } catch (evalErr) {
        console.warn('Initial student evaluation note:', evalErr);
      }

      const [metricsData, summaryData] = await Promise.all([
        fetchModelMetrics().catch(() => null),
        fetchDatasetSummary().catch(() => null),
      ]);

      if (metricsData) setMetrics(metricsData);
      if (summaryData) setSummary(summaryData);
    } catch (err: any) {
      console.warn('Backend connection note:', err.message);
      setIsBackendHealthy(false);
      setErrorMessage(
        err.message || `Backend service is unreachable at ${API_BASE_URL}.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-primary-600 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendHealthy={isBackendHealthy}
      />

      {/* Offline Warning Banner */}
      {isBackendHealthy === false && (
        <div className="bg-amber-950/80 border-b border-amber-800 text-amber-200 px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2 max-w-6xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>
              Backend API is currently unreachable at{' '}
              <code className="bg-slate-900 px-1.5 py-0.5 rounded font-mono font-bold text-amber-300 border border-amber-800/60">
                {API_BASE_URL}
              </code>
              {errorMessage && ` (${errorMessage})`}.
            </span>
            <button
              onClick={loadData}
              className="ml-auto inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-100 text-[11px] font-semibold border border-amber-700 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content View Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'predict' && (
          <PredictionPage
            formData={formData}
            setFormData={setFormData}
            result={predictionResult}
            setResult={setPredictionResult}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'simulator' && (
          <SimulatorPage
            baselineInput={formData}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'explain' && (
          <ExplainPage
            studentInput={formData}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'about' && (
          <AboutModelPage
            metrics={metrics}
            summary={summary}
            loading={loading}
          />
        )}
      </main>

      {/* Modern Minimal Academic Footer */}
      <footer className="bg-slate-900/90 border-t border-slate-800/80 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-200">
              Student Performance AI
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">UCI Portuguese Dataset (N = 649)</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-500">
            <span>0.0 – 60.0 Exam Scale</span>
            <span className="text-slate-600">•</span>
            <span>FastAPI + scikit-learn + React</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
