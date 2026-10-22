import React, { useState } from 'react';
import {
  History,
  Calendar,
  Award,
  ChevronRight,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Target,
  X,
  Copy,
  Check,
  Download,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { InterviewSession, getReadinessBadge } from '../utils/interview';
import { deleteStoredSession, clearAllSessions } from '../utils/storage';
import { exportSessionToPdf } from '../utils/pdfExport';

interface HistoryViewProps {
  sessions: InterviewSession[];
  onRefreshSessions: () => void;
  onStartNewMock: () => void;
  initialSessionModal?: InterviewSession | null;
  onCloseInitialModal?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  sessions,
  onRefreshSessions,
  onStartNewMock,
  initialSessionModal,
  onCloseInitialModal,
}) => {
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [activeSessionModal, setActiveSessionModal] = useState<InterviewSession | null>(
    initialSessionModal || null
  );
  const [copiedModal, setCopiedModal] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialSessionModal) {
      setActiveSessionModal(initialSessionModal);
    }
  }, [initialSessionModal]);

  const handleCloseModal = () => {
    setActiveSessionModal(null);
    if (onCloseInitialModal) onCloseInitialModal();
  };

  const handleExportPdf = (session: InterviewSession, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExportingId(session.id);
    setExportSuccessMsg(null);

    setTimeout(() => {
      const success = exportSessionToPdf(session);
      setExportingId(null);
      if (success) {
        setExportSuccessMsg(`Assessment report for ${session.role} downloaded as PDF.`);
        setTimeout(() => setExportSuccessMsg(null), 4000);
      }
    }, 150);
  };

  const filteredSessions = sessions.filter((s) => {
    if (selectedRoleFilter === 'All') return true;
    return s.role.toLowerCase().includes(selectedRoleFilter.toLowerCase());
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this interview session record?')) {
      deleteStoredSession(id);
      onRefreshSessions();
      if (activeSessionModal?.id === id) {
        setActiveSessionModal(null);
      }
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all interview history records? This cannot be undone.')) {
      clearAllSessions();
      onRefreshSessions();
      setActiveSessionModal(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Interview Records & Progress</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Question History & Progress Dashboard
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Track your scoring trajectory across interview sessions. Review past AI critiques and model answers anytime.
          </p>
        </div>

        {sessions.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center space-x-1 self-start sm:self-auto px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Export Success Toast / Notification */}
      {exportSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportSuccessMsg}</span>
          </div>
          <button
            onClick={() => setExportSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
        {['All', 'Software Developer', 'Java Developer', 'Web Developer', 'Data Analyst', 'Cybersecurity'].map((r) => (
          <button
            key={r}
            onClick={() => setSelectedRoleFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedRoleFilter === r
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800">No session history found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Complete a mock interview or practice question drill to populate your history log and monitor improvement.
          </p>
          <button
            onClick={onStartNewMock}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Start Practice Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const dateStr = new Date(session.startedAt).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const badge = getReadinessBadge(session.overallScore);
            const count = session.evaluations?.length || 0;

            return (
              <div
                key={session.id}
                onClick={() => setActiveSessionModal(session)}
                className="bg-white rounded-xl border border-slate-200/90 hover:border-blue-300 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-base text-slate-900">
                      {session.role}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold">
                      {session.interviewType}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                      {session.experienceLevel}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dateStr}</span>
                    </span>
                    <span>•</span>
                    <span>{count} Questions Completed</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  <div className="text-right">
                    <div className="flex items-baseline space-x-1 sm:justify-end">
                      <span className="text-2xl font-extrabold text-blue-600">
                        {session.overallScore}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">/ 10</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 block">
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => handleExportPdf(session, e)}
                      disabled={exportingId === session.id}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/70 text-slate-700 hover:text-blue-700 text-xs font-semibold transition-all shadow-2xs"
                      title="Download PDF report for this session"
                    >
                      {exportingId === session.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span className="hidden sm:inline">Export PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(session.id, e)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Session Details Modal */}
      {activeSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {activeSessionModal.interviewType} Round
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {activeSessionModal.role} Session
                </h3>
                <p className="text-xs text-slate-500">
                  {new Date(activeSessionModal.startedAt).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleExportPdf(activeSessionModal)}
                  disabled={exportingId === activeSessionModal.id}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  title="Download session assessment as PDF"
                >
                  {exportingId === activeSessionModal.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Export PDF</span>
                </button>

                <button
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Score & Summary */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block">
                  Overall Score
                </span>
                <span className="text-2xl font-extrabold text-white">
                  {activeSessionModal.overallScore} / 10
                </span>
              </div>
              <div className="text-xs font-bold px-3 py-1 rounded-full bg-blue-600/40 text-blue-200 border border-blue-400/30">
                {getReadinessBadge(activeSessionModal.overallScore).label}
              </div>
            </div>

            {/* Questions Evaluated */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Evaluated Questions ({activeSessionModal.evaluations?.length || 0})
              </span>

              {activeSessionModal.evaluations?.map((ev, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Q{i + 1}</span>
                    <span className="font-extrabold text-blue-600">{ev.score}/10</span>
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">"{ev.question}"</p>
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="font-bold text-slate-700 block">Candidate's Answer:</span>
                    <p className="text-slate-600 italic">"{ev.userAnswer}"</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="font-bold text-slate-700 block">Feedback:</span>
                    <p className="text-slate-700 leading-relaxed">{ev.explanation}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                    <span className="font-bold text-blue-900 block">Model Example Answer:</span>
                    <p className="text-blue-950 font-sans">{ev.strongerExampleAnswer}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleExportPdf(activeSessionModal)}
                disabled={exportingId === activeSessionModal.id}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                {exportingId === activeSessionModal.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Download Assessment PDF</span>
              </button>

              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
