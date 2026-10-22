/**
 * Pure helper and logic functions for InterviewReady AI
 * Decoupled from UI components for pure unit-testing.
 */

export interface CriteriaScores {
  relevance: number; // 0-10
  correctness: number; // 0-10
  clarity: number; // 0-10
  completeness: number; // 0-10
  communication: number; // 0-10
}

export interface QuestionItem {
  id: string;
  question: string;
  category: 'technical' | 'hr' | 'situational';
  contextTip?: string;
  expectedKeyPoints?: string[];
  role?: string;
}

export interface AnswerEvaluation {
  questionId: string;
  question: string;
  userAnswer: string;
  score: number; // 0 to 10
  explanation: string;
  whatUserDidWell: string[];
  areasForImprovement: string[];
  strongerExampleAnswer: string;
  actionableTip: string;
  criteriaScores: CriteriaScores;
  evaluatedAt: string;
  isFallback?: boolean;
}

export interface InterviewSession {
  id: string;
  role: string;
  experienceLevel: 'Fresher' | 'Experienced';
  interviewType: 'HR' | 'Technical' | 'Mixed';
  questionCount: number;
  questions: QuestionItem[];
  evaluations: AnswerEvaluation[];
  overallScore: number;
  startedAt: string;
  completedAt?: string;
  finalReport?: SessionFinalReport;
}

export interface SessionFinalReport {
  overallScore: number;
  readinessLevel: string;
  summary: string;
  topStrengths: string[];
  priorityImprovements: string[];
  criteriaAverages: CriteriaScores;
  recommendedRoadmap: string[];
}

/**
 * Calculates average overall score rounded to 1 decimal place.
 */
export function calculateOverallScore(scores: number[]): number {
  if (!scores || scores.length === 0) return 0;
  const sum = scores.reduce((acc, curr) => acc + curr, 0);
  const avg = sum / scores.length;
  return Math.round(avg * 10) / 10;
}

/**
 * Returns placement readiness badge and color scheme based on score out of 10.
 */
export function getReadinessBadge(score: number): {
  label: string;
  variant: 'green' | 'blue' | 'yellow' | 'red';
  description: string;
} {
  if (score >= 8.5) {
    return {
      label: 'Offer Ready ⭐',
      variant: 'green',
      description: 'Exceptional answers! Ready for top product firms and MNC technical rounds.',
    };
  } else if (score >= 7.0) {
    return {
      label: 'Interview Ready 🎯',
      variant: 'blue',
      description: 'Strong foundation. With slight refinement in examples, you will crack IT campus drives.',
    };
  } else if (score >= 5.0) {
    return {
      label: 'Promising Progress 📈',
      variant: 'yellow',
      description: 'Good conceptual knowledge. Work on structured STAR delivery and depth in technical answers.',
    };
  } else {
    return {
      label: 'Needs Structured Practice 🛠️',
      variant: 'red',
      description: 'Review core concepts, practice writing bulleted clear points, and avoid one-liner answers.',
    };
  }
}

/**
 * Validates user answer before AI submission.
 */
export function validateAnswer(answer: string, minWords = 5): {
  isValid: boolean;
  error?: string;
  wordCount: number;
} {
  const trimmed = (answer || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Please enter your answer before submitting for evaluation.',
      wordCount: 0,
    };
  }

  // Count words
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount < minWords) {
    return {
      isValid: false,
      error: `Your answer is very brief (${wordCount} word${wordCount === 1 ? '' : 's'}). Provide at least ${minWords} words to receive meaningful feedback.`,
      wordCount,
    };
  }

  return {
    isValid: true,
    wordCount,
  };
}

/**
 * Computes average across all 5 evaluation criteria.
 */
