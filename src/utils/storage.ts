import { InterviewSession, AnswerEvaluation } from './interview';

const SESSIONS_KEY = 'interviewready_sessions';
const STREAK_KEY = 'interviewready_streak';
const DAILY_COMPLETED_KEY = 'interviewready_daily_completed';

export interface UserStats {
  totalSessions: number;
  totalQuestionsAnswered: number;
  averageScore: number;
  highestScore: number;
  streakDays: number;
}

export function getStoredSessions(): InterviewSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading sessions from localStorage', e);
    return [];
  }
}

export function saveSession(session: InterviewSession): void {
  try {
    const existing = getStoredSessions();
    const updated = [session, ...existing.filter((s) => s.id !== session.id)];
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated.slice(0, 50))); // Keep last 50
    updateStreak();
  } catch (e) {
    console.error('Error saving session to localStorage', e);
  }
}

export function deleteStoredSession(sessionId: string): void {
  try {
    const existing = getStoredSessions();
    const filtered = existing.filter((s) => s.id !== sessionId);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error deleting session', e);
  }
}

export function clearAllSessions(): void {
  try {
    localStorage.removeItem(SESSIONS_KEY);
  } catch (e) {
    console.error('Error clearing sessions', e);
  }
}

export function getUserStats(): UserStats {
  const sessions = getStoredSessions();
  const completedSessions = sessions.filter((s) => s.evaluations && s.evaluations.length > 0);

  let totalQuestions = 0;
  let allScores: number[] = [];

  completedSessions.forEach((s) => {
    totalQuestions += s.evaluations.length;
    s.evaluations.forEach((e) => {
      if (typeof e.score === 'number') {
        allScores.push(e.score);
      }
    });
  });

  const avg = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
  const highest = allScores.length > 0 ? Math.max(...allScores) : 0;

  const streak = getStreak();

  return {
    totalSessions: completedSessions.length,
    totalQuestionsAnswered: totalQuestions,
    averageScore: Math.round(avg * 10) / 10,
    highestScore: Math.round(highest * 10) / 10,
    streakDays: streak,
  };
}

export function getStreak(): number {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return 1;
    const parsed = JSON.parse(raw);
    const lastDate = parsed.lastDate;
    const today = new Date().toISOString().split('T')[0];

    if (lastDate === today) {
      return parsed.count || 1;
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (lastDate === yesterday) {
      return parsed.count || 1;
    }

    // Missed streak
    return 1;
  } catch {
    return 1;
  }
}

export function updateStreak(): void {
  try {
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(STREAK_KEY);
    let count = 1;

    if (raw) {
      const parsed = JSON.parse(raw);
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (parsed.lastDate === yesterday) {
        count = (parsed.count || 1) + 1;
      } else if (parsed.lastDate === today) {
        count = parsed.count || 1;
      }
    }

    localStorage.setItem(STREAK_KEY, JSON.stringify({ lastDate: today, count }));
  } catch (e) {
    console.error('Error updating streak', e);
  }
}

export function isDailyChallengeCompleted(): boolean {
  try {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(DAILY_COMPLETED_KEY);
    return saved === today;
  } catch {
    return false;
  }
}

export function markDailyChallengeCompleted(): void {
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(DAILY_COMPLETED_KEY, today);
    updateStreak();
  } catch (e) {
    console.error('Error marking daily challenge completed', e);
  }
}

/**
 * Seed realistic initial demo data if user has no sessions, so first-time
 * view showcases realistic statistics and reviewable reports.
 */
