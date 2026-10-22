import React, { useState } from 'react';
import {
  Users2,
  Sparkles,
  ChevronRight,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Target,
  Compass,
} from 'lucide-react';
import { AnswerEvaluation, validateAnswer } from '../utils/interview';
import { evaluateAnswer } from '../utils/api';
import { VoiceAnswerInput } from './VoiceAnswerInput';

const HR_QUESTIONS = [
  {
    id: 'hr-q1',
    category: 'Introduction',
    question: 'Tell me about yourself, your educational background, and why you are interested in joining our company.',
    whyItMatters: 'The universal opening question in every Indian IT campus drive (TCS, Infosys, Wipro, Cognizant). Recruiters check your communication flow and confidence.',
    frameworkTip: 'Follow the Past-Present-Future structure. Past: Schooling/College branch. Present: Mini-projects, skills, coding practice. Future: Why this company.',
  },
  {
    id: 'hr-q2',
    category: 'Relocation & Shifts',
    question: 'Are you comfortable relocating to any of our branch locations (e.g., Pune, Bengaluru, Hyderabad, Chennai) and working in rotational shifts?',
    whyItMatters: 'Standard eliminator question in service-based MNC drives. Companies need candidates who are flexible with client project locations.',
    frameworkTip: 'Always respond affirmatively with genuine enthusiasm for exposure to top tech hubs.',
  },
  {
    id: 'hr-q3',
    category: 'Academic Gap / Backlog',
    question: 'Can you explain the gap in your academic years or any subject backlogs you had during your engineering degree?',
    whyItMatters: 'Testing honesty, accountability, and resilience. Recruiters want to know what you learned rather than excuses.',
    frameworkTip: 'Be honest, take accountability, emphasize the remedial actions taken, and showcase your strong current CGPA or project output.',
  },
  {
    id: 'hr-q4',
    category: 'Strengths & Weaknesses',
    question: 'What is your greatest technical strength, and what is one real weakness you are actively working to improve?',
    whyItMatters: 'Evaluates self-awareness and willingness to learn. Avoid fake weaknesses like "I work too hard".',
    frameworkTip: 'Pick a genuine skill (e.g. public speaking or hesitation to delegate), describe specific steps you take to improve.',
  },
  {
    id: 'hr-q5',
    category: 'Teamwork & Conflict',
    question: 'Describe a disagreement you had with a teammate during your final year college project. How did you resolve it?',
    whyItMatters: 'Assesses collaboration, emotional maturity, and problem-solving without escalating drama.',
    frameworkTip: 'Use STAR: describe differing opinions on tech stack/architecture, respectful discussion, pros/cons list, and successful joint delivery.',
  },
  {
    id: 'hr-q6',
    category: 'Career Vision',
    question: 'Where do you see yourself in 3 to 5 years in the software industry?',
    whyItMatters: 'Tests commitment and ambition. Avoid saying "I want to do an MBA" or "I want to be the CEO".',
    frameworkTip: 'Focus on mastering domain architecture, mentoring juniors, and delivering mission-critical client modules.',
  },
];

export const HrPracticeView: React.FC = () => {
  const [selectedQuestion, setSelectedQuestion] = useState(HR_QUESTIONS[0]);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    setErrorMsg(null);
    const valid = validateAnswer(answer, 5);
    if (!valid.isValid) {
      setErrorMsg(valid.error || 'Please enter an answer to evaluate.');
      return;
    }

    setLoading(true);
    try {
      const res = await evaluateAnswer({
        role: 'Software Developer',
        experienceLevel: 'Fresher',
        interviewType: 'HR',
        question: selectedQuestion.question,
        answer,
        category: 'hr',
      });
      setEvaluation(res.evaluation);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to evaluate HR response. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestion = (q: typeof HR_QUESTIONS[0]) => {
    setSelectedQuestion(q);
    setAnswer('');
    setEvaluation(null);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
          <Compass className="w-3.5 h-3.5" />
          <span>Campus HR Round Preparation</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Dedicated HR & Behavioral Question Bank
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
          Most tech candidates clear coding but struggle with the HR interview round. Practice the top behavioral and situational questions asked in Indian placement drives with instant AI coaching.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Question Selection Bank */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-2">
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Core HR Questions</span>
            <span className="tabular-nums font-normal">{HR_QUESTIONS.length} prompts</span>
          </div>

          <div className="space-y-1.5">
            {HR_QUESTIONS.map((q) => {
              const isSelected = selectedQuestion.id === q.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleSelectQuestion(q)}
                  className={`w-full text-left p-3.5 rounded-xl transition-all border ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="text-[11px] font-semibold text-blue-600 mb-0.5">
                    {q.category}
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2">
                    {q.question}
                  </h4>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Question Drill & AI Feedback */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                {selectedQuestion.category} Round
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                "{selectedQuestion.question}"
              </h3>
            </div>

            {/* Why it matters & Framework Tip */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs">
              <div>
                <span className="font-bold text-slate-800">Recruiter Rationale: </span>
                <span className="text-slate-600">{selectedQuestion.whyItMatters}</span>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <span className="font-bold text-blue-900">Recommended Structure: </span>
                <span className="text-slate-700">{selectedQuestion.frameworkTip}</span>
              </div>
            </div>

            {/* Answer Input with Web Speech API */}
            <VoiceAnswerInput
              id="hr-answer"
              rows={5}
              value={answer}
              onChange={setAnswer}
              disabled={loading}
              label="Your Answer:"
              minWordsTarget={15}
              placeholder="Draft your response here or speak into the microphone. Structure your points clearly (Past-Present-Future or STAR method)..."
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
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs transition-colors self-start sm:self-auto shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Evaluation</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !answer.trim()}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating Response...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Evaluate My Answer</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Feedback Card */}
          {evaluation && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-slate-900 text-base">
                    HR Evaluation & Feedback
                  </h4>
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-extrabold text-blue-600 tabular-nums">
                    {evaluation.score}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ 10</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                {evaluation.explanation}
              </p>

              {/* What went well & Improvements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-1.5">
                  <span className="font-bold text-emerald-800 uppercase tracking-wider block">
                    Strengths
                  </span>
                  <ul className="space-y-1 text-emerald-950">
                    {evaluation.whatUserDidWell.map((w, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1.5">
                  <span className="font-bold text-amber-800 uppercase tracking-wider block">
                    Areas to Refine
                  </span>
                  <ul className="space-y-1 text-amber-950">
                    {evaluation.areasForImprovement.map((imp, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Model Example */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-400 uppercase tracking-wider">
                    Model Stronger Answer
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(evaluation.strongerExampleAnswer);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-slate-300 hover:text-white flex items-center space-x-1 font-medium"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-slate-200 leading-relaxed font-sans">
                  "{evaluation.strongerExampleAnswer}"
                </p>
              </div>

              {/* Actionable Tip */}
              <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200/80 text-blue-900 text-xs">
                <span className="font-bold">Coach's Tip: </span>
                <span>{evaluation.actionableTip}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
