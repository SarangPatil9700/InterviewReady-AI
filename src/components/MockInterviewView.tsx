import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Mic,
  MicOff,
  Copy,
  Check,
  Award,
  BookOpen,
  Send,
  Loader2,
  FileText,
  TrendingUp,
  Target,
  Clock,
  Compass,
  Download,
} from 'lucide-react';
import {
  TARGET_ROLES,
  QuestionItem,
  AnswerEvaluation,
  InterviewSession,
  SessionFinalReport,
  validateAnswer,
  getReadinessBadge,
  calculateOverallScore,
  calculateCategoryAverages,
} from '../utils/interview';
import {
  generateQuestions,
  evaluateAnswer,
  generateFinalReport,
} from '../utils/api';
import { saveSession, markDailyChallengeCompleted } from '../utils/storage';
import { exportSessionToPdf } from '../utils/pdfExport';
import { VoiceAnswerInput } from './VoiceAnswerInput';


interface MockInterviewViewProps {
  initialRoleId?: string;
  onExit: () => void;
  onViewHistory: () => void;
  presetQuestion?: {
    question: string;
    role: string;
    context: string;
  };
}

type InterviewStep = 'setup' | 'in-progress' | 'evaluated' | 'final-report';

export const MockInterviewView: React.FC<MockInterviewViewProps> = ({
  initialRoleId,
  onExit,
  onViewHistory,
  presetQuestion,
}) => {
  // Configuration State
  const [selectedRole, setSelectedRole] = useState(initialRoleId || 'software-developer');
  const [experienceLevel, setExperienceLevel] = useState<'Fresher' | 'Experienced'>('Fresher');
  const [interviewType, setInterviewType] = useState<'Mixed' | 'Technical' | 'HR'>('Mixed');
  const [questionCount, setQuestionCount] = useState<5 | 10>(5);

  // Flow State
  const [currentStep, setCurrentStep] = useState<InterviewStep>('setup');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Session Data
  const [sessionQuestions, setSessionQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluations, setEvaluations] = useState<AnswerEvaluation[]>([]);
  const [currentEvaluation, setCurrentEvaluation] = useState<AnswerEvaluation | null>(null);
  const [finalReport, setFinalReport] = useState<SessionFinalReport | null>(null);
  const [sessionId, setSessionId] = useState('');

  // UI Helpers
  const [showStarGuide, setShowStarGuide] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [expandedReviewIndex, setExpandedReviewIndex] = useState<number | null>(0);
  // Initialize preset question if opened from Daily Challenge
  useEffect(() => {
    if (presetQuestion) {
      const q: QuestionItem = {
        id: `daily-${Date.now()}`,
        question: presetQuestion.question,
        category: 'technical',
        contextTip: presetQuestion.context,
      };
      setSessionQuestions([q]);
      setSessionId(`session-${Date.now()}`);
      setCurrentStep('in-progress');
      setCurrentIndex(0);
      setUserAnswer('');
    }
  }, [presetQuestion]);

  // Start interview session
  const handleStartInterview = async () => {
    setErrorMsg(null);
    setLoadingQuestions(true);

    try {
      const roleObj = TARGET_ROLES.find((r) => r.id === selectedRole) || TARGET_ROLES[0];
      const res = await generateQuestions({
        role: roleObj.name,
        experienceLevel,
        interviewType,
        count: questionCount,
      });

      if (!res.questions || res.questions.length === 0) {
        throw new Error('No questions received. Please retry.');
      }

      const newId = `session-${Date.now()}`;
      setSessionId(newId);
      setSessionQuestions(res.questions);
      setCurrentIndex(0);
      setUserAnswer('');
      setEvaluations([]);
      setCurrentEvaluation(null);
      setCurrentStep('in-progress');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Unable to generate interview questions. Please try again.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Submit answer for evaluation
  const handleSubmitAnswer = async () => {
    setErrorMsg(null);
    const validation = validateAnswer(userAnswer, 5);
    if (!validation.isValid) {
      setErrorMsg(validation.error || 'Please enter an answer before submitting.');
      return;
    }

    setSubmittingAnswer(true);
    const currentQ = sessionQuestions[currentIndex];
    const roleObj = TARGET_ROLES.find((r) => r.id === selectedRole) || TARGET_ROLES[0];

    try {
      const res = await evaluateAnswer({
        role: roleObj.name,
        experienceLevel,
        interviewType,
        question: currentQ.question,
        answer: userAnswer,
        category: currentQ.category,
      });

      const evalData: AnswerEvaluation = {
        ...res.evaluation,
        questionId: currentQ.id,
        question: currentQ.question,
        userAnswer: userAnswer.trim(),
      };

      setCurrentEvaluation(evalData);
      setEvaluations((prev) => [...prev, evalData]);
      setCurrentStep('evaluated');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Evaluation failed. Please check connection and retry.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Move to next question or trigger final report
  const handleProceed = async () => {
    if (currentIndex < sessionQuestions.length - 1) {
      // Next question
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer('');
      setCurrentEvaluation(null);
      setCurrentStep('in-progress');
    } else {
      // Generate final report
      await handleGenerateFinalReport();
    }
  };

  // Generate and save final report
  const handleGenerateFinalReport = async () => {
    setGeneratingReport(true);
    setErrorMsg(null);

    const roleObj = TARGET_ROLES.find((r) => r.id === selectedRole) || TARGET_ROLES[0];
    const allEvals = evaluations.length > 0
      ? evaluations
      : (currentEvaluation ? [currentEvaluation] : []);

    try {
      const report = await generateFinalReport({
        role: roleObj.name,
        experienceLevel,
        evaluations: allEvals,
      });

      setFinalReport(report);

      // Save complete session to storage
      const sessionObj: InterviewSession = {
        id: sessionId || `session-${Date.now()}`,
        role: roleObj.name,
        experienceLevel,
        interviewType,
        questionCount: sessionQuestions.length,
        questions: sessionQuestions,
        evaluations: allEvals,
        overallScore: report.overallScore,
        startedAt: new Date(Date.now() - 900000).toISOString(),
        completedAt: new Date().toISOString(),
        finalReport: report,
      };

      saveSession(sessionObj);
      if (presetQuestion) {
        markDailyChallengeCompleted();
      }
      setCurrentStep('final-report');
    } catch (err: any) {
      console.error(err);
      // Fallback local report calculation if network issue
      const scores = allEvals.map((e) => e.score);
      const overall = calculateOverallScore(scores);
      const readiness = getReadinessBadge(overall);
      const critAverages = calculateCategoryAverages(allEvals.map((e) => e.criteriaScores));

      const fallbackReport: SessionFinalReport = {
        overallScore: overall,
        readinessLevel: readiness.label,
        summary: `Completed ${allEvals.length} interview questions for ${roleObj.name}. Score: ${overall}/10. Keep refining structured examples.`,
        topStrengths: [
          'Solid direct understanding of core interview prompts.',
          'Confident technical phrasing and terminology.',
          'Maintained professional focus throughout.',
        ],
        priorityImprovements: [
          'Practice structuring answers with the STAR method for behavioral questions.',
          'Include measurable results (e.g. percentages, team sizes, latencies).',
        ],
        criteriaAverages: critAverages,
        recommendedRoadmap: [
          'Review questions where score was under 7.0/10.',
          'Re-read model answers to study the ideal concise structure.',
          'Practice one mock session daily to build fluency.',
        ],
      };

      setFinalReport(fallbackReport);

      const sessionObj: InterviewSession = {
        id: sessionId || `session-${Date.now()}`,
        role: roleObj.name,
        experienceLevel,
        interviewType,
        questionCount: sessionQuestions.length,
        questions: sessionQuestions,
        evaluations: allEvals,
        overallScore: overall,
        startedAt: new Date(Date.now() - 900000).toISOString(),
        completedAt: new Date().toISOString(),
        finalReport: fallbackReport,
      };

      saveSession(sessionObj);
      if (presetQuestion) {
        markDailyChallengeCompleted();
      }
      setCurrentStep('final-report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const copyToClipboard = (text: string, isReport = false) => {
    navigator.clipboard.writeText(text);
    if (isReport) {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    } else {
      setCopiedAnswer(true);
      setTimeout(() => setCopiedAnswer(false), 2000);
    }
  };

  // --------------------------------------------------------------------------
  // STEP 1: SETUP VIEW
  // --------------------------------------------------------------------------
  if (currentStep === 'setup') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-16">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <button
            onClick={onExit}
            className="hover:text-slate-800 flex items-center space-x-1 font-semibold"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <span>/</span>
          <span className="text-slate-800 font-bold">New Mock Interview Session</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-8">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Interactive AI Simulation Setup</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Configure Your Mock Interview
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Select your role, experience level, and round format. Gemini AI will generate targeted questions and evaluate your responses against placement benchmarks.
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">
                <span className="font-bold block text-red-900">Setup Notice</span>
                <span className="text-xs text-red-700 mt-0.5">{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-3">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              1. Target Job Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TARGET_ROLES.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex items-start justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900">{role.name}</div>
                      <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        {role.defaultTopics.join(' · ')}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Experience Level & Question Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Experience Level */}
            <div className="space-y-3">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                2. Experience Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExperienceLevel('Fresher')}
                  className={`py-3 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    experienceLevel === 'Fresher'
                      ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Fresher (0-1 yrs)
                  <span className="block text-[10px] font-normal opacity-85 mt-0.5">Campus drives</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExperienceLevel('Experienced')}
                  className={`py-3 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    experienceLevel === 'Experienced'
                      ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Experienced (1-3+ yrs)
                  <span className="block text-[10px] font-normal opacity-85 mt-0.5">Deep concepts</span>
                </button>
              </div>
            </div>

            {/* Question Count */}
            <div className="space-y-3">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                3. Number of Questions
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQuestionCount(5)}
                  className={`py-3 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    questionCount === 5
                      ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  5 Questions (Quick)
                  <span className="block text-[10px] font-normal opacity-85 mt-0.5">~10-15 mins</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionCount(10)}
                  className={`py-3 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    questionCount === 10
                      ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  10 Questions (Full)
                  <span className="block text-[10px] font-normal opacity-85 mt-0.5">~25-30 mins</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interview Type */}
          <div className="space-y-3">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              4. Round Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  id: 'Mixed' as const,
                  label: 'Mixed Round',
                  desc: 'Tech + HR Combined',
                },
                {
                  id: 'Technical' as const,
                  label: 'Technical Only',
                  desc: 'OOP, DSA & Architecture',
                },
                {
                  id: 'HR' as const,
                  label: 'HR Only',
                  desc: 'Behavioral & STAR Method',
                },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setInterviewType(t.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    interviewType === t.id
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-600/10'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">{t.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Start CTA */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>One question at a time · Instant objective AI evaluation</span>
            </div>

            <button
              type="button"
              onClick={handleStartInterview}
              disabled={loadingQuestions}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50"
            >
              {loadingQuestions ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Curating Assessment Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Begin Mock Interview ({questionCount} Questions)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STEP 2: IN-PROGRESS QUESTION VIEW
  // --------------------------------------------------------------------------
  if (currentStep === 'in-progress') {
    const currentQ = sessionQuestions[currentIndex];
    const progressPercent = Math.round(((currentIndex + 1) / sessionQuestions.length) * 100);
    const wordCount = userAnswer.trim() ? userAnswer.trim().split(/\s+/).filter(Boolean).length : 0;

    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-16">
        {/* Progress Bar & Header */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 tabular-nums">
                Question {currentIndex + 1} of {sessionQuestions.length}
              </span>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-slate-600 uppercase text-[10px] tracking-wider">
                {currentQ.category}
              </span>
            </div>

            <button
              onClick={() => {
                if (confirm('Exit mock interview? Unfinished progress will be lost.')) {
                  onExit();
                }
              }}
              className="text-xs text-slate-400 hover:text-slate-700 font-medium transition-colors"
            >
              Exit Interview
            </button>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-5">
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Interviewer Prompt:
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              {currentQ.question}
            </h3>
          </div>

          {/* Context Tip Toggle */}
          {currentQ.contextTip && (
            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3.5">
              <button
                type="button"
                onClick={() => setShowTips(!showTips)}
                className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800"
              >
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Coach's Thought Structure</span>
                </div>
                {showTips ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showTips && (
                <div className="mt-2 text-xs text-slate-700 leading-relaxed pl-5">
                  <p>{currentQ.contextTip}</p>
                  {currentQ.expectedKeyPoints && currentQ.expectedKeyPoints.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60">
                      <span className="font-semibold text-slate-900 block mb-1">Key concepts to touch upon:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                        {currentQ.expectedKeyPoints.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STAR Framework Helper Pill for behavioral questions */}
          {currentQ.category !== 'technical' && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-slate-500" />
                <span>
                  Tip: Structure with <span className="font-bold text-slate-900">STAR</span> (Situation, Task, Action, Result)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowStarGuide(!showStarGuide)}
                className="text-blue-600 font-bold hover:underline"
              >
                {showStarGuide ? 'Hide Guide' : 'Show STAR Helper'}
              </button>
            </div>
          )}

          {showStarGuide && (
            <div className="p-4 rounded-xl bg-slate-900 text-white text-xs space-y-2">
              <div className="font-bold text-blue-400">STAR Framework Quick Template:</div>
              <p><strong className="text-white">Situation:</strong> Set the context of your academic project or team assignment.</p>
              <p><strong className="text-white">Task:</strong> What was the specific problem or goal assigned to you?</p>
              <p><strong className="text-white">Action:</strong> What technical steps or decisions did YOU take to address it?</p>
              <p><strong className="text-white">Result:</strong> What was the measurable impact or takeaway? (e.g. reduced load time, finished before deadline).</p>
            </div>
          )}

          {/* Answer Input Area with Robust Speech Recognition */}
          <VoiceAnswerInput
            id="user-answer"
            value={userAnswer}
            onChange={setUserAnswer}
            rows={6}
            label="Your Answer:"
            minWordsTarget={15}
            disabled={submittingAnswer}
            placeholder="Type your response here or click the microphone to speak your answer aloud. Be clear, specific, and structured..."
          />

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <div>
                  <span className="font-bold block text-red-900">Evaluation Notice</span>
                  <span>{errorMsg}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={submittingAnswer}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs transition-colors self-start sm:self-auto shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Evaluation</span>
              </button>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={submittingAnswer || !userAnswer.trim()}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingAnswer ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating Answer with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Answer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STEP 3: INSTANT EVALUATION VIEW
  // --------------------------------------------------------------------------
  if (currentStep === 'evaluated' && currentEvaluation) {
    const isLastQuestion = currentIndex >= sessionQuestions.length - 1;
    const scoreBadge = getReadinessBadge(currentEvaluation.score);

    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-16">
        {/* Score Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Question {currentIndex + 1} of {sessionQuestions.length} Feedback
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                "{currentEvaluation.question}"
              </h3>
            </div>

            <div className="shrink-0 flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              <div className="text-right">
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold text-blue-600 tabular-nums">
                    {currentEvaluation.score}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">/ 10</span>
                </div>
                <span className="text-[11px] font-bold text-slate-600">
                  {scoreBadge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Coach Assessment:
            </h4>
            <p className="text-sm text-slate-800 leading-relaxed">
              {currentEvaluation.explanation}
            </p>
          </div>

          {/* Sub-criteria Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
            {[
              { label: 'Relevance', val: currentEvaluation.criteriaScores.relevance },
              { label: 'Correctness', val: currentEvaluation.criteriaScores.correctness },
              { label: 'Clarity', val: currentEvaluation.criteriaScores.clarity },
              { label: 'Completeness', val: currentEvaluation.criteriaScores.completeness },
              { label: 'Communication', val: currentEvaluation.criteriaScores.communication },
            ].map((crit) => (
              <div key={crit.label} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {crit.label}
                </span>
                <span className="text-base font-extrabold text-slate-900 mt-0.5 block tabular-nums">
                  {crit.val}/10
                </span>
              </div>
            ))}
          </div>

          {/* What went well & Areas for improvement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/70 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>What You Did Well</span>
              </div>
              <ul className="space-y-1.5 text-xs text-emerald-950">
                {currentEvaluation.whatUserDidWell.map((pt, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-emerald-500 font-bold mt-0.5">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Areas For Improvement</span>
              </div>
              <ul className="space-y-1.5 text-xs text-amber-950">
                {currentEvaluation.areasForImprovement.map((pt, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-amber-500 font-bold mt-0.5">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Model Answer */}
          <div className="p-5 rounded-xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Stronger Model Answer (Study Reference)
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(currentEvaluation.strongerExampleAnswer)}
                className="text-xs text-slate-300 hover:text-white flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors font-medium"
              >
                {copiedAnswer ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAnswer ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              "{currentEvaluation.strongerExampleAnswer}"
            </p>
          </div>

          {/* Actionable Tip */}
          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-blue-900 text-xs flex items-start space-x-2.5">
            <Target className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Actionable Tip for Next Attempt: </span>
              <span>{currentEvaluation.actionableTip}</span>
            </div>
          </div>

          {/* Continue / Finish Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setUserAnswer(currentEvaluation.userAnswer);
                setCurrentStep('in-progress');
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry This Question</span>
            </button>

            <button
              type="button"
              onClick={handleProceed}
              disabled={generatingReport}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all"
            >
              {generatingReport ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Final Report...</span>
                </>
              ) : (
                <>
                  <span>{isLastQuestion ? 'Complete Interview & View Report' : 'Next Question'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STEP 4: FINAL INTERVIEW REPORT VIEW
  // --------------------------------------------------------------------------
  if (currentStep === 'final-report' && finalReport) {
    const roleObj = TARGET_ROLES.find((r) => r.id === selectedRole) || TARGET_ROLES[0];
    const readiness = getReadinessBadge(finalReport.overallScore);

    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        {/* Top Report Header Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                <Award className="w-4 h-4 text-blue-400" />
                <span>Interview Performance Assessment</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {roleObj.name} Mock Interview Report
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {finalReport.summary}
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-5 text-center min-w-[200px] shrink-0">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                Overall Average
              </span>
              <div className="flex items-baseline justify-center space-x-1 my-1">
                <span className="text-4xl font-extrabold text-white tabular-nums">
                  {finalReport.overallScore}
                </span>
                <span className="text-slate-400 font-semibold text-sm">/ 10</span>
              </div>
              <div className="text-xs font-bold text-blue-300">
                {readiness.label}
              </div>
            </div>
          </div>
        </div>

        {/* 5-Criteria Skill Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
          <h3 className="font-extrabold text-base text-slate-900">
            Competency Skill Breakdown
          </h3>

          <div className="space-y-3.5">
            {[
              {
                label: 'Relevance to Question',
                score: finalReport.criteriaAverages.relevance,
                desc: 'Directness in addressing core prompt without drifting',
              },
              {
                label: 'Technical Correctness',
                score: finalReport.criteriaAverages.correctness,
                desc: 'Factual accuracy of definitions, syntax, and logic',
              },
              {
                label: 'Clarity & Structure',
                score: finalReport.criteriaAverages.clarity,
                desc: 'Flow, readability, and bulleted organization',
              },
              {
                label: 'Completeness & Depth',
                score: finalReport.criteriaAverages.completeness,
                desc: 'Coverage of essential principles, edge cases, and impact',
              },
              {
                label: 'Professional Tone',
                score: finalReport.criteriaAverages.communication,
                desc: 'Confident, respectful, candidate-oriented tone',
              },
            ].map((crit) => (
              <div key={crit.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{crit.label}</span>
                  <span className="font-extrabold text-slate-900 tabular-nums">{crit.score} / 10</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((crit.score / 10) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">{crit.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Priority Improvement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-emerald-200/80 p-6 shadow-2xs space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Key Strengths Observed</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
              {finalReport.topStrengths.map((str, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-amber-200/80 p-6 shadow-2xs space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Priority Action Items</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
              {finalReport.priorityImprovements.map((imp, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold mt-0.5">•</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommended 3-Step Placement Roadmap */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-4 border border-slate-800">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-blue-400" />
            <h3 className="font-extrabold text-base sm:text-lg">
              Personalized 3-Step Placement Preparation Roadmap
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {finalReport.recommendedRoadmap.map((step, idx) => (
              <div key={idx} className="bg-slate-800 p-4 rounded-xl border border-slate-700/80 space-y-2">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  Step {idx + 1}
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Question-by-Question Review Accordion */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
          <h3 className="font-extrabold text-base text-slate-900">
            Question-by-Question Audit ({evaluations.length} Questions)
          </h3>

          <div className="space-y-3">
            {evaluations.map((evalItem, idx) => {
              const isExpanded = expandedReviewIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200/80 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedReviewIndex(isExpanded ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="space-y-0.5 pr-4">
                      <span className="text-xs font-bold text-slate-500 tabular-nums">Q{idx + 1}</span>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-1">
                        {evalItem.question}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 tabular-nums">
                        {evalItem.score}/10
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 sm:p-5 space-y-4 bg-white border-t border-slate-100 text-xs text-slate-700">
                      <div>
                        <span className="font-bold text-slate-900 block mb-1">Your Submitted Answer:</span>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed italic">
                          "{evalItem.userAnswer}"
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-slate-900 block mb-1">Feedback & Critique:</span>
                        <p className="leading-relaxed text-slate-700">{evalItem.explanation}</p>
                      </div>

                      <div>
                        <span className="font-bold text-blue-900 block mb-1">Ideal Model Answer:</span>
                        <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-950 leading-relaxed font-sans">
                          {evalItem.strongerExampleAnswer}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onExit}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Back to Dashboard
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (!finalReport) return;
                setIsExportingPdf(true);
                setTimeout(() => {
                  const currentSession: InterviewSession = {
                    id: sessionId || `session-${Date.now()}`,
                    role: roleObj.name,
                    experienceLevel,
                    interviewType,
                    questionCount: sessionQuestions.length,
                    questions: sessionQuestions,
                    evaluations,
                    overallScore: finalReport.overallScore,
                    startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                    completedAt: new Date().toISOString(),
                    finalReport,
                  };
                  exportSessionToPdf(currentSession);
                  setIsExportingPdf(false);
                }, 150);
              }}
              disabled={isExportingPdf}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isExportingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const text = `InterviewReady AI Report - ${roleObj.name}\nScore: ${finalReport.overallScore}/10 (${readiness.label})\n\nSummary: ${finalReport.summary}\n\nTop Strengths:\n${finalReport.topStrengths.map((s) => `• ${s}`).join('\n')}\n\nNext Steps:\n${finalReport.recommendedRoadmap.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
                copyToClipboard(text, true);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedReport ? 'Copied Summary!' : 'Copy Summary'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentStep('setup');
                setEvaluations([]);
                setCurrentEvaluation(null);
                setFinalReport(null);
                setUserAnswer('');
              }}
              className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Practice Another Session</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
