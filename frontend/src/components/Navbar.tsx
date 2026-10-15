import React from 'react';
import {
  GraduationCap,
  Sparkles,
  Sliders,
  Lightbulb,
  Info,
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
    { id: 'predict', label: 'Predict Performance', icon: Sparkles },
    { id: 'simulator', label: 'What-If Simulator', icon: Sliders },
    { id: 'explain', label: 'Explain Prediction', icon: Lightbulb },
    { id: 'about', label: 'About Model', icon: Info },
  ];

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo & Title */}
          <div
            onClick={() => setActiveTab('predict')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="bg-primary-600 text-white p-2 rounded-xl shadow-md ring-1 ring-primary-500/30 group-hover:bg-primary-500 transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
                Student Performance AI
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                0–60 Marks Scale • UCI Benchmark
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex space-x-1 sm:space-x-1.5 items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Backend Health Status Dot */}
          <div className="flex items-center space-x-2 pl-2 sm:pl-3 border-l border-slate-800">
            <div className="flex items-center space-x-1.5 text-xs font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendHealthy === true
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-pulse'
                    : isBackendHealthy === false
                    ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-400 text-[11px] hidden md:inline">
                {isBackendHealthy === true
                  ? 'Online'
                  : isBackendHealthy === false
                  ? 'Offline'
                  : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
