// src/utils/riskAnalysis.js

/**
 * Evaluates study regularity for a subject across a 14-day rolling window.
 */
function evaluateStudyConsistency(subjectSessions = []) {
  if (!subjectSessions || subjectSessions.length === 0) {
    return { points: 0, status: null };
  }

  const now = new Date();
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(now.getDate() - 14);

  const recentSessions = subjectSessions.filter((s) => {
    if (!s.date) return false;
    const sessionDate = new Date(s.date);
    return !isNaN(sessionDate.getTime()) && sessionDate >= fourteenDaysAgo;
  });

  if (recentSessions.length === 0) {
    return { points: 0, status: null };
  }

  const uniqueStudyDays = new Set(
    recentSessions.map((s) => new Date(s.date).toISOString().split("T")[0])
  ).size;

  if (uniqueStudyDays >= 5) {
    return { points: 0, status: "Good" };
  } else if (uniqueStudyDays >= 2) {
    return { points: 5, status: "Moderate" };
  } else {
    return { points: 10, status: "Poor" };
  }
}

/**
 * ============================================================================
 * RULE-BASED ACADEMIC RISK ENGINE
 * ============================================================================
 * Computes deterministic 0-100 risk scores across 5 academic dimensions:
 * 1. Attendance percentage vs. thresholds (max 40 pts)
 * 2. Grade point standings (max 30 pts)
 * 3. Overdue assignment count (max 30 pts)
 * 4. Study goal fulfillment (max 20 pts)
 * 5. 14-day study session consistency (max 10 pts)
 *
 * NOTE FOR FUTURE ML MIGRATION:
 * When migrating to a trained Machine Learning model (e.g. Random Forest / Logistic Regression),
 * this function can be swapped with `predictAcademicRisk(features)` without altering the downstream UI contracts.
 */