export function calculateCategoryAverages(criteriaList: CriteriaScores[]): CriteriaScores {
  if (!criteriaList || criteriaList.length === 0) {
    return {
      relevance: 0,
      correctness: 0,
      clarity: 0,
      completeness: 0,
      communication: 0,
    };
  }

  const totals = criteriaList.reduce(
    (acc, curr) => ({
      relevance: acc.relevance + (curr.relevance || 0),
      correctness: acc.correctness + (curr.correctness || 0),
      clarity: acc.clarity + (curr.clarity || 0),
      completeness: acc.completeness + (curr.completeness || 0),
      communication: acc.communication + (curr.communication || 0),
    }),
    { relevance: 0, correctness: 0, clarity: 0, completeness: 0, communication: 0 }
  );

  const count = criteriaList.length;
  const round1 = (val: number) => Math.round((val / count) * 10) / 10;

  return {
    relevance: round1(totals.relevance),
    correctness: round1(totals.correctness),
    clarity: round1(totals.clarity),
    completeness: round1(totals.completeness),
    communication: round1(totals.communication),
  };
}

/**
 * Combines STAR components into a cohesive professional answer.
 */
export function formatStarResponse(
  situation: string,
  task: string,
  action: string,
  result: string
): string {
  const parts: string[] = [];
  if (situation.trim()) parts.push(`Situation: ${situation.trim()}`);
  if (task.trim()) parts.push(`Task: ${task.trim()}`);
  if (action.trim()) parts.push(`Action: ${action.trim()}`);
  if (result.trim()) parts.push(`Result: ${result.trim()}`);
  return parts.join('\n\n');
}

/**
 * Role metadata configurations
 */
export const TARGET_ROLES = [
  {
    id: 'software-developer',
    name: 'Software Developer',
    icon: 'Code2',
    color: 'from-blue-600 to-indigo-700',
    description: 'DSA, problem solving, OOP, algorithms, and core engineering fundamentals.',
    popularCompanies: ['TCS Digital', 'Infosys DSE', 'Amazon', 'Cognizant', 'Zoho'],
    defaultTopics: ['Data Structures', 'OOP concepts', 'Time Complexity', 'Git & CI/CD'],
  },
  {
    id: 'java-developer',
    name: 'Java Developer',
    icon: 'Coffee',
    color: 'from-amber-600 to-orange-700',
    description: 'Core Java, Collections framework, Multithreading, Spring Boot, and JVM internals.',
    popularCompanies: ['Accenture', 'Capgemini', 'Wipro Turbo', 'HCL', 'Oracle'],
    defaultTopics: ['Java 8+ Streams', 'Spring Boot APIs', 'Hibernate/JPA', 'Garbage Collection'],
  },
  {
    id: 'web-developer',
    name: 'Web Developer',
    icon: 'Globe',
    color: 'from-cyan-600 to-blue-700',
    description: 'React, modern JavaScript (ES6+), HTML5/CSS3, RESTful APIs, and frontend architecture.',
    popularCompanies: ['Swiggy', 'Zomato', 'Paytm', 'Mindtree', 'LTIMindtree'],
    defaultTopics: ['React Hooks & State', 'Async/Await & Promises', 'CSS Flexbox/Grid', 'Web Performance'],
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    icon: 'BarChart3',
    color: 'from-emerald-600 to-teal-700',
    description: 'SQL queries, joins, aggregations, Python (Pandas/NumPy), statistical analysis, and dashboarding.',
    popularCompanies: ['Mu Sigma', 'Fractal Analytics', 'EY India', 'Deloitte', 'TCS'],
    defaultTopics: ['Complex SQL Queries', 'Data Cleaning', 'PowerBI/Tableau', 'Probability & Stats'],
  },
  {
    id: 'cybersecurity-analyst',
    name: 'Cybersecurity Analyst',
    icon: 'ShieldCheck',
    color: 'from-rose-600 to-red-700',
    description: 'Network security protocols, OWASP Top 10 vulnerabilities, cryptography, and SOC incident handling.',
    popularCompanies: ['PwC India', 'KPMG', 'Wipro Cyber', 'Tech Mahindra', 'Infosys'],
    defaultTopics: ['OWASP Top 10', 'TCP/IP & Firewalls', 'Encryption (AES/RSA)', 'Penetration Testing'],
  },
] as const;
