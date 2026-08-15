// src/utils/aiContextBuilder.js
import { calculateSGPA, calculateOverallAttendance } from "./dashboardUtils";
import { generateStudyRecommendations, getCurrentWeekStartDate, getTodayDateString } from "./studyRecommendations";

/**
 * Transforms raw Firebase documents into a clean, safe, and structured
 * academic context object tailored for LLM reasoning.
 *
 * Excludes sensitive fields (tokens, passwords, database internal keys).
 */
export function buildAcademicContext({
  currentUser,
  subjects = [],
  attendance = [],
  assignments = [],
  studySessions = [],
  studyGoals = [],
}) {
  const studentName =
    currentUser?.displayName ||
    currentUser?.email?.split("@")[0] ||
    "Student";

  // 1. SGPA & Credit Metrics (Reusing calculation engine)
  const sgpaResult = calculateSGPA(subjects);
  const overallAttendanceResult = calculateOverallAttendance(attendance);

  // 2. Clean Subject & Grade Information
  const formattedSubjects = subjects.map((s) => ({
    name: s.name,
    credits: Number(s.credits) || 0,
    grade: s.grade || "In Progress",
    gradePoint: s.gradePoint !== null && s.gradePoint !== undefined ? Number(s.gradePoint) : null,
  }));

  // 3. Clean Attendance by Subject
  const formattedAttendance = subjects.map((sub) => {
    const record = attendance.find(
      (a) => a.subjectId === sub.id || a.subjectName === sub.name
    );
    const attended = Number(record?.attendedClasses ?? record?.attended ?? 0);
    const total = Number(record?.totalClasses ?? record?.total ?? 0);
    const percentage = total > 0 ? Math.round((attended / total) * 100) : null;

    return {
      subject: sub.name,
      attendedClasses: attended,
      totalClasses: total,
      percentage: percentage !== null ? `${percentage}%` : "No classes recorded",
    };
  });

  // 4. Assignments Summary & Overdue Classification
  const todayStr = getTodayDateString();
  let completedCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;
  const assignmentDetails = [];

  assignments.forEach((task) => {
    const isCompleted = task.status === "Completed";
    const dueDate = task.dueDate || task.date || "";
    const isOverdue = !isCompleted && Boolean(dueDate && dueDate < todayStr);

    if (isCompleted) completedCount += 1;
    else {
      pendingCount += 1;
      if (isOverdue) overdueCount += 1;
    }

    assignmentDetails.push({
      title: task.title || task.name || "Untitled",
      subject: task.subjectName || "General",
      dueDate: dueDate || "Not set",
      status: isCompleted ? "Completed" : isOverdue ? "Overdue" : "Pending",
    });
  });

  // 5. Weekly Study Time & Goals
  const weekStartStr = getCurrentWeekStartDate();
  const weeklyStudyMinutes = studySessions
    .filter((s) => s.status === "Completed" && s.date && s.date >= weekStartStr)
    .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);

  const weeklyGoalMinutes = studyGoals.reduce(
    (sum, g) => sum + (Number(g.targetMinutes) || 0),
    0
  );

  // 6. Pre-computed Study Recommendations (Reusing Day 14 Rule Engine)
  const recommendations = generateStudyRecommendations({
    subjects,
    attendance,
    assignments,
    studySessions,
    studyGoals,
  }).map((r) => ({
    subject: r.subjectName,
    priority: r.priority,
    score: r.score,
    recommendedMinutes: r.recommendedMinutes,
    reasons: r.reasons,
  }));

  return {
    studentName,
    academicStanding: {
      sgpa: sgpaResult.sgpa,
      status: sgpaResult.status,
      totalGradedCredits: sgpaResult.totalGradedCredits,
      totalCredits: subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0),
      overallAttendance: overallAttendanceResult.formatted,
    },
    subjects: formattedSubjects,
    attendance: formattedAttendance,
    assignments: {
      total: assignments.length,
      pending: pendingCount,
      completed: completedCount,
      overdue: overdueCount,
      list: assignmentDetails.slice(0, 8),
    },
    study: {
      weeklyCompletedMinutes: weeklyStudyMinutes,
      weeklyCompletedHours: parseFloat((weeklyStudyMinutes / 60).toFixed(1)),
      weeklyGoalMinutes,
      weeklyGoalHours: parseFloat((weeklyGoalMinutes / 60).toFixed(1)),
    },
    topStudyRecommendations: recommendations,
  };
}