import { QuestionItem, AnswerEvaluation, SessionFinalReport } from './interview';

export interface GenerateQuestionsParams {
  role: string;
  experienceLevel: 'Fresher' | 'Experienced';
  interviewType: 'HR' | 'Technical' | 'Mixed';
  count: number;
}

export interface EvaluateAnswerParams {
  role: string;
  experienceLevel: 'Fresher' | 'Experienced';
  interviewType: 'HR' | 'Technical' | 'Mixed';
  question: string;
  answer: string;
  category?: string;
}

export interface DailyChallengeData {
  id: string;
  date: string;
  role: string;
  roleId: string;
  question: string;
  context: string;
  tips: string[];
  timeEstimateMinutes: number;
}

export async function fetchHealth(): Promise<{ status: string; hasApiKey: boolean }> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (e) {
    return { status: 'offline', hasApiKey: false };
  }
}

export async function fetchDailyChallenge(): Promise<DailyChallengeData | null> {
  try {
    const res = await fetch('/api/daily-challenge');
    if (!res.ok) throw new Error('Failed to fetch daily challenge');
    const data = await res.json();
    return data.challenge;
  } catch (e) {
    console.error('Error fetching daily challenge', e);
    return null;
  }
}

export async function generateQuestions(params: GenerateQuestionsParams): Promise<{
  questions: QuestionItem[];
  isAiGenerated: boolean;
}> {
  const res = await fetch('/api/generate-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to generate questions (${res.status})`);
  }

  const data = await res.json();
  return {
    questions: data.questions || [],
    isAiGenerated: Boolean(data.isAiGenerated),
  };
}

export async function evaluateAnswer(params: EvaluateAnswerParams): Promise<{
  evaluation: AnswerEvaluation;
  isAiGenerated: boolean;
}> {
  const res = await fetch('/api/evaluate-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to evaluate answer (${res.status})`);
  }

  const data = await res.json();
  return {
    evaluation: data.evaluation,
    isAiGenerated: Boolean(data.isAiGenerated),
  };
}

export async function generateFinalReport(params: {
  role: string;
  experienceLevel: string;
  evaluations: AnswerEvaluation[];
}): Promise<SessionFinalReport> {
  const res = await fetch('/api/generate-final-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to generate final report (${res.status})`);
  }

  const data = await res.json();
  return data.report;
}
