import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOverallScore,
  getReadinessBadge,
  validateAnswer,
  calculateCategoryAverages,
  formatStarResponse,
  CriteriaScores,
} from './interview';

test('calculateOverallScore: calculates average score correctly', () => {
  assert.equal(calculateOverallScore([]), 0);
  assert.equal(calculateOverallScore([8, 9, 7]), 8.0);
  assert.equal(calculateOverallScore([7.5, 8.2, 9.1]), 8.3);
  assert.equal(calculateOverallScore([10, 10, 10]), 10);
});

test('getReadinessBadge: maps scores to correct tier badges', () => {
  const topTier = getReadinessBadge(9.0);
  assert.equal(topTier.variant, 'green');
  assert.match(topTier.label, /Offer Ready/);

  const midTier = getReadinessBadge(7.5);
  assert.equal(midTier.variant, 'blue');
  assert.match(midTier.label, /Interview Ready/);

  const devTier = getReadinessBadge(5.5);
  assert.equal(devTier.variant, 'yellow');

  const lowTier = getReadinessBadge(3.0);
  assert.equal(lowTier.variant, 'red');
});

test('validateAnswer: rejects empty or too short answers', () => {
  const emptyRes = validateAnswer('');
  assert.equal(emptyRes.isValid, false);
  assert.match(emptyRes.error!, /enter your answer/i);

  const shortRes = validateAnswer('I am good.', 5);
  assert.equal(shortRes.isValid, false);
  assert.equal(shortRes.wordCount, 3);
  assert.match(shortRes.error!, /at least 5 words/i);

  const validRes = validateAnswer('Object Oriented Programming has four core pillars: Encapsulation, Abstraction, Inheritance, and Polymorphism.');
  assert.equal(validRes.isValid, true);
  assert.equal(validRes.wordCount, 12);
  assert.equal(validRes.error, undefined);
});

test('calculateCategoryAverages: computes averages per criteria', () => {
  const sampleCriteria: CriteriaScores[] = [
    { relevance: 8, correctness: 9, clarity: 7, completeness: 8, communication: 8 },
    { relevance: 9, correctness: 8, clarity: 9, completeness: 7, communication: 9 },
  ];

  const averages = calculateCategoryAverages(sampleCriteria);
  assert.equal(averages.relevance, 8.5);
  assert.equal(averages.correctness, 8.5);
  assert.equal(averages.clarity, 8.0);
  assert.equal(averages.completeness, 7.5);
  assert.equal(averages.communication, 8.5);
});

test('formatStarResponse: stitches STAR parts correctly', () => {
  const output = formatStarResponse(
    'In my final year college project',
    'We had to build a real-time blood donor finder app',
    'I designed the MongoDB schema and integrated Mapbox API',
    'We reduced donor lookup time by 60% and won 2nd prize at the hackathon'
  );

  assert.match(output, /Situation: In my final year college project/);
  assert.match(output, /Task: We had to build/);
  assert.match(output, /Action: I designed the MongoDB/);
  assert.match(output, /Result: We reduced donor/);
});

test('buildSessionPdfDoc: generates valid multi-page PDF document for interview session', async () => {
  const { buildSessionPdfDoc } = await import('./pdfExport');

  const mockSession = {
    id: 'test-session-123',
    role: 'Software Developer',
    experienceLevel: 'Fresher' as const,
    interviewType: 'Mixed' as const,
    questionCount: 2,
    questions: [
      { id: 'q1', question: 'What is polymorphism?', category: 'technical' as const },
      { id: 'q2', question: 'Describe a conflict in a team.', category: 'hr' as const },
    ],
    evaluations: [
      {
        questionId: 'q1',
        question: 'What is polymorphism?',
        userAnswer: 'Polymorphism allows objects of different classes to be treated as objects of a common superclass.',
        score: 8.5,
        explanation: 'Clear answer with correct definition of compile-time and runtime polymorphism.',
        whatUserDidWell: ['Accurate definition', 'Mentioned overriding'],
        areasForImprovement: ['Could provide a short code snippet'],
        strongerExampleAnswer: 'Polymorphism in OOP is the ability of an object to take many forms...',
        actionableTip: 'Always cite real-world examples like Shape drawing.',
        criteriaScores: { relevance: 9, correctness: 9, clarity: 8, completeness: 8, communication: 9 },
        evaluatedAt: new Date().toISOString(),
      },
      {
        questionId: 'q2',
        question: 'Describe a conflict in a team.',
        userAnswer: 'In our hackathon, we disagreed on database choice so we benchmarked both.',
        score: 8.0,
        explanation: 'Good usage of structured thinking and data-driven conflict resolution.',
        whatUserDidWell: ['Constructive resolution', 'Objective benchmarks'],
        areasForImprovement: ['Elaborate on personal communication role'],
        strongerExampleAnswer: 'During our final year project, our team had conflicting views on tech stack...',
        actionableTip: 'Emphasize empathetic listening before presenting benchmarks.',
        criteriaScores: { relevance: 8, correctness: 8, clarity: 8, completeness: 8, communication: 8 },
        evaluatedAt: new Date().toISOString(),
      },
    ],
    overallScore: 8.3,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    finalReport: {
      overallScore: 8.3,
      readinessLevel: 'Interview Ready',
      summary: 'Candidate demonstrated strong technical clarity and balanced communication skills.',
      topStrengths: ['Concise explanations', 'Good problem-solving structure'],
      priorityImprovements: ['Deepen technical implementation details', 'Add concrete metrics'],
      criteriaAverages: { relevance: 8.5, correctness: 8.5, clarity: 8.0, completeness: 8.0, communication: 8.5 },
      recommendedRoadmap: ['Practice live coding for DSA questions', 'Refine STAR stories with metrics'],
    },
  };

  const doc = buildSessionPdfDoc(mockSession);
  assert.ok(doc, 'PDF document should be created');
  assert.ok(doc.getNumberOfPages() >= 1, 'Should have at least 1 page');

  // Verify doc output can be generated
  const output = doc.output('arraybuffer');
  assert.ok(output.byteLength > 1000, 'PDF buffer should be non-trivial size');
});

