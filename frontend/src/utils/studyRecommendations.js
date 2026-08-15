// src/utils/studyRecommendations.js

/**
 * Returns today's local date string formatted as YYYY-MM-DD.
 */
export function getTodayDateString() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Computes Monday (start) of the current week as a YYYY-MM-DD string.
 */
export function getCurrentWeekStartDate() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  return getTodayDateString(monday);
}

/**
 * 1. Calculates attendance metrics for a specific subject.
 * Safely handles zero classes without producing NaN.
 */
export function evaluateSubjectAttendance(attendanceRecord) {
  if (!attendanceRecord) {
    return { percentage: null, score: 0, reason: null };
  }

  const attended = Number(attendanceRecord.attendedClasses ?? attendanceRecord.attended ?? 0);
  const total = Number(attendanceRecord.totalClasses ?? attendanceRecord.total ?? 0);

  if (total <= 0 || isNaN(attended) || isNaN(total)) {
    return { percentage: null, score: 0, reason: null };
  }

  const percentage = Math.round((attended / total) * 100);

  if (percentage < 75) {
    return {
      percentage,
      score: 3,
      reason: `Attendance is low at ${percentage}% (Below 75% requirement)`,
    };
  } else if (percentage >= 75 && percentage < 85) {
    return {
      percentage,
      score: 2,
      reason: `Attendance is moderate at ${percentage}% (Target is ≥ 85%)`,
    };
  }

  return { percentage, score: 0, reason: null };
}

/**
 * 2. Evaluates grade point standing for a specific subject.
 */
export function evaluateSubjectGrade(subject) {
  if (
    subject.gradePoint === null ||
    subject.gradePoint === undefined ||
    subject.gradePoint === "" ||
    isNaN(Number(subject.gradePoint))
  ) {
    return { gradePoint: null, score: 0, reason: null };
  }

  const gp = Number(subject.gradePoint);

  if (gp <= 6) {
    return {
      gradePoint: gp,
      score: 3,
      reason: `Grade point is ${gp} (Needs academic improvement)`,
    };
  } else if (gp >= 7 && gp <= 8) {
    return {
      gradePoint: gp,
      score: 1,
      reason: `Grade point is ${gp} (Moderate academic standing)`,
    };
  }

  return { gradePoint: gp, score: 0, reason: null };
}

/**
 * 3. Evaluates overdue and pending assignments for a specific subject.
 */
export function evaluateSubjectAssignments(subjectAssignments = []) {
  const todayStr = getTodayDateString();
  let overdueCount = 0;
  let pendingCount = 0;

  subjectAssignments.forEach((task) => {
    if (task.status !== "Completed") {
      const dueDate = task.dueDate || task.date || "";
      if (dueDate && dueDate < todayStr) {
        overdueCount += 1;
      } else {
        pendingCount += 1;
      }
    }
  });

  let score = 0;
  const reasons = [];

  if (overdueCount > 0) {
    score += 3;
    reasons.push(
      `${overdueCount} overdue assignment${overdueCount > 1 ? "s" : ""} requiring urgent submission`
    );
  }

  if (pendingCount >= 2) {
    score += 1;
    reasons.push(`${pendingCount} pending assignments upcoming`);
  }

  return { overdueCount, pendingCount, score, reasons };
}

/**
 * 4. Evaluates weekly study goal progress for a specific subject.
 */
export function evaluateSubjectStudyGoal(subjectGoal, subjectSessions = []) {
  if (!subjectGoal || !subjectGoal.targetMinutes || Number(subjectGoal.targetMinutes) <= 0) {
    return { goalProgress: null, score: 0, reason: null };
  }

  const weekStartStr = getCurrentWeekStartDate();
  const completedMinutesThisWeek = subjectSessions
    .filter((s) => s.status === "Completed" && s.date && s.date >= weekStartStr)
    .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);

  const targetMinutes = Number(subjectGoal.targetMinutes);
  const goalProgress = Math.round((completedMinutesThisWeek / targetMinutes) * 100);

  if (goalProgress < 40) {
    return {
      goalProgress,
      score: 2,
      reason: `Weekly study goal is behind schedule (${goalProgress}% completed)`,
    };
  }

  return { goalProgress, score: 0, reason: null };
}

/**
 * 5. Maps numeric score to Priority and recommended study time.
 */