export function calculateAcademicRisk({
  subjects = [],
  attendance = [],
  assignments = [],
  studySessions = [],
  studyGoals = [],
}) {
  const now = new Date();

  const attendanceMap = new Map();
  attendance.forEach((att) => {
    if (att.subjectId) attendanceMap.set(att.subjectId, att);
  });

  const assignmentsMap = new Map();
  assignments.forEach((asg) => {
    if (asg.subjectId) {
      if (!assignmentsMap.has(asg.subjectId)) {
        assignmentsMap.set(asg.subjectId, []);
      }
      assignmentsMap.get(asg.subjectId).push(asg);
    }
  });

  const sessionsMap = new Map();
  studySessions.forEach((session) => {
    if (session.subjectId) {
      if (!sessionsMap.has(session.subjectId)) {
        sessionsMap.set(session.subjectId, []);
      }
      sessionsMap.get(session.subjectId).push(session);
    }
  });

  const goalsMap = new Map();
  studyGoals.forEach((goal) => {
    if (goal.subjectId) goalsMap.set(goal.subjectId, goal);
  });

  return subjects.map((subject) => {
    const subjectId = subject.id;
    const subjectName = subject.name || "Unnamed Course";

    let riskScore = 0;
    const reasons = [];

    // 1. ATTENDANCE FACTOR
    let attendancePercentage = null;
    const attRecord = attendanceMap.get(subjectId);

    if (attRecord) {
      const total = Number(attRecord.totalClasses || attRecord.total || 0);
      const attended = Number(attRecord.attendedClasses || attRecord.attended || 0);

      if (total > 0) {
        attendancePercentage = Math.round((attended / total) * 100);

        if (attendancePercentage >= 85) {
          // 0 risk points
        } else if (attendancePercentage >= 75) {
          riskScore += 10;
          reasons.push(`Attendance is ${attendancePercentage}% (approaching 75% boundary).`);
        } else if (attendancePercentage >= 65) {
          riskScore += 25;
          reasons.push(`Attendance is ${attendancePercentage}% (below 75% requirement).`);
        } else {
          riskScore += 40;
          reasons.push(`Attendance is critically low at ${attendancePercentage}% (< 65%).`);
        }
      }
    }

    // 2. GRADE POINT FACTOR
    let gradePoint = null;
    if (
      subject.gradePoint !== null &&
      subject.gradePoint !== undefined &&
      subject.gradePoint !== "" &&
      !isNaN(Number(subject.gradePoint))
    ) {
      gradePoint = Number(subject.gradePoint);

      if (gradePoint >= 9) {
        // 0 risk points
      } else if (gradePoint === 8) {
        riskScore += 5;
      } else if (gradePoint === 7) {
        riskScore += 10;
        reasons.push(`Current grade point is ${gradePoint} (${subject.grade || "B+"}).`);
      } else if (gradePoint === 6) {
        riskScore += 20;
        reasons.push(`Current grade point is ${gradePoint} (${subject.grade || "B"}).`);
      } else {
        riskScore += 30;
        reasons.push(`Current grade point is ${gradePoint} (at or below passing grade).`);
      }
    }

    // 3. OVERDUE ASSIGNMENTS FACTOR
    const subjectAssignments = assignmentsMap.get(subjectId) || [];
    let overdueCount = 0;

    subjectAssignments.forEach((asg) => {
      const isPending = asg.status !== "Completed" && !asg.completed;
      const dueStr = asg.dueDate || asg.deadline;

      if (isPending && dueStr) {
        const dueDate = new Date(dueStr);
        if (!isNaN(dueDate.getTime()) && dueDate < now) {
          overdueCount += 1;
        }
      }
    });

    if (overdueCount === 0) {
      // 0 points
    } else if (overdueCount === 1) {
      riskScore += 15;
      reasons.push("1 assignment is overdue.");
    } else if (overdueCount === 2) {
      riskScore += 25;
      reasons.push("2 assignments are overdue.");
    } else {
      riskScore += 30;
      reasons.push(`${overdueCount} assignments are overdue.`);
    }

    // 4. STUDY GOAL FACTOR
    let studyGoalProgress = null;
    const goalRecord = goalsMap.get(subjectId);

    if (goalRecord) {
      const target = Number(goalRecord.targetHours || goalRecord.target || 0);
      const completed = Number(goalRecord.completedHours || goalRecord.current || 0);

      if (target > 0) {
        studyGoalProgress = Math.min(100, Math.round((completed / target) * 100));

        if (studyGoalProgress >= 80) {
          // 0 points
        } else if (studyGoalProgress >= 60) {
          riskScore += 5;
        } else if (studyGoalProgress >= 40) {
          riskScore += 10;
          reasons.push(`Weekly study goal is ${studyGoalProgress}% complete.`);
        } else {
          riskScore += 20;
          reasons.push(`Weekly study goal is only ${studyGoalProgress}% complete.`);
        }
      }
    }

    // 5. STUDY CONSISTENCY FACTOR
    const subjectSessions = sessionsMap.get(subjectId) || [];
    const consistency = evaluateStudyConsistency(subjectSessions);

    if (consistency.status === "Poor") {
      riskScore += 10;
      reasons.push("Study routine has been irregular over the past 14 days.");
    } else if (consistency.status === "Moderate") {
      riskScore += 5;
    }

    // NORMALIZATION & LEVEL ASSIGNMENT
    const finalScore = Math.min(100, Math.max(0, riskScore));

    let riskLevel = "LOW";
    let statusMessage = "Your performance is currently stable.";
    let suggestedActions = ["Maintain your current study routine."];
    let recommendedDuration = 45;
    let recommendedPriority = "Low";

    if (finalScore >= 60) {
      riskLevel = "HIGH";
      statusMessage = "This subject requires immediate attention.";
      suggestedActions = [
        "Schedule focused study time.",
        "Complete overdue assignments.",
        "Review weak topics.",
        "Monitor attendance.",
      ];
      recommendedDuration = 90;
      recommendedPriority = "High";
    } else if (finalScore >= 30) {
      riskLevel = "MEDIUM";
      statusMessage = "This subject needs attention.";
      suggestedActions = [
        "Increase study time.",
        "Monitor attendance.",
        "Complete pending assignments.",
      ];
      recommendedDuration = 60;
      recommendedPriority = "Medium";
    }

    return {
      subjectId,
      subjectName,
      riskScore: finalScore,
      riskLevel,
      statusMessage,
      suggestedActions,
      recommendedDuration,
      recommendedPriority,
      attendance: attendancePercentage,
      gradePoint,
      overdueAssignments: overdueCount,
      studyGoalProgress,
      reasons,
    };
  });
}