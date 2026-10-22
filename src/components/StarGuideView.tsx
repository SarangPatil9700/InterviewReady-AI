import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  Loader2,
  Lightbulb,
  Compass,
  RotateCcw,
} from 'lucide-react';
import { formatStarResponse, AnswerEvaluation, validateAnswer } from '../utils/interview';
import { evaluateAnswer } from '../utils/api';

export const StarGuideView: React.FC = () => {
  const [situation, setSituation] = useState('');
  const [task, setTask] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState('');

  const [copied, setCopied] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const combinedResponse = formatStarResponse(situation, task, action, result);
  const totalWords = combinedResponse.trim()
    ? combinedResponse.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const handleEvaluateBuilder = async () => {
    setErrorMsg(null);
    const valid = validateAnswer(combinedResponse, 15);
    if (!valid.isValid) {
      setErrorMsg(valid.error || 'Please fill in all 4 STAR sections to evaluate.');
      return;
    }

    setEvaluating(true);
    try {
      const res = await evaluateAnswer({
        role: 'Software Developer',
        experienceLevel: 'Fresher',
        interviewType: 'HR',
        question: 'Describe a challenging project or conflict you handled and what the outcome was.',
        answer: combinedResponse,
        category: 'situational',
      });
      setEvaluation(res.evaluation);
    } catch (err: any) {
      setErrorMsg(err.message || 'Evaluation failed. Please retry.');
    } finally {
      setEvaluating(false);
    }
  };

  const loadStudentExample = () => {
    setSituation('During our 6th-semester college mini-project, our 4-member team was building a Campus Food Pre-ordering Web App.');
    setTask('Two days before the college project submission, our database queries froze whenever more than 10 test users placed orders simultaneously.');
    setAction('I profiled our MongoDB collections, identified missing indexes on the "orderId" and "restaurantId" fields, and refactored our backend API to batch incoming order status updates rather than firing individual queries.');
    setResult('Query latency dropped from 4.2 seconds to under 250 milliseconds, our app smoothly passed the faculty demo, and our team secured an A+ grade for performance.');
    setEvaluation(null);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
          <Compass className="w-3.5 h-3.5" />
          <span>Proven Interview Framework</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Master the STAR Method for Behavioral Questions
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
          The STAR framework is the industry gold standard used by Amazon, Google, TCS, and Infosys interviewers to evaluate problem solving, teamwork, and leadership.
        </p>
      </div>

      {/* 4 Pillars of STAR Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* S */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-extrabold flex items-center justify-center text-sm">
            S
          </div>
          <h3 className="font-bold text-sm text-slate-900">Situation (15%)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Set the background: Where were you? (e.g. final year project, college hackathon, internship). Keep it concise.
          </p>
        </div>

        {/* T */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-extrabold flex items-center justify-center text-sm">
            T
          </div>
          <h3 className="font-bold text-sm text-slate-900">Task (15%)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            What was the specific challenge or goal you needed to accomplish? What was at stake?
          </p>
        </div>

        {/* A */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-2 ring-1 ring-blue-500/20">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm">
            A
          </div>
          <h3 className="font-bold text-sm text-slate-900">Action (50%)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The core: What specific steps did <strong>YOU</strong> take? Highlight your individual technical contribution.
          </p>
        </div>

        {/* R */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-extrabold flex items-center justify-center text-sm">
            R
          </div>
          <h3 className="font-bold text-sm text-slate-900">Result (20%)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            What was the concrete outcome? Always quantify with numbers, latencies, grades, or business impacts.
          </p>
        </div>
      </div>

      {/* Common Traps */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-3 shadow-2xs">
        <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>Top 3 Mistakes Freshers Make in Behavioral Rounds:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <strong className="text-slate-900 block mb-1">1. Over-explaining Situation:</strong> Spending 2 minutes on college background leaving only 10 seconds for what you actually did.
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <strong className="text-slate-900 block mb-1">2. Using "We" instead of "I":</strong> Recruiters want to know your individual role, not the entire team's generic actions.
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <strong className="text-slate-900 block mb-1">3. Skipping the Measurable Result:</strong> Ending abruptly with "so it worked" instead of quoting performance improvements or awards.
          </div>
        </div>
      </div>

      {/* Interactive STAR Answer Builder */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Interactive STAR Story Builder
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Draft your story section by section. The tool stitches it together and lets Gemini AI evaluate it.
            </p>
          </div>

          <button
            type="button"
            onClick={loadStudentExample}
            className="text-xs px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors self-start sm:self-auto"
          >
            Load Engineering Project Example
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              1. Situation (Context & Setting):
            </label>
            <input
              type="text"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="e.g., In my 7th semester college IoT project with a 3-member team..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              2. Task (The Problem or Deadline):
            </label>
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g., We had to integrate sensor data into a real-time web dashboard before the deadline..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              3. Action (What YOU did specifically):
            </label>
            <textarea
              rows={3}
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g., I implemented WebSockets on the Node.js server, optimized sensor payload sizes by 40%, and created a responsive dashboard with charts..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans leading-relaxed"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              4. Result (Impact & Measurable Outcome):
            </label>
            <input
              type="text"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="e.g., The system handled 50 data packets/sec with zero drops, and we won 2nd prize at our college tech symposium."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans"
            />
          </div>
        </div>

        {/* Live Stitched Preview */}
        {combinedResponse && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Stitched Story Preview (<span className="tabular-nums font-semibold">{totalWords}</span> words)
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(combinedResponse);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 font-bold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy All'}</span>
              </button>
            </div>
            <pre className="font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              {combinedResponse}
            </pre>
          </div>
        )}

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
              onClick={handleEvaluateBuilder}
              disabled={evaluating}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs transition-colors self-start sm:self-auto shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Evaluation</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleEvaluateBuilder}
            disabled={evaluating || !combinedResponse.trim()}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            {evaluating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating STAR Story with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Critique My STAR Story</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Evaluation */}
      {evaluation && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-base">
                STAR Story Evaluation
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-1.5">
              <span className="font-bold text-emerald-800 uppercase tracking-wider block">
                STAR Strengths
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
                How to Strengthen
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

          <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200/80 text-blue-900 text-xs">
            <span className="font-bold">Next Attempt Advice: </span>
            <span>{evaluation.actionableTip}</span>
          </div>
        </div>
      )}
    </div>
  );
};
