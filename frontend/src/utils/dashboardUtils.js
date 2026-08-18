// src/utils/dashboardUtils.js

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
 * Generates a dynamic greeting based on the user's local hour.
 */
export function getTimeBasedGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

/**
 * 1. Calculates Credit-Weighted SGPA.
 */
export function calculateSGPA(subjects = []) {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return { sgpa: "—", numericSgpa: null, totalGradedCredits: 0, hasGradedSubjects: false, status: "No Grades" };
  }

  const graded = subjects.filter((s) => {
    const cr = Number(s.credits);
    const gp = Number(s.gradePoint);
    return s.grade && s.grade !== "" && !isNaN(cr) && cr > 0 && !isNaN(gp);
  });

  if (graded.length === 0) {
    return { sgpa: "—", numericSgpa: null, totalGradedCredits: 0, hasGradedSubjects: false, status: "No Grades" };
  }

  const totalCredits = graded.reduce((sum, s) => sum + Number(s.credits), 0);
  const totalQualityPoints = graded.reduce((sum, s) => sum + Number(s.credits) * Number(s.gradePoint), 0);
  const numericSgpa = parseFloat((totalQualityPoints / totalCredits).toFixed(2));

  let status = "Needs Attention";
  if (numericSgpa >= 9.0) status = "Outstanding";
  else if (numericSgpa >= 8.0) status = "Very Good";
  else if (numericSgpa >= 7.0) status = "Good";
  else if (numericSgpa >= 6.0) status = "Needs Improvement";

  return {
    sgpa: numericSgpa.toFixed(2),
    numericSgpa,
    totalGradedCredits: totalCredits,
    hasGradedSubjects: true,
    status,
  };
}

/**
 * 2. Calculates Overall Aggregate Attendance Percentage.
 */
export function calculateOverallAttendance(attendanceRecords = []) {
  if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
    return { percentage: null, formatted: "—", attended: 0, total: 0, hasRecords: false, status: "No Records" };
  }

  let totalAttended = 0;
  let totalClasses = 0;

  attendanceRecords.forEach((r) => {
    const a = Number(r.attendedClasses ?? r.attended ?? 0);
    const t = Number(r.totalClasses ?? r.total ?? 0);
    if (!isNaN(a) && a > 0) totalAttended += a;
    if (!isNaN(t) && t > 0) totalClasses += t;
  });

  if (totalClasses === 0) {
    return { percentage: null, formatted: "—", attended: 0, total: 0, hasRecords: false, status: "No Classes" };
  }

  const pct = Math.round((totalAttended / totalClasses) * 100);
  let status = "Critical";
  if (pct >= 85) status = "Excellent";
  else if (pct >= 75) status = "Good";
  else if (pct >= 65) status = "Warning";

  return {
    percentage: pct,
    formatted: `${pct}%`,
    attended: totalAttended,
    total: totalClasses,
    hasRecords: true,
    status,
  };
}

/**
 * 3. Assignment Metrics & Next Deadline.
 */
export function calculateAssignmentStats(assignments = []) {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return { total: 0, completed: 0, pending: 0, overdue: 0, nextDeadline: null, upcomingList: [] };
  }

  const todayStr = getTodayDateString();
  let completed = 0;
  let pending = 0;
  let overdue = 0;
  const pendingItems = [];

  assignments.forEach((task) => {
    const isDone = task.status === "Completed";
    const dueDate = task.dueDate || task.date || "";

    if (isDone) {
      completed += 1;
    } else {
      pending += 1;
      if (dueDate && dueDate < todayStr) {
        overdue += 1;
      }
      pendingItems.push(task);
    }
  });

  // Sort upcoming pending items by due date ascending
  pendingItems.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  return {
    total: assignments.length,
    completed,
    pending,
    overdue,
    nextDeadline: pendingItems.length > 0 ? pendingItems[0] : null,
    upcomingList: pendingItems.slice(0, 5),
  };
}

/**
 * 4. Today's Study Plan & Progress.
 */