export function getPriorityMeta(score) {
  if (score >= 5) {
    return { priority: "HIGH", recommendedMinutes: 90, badgeColor: "#dc2626", bg: "#fef2f2" };
  }
  if (score >= 3) {
    return { priority: "MEDIUM", recommendedMinutes: 60, badgeColor: "#d97706", bg: "#fffbeb" };
  }
  return { priority: "LOW", recommendedMinutes: 30, badgeColor: "#16a34a", bg: "#f0fdf4" };
}

/**
 * 6. Deterministic tie-breaking multi-level sort:
 * 1. Score descending
 * 2. Priority weight (HIGH > MEDIUM > LOW)
 * 3. Attendance percentage ascending (lowest attendance first)
 * 4. Overdue count descending
 * 5. Grade point ascending (lowest grade point first)
 */
export function sortRecommendations(recommendations = []) {
  const priorityWeights = { HIGH: 3, MEDIUM: 2, LOW: 1 };

  return [...recommendations].sort((a, b) => {
    // 1. Priority Score
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // 2. Priority category
    const weightA = priorityWeights[a.priority] || 0;
    const weightB = priorityWeights[b.priority] || 0;
    if (weightB !== weightA) {
      return weightB - weightA;
    }

    // 3. Lowest attendance first (treat null as high/no penalty)
    const attA = a.attendancePercentage !== null ? a.attendancePercentage : 999;
    const attB = b.attendancePercentage !== null ? b.attendancePercentage : 999;
    if (attA !== attB) {
      return attA - attB;
    }

    // 4. Most overdue assignments
    if (b.overdueCount !== a.overdueCount) {
      return b.overdueCount - a.overdueCount;
    }

    // 5. Lowest grade point
    const gpA = a.gradePoint !== null ? a.gradePoint : 999;
    const gpB = b.gradePoint !== null ? b.gradePoint : 999;
    return gpA - gpB;
  });
}

/**
 * 7. Master Function: Generates explainable study recommendations across all user subjects.
 */
export function generateStudyRecommendations({
  subjects = [],
  attendance = [],
  assignments = [],
  studySessions = [],
  studyGoals = [],
}) {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return [];
  }

  const rawRecommendations = subjects.map((sub) => {
    const attRecord = attendance.find(
      (a) => a.subjectId === sub.id || a.subjectName === sub.name
    );
    const subAssignments = assignments.filter(
      (a) => a.subjectId === sub.id || a.subjectName === sub.name
    );
    const subSessions = studySessions.filter(
      (s) => s.subjectId === sub.id || s.subjectName === sub.name
    );
    const subGoal = studyGoals.find(
      (g) => g.subjectId === sub.id || g.subjectName === sub.name
    );

    // Evaluate component rules
    const attEval = evaluateSubjectAttendance(attRecord);
    const gradeEval = evaluateSubjectGrade(sub);
    const asgEval = evaluateSubjectAssignments(subAssignments);
    const goalEval = evaluateSubjectStudyGoal(subGoal, subSessions);

    // Aggregate score
    const totalScore = attEval.score + gradeEval.score + asgEval.score + goalEval.score;

    // Collect explainable reasons
    const reasons = [];
    if (attEval.reason) reasons.push(attEval.reason);
    if (gradeEval.reason) reasons.push(gradeEval.reason);
    asgEval.reasons.forEach((r) => reasons.push(r));
    if (goalEval.reason) reasons.push(goalEval.reason);

    // Default positive reasons if score is 0
    if (reasons.length === 0) {
      if (gradeEval.gradePoint !== null && gradeEval.gradePoint >= 9) {
        reasons.push("Strong academic performance");
      }
      if (attEval.percentage !== null && attEval.percentage >= 85) {
        reasons.push(`Attendance is consistent at ${attEval.percentage}%`);
      }
      reasons.push("No urgent academic issues detected");
    }

    const { priority, recommendedMinutes, badgeColor, bg } = getPriorityMeta(totalScore);

    return {
      subjectId: sub.id,
      subjectName: sub.name,
      score: totalScore,
      priority,
      recommendedMinutes,
      badgeColor,
      bg,
      reasons,
      attendancePercentage: attEval.percentage,
      gradePoint: gradeEval.gradePoint,
      overdueCount: asgEval.overdueCount,
      pendingCount: asgEval.pendingCount,
    };
  });

  return sortRecommendations(rawRecommendations);
}