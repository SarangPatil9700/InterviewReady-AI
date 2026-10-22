import React, { useState } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  PlayCircle,
  Users2,
  Code2,
  FileText,
  History,
  Flame,
  Menu,
  X,
  Target,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'mock-interview' | 'hr-practice' | 'tech-practice' | 'star-guide' | 'history';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onStartNewInterview: () => void;
  streak: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onStartNewInterview,
  streak,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'mock-interview' as NavTab, label: 'Mock Interview', icon: PlayCircle },
    { id: 'hr-practice' as NavTab, label: 'HR Practice', icon: Users2 },
    { id: 'tech-practice' as NavTab, label: 'Tech Practice', icon: Code2 },
    { id: 'star-guide' as NavTab, label: 'STAR Guide', icon: FileText },
    { id: 'history' as NavTab, label: 'History', icon: History },
  ];

  const handleTabClick = (tab: NavTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Zone 1: Wordmark */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer shrink-0 group select-none"
            onClick={() => handleTabClick('dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-600 transition-colors">
              <Target className="w-4 h-4 text-blue-400 group-hover:text-white transition-colors" />
            </div>
            <div className="flex items-baseline space-x-1.5 whitespace-nowrap">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                Interview<span className="text-blue-600">Ready</span>
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                AI
              </span>
            </div>
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action + streak */}
          <div className="hidden sm:flex items-center space-x-3 shrink-0">
            <div
              className="flex items-center space-x-1 px-2.5 py-1 text-slate-600 text-xs font-medium"
              title="Daily Practice Streak"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="font-semibold text-slate-800 tabular-nums">{streak}</span>
              <span className="text-slate-500">{streak === 1 ? 'day' : 'days'}</span>
            </div>

            <button
              onClick={onStartNewInterview}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold tracking-tight shadow-xs transition-all whitespace-nowrap hover:shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start Mock Interview</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center space-x-2">
            <div className="flex items-center space-x-1 px-2 py-0.5 text-slate-700 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="tabular-nums">{streak}d</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-left transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onStartNewInterview();
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Mock Interview</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