export function calculateTodayStudyStats(studySessions = []) {
  if (!Array.isArray(studySessions) || studySessions.length === 0) {
    return { todaySessions: [], totalCount: 0, completedCount: 0, progressPercentage: 0 };
  }

  const todayStr = getTodayDateString();
  const todaySessions = studySessions
    .filter((s) => s.date === todayStr)
    .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

  const totalCount = todaySessions.length;
  const completedCount = todaySessions.filter((s) => s.status === "Completed").length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    todaySessions,
    totalCount,
    completedCount,
    progressPercentage,
  };
}

/**
 * 5. Weekly Study Stats (Aggregated Monday through Sunday).
 */
export function calculateWeeklyStudyStats(studySessions = []) {
  const now = new Date();
  const diffToMonday = (now.getDay() + 6) % 7;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const completedSessions = studySessions.filter((s) => {
    if (s.status !== "Completed" || !s.date) return false;
    const sessionDate = new Date(`${s.date}T00:00:00`);
    return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
  });

  const subjectMap = {};
  let totalMinutes = 0;

  completedSessions.forEach((s) => {
    const name = s.subjectName || "General Study";
    const dur = Number(s.duration) || 0;
    subjectMap[name] = (subjectMap[name] || 0) + dur;
    totalMinutes += dur;
  });

  const formatHoursMinutes = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${String(m).padStart(2, "0")}m`;
  };

  return {
    totalWeeklyMinutes: totalMinutes,
    formattedTotal: formatHoursMinutes(totalMinutes),
    subjectBreakdown: Object.entries(subjectMap).map(([subject, mins]) => ({
      subject,
      minutes: mins,
      formatted: formatHoursMinutes(mins),
    })),
  };
}

/**
 * 6. Rule-based Academic Health Indicator.
 */
export function calculateAcademicHealth({ sgpaData, attendanceData, assignmentData, studyData }) {
  let score = 100;
  const explanations = [];

  // SGPA Check (Weight: up to -30)
  if (sgpaData.numericSgpa !== null) {
    if (sgpaData.numericSgpa < 6.0) {
      score -= 30;
      explanations.push("SGPA is below 6.0 (Critical standing).");
    } else if (sgpaData.numericSgpa < 7.5) {
      score -= 15;
      explanations.push("SGPA is below 7.5; prioritize revision.");
    } else {
      explanations.push("Academic grades and SGPA are strong.");
    }
  } else {
    explanations.push("No graded courses recorded yet.");
  }

  // Attendance Check (Weight: up to -30)
  if (attendanceData.percentage !== null) {
    if (attendanceData.percentage < 65) {
      score -= 30;
      explanations.push(`Overall attendance is critical at ${attendanceData.percentage}%.`);
    } else if (attendanceData.percentage < 75) {
      score -= 20;
      explanations.push(`Overall attendance (${attendanceData.percentage}%) is below the 75% threshold.`);
    } else {
      explanations.push(`Attendance is solid at ${attendanceData.percentage}%.`);
    }
  }

  // Overdue Assignments Check (Weight: -15 per overdue, capped at -30)
  if (assignmentData.overdue > 0) {
    score -= Math.min(30, assignmentData.overdue * 15);
    explanations.push(`You have ${assignmentData.overdue} overdue assignment(s).`);
  }

  // Study Sessions Activity Check
  if (studyData?.totalCount > 0 && studyData.progressPercentage < 50) {
    explanations.push(`Daily study completion is at ${studyData.progressPercentage}%.`);
  }

  score = Math.max(0, Math.min(100, score));

  let status = "Critical";
  let color = "#dc2626";
  let bg = "#fef2f2";
  let border = "#fca5a5";

  if (score >= 85) {
    status = "Excellent";
    color = "#16a34a";
    bg = "#f0fdf4";
    border = "#86efac";
  } else if (score >= 70) {
    status = "Good";
    color = "#2563eb";
    bg = "#eff6ff";
    border = "#bfdbfe";
  } else if (score >= 50) {
    status = "Needs Improvement";
    color = "#d97706";
    bg = "#fffbeb";
    border = "#fde68a";
  }

  return { score, status, color, bg, border, summary: explanations.join(" ") };
}

/**
 * 7. Generates dynamic, rule-based Academic Alerts.
 */
export function generateAcademicAlerts({ subjects, attendance, assignments, studySessions, studyGoals }) {
  const alerts = [];
  const todayStr = getTodayDateString();

  // 1. Low Attendance Alerts (per subject)
  attendance.forEach((rec) => {
    const att = Number(rec.attendedClasses ?? rec.attended ?? 0);
    const tot = Number(rec.totalClasses ?? rec.total ?? 0);
    if (tot > 0) {
      const pct = Math.round((att / tot) * 100);
      if (pct < 75) {
        alerts.push({
          id: `att_${rec.id || rec.subjectId}`,
          type: "attendance",
          severity: pct < 65 ? "critical" : "warning",
          title: "Low Attendance Warning",
          message: `${rec.subjectName || "Subject"} attendance is currently at ${pct}%. Target is ≥75%.`,
        });
      }
    }
  });

  // 2. Overdue Assignment Alerts
  assignments.forEach((task) => {
    if (task.status !== "Completed" && task.dueDate && task.dueDate < todayStr) {
      alerts.push({
        id: `asg_${task.id}`,
        type: "assignment",
        severity: "critical",
        title: "Overdue Assignment",
        message: `"${task.title || "Assignment"}" was due on ${task.dueDate}.`,
      });
    }
  });

  // 3. Subject Grade Alerts
  subjects.forEach((sub) => {
    if (sub.gradePoint !== null && sub.gradePoint !== undefined && Number(sub.gradePoint) < 7) {
      alerts.push({
        id: `sub_${sub.id}`,
        type: "subject",
        severity: "warning",
        title: "Subject Needs Improvement",
        message: `${sub.name} grade point is ${sub.gradePoint} (${sub.grade || "N/A"}). Consider extra study blocks.`,
      });
    }
  });

  // 4. Incomplete Study Sessions Today
  const pendingTodaySessions = studySessions.filter((s) => s.date === todayStr && s.status !== "Completed");
  if (pendingTodaySessions.length > 0) {
    alerts.push({
      id: "study_today_pending",
      type: "study",
      severity: "info",
      title: "Study Sessions Pending Today",
      message: `You have ${pendingTodaySessions.length} study session(s) scheduled for today.`,
    });
  }

  // 5. Incomplete Study Goals
  if (studyGoals && Array.isArray(studyGoals)) {
    const activeGoals = studyGoals.filter((g) => g.status !== "Completed");
    if (activeGoals.length > 3) {
      alerts.push({
        id: "goals_active_alert",
        type: "study",
        severity: "info",
        title: "Active Study Goals",
        message: `You have ${activeGoals.length} active academic milestones in progress.`,
      });
    }
  }

  return alerts;
}

/**
 * 8. Aggregates and sorts recent activity from existing Firestore documents with timestamps.
 */
export function getRecentActivity({ subjects, attendance, assignments, studySessions }) {
  const activities = [];

  subjects.forEach((s) => {
    if (s.createdAt?.toDate) {
      activities.push({
        id: `sub_${s.id}`,
        text: `Enrolled course: ${s.name}`,
        date: s.createdAt.toDate(),
        icon: "book",
      });
    }
  });

  if (attendance && Array.isArray(attendance)) {
    attendance.forEach((att) => {
      if (att.updatedAt?.toDate) {
        activities.push({
          id: `att_${att.id}`,
          text: `Updated attendance: ${att.subjectName || "Course"} (${att.percentage || 0}%)`,
          date: att.updatedAt.toDate(),
          icon: "attendance",
        });
      }
    });
  }

  assignments.forEach((a) => {
    if (a.createdAt?.toDate) {
      activities.push({
        id: `asg_${a.id}`,
        text: a.status === "Completed" ? `Completed task: ${a.title}` : `Added task: ${a.title}`,
        date: a.createdAt.toDate(),
        icon: "assignment",
      });
    }
  });

  studySessions.forEach((s) => {
    if (s.createdAt?.toDate) {
      activities.push({
        id: `std_${s.id}`,
        text: s.status === "Completed" ? `Finished study block: ${s.topic}` : `Scheduled study: ${s.topic}`,
        date: s.createdAt.toDate(),
        icon: "study",
      });
    }
  });

  return activities.sort((a, b) => b.date - a.date).slice(0, 6);
}