export function seedSampleSessionsIfEmpty(): void {
  const existing = getStoredSessions();
  if (existing.length > 0) return;

  const sampleSession: InterviewSession = {
    id: 'sample-session-1',
    role: 'Software Developer',
    experienceLevel: 'Fresher',
    interviewType: 'Mixed',
    questionCount: 5,
    startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
    overallScore: 8.2,
    questions: [
      {
        id: 'q-sample-1',
        question: 'Explain the four core principles of Object-Oriented Programming (OOP) and how you applied them in a college project.',
        category: 'technical',
      },
      {
        id: 'q-sample-2',
        question: 'Tell me about yourself, your technical skills, and why you want to start your software engineering career with us.',
        category: 'hr',
      },
    ],
    evaluations: [
      {
        questionId: 'q-sample-1',
        question: 'Explain the four core principles of Object-Oriented Programming (OOP) and how you applied them in a college project.',
        userAnswer: 'OOP consists of Encapsulation, Abstraction, Inheritance, and Polymorphism. In our Library Management mini-project in 3rd year, I created a base class Book and derived AcademicBook and ReferenceBook to inherit common attributes while overriding loan duration.',
        score: 8.5,
        explanation: 'Very strong answer. You correctly named all four pillars and immediately connected it to your college project with inheritance and polymorphism examples.',
        whatUserDidWell: [
          'Directly stated all 4 OOP pillars in the first sentence.',
          'Provided a concrete class hierarchy example from a real academic project.',
        ],
        areasForImprovement: [
          'Briefly define encapsulation (private fields with getters/setters) to demonstrate full completeness.',
        ],
        strongerExampleAnswer: 'OOP stands on 4 pillars: Encapsulation (bundling data with methods and restricting direct access), Abstraction (hiding implementation complexity), Inheritance (reusing parent class attributes), and Polymorphism (dynamic method overriding). In my 3rd-year Library System, Book served as a base class extended by AcademicBook with overridden checkout logic, ensuring clean separation of concerns.',
        actionableTip: 'Whenever asked about OOP pillars, state definitions in one sentence each, then tie 1-2 pillars to your project.',
        criteriaScores: {
          relevance: 9,
          correctness: 9,
          clarity: 8,
          completeness: 8,
          communication: 8.5,
        },
        evaluatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        questionId: 'q-sample-2',
        question: 'Tell me about yourself, your technical skills, and why you want to start your software engineering career with us.',
        userAnswer: 'I am a final year Computer Science student. I have worked on web applications using React and Node.js, and solved 150+ LeetCode problems in Java. I am excited to join an organization with strong mentorship where I can contribute to client delivery.',
        score: 7.9,
        explanation: 'Good structure covering academics, tech stack, and problem-solving dedication. Adding a specific detail about the company will make this exceptional.',
        whatUserDidWell: [
          'Mentioned quantifiable achievement (150+ coding problems solved).',
          'Covered both frontend and backend stack.',
        ],
        areasForImprovement: [
          'Reference a specific company initiative, service line, or product to demonstrate genuine research.',
        ],
        strongerExampleAnswer: 'Hello! I am a final-year B.Tech CSE student passionate about software engineering. Over the past two years, I have built full-stack applications with React and Java Spring Boot and consistently practiced data structures. What draws me to your team is your reputation for large-scale digital transformation and structured fresher onboarding, where I can build reliable software from day one.',
        actionableTip: 'Follow the Past-Present-Future formula and spend 20 seconds on why their specific culture aligns with you.',
        criteriaScores: {
          relevance: 8.5,
          correctness: 8,
          clarity: 8,
          completeness: 7.5,
          communication: 7.5,
        },
        evaluatedAt: new Date(Date.now() - 86400000 * 2 + 600000).toISOString(),
      },
    ],
    finalReport: {
      overallScore: 8.2,
      readinessLevel: 'Interview Ready 🎯',
      summary: 'Strong performance on both technical core and introductory HR questions. Demonstrates solid fundamentals and clear project articulation.',
      topStrengths: [
        'Excellent linkage of theoretical concepts with hands-on college projects.',
        'Clear, concise communication without rambling.',
        'Demonstrated quantitative effort through coding practice.',
      ],
      priorityImprovements: [
        'Add specific company-aligned rationale in HR responses.',
        'Provide deeper definitions before jumping into project applications.',
      ],
      criteriaAverages: {
        relevance: 8.8,
        correctness: 8.5,
        clarity: 8.0,
        completeness: 7.8,
        communication: 8.0,
      },
      recommendedRoadmap: [
        'Practice 3 more STAR behavioural questions on handling team conflicts.',
        'Review database indexing and query optimization for technical rounds.',
        'Do a timed 5-question mock interview before your next campus drive.',
      ],
    },
  };

  saveSession(sampleSession);
}
