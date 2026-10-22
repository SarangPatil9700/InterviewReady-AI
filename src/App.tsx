import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { MockInterviewView } from './components/MockInterviewView';
import { HrPracticeView } from './components/HrPracticeView';
import { TechnicalPracticeView } from './components/TechnicalPracticeView';
import { StarGuideView } from './components/StarGuideView';
import { HistoryView } from './components/HistoryView';
import {
  getStoredSessions,
  getUserStats,
  seedSampleSessionsIfEmpty,
  UserStats,
} from './utils/storage';
import { InterviewSession } from './utils/interview';
import { DailyChallengeData } from './utils/api';
import { Target, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [stats, setStats] = useState<UserStats>({
    totalSessions: 0,
    totalQuestionsAnswered: 0,
    averageScore: 0,
    highestScore: 0,
    streakDays: 1,
  });
  const [sessions, setSessions] = useState<InterviewSession[]>([]);

  // Active mock interview configuration trigger
  const [mockRoleId, setMockRoleId] = useState<string>('software-developer');
  const [mockPresetQuestion, setMockPresetQuestion] = useState<
    { question: string; role: string; context: string } | undefined
  >(undefined);
  const [mockSessionCounter, setMockSessionCounter] = useState(0);

  // History detail modal navigation
  const [selectedHistorySession, setSelectedHistorySession] = useState<InterviewSession | null>(null);

  // Initialize and load storage data
  const refreshStorage = () => {
    seedSampleSessionsIfEmpty();
    const loadedSessions = getStoredSessions();
    const loadedStats = getUserStats();
    setSessions(loadedSessions);
    setStats(loadedStats);
  };

  useEffect(() => {
    refreshStorage();
  }, []);

  // Handlers for starting interviews from various cards
  const handleStartRoleInterview = (roleId: string) => {
    setMockRoleId(roleId);
    setMockPresetQuestion(undefined);
    setMockSessionCounter((prev) => prev + 1);
    setActiveTab('mock-interview');
  };

  const handleOpenMockConfig = () => {
    setMockRoleId('software-developer');
    setMockPresetQuestion(undefined);
    setMockSessionCounter((prev) => prev + 1);
    setActiveTab('mock-interview');
  };

  const handleStartDailyPractice = (challenge: DailyChallengeData) => {
    setMockRoleId(challenge.roleId);
    setMockPresetQuestion({
      question: challenge.question,
      role: challenge.role,
      context: challenge.context,
    });
    setMockSessionCounter((prev) => prev + 1);
    setActiveTab('mock-interview');
  };

  const handleViewSessionDetails = (session: InterviewSession) => {
    setSelectedHistorySession(session);
    setActiveTab('history');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          refreshStorage();
        }}
        onStartNewInterview={handleOpenMockConfig}
        streak={stats.streakDays}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            recentSessions={sessions}
            onStartRoleInterview={handleStartRoleInterview}
            onOpenMockConfig={handleOpenMockConfig}
            onViewSessionDetails={handleViewSessionDetails}
            onNavigateToTab={(tab) => {
              setActiveTab(tab);
              refreshStorage();
            }}
            onStartDailyPractice={handleStartDailyPractice}
          />
        )}

        {activeTab === 'mock-interview' && (
          <MockInterviewView
            key={`mock-session-${mockSessionCounter}-${mockRoleId}`}
            initialRoleId={mockRoleId}
            presetQuestion={mockPresetQuestion}
            onExit={() => {
              setActiveTab('dashboard');
              refreshStorage();
            }}
            onViewHistory={() => {
              setActiveTab('history');
              refreshStorage();
            }}
          />
        )}

        {activeTab === 'hr-practice' && <HrPracticeView />}

        {activeTab === 'tech-practice' && <TechnicalPracticeView />}

        {activeTab === 'star-guide' && <StarGuideView />}

        {activeTab === 'history' && (
          <HistoryView
            sessions={sessions}
            onRefreshSessions={refreshStorage}
            onStartNewMock={handleOpenMockConfig}
            initialSessionModal={selectedHistorySession}
            onCloseInitialModal={() => setSelectedHistorySession(null)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <Target className="w-3 h-3" />
            </div>
            <span className="font-semibold text-slate-800">
              InterviewReady AI
            </span>
            <span>— Personalized AI Interview Coach for Tech Placements</span>
          </div>

          <div className="flex items-center space-x-4 text-slate-500">
            <span>Powered by Google Gemini 3.8 Flash</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <span>Made with care for Indian College Freshers</span>
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
