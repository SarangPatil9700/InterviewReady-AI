import { jsPDF } from 'jspdf';
import { InterviewSession, getReadinessBadge } from './interview';

/**
 * Builds the complete jsPDF document structure for an interview session.
 * Decoupled from file downloading so it can be verified in both browser and unit test environments.
 */
export function buildSessionPdfDoc(session: InterviewSession): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // 178mm
  let y = margin;

  // Helper: Check page space and auto-page-break
  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 22) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Helper: Wrap and print text, returning new y
  const printWrappedText = (
    text: string,
    x: number,
    fontSize: number,
    color: [number, number, number],
    fontStyle: 'normal' | 'bold' | 'italic' = 'normal',
    maxWidth: number = contentWidth,
    lineHeightMultiplier = 1.3
  ): number => {
    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.3527 * lineHeightMultiplier; // pt to mm
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, x, y);
      y += lineHeight;
    }
    return y;
  };

  // ==========================================
  // 1. BRAND HEADER BANNER
  // ==========================================
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.roundedRect(margin, y, contentWidth, 32, 3, 3, 'F');

  // Brand Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('INTERVIEWREADY AI', margin + 8, y + 11);

  // Accent badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(96, 165, 250); // Blue-400
  doc.text('OFFICIAL CANDIDATE EVALUATION REPORT', margin + 8, y + 18);

  // Role & Date on right side
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // Slate-300
  const dateFormatted = session.startedAt
    ? new Date(session.startedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : new Date().toLocaleDateString();

  const rightText1 = `${session.role} (${session.experienceLevel})`;
  const rightText2 = `Format: ${session.interviewType} | ${dateFormatted}`;
  doc.text(rightText1, pageWidth - margin - 8, y + 12, { align: 'right' });
  doc.text(rightText2, pageWidth - margin - 8, y + 20, { align: 'right' });

  y += 38;

  // ==========================================
  // 2. OVERALL SCORE & READINESS HIGHLIGHT
  // ==========================================
  const badge = getReadinessBadge(session.overallScore);
  const scoreBoxHeight = 36;
  ensureSpace(scoreBoxHeight);

  // Score Card Container
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.roundedRect(margin, y, contentWidth, scoreBoxHeight, 3, 3, 'FD');

  // Left: Big Score display
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.text(`${session.overallScore}`, margin + 8, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text('/ 10', margin + 28, y + 17);

  // Readiness Level pill
  doc.setFillColor(239, 246, 255); // Blue-50
  doc.setDrawColor(191, 219, 254); // Blue-200
  doc.roundedRect(margin + 8, y + 22, 52, 9, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 64, 175); // Blue-800
  // Strip emojis for standard PDF fonts
  const sanitizedBadge = badge.label.replace(/[^\x00-\x7F]/g, '').trim();
  doc.text(sanitizedBadge, margin + 11, y + 28);

  // Right: Summary description
  const summaryX = margin + 66;
  const summaryWidth = contentWidth - 72;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text('Assessment Overview:', summaryX, y + 10);

  const summaryText =
    session.finalReport?.summary ||
    badge.description ||
    'Complete interview performance summary evaluated against IT industry benchmark standards.';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // Slate-600
  const summaryLines = doc.splitTextToSize(summaryText, summaryWidth);
  let sY = y + 16;
  for (const sLine of summaryLines.slice(0, 4)) {
    doc.text(sLine, summaryX, sY);
    sY += 4.5;
  }

  y += scoreBoxHeight + 8;

  // ==========================================
  // 3. 5-CRITERIA PERFORMANCE BENCHMARK
  // ==========================================
  const criteriaScores = session.finalReport?.criteriaAverages || {
    relevance: session.overallScore,
    correctness: session.overallScore,
    clarity: session.overallScore,
    completeness: session.overallScore,
    communication: session.overallScore,
  };

  const criteriaList = [
    { name: 'Relevance', score: criteriaScores.relevance },
    { name: 'Technical Correctness', score: criteriaScores.correctness },
    { name: 'Clarity & Structure', score: criteriaScores.clarity },
    { name: 'Completeness', score: criteriaScores.completeness },
    { name: 'Communication Style', score: criteriaScores.communication },
  ];

  ensureSpace(32);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Evaluation Criteria Breakdown', margin, y);
  y += 5;

  // Render 5 horizontal progress bars
  const colWidth = (contentWidth - 8) / 2;
  let critY = y;
  criteriaList.forEach((item, idx) => {
    const isLeft = idx % 2 === 0;
    const xPos = isLeft ? margin : margin + colWidth + 8;
    const currentY = isLeft ? critY : critY;

    // Label & Score
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(item.name, xPos, currentY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(`${item.score}/10`, xPos + colWidth - 12, currentY + 4);

    // Bar Background
    const barY = currentY + 6;
    const barWidth = colWidth;
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(xPos, barY, barWidth, 3, 1.5, 1.5, 'F');

    // Bar Fill
    const fillWidth = Math.min(barWidth, Math.max(2, (item.score / 10) * barWidth));
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(xPos, barY, fillWidth, 3, 1.5, 1.5, 'F');

    if (!isLeft || idx === criteriaList.length - 1) {
      critY += 12;
    }
  });

  y = critY + 2;

  // ==========================================
  // 4. STRENGTHS & IMPROVEMENTS
  // ==========================================
  const strengths = session.finalReport?.topStrengths || [
    'Strong grasp of foundational concepts in the chosen domain',
    'Clear, professional communication style throughout the session',
  ];

  const improvements = session.finalReport?.priorityImprovements || [
    'Provide concrete project examples and metrics to back assertions',
    'Use the STAR method (Situation, Task, Action, Result) for situational questions',
  ];

  ensureSpace(38);
  const boxWidth = (contentWidth - 6) / 2;

  // Strengths Box
  doc.setFillColor(240, 253, 244); // Green-50
  doc.setDrawColor(187, 247, 208); // Green-200
  doc.roundedRect(margin, y, boxWidth, 36, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(22, 101, 52); // Green-800
  doc.text('Top Strengths', margin + 6, y + 7);

  let strY = y + 13;
  strengths.slice(0, 3).forEach((s) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(21, 128, 61);
    const lines = doc.splitTextToSize(`+ ${s}`, boxWidth - 12);
    for (const line of lines.slice(0, 2)) {
      doc.text(line, margin + 6, strY);
      strY += 4.2;
    }
  });

  // Improvements Box
  const impX = margin + boxWidth + 6;
  doc.setFillColor(254, 252, 232); // Yellow-50
  doc.setDrawColor(254, 240, 138); // Yellow-200
  doc.roundedRect(impX, y, boxWidth, 36, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(133, 77, 14); // Yellow-800
  doc.text('Priority Improvements', impX + 6, y + 7);

  let impY = y + 13;
  improvements.slice(0, 3).forEach((imp) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(161, 98, 7);
    const lines = doc.splitTextToSize(`! ${imp}`, boxWidth - 12);
    for (const line of lines.slice(0, 2)) {
      doc.text(line, impX + 6, impY);
      impY += 4.2;
    }
  });

  y += 42;

  // ==========================================
  // 5. ROADMAP (If available)
  // ==========================================
  if (session.finalReport?.recommendedRoadmap && session.finalReport.recommendedRoadmap.length > 0) {
    ensureSpace(28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Recommended Preparation Roadmap', margin, y);
    y += 5;

    session.finalReport.recommendedRoadmap.slice(0, 3).forEach((step, idx) => {
      ensureSpace(8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(37, 99, 235);
      doc.text(`${idx + 1}.`, margin + 2, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(step, contentWidth - 12);
      for (const line of lines) {
        doc.text(line, margin + 8, y);
        y += 4.2;
      }
    });
    y += 4;
  }

  // ==========================================
  // 6. DETAILED QUESTION BREAKDOWN
  // ==========================================
  ensureSpace(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`Question-by-Question Evaluation (${session.evaluations?.length || 0})`, margin, y);
  y += 7;

  const evaluations = session.evaluations || [];
  evaluations.forEach((evalItem, index) => {
    ensureSpace(45);

    // Question Header Strip
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`Question ${index + 1}`, margin + 4, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(37, 99, 235);
    doc.text(`Score: ${evalItem.score} / 10`, pageWidth - margin - 4, y + 5.5, { align: 'right' });

    y += 11;

    // Question Text
    y = printWrappedText(
      `"${evalItem.question}"`,
      margin + 2,
      9.5,
      [30, 41, 59],
      'bold',
      contentWidth - 4
    );
    y += 2;

    // Candidate's Answer Box
    ensureSpace(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Candidate's Submitted Answer:", margin + 2, y);
    y += 4;

    const answerText = evalItem.userAnswer || '(No answer recorded)';
    const answerLines = doc.splitTextToSize(answerText, contentWidth - 12);
    const answerBoxHeight = Math.max(10, answerLines.length * 4 + 4);

    ensureSpace(answerBoxHeight);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin + 2, y, contentWidth - 4, answerBoxHeight, 2, 2, 'FD');

    let ansLineY = y + 5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    for (const line of answerLines) {
      doc.text(line, margin + 6, ansLineY);
      ansLineY += 4;
    }
    y += answerBoxHeight + 4;

    // Feedback & Critique
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('AI Evaluator Critique:', margin + 2, y);
    y += 4.5;

    y = printWrappedText(
      evalItem.explanation,
      margin + 2,
      8.2,
      [71, 85, 105],
      'normal',
      contentWidth - 4
    );
    y += 3;

    // Model Ideal Answer Box
    if (evalItem.strongerExampleAnswer) {
      ensureSpace(22);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 64, 175);
      doc.text('Recommended Model Answer:', margin + 2, y);
      y += 4;

      const modelLines = doc.splitTextToSize(evalItem.strongerExampleAnswer, contentWidth - 12);
      const modelBoxHeight = Math.max(10, modelLines.length * 3.8 + 5);

      ensureSpace(modelBoxHeight);
      doc.setFillColor(239, 246, 255); // Blue-50
      doc.setDrawColor(191, 219, 254); // Blue-200
      doc.roundedRect(margin + 2, y, contentWidth - 4, modelBoxHeight, 2, 2, 'FD');

      let modLineY = y + 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 58, 138); // Blue-900
      for (const line of modelLines) {
        doc.text(line, margin + 6, modLineY);
        modLineY += 3.8;
      }
      y += modelBoxHeight + 6;
    }

    // Separator Line
    ensureSpace(6);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  });

  // ==========================================
  // 7. FOOTERS (All Pages)
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400

    // Divider above footer
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.text(
      'InterviewReady AI — Career Readiness & Evaluation Report',
      margin,
      pageHeight - 7
    );

    doc.text(
      `Page ${p} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 7,
      { align: 'right' }
    );
  }

  return doc;
}

/**
 * Generates and downloads a multi-page, formatted PDF assessment report
 * for an InterviewReady AI session.
 */
export function exportSessionToPdf(session: InterviewSession): boolean {
  try {
    const doc = buildSessionPdfDoc(session);
    const cleanRole = (session.role || 'Interview').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `InterviewReady_${cleanRole}_Report_${Date.now().toString().slice(-4)}.pdf`;
    doc.save(fileName);
    return true;
  } catch (err) {
    console.error('Failed to generate PDF report:', err);
    return false;
  }
}
