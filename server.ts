import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '2mb' }));

// Initialize Google GenAI client with required User-Agent
const apiKey = process.env.GEMINI_API_KEY || '';
const hasApiKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');

const ai = hasApiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Helper to call Gemini with automatic failover between flash and flash-lite on high-demand 503/429
async function callGeminiWithFailover(options: {
  contents: string;
  responseSchema?: any;
}) {
  if (!ai) throw new Error('Gemini API key is not configured.');

  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: {
          responseMimeType: 'application/json',
          ...(options.responseSchema ? { responseSchema: options.responseSchema } : {}),
        },
      });

      if (response && response.text) {
        return { text: response.text, model };
      }
    } catch (err: any) {
      console.warn(`Gemini call on ${model} failed:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError;
}

// Built-in vetted questions for Indian campus placements & IT drives (TCS, Infosys, Wipro, Accenture, Startups)
const FALLBACK_QUESTION_BANK: Record<string, { technical: any[]; hr: any[] }> = {
  'software-developer': {
    technical: [
      {
        id: 'sd-tech-1',
        question: 'Explain the four core principles of Object-Oriented Programming (OOP) and how you have applied at least one of them in a college or personal project.',
        category: 'technical',
        contextTip: 'Focus on Abstraction, Encapsulation, Inheritance, and Polymorphism. Give a real project example.',
        expectedKeyPoints: ['Clear definition of all 4 pillars', 'Real project example', 'Advantage like reusability/maintainability'],
      },
      {
        id: 'sd-tech-2',
        question: 'What is the difference between an Array and a Linked List in terms of memory allocation, insertion, and lookup time complexity?',
        category: 'technical',
        contextTip: 'Mention contiguous vs non-contiguous memory, O(1) vs O(N) access, and pointers overhead.',
        expectedKeyPoints: ['Contiguous memory allocation', 'O(1) random access in arrays', 'O(1) insertion in linked list given pointer', 'Pointer memory overhead'],
      },
      {
        id: 'sd-tech-3',
        question: 'What is the difference between SQL (relational) and NoSQL databases, and when would you choose one over the other for a web application?',
        category: 'technical',
        contextTip: 'Mention ACID properties, structured schemas vs flexible JSON documents, and horizontal vs vertical scaling.',
        expectedKeyPoints: ['ACID compliance vs BASE', 'Schema rigidity vs flexibility', 'JOIN operations', 'Use case example'],
      },
      {
        id: 'sd-tech-4',
        question: 'Explain how RESTful APIs work. What are the common HTTP methods and standard HTTP status codes (200, 201, 400, 401, 404, 500)?',
        category: 'technical',
        contextTip: 'State that REST is stateless and uses standard verbs (GET, POST, PUT, DELETE).',
        expectedKeyPoints: ['Stateless nature', 'Standard HTTP verbs', 'Correct status code semantics', 'JSON payload format'],
      },
      {
        id: 'sd-tech-5',
        question: 'How does Git version control help during team development? Explain the difference between git merge and git rebase.',
        category: 'technical',
        contextTip: 'Discuss commit history preservation, conflicts handling, and branching strategies.',
        expectedKeyPoints: ['Fast-forward vs 3-way merge', 'Linear commit history in rebase', 'Collaboration & conflict resolution'],
      },
    ],
    hr: [
      {
        id: 'sd-hr-1',
        question: 'Tell me about yourself, your educational background, and why you decided to pursue a career in software development.',
        category: 'hr',
        contextTip: 'Structure your answer in 3 parts: Past (academics), Present (skills & projects), and Future (why this role).',
        expectedKeyPoints: ['Concise academic background', 'Key tech stack & project highlight', 'Passionate reason for joining software engineering'],
      },
      {
        id: 'sd-hr-2',
        question: 'Describe a challenging bug or technical obstacle you encountered in a college project or internship. How did you diagnose and solve it?',
        category: 'situational',
        contextTip: 'Use the STAR method: Situation, Task, Action (specific debugging tools used), and Result.',
        expectedKeyPoints: ['Clear problem statement', 'Systematic debugging approach', 'Concrete outcome and learning'],
      },
      {
        id: 'sd-hr-3',
        question: 'Why do you want to join our company, and where do you see yourself in 3 to 5 years in your engineering career?',
        category: 'hr',
        contextTip: 'Demonstrate that you researched company values, training programs, and have realistic growth ambitions.',
        expectedKeyPoints: ['Alignment with company tech or domain', 'Continuous learning mindset', 'Realistic 3-5 year technical leadership goal'],
      },
      {
        id: 'sd-hr-4',
        question: 'How do you handle disagreements or conflicting opinions when working in a team on a deadline-driven project?',
        category: 'situational',
        contextTip: 'Emphasize active listening, data/facts-driven discussions, and prioritizing the overall project goal.',
        expectedKeyPoints: ['Active listening', 'Objective pros/cons comparison', 'Compromise and mutual respect'],
      },
      {
        id: 'sd-hr-5',
        question: 'Are you comfortable relocating to different job locations (e.g., Bengaluru, Pune, Hyderabad) or working in rotational shifts if required by client projects?',
        category: 'hr',
        contextTip: 'Common question in Indian MNC drives (TCS/Infosys/Wipro). Be honest, flexible, and positive.',
        expectedKeyPoints: ['Clear positive response', 'Willingness to learn and adapt to client project demands', 'Openness to new working environments'],
      },
    ],
  },
  'java-developer': {
    technical: [
      {
        id: 'jd-tech-1',
        question: 'What is the difference between JDK, JRE, and JVM in Java? Why is Java called platform-independent?',
        category: 'technical',
        contextTip: 'Explain bytecode execution, WORA (Write Once, Run Anywhere), and JVM platform specificity.',
        expectedKeyPoints: ['JVM role in bytecode execution', 'JRE runtime libraries', 'JDK compiler & tools', 'Bytecode portability'],
      },
      {
        id: 'jd-tech-2',
        question: 'Explain the Java Collections framework. What is the difference between ArrayList, LinkedList, and HashMap in terms of performance and internal implementation?',
        category: 'technical',
        contextTip: 'Dynamic array vs doubly-linked nodes; hashing mechanism and bucket collisions in HashMap.',
        expectedKeyPoints: ['ArrayList dynamic resizing', 'LinkedList node traversal', 'HashMap hashing and hashcode/equals contract'],
      },
      {
        id: 'jd-tech-3',
        question: 'What is the purpose of the "final", "finally", and "finalize" keywords in Java?',
        category: 'technical',
        contextTip: 'Final (variable/method/class modifier), finally (try-catch cleanup block), finalize (deprecated GC cleanup).',
        expectedKeyPoints: ['Final prevents inheritance/mutation', 'Finally always executes', 'Finalize method cleanup history'],
      },
      {
        id: 'jd-tech-4',
        question: 'Explain Java 8 features: What are Lambda Expressions, Functional Interfaces, and the Stream API? Give an example of filtering and mapping a list.',
        category: 'technical',
        contextTip: 'Mention @FunctionalInterface (e.g. Predicate, Function), concise syntax, and stream operations.',
        expectedKeyPoints: ['Stream intermediate vs terminal operations', 'Lambda concise syntax', 'Code readability improvement'],
      },
      {
        id: 'jd-tech-5',
        question: 'What is Spring Boot and what problems does it solve compared to traditional Spring? What is the role of @SpringBootApplication?',
        category: 'technical',
        contextTip: 'Mention auto-configuration, embedded server (Tomcat), starter dependencies, and production-ready metrics.',
        expectedKeyPoints: ['Auto-configuration', 'Embedded servlet container', 'Combines @Configuration, @EnableAutoConfiguration, @ComponentScan'],
      },
    ],
    hr: [
      {
        id: 'jd-hr-1',
        question: 'Tell me about yourself and what sparked your interest in enterprise backend development with Java.',
        category: 'hr',
        contextTip: 'Highlight your strong OOP foundation and hands-on projects with Java or Spring Boot.',
        expectedKeyPoints: ['Background', 'Why Java enterprise ecosystem', 'Core project mention'],
      },
      {
        id: 'jd-hr-2',
        question: 'Describe a situation where you had to learn a new Java library or framework under a tight deadline.',
        category: 'situational',
        contextTip: 'Explain your learning strategy: documentation, tutorials, building a POC (Proof of Concept).',
        expectedKeyPoints: ['Structured learning technique', 'Hands-on practice POC', 'Timely project delivery'],
      },
    ],
  },
  'web-developer': {
    technical: [
      {
        id: 'wd-tech-1',
        question: 'Explain the Virtual DOM in React. How does React diffing and reconciliation work to update the real DOM efficiently?',
        category: 'technical',
        contextTip: 'Discuss batching, Fiber tree, keys in lists, and avoiding costly real DOM layout recalculations.',
        expectedKeyPoints: ['Virtual DOM in-memory representation', 'Reconciliation algorithm', 'Key prop importance in lists'],
      },
      {
        id: 'wd-tech-2',
        question: 'What is the difference between useState, useEffect, and useMemo/useCallback hooks in React? When should each be used?',
        category: 'technical',
        contextTip: 'State management vs side effects (subscriptions/fetching) vs performance memoization.',
        expectedKeyPoints: ['useState triggers re-renders', 'useEffect lifecycle dependency array', 'useMemo caches values, useCallback caches functions'],
      },
      {
        id: 'wd-tech-3',
        question: 'Explain the difference between "==" and "===" in JavaScript. What is type coercion, and why is strict equality preferred?',
        category: 'technical',
        contextTip: 'Loose equality performs implicit type casting; strict equality checks both type and value.',
        expectedKeyPoints: ['Type coercion behavior', 'Examples like 0 == false vs 0 === false', 'Preventing subtle runtime bugs'],
      },
      {
        id: 'wd-tech-4',
        question: 'What is CSS Flexbox vs CSS Grid? Describe a responsive layout scenario where you would choose one over the other.',
        category: 'technical',
        contextTip: 'Flexbox is 1-dimensional (row or column); Grid is 2-dimensional (rows and columns simultaneously).',
        expectedKeyPoints: ['1D vs 2D layout model', 'Flexbox for navigation bars/alignments', 'Grid for overall page layouts'],
      },
      {
        id: 'wd-tech-5',
        question: 'How do you optimize the loading and rendering performance of a modern web application?',
        category: 'technical',
        contextTip: 'Mention code splitting (lazy loading), image optimization, bundle size reduction, and caching.',
        expectedKeyPoints: ['Lazy loading components', 'Asset compression (WebP/SVG)', 'Minimizing re-renders', 'Lighthouse metrics'],
      },
    ],
    hr: [
      {
        id: 'wd-hr-1',
        question: 'Walk me through your portfolio or the most exciting web application you have built. What was your specific contribution?',
        category: 'hr',
        contextTip: 'Be specific about tech stack, challenges faced (responsive design, state management), and end user impact.',
        expectedKeyPoints: ['Clear project goal', 'Tech stack rationale', 'Challenges solved and demo capability'],
      },
      {
        id: 'wd-hr-2',
        question: 'How do you test your frontend code to ensure cross-browser compatibility and responsive display on mobile screens?',
        category: 'situational',
        contextTip: 'Mention responsive developer tools, real mobile device testing, and semantic HTML.',
        expectedKeyPoints: ['DevTools device emulation', 'Real device testing', 'Accessibility and browser support'],
      },
    ],
  },
  'data-analyst': {
    technical: [
      {
        id: 'da-tech-1',
        question: 'What is the difference between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN in SQL? Give a real business example.',
        category: 'technical',
        contextTip: 'Use Customers and Orders tables to illustrate matched vs unmatched records.',
        expectedKeyPoints: ['Clear definition of each JOIN', 'Table Venn diagram mental model', 'Correct handling of NULL values'],
      },
      {
        id: 'da-tech-2',
        question: 'Explain the difference between WHERE and HAVING clauses in SQL. When must you use HAVING?',
        category: 'technical',
        contextTip: 'WHERE filters rows before aggregation; HAVING filters aggregated groups (e.g. COUNT(*) > 5).',
        expectedKeyPoints: ['Row-level vs group-level filtering', 'Execution order in SQL pipeline', 'Used with GROUP BY and aggregate functions'],
      },
      {
        id: 'da-tech-3',
        question: 'How do you handle missing (NaN / NULL) and outlier values in a dataset using Python or SQL before performing analysis?',
        category: 'technical',
        contextTip: 'Discuss imputation (mean, median, mode), deletion, domain verification, and IQR/Z-score outlier detection.',
        expectedKeyPoints: ['Imputation techniques vs dropping rows', 'Impact of mean vs median with skewed data', 'Outlier detection methods'],
      },
      {
        id: 'da-tech-4',
        question: 'What are SQL Window Functions (like ROW_NUMBER, RANK, and DENSE_RANK)? How do they differ from GROUP BY?',
        category: 'technical',
        contextTip: 'Window functions calculate values across a set of rows without collapsing the individual rows into a single row.',
        expectedKeyPoints: ['Preserves original row count', 'OVER(PARTITION BY ... ORDER BY ...)', 'Difference between RANK and DENSE_RANK ties'],
      },
      {
        id: 'da-tech-5',
        question: 'What metrics and visualizations would you use to measure customer retention and monthly churn for a subscription service?',
        category: 'technical',
        contextTip: 'Mention Churn Rate formula, cohort analysis heatmaps, line charts over time, and retention curves.',
        expectedKeyPoints: ['Churn calculation formula', 'Cohort analysis visualization', 'Actionable insights for management'],
      },
    ],
    hr: [
      {
        id: 'da-hr-1',
        question: 'How do you explain complex data findings or statistical insights to non-technical stakeholders (such as marketing or sales heads)?',
        category: 'situational',
        contextTip: 'Highlight storytelling with data, focusing on business impact and avoiding heavy mathematical jargon.',
        expectedKeyPoints: ['Simplifying jargon', 'Focusing on actionable business decisions', 'Effective visual charts'],
      },
      {
        id: 'da-hr-2',
        question: 'Tell me about a data project where your analysis revealed something surprising or contrary to common assumptions.',
        category: 'hr',
        contextTip: 'Show curiosity, thorough verification, and how you validated the data integrity before concluding.',
        expectedKeyPoints: ['Data integrity verification', 'Insight discovered', 'Business takeaway'],
      },
    ],
  },
  'cybersecurity-analyst': {
    technical: [
      {
        id: 'cs-tech-1',
        question: 'Explain the CIA Triad (Confidentiality, Integrity, Availability) in information security. Give an example of a threat to each.',
        category: 'technical',
        contextTip: 'Confidentiality (data breach), Integrity (man-in-the-middle tampering), Availability (DDoS attack).',
        expectedKeyPoints: ['Confidentiality: encryption/access control', 'Integrity: hashing/checksums', 'Availability: redundancy/DDoS mitigation'],
      },
      {
        id: 'cs-tech-2',
        question: 'What is SQL Injection (SQLi)? How does it occur, and what are the industry best practices to prevent it in web applications?',
        category: 'technical',
        contextTip: 'Untrusted input concatenated into SQL queries; prevent with Parameterized Queries (Prepared Statements) and ORMs.',
        expectedKeyPoints: ['Mechanism of malicious SQL injection', 'Prepared statements / parameterized queries', 'Input validation & least privilege'],
      },
      {
        id: 'cs-tech-3',
        question: 'What is the difference between Symmetric and Asymmetric encryption? How are both used together in HTTPS / TLS handshakes?',
        category: 'technical',
        contextTip: 'Symmetric (single shared key, fast); Asymmetric (public/private key pair, secure key exchange).',
        expectedKeyPoints: ['Key pairs vs shared secret', 'Asymmetric for TLS handshake exchange', 'Symmetric (AES) for high-speed session data'],
      },
      {
        id: 'cs-tech-4',
        question: 'Explain the difference between a Vulnerability Assessment and Penetration Testing (VAPT). What tools are commonly used?',
        category: 'technical',
        contextTip: 'Vulnerability assessment identifies known weaknesses (Nessus/OpenVAS); Pen testing actively exploits them (Metasploit/Burp Suite).',
        expectedKeyPoints: ['Automated scanning vs simulated active attack', 'Tool examples (Burp Suite, Nmap, Wireshark)', 'Reporting remediation steps'],
      },
      {
        id: 'cs-tech-5',
        question: 'What are the core steps in an Incident Response lifecycle according to NIST framework when a malware or breach alert is triggered?',
        category: 'technical',
        contextTip: 'Preparation, Detection & Analysis, Containment, Eradication, Recovery, and Post-Incident Activity (Lessons Learned).',
        expectedKeyPoints: ['6 NIST phases', 'Importance of containment to stop lateral movement', 'Evidence preservation & lessons learned'],
      },
    ],
    hr: [
      {
        id: 'cs-hr-1',
        question: 'Cybersecurity requires high ethical integrity and responsibility. How do you stay updated with zero-day exploits and threat intel?',
        category: 'hr',
        contextTip: 'Mention reputable security blogs (Krebs, The Hacker News), CVE databases, CTF competitions, and GitHub advisories.',
        expectedKeyPoints: ['Ethical adherence', 'Continuous learning sources (CVE, CTFs)', 'Community participation'],
      },
      {
        id: 'cs-hr-2',
        question: 'If you discovered a critical vulnerability in a production system during off-hours, what immediate steps would you take to report it?',
        category: 'situational',
        contextTip: 'Follow responsible disclosure, notify the designated Incident Response lead, document reproduction steps, avoid public disclosure.',
        expectedKeyPoints: ['Responsible disclosure protocol', 'Immediate chain of command notification', 'Clear documentation without panic'],
      },
    ],
  },
};

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey,
    timestamp: new Date().toISOString(),
  });
});

// Daily Challenge Endpoint
app.get('/api/daily-challenge', (req: Request, res: Response) => {
  const challenges = [
    {
      id: 'daily-1',
      date: new Date().toISOString().split('T')[0],
      role: 'Software Developer',
      roleId: 'software-developer',
      question: 'Explain how hashing works in a HashMap. What happens when two different keys generate the same hashcode, and how is collision resolved?',
      context: 'Very frequently asked in TCS Digital, Infosys DSE, and Amazon campus rounds.',
      tips: ['Explain hashCode() and equals()', 'Discuss separate chaining with LinkedList and Red-Black tree in Java 8+', 'Mention O(1) average lookup vs O(N) worst case'],
      timeEstimateMinutes: 3,
    },
    {
      id: 'daily-2',
      date: new Date().toISOString().split('T')[0],
      role: 'Web Developer',
      roleId: 'web-developer',
      question: 'What is Event Bubbling and Event Capturing in JavaScript DOM? How does Event Delegation leverage this to improve web performance?',
      context: 'Essential frontend engineering concept for mid-size to product tech interviews.',
      tips: ['Explain bottom-up vs top-down event propagation', 'Show how single parent listener handles 100 child items', 'Mention event.stopPropagation()'],
      timeEstimateMinutes: 3,
    },
    {
      id: 'daily-3',
      date: new Date().toISOString().split('T')[0],
      role: 'Data Analyst',
      roleId: 'data-analyst',
      question: 'Suppose an e-commerce platform has 20% drop in checkout completions this week. How would you systematically analyze this data to find the root cause?',
      context: 'Classic business sense and root-cause analysis question for data roles.',
      tips: ['Segment by device (iOS, Android, Web), payment gateway, geography', 'Compare funnel step conversion rates', 'Check for recent app release or bug'],
      timeEstimateMinutes: 4,
    },
  ];

  const dayIndex = new Date().getDate() % challenges.length;
  res.json({
    success: true,
    challenge: challenges[dayIndex],
  });
});

// Generate Questions Endpoint
app.post('/api/generate-questions', async (req: Request, res: Response) => {
  try {
    const { role = 'software-developer', experienceLevel = 'Fresher', interviewType = 'Mixed', count = 5 } = req.body;
    const targetCount = Number(count) === 10 ? 10 : 5;
    const bank = FALLBACK_QUESTION_BANK[role] || FALLBACK_QUESTION_BANK['software-developer'];

    // If Gemini client is active, generate tailored questions dynamically
    if (ai) {
      try {
        const prompt = `You are an expert technical interviewer for Indian IT companies and tech startups (e.g., TCS Digital, Infosys, Wipro, Capgemini, Product Startups).
Generate exactly ${targetCount} authentic, high-yield interview questions for:
- Role: ${role}
- Candidate Experience Level: ${experienceLevel}
- Interview Round Type: ${interviewType} (HR, Technical, or Mixed)

Target audience: Indian college engineering students and fresh graduates.
For 'Technical', ask core programming, OOP, data structures, databases, and system concepts.
For 'HR', ask behavioral, situational, background, teamwork, and relocation/communication questions.
For 'Mixed', balance 60% technical and 40% HR/situational.

Return a JSON array of objects with the exact schema:
[
  {
    "id": "q1",
    "question": "The interview question text",
    "category": "technical" | "hr" | "situational",
    "contextTip": "Short guidance hint for how the candidate should structure their thought process",
    "expectedKeyPoints": ["Point 1", "Point 2", "Point 3"]
  }
]`;

        const { text } = await callGeminiWithFailover({
          contents: prompt,
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                category: { type: Type.STRING },
                contextTip: { type: Type.STRING },
                expectedKeyPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['id', 'question', 'category', 'contextTip', 'expectedKeyPoints'],
            },
          },
        });

        const parsed = JSON.parse(text.trim());
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json({
            success: true,
            isAiGenerated: true,
            questions: parsed.slice(0, targetCount),
          });
        }
      } catch (geminiErr: any) {
        console.warn('Live Gemini question generation failed, falling back to curated bank:', geminiErr?.message);
      }
    }

    // High quality curated question bank for Indian IT campus drives
    let questionPool: any[] = [];
    if (interviewType === 'Technical') {
      questionPool = [...bank.technical];
    } else if (interviewType === 'HR') {
      questionPool = [...bank.hr];
    } else {
      const techNeeded = Math.ceil(targetCount * 0.6);
      const hrNeeded = targetCount - techNeeded;
      const t = bank.technical.slice(0, techNeeded);
      const h = bank.hr.slice(0, hrNeeded);
      questionPool = [...t, ...h];
    }

    while (questionPool.length < targetCount) {
      const extra = FALLBACK_QUESTION_BANK['software-developer'].technical;
      questionPool.push(extra[questionPool.length % extra.length]);
    }

    return res.json({
      success: true,
      isAiGenerated: false,
      questions: questionPool.slice(0, targetCount).map((q, idx) => ({
        ...q,
        id: `q-${idx + 1}-${Date.now()}`,
      })),
    });
  } catch (error: any) {
    console.error('Error generating questions:', error);
    const bank = FALLBACK_QUESTION_BANK['software-developer'];
    return res.json({
      success: true,
      isAiGenerated: false,
      questions: [...bank.technical.slice(0, 3), ...bank.hr.slice(0, 2)],
    });
  }
});

// Evaluate Answer Endpoint
app.post('/api/evaluate-answer', async (req: Request, res: Response) => {
  try {
    const {
      role = 'Software Developer',
      experienceLevel = 'Fresher',
      interviewType = 'Mixed',
      question = '',
      answer = '',
      category = 'technical',
    } = req.body;

    const trimmedAnswer = (answer || '').trim();
    if (!trimmedAnswer || trimmedAnswer.split(/\s+/).filter(Boolean).length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a meaningful answer to evaluate.',
      });
    }

    if (!ai) {
      return res.status(503).json({
        success: false,
        error: 'Gemini AI integration is not configured. Please ensure your API key is provided.',
      });
    }

    const evaluationPrompt = `You are a senior technical and HR interviewer assessing a candidate's answer for an Indian software engineering placement drive.
Role: ${role}
Candidate Level: ${experienceLevel}
Category: ${category}
Interview Format: ${interviewType}

INTERVIEW QUESTION:
"${question}"

CANDIDATE'S SUBMITTED TEXT ANSWER:
"${trimmedAnswer}"

EVALUATION INSTRUCTIONS:
1. Provide an objective score between 1 and 10 based on relevance, correctness, clarity, completeness, and communication tone.
2. Provide a 2-sentence explanation of the score.
3. List 2-3 specific bullet points for what the candidate did well.
4. List 2-3 specific areas for improvement.
5. Provide a Stronger Example Answer that demonstrates how a top-tier candidate or fresher would answer.
6. Provide ONE actionable tip for their next attempt.
7. Score each of the 5 criteria out of 10: relevance, correctness, clarity, completeness, communication. Note: Do not evaluate voice/accent since this is text.

Return as a valid JSON object matching this schema:
{
  "score": 7.5,
  "explanation": "Clear explanation...",
  "whatUserDidWell": ["Point 1", "Point 2"],
  "areasForImprovement": ["Point 1", "Point 2"],
  "strongerExampleAnswer": "Ideal model answer...",
  "actionableTip": "One specific actionable tip...",
  "criteriaScores": {
    "relevance": 8,
    "correctness": 7,
    "clarity": 8,
    "completeness": 7,
    "communication": 8
  }
}`;

    const { text, model } = await callGeminiWithFailover({
      contents: evaluationPrompt,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          explanation: { type: Type.STRING },
          whatUserDidWell: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          areasForImprovement: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          strongerExampleAnswer: { type: Type.STRING },
          actionableTip: { type: Type.STRING },
          criteriaScores: {
            type: Type.OBJECT,
            properties: {
              relevance: { type: Type.NUMBER },
              correctness: { type: Type.NUMBER },
              clarity: { type: Type.NUMBER },
              completeness: { type: Type.NUMBER },
              communication: { type: Type.NUMBER },
            },
            required: ['relevance', 'correctness', 'clarity', 'completeness', 'communication'],
          },
        },
        required: [
          'score',
          'explanation',
          'whatUserDidWell',
          'areasForImprovement',
          'strongerExampleAnswer',
          'actionableTip',
          'criteriaScores',
        ],
      },
    });

    const parsed = JSON.parse(text.trim());
    return res.json({
      success: true,
      isAiGenerated: true,
      evaluation: {
        ...parsed,
        score: Math.min(10, Math.max(1, Number(parsed.score) || 7)),
        evaluatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in evaluate-answer:', error?.message || error);
    // Explicit, clean error reporting so user gets a clear retry option without fabrication
    return res.status(503).json({
      success: false,
      error: 'The AI model is currently handling high request volume. Please click "Retry Evaluation" to submit again.',
    });
  }
});

// Generate Final Report Endpoint
app.post('/api/generate-final-report', async (req: Request, res: Response) => {
  try {
    const { role = 'Software Developer', experienceLevel = 'Fresher', evaluations = [] } = req.body;

    if (!Array.isArray(evaluations) || evaluations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No evaluations provided for report generation.',
      });
    }

    const scores: number[] = evaluations.map((e: any) => Number(e.score) || 6);
    const avgScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;

    let readinessLevel = 'Interview Ready 🎯';
    if (avgScore >= 8.5) readinessLevel = 'Offer Ready ⭐';
    else if (avgScore < 6.0) readinessLevel = 'Needs Structured Practice 🛠️';

    const criteriaKeys = ['relevance', 'correctness', 'clarity', 'completeness', 'communication'] as const;
    const criteriaAverages: Record<string, number> = {};

    criteriaKeys.forEach((key) => {
      const vals = evaluations.map((e: any) => e.criteriaScores?.[key] || 7);
      criteriaAverages[key] = Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10;
    });

    if (ai) {
      try {
        const reportPrompt = `A candidate just finished an interview session for role: ${role} (${experienceLevel}).
Total Questions: ${evaluations.length}
Overall Average Score: ${avgScore}/10

Summary of Candidate's Q&A:
${evaluations
  .map(
    (e: any, i: number) => `Q${i + 1}: ${e.question}\nScore: ${e.score}/10\nKey feedback: ${e.explanation}`
  )
  .join('\n\n')}

Generate a comprehensive final interview performance report:
1. summary: A professional 2-3 sentence executive assessment of their overall readiness for Indian IT and software placement drives.
2. topStrengths: Exactly 3 key strengths observed across their answers.
3. priorityImprovements: Exactly 3 specific areas to improve before their next real interview.
4. recommendedRoadmap: A concrete 3-step action roadmap (e.g. Day 1-2, Day 3-5, Day 6-7).

Return as valid JSON:
{
  "summary": "...",
  "topStrengths": ["...", "...", "..."],
  "priorityImprovements": ["...", "...", "..."],
  "recommendedRoadmap": ["Step 1...", "Step 2...", "Step 3..."]
}`;

        const { text } = await callGeminiWithFailover({
          contents: reportPrompt,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              topStrengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              priorityImprovements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              recommendedRoadmap: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['summary', 'topStrengths', 'priorityImprovements', 'recommendedRoadmap'],
          },
        });

        const parsed = JSON.parse(text.trim());
        return res.json({
          success: true,
          report: {
            overallScore: avgScore,
            readinessLevel,
            criteriaAverages,
            ...parsed,
          },
        });
      } catch (geminiReportErr: any) {
        console.warn('AI report generation failed, using structured synthesis:', geminiReportErr?.message);
      }
    }

    // Structured fallback report synthesis
    return res.json({
      success: true,
      report: {
        overallScore: avgScore,
        readinessLevel,
        criteriaAverages,
        summary: `You completed a ${evaluations.length}-question interview session for ${role}. Your conceptual foundation is solid, and with focused practice on structuring longer answers with the STAR method, you are well-positioned for placement rounds.`,
        topStrengths: [
          'Consistent articulation across both technical and behavioral prompts.',
          'Direct problem-solving focus without getting distracted by unrelated details.',
          'Strong professional tone and positive, adaptable attitude.',
        ],
        priorityImprovements: [
          'Incorporate quantifiable metrics (e.g. "reduced latency by 30%", "handled 500+ records").',
          'Practice explaining complex data structures or code architectures step-by-step.',
          'Deepen knowledge on framework-specific internals (e.g., JVM memory model, React reconciliation).',
        ],
        recommendedRoadmap: [
          'Revise core OOP and database indexing concepts for your target role.',
          'Draft and rehearse 3 STAR stories from your academic projects and college internships.',
          'Take another full 5-question mock interview on InterviewReady AI to measure improvement.',
        ],
      },
    });
  } catch (error: any) {
    console.error('Error generating final report:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate final report. Please try again.',
    });
  }
});

// Vite middleware in dev or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`InterviewReady AI Server running at http://0.0.0.0:${PORT}`);
    console.log(`Gemini API configured: ${hasApiKey ? 'Yes (Live Gemini)' : 'No'}`);
  });
}

startServer();
