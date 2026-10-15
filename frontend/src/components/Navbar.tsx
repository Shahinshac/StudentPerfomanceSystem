import React from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  Calculator,
  GitCompare,
  Database,
  Activity,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendHealthy: boolean | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isBackendHealthy,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'predict', label: 'Predict & Simulator', icon: Calculator },
    { id: 'evaluation', label: 'Model Evaluation', icon: GitCompare },
    { id: 'insights', label: 'Dataset Insights', icon: Database },
  ];

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Project Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 text-white p-2.5 rounded-xl shadow-md ring-1 ring-primary-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                Academic Performance System
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                UCI Benchmark (0–60 Scale) • What-If Simulator • Explainable AI
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex space-x-1 sm:space-x-2 items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-950/80 text-primary-300 border border-primary-800/80 font-semibold shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-400' : 'text-slate-400'}`} />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Backend Health Badge */}
          <div className="flex items-center space-x-2 pl-3 border-l border-slate-800 my-auto h-8">
            <Activity className="w-4 h-4 text-slate-400" />
            <div className="flex items-center space-x-1.5 text-xs font-medium">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isBackendHealthy === true
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse'
                    : isBackendHealthy === false
                    ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-300 hidden sm:inline">
                {isBackendHealthy === true
                  ? 'API Online'
                  : isBackendHealthy === false
                  ? 'API Offline'
                  : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
