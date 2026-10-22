import React, { useState } from 'react';
import {
  Code2,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Search,
  Filter,
} from 'lucide-react';
import { AnswerEvaluation, validateAnswer } from '../utils/interview';
import { evaluateAnswer } from '../utils/api';
import { VoiceAnswerInput } from './VoiceAnswerInput';

interface TechQuestion {
  id: string;
  topic: string;
  role: string;
  question: string;
  keyPoints: string[];
}

const TECH_QUESTIONS: TechQuestion[] = [
  {
    id: 't-1',
    topic: 'Core Java & OOP',
    role: 'Java Developer',
    question: 'Explain the internal working of HashMap in Java. How are collisions handled in Java 8 and later?',
    keyPoints: ['Hashing using hashCode()', 'Bucket array with linked lists', 'Treeify threshold (8) transforms list into Red-Black Tree', 'O(1) average lookup vs O(log N) collision worst case'],
  },
  {
    id: 't-2',
    topic: 'Core Java & OOP',
    role: 'Java Developer',
    question: 'What is the difference between Method Overloading (Compile-time Polymorphism) and Method Overriding (Runtime Polymorphism)?',
    keyPoints: ['Same method name with different parameters in same class', 'Same signature in child class with @Override', 'Static vs dynamic binding'],
  },
  {
    id: 't-3',
    topic: 'DSA & Algorithms',
    role: 'Software Developer',
    question: 'How do you detect a cycle in a singly linked list? Explain Floyd’s Tortoise and Hare algorithm.',
    keyPoints: ['Two pointers (slow and fast)', 'Slow advances 1 step, fast advances 2 steps', 'If pointers meet, cycle exists', 'O(N) time complexity and O(1) auxiliary space'],
  },
  {
    id: 't-4',
    topic: 'DSA & Algorithms',
    role: 'Software Developer',
    question: 'Compare Merge Sort and Quick Sort. What are their time and space complexities in best, average, and worst cases?',
    keyPoints: ['Merge Sort is O(N log N) always with O(N) space', 'Quick Sort is in-place O(1) space, O(N log N) average, O(N^2) worst case on bad pivot', 'Stability difference'],
  },
  {
    id: 't-5',
    topic: 'Web & React',
    role: 'Web Developer',
    question: 'How does React Virtual DOM differ from the real browser DOM? Explain how the reconciliation process optimizes UI updates.',
    keyPoints: ['Lightweight JavaScript object tree representation', 'Diffing algorithm calculates minimal patch', 'Batching DOM operations prevents layout thrashing', 'Role of unique keys in lists'],
  },
  {
    id: 't-6',
    topic: 'Web & React',
    role: 'Web Developer',
    question: 'What is a Closure in JavaScript? Provide a real-world frontend use case where closures are applied.',
    keyPoints: ['Function bundled with its lexical environment', 'Inner function retains access to outer variables even after outer has returned', 'Use cases: data privacy/module pattern, debounce/throttle handlers'],
  },
  {
    id: 't-7',
    topic: 'SQL & Databases',
    role: 'Data Analyst',
    question: 'What is Database Normalization? Explain the difference between 1NF, 2NF, and 3NF with a practical example.',
    keyPoints: ['Eliminating data redundancy and update anomalies', '1NF: Atomic values, unique records', '2NF: 1NF + no partial dependency on composite key', '3NF: 2NF + no transitive dependency'],
  },
  {
    id: 't-8',
    topic: 'SQL & Databases',
    role: 'Data Analyst',
    question: 'What is a Database Index (B-Tree)? How does it improve SELECT query speed, and what is its negative impact on INSERT/UPDATE operations?',
    keyPoints: ['B-Tree search pointer structure', 'Reduces disk I/O from full table scan to O(log N)', 'Trade-off: slower write operations as index must be maintained'],
  },
  {
    id: 't-9',
    topic: 'Cybersecurity',
    role: 'Cybersecurity Analyst',
    question: 'What is Cross-Site Scripting (XSS)? What are the three types of XSS (Stored, Reflected, DOM-based), and how can developers mitigate them?',
    keyPoints: ['Malicious script injection executed in victim browser', 'Stored: saved in database; Reflected: in URL parameters; DOM-based: client-side manipulation', 'Mitigation: Content Security Policy (CSP), HTML output encoding, input sanitization'],
  },
];

export const TechnicalPracticeView: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(TECH_QUESTIONS[0]);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const topics = ['All', 'Core Java & OOP', 'DSA & Algorithms', 'Web & React', 'SQL & Databases', 'Cybersecurity'];

  const filteredQuestions = TECH_QUESTIONS.filter((q) => {
    const matchesTopic = selectedTopic === 'All' || q.topic === selectedTopic;
    const matchesSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

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
        role: selectedQuestion.role,
        experienceLevel: 'Fresher',
        interviewType: 'Technical',
        question: selectedQuestion.question,
        answer,
        category: 'technical',
      });
      setEvaluation(res.evaluation);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to evaluate technical answer. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestion = (q: TechQuestion) => {
    setSelectedQuestion(q);
    setAnswer('');
    setEvaluation(null);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
          <Code2 className="w-3.5 h-3.5" />
          <span>Technical Domain Deep Dive</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Technical Question Practice Bank
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Sharpen your technical articulation. Recruiters care not only about writing code, but also how clearly you explain complexity, internal architectures, and system design decisions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedTopic === t
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or keywords..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Questions List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2 max-h-[600px] overflow-y-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block px-2 py-1">
            Questions ({filteredQuestions.length})
          </span>

          {filteredQuestions.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">No questions found matching your filter.</p>
          ) : (
            <div className="space-y-1.5">
              {filteredQuestions.map((q) => {
                const isSelected = selectedQuestion.id === q.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleSelectQuestion(q)}
                    className={`w-full text-left p-3 rounded-xl transition-all border ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        {q.topic}
                      </span>
                      <span>{q.role}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2">
                      {q.question}
                    </h4>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Active Question & Feedback */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="space-y-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {selectedQuestion.topic}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                "{selectedQuestion.question}"
              </h3>
            </div>

            {/* Key concepts hint */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 space-y-1.5">
              <span className="font-bold text-slate-900 block">Expected Key Technical Concepts:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                {selectedQuestion.keyPoints.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>

            {/* Answer Input with Web Speech API */}
            <VoiceAnswerInput
              id="tech-answer"
              rows={5}
              value={answer}
              onChange={setAnswer}
              disabled={loading}
              label="Your Answer:"
              minWordsTarget={15}
              placeholder="Explain the concept clearly. Include time/space complexity, data structure behaviors, or real project examples where applicable..."
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
                  <span>Retry Evaluation</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !answer.trim()}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating Technical Depth...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Evaluate Technical Answer</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Evaluation */}
          {evaluation && (
            <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-slate-900 text-base">
                    Technical Feedback & Scoring
                  </h4>
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-extrabold text-blue-600">
                    {evaluation.score}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ 10</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                {evaluation.explanation}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                  <span className="font-bold text-emerald-800 uppercase tracking-wider block">
                    Strong Technical Points
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

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1.5">
                  <span className="font-bold text-amber-800 uppercase tracking-wider block">
                    Missing or Weak Concepts
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

              {/* Model stronger answer */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-400 uppercase tracking-wider">
                    Model Technical Answer
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(evaluation.strongerExampleAnswer);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-slate-300 hover:text-white flex items-center space-x-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-slate-200 leading-relaxed font-sans">
                  "{evaluation.strongerExampleAnswer}"
                </p>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                <span className="font-bold">Next Attempt Tip: </span>
                <span>{evaluation.actionableTip}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
