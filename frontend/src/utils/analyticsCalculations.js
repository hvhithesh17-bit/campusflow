// src/utils/analyticsCalculations.js

/**
 * Returns today's date formatted as YYYY-MM-DD in local time.
 */
export function getLocalDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 1. Transform raw attendance & subjects into Chart-Ready datasets.
 * Matches records using subjectId with fallback to subjectName.
 */
export function transformAttendanceChartData(subjects = [], attendance = []) {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    if (!Array.isArray(attendance) || attendance.length === 0) return [];
    return attendance.map((att) => {
      const a = Number(att.attendedClasses ?? att.attended ?? 0);
      const t = Number(att.totalClasses ?? att.total ?? 0);
      const pct = t > 0 ? Math.round((a / t) * 100) : 0;
      return {
        subject: att.subjectName || "Subject",
        attendance: pct,
        attended: a,
        total: t,
        fill: pct >= 85 ? "#16a34a" : pct >= 75 ? "#2563eb" : "#dc2626",
      };
    });
  }

  return subjects.map((sub) => {
    const att = attendance.find(
      (a) => a.subjectId === sub.id || a.subjectName === sub.name
    );
    const a = Number(att?.attendedClasses ?? att?.attended ?? 0);
    const t = Number(att?.totalClasses ?? att?.total ?? 0);
    const pct = t > 0 ? Math.round((a / t) * 100) : 0;

    return {
      subject: sub.name,
      attendance: pct,
      attended: a,
      total: t,
      fill: t === 0 ? "#94a3b8" : pct >= 85 ? "#16a34a" : pct >= 75 ? "#2563eb" : "#dc2626",
    };
  });
}

/**
 * 2. Calculate Weekly Study Hours grouped by Day (Mon-Sun).
 * Converts accumulated minutes to decimal hours.
 */
export function calculateWeeklyStudyHours(studySessions = [], referenceDate = new Date()) {
  const days = [
    { short: "Mon", full: "Monday" },
    { short: "Tue", full: "Tuesday" },
    { short: "Wed", full: "Wednesday" },
    { short: "Thu", full: "Thursday" },
    { short: "Fri", full: "Friday" },
    { short: "Sat", full: "Saturday" },
    { short: "Sun", full: "Sunday" },
  ];

  const dayOfWeek = referenceDate.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() - diffToMonday);

  const weekTemplate = days.map((d, index) => {
    const target = new Date(monday);
    target.setDate(monday.getDate() + index);
    return {
      day: d.short,
      fullDay: d.full,
      dateStr: getLocalDateString(target),
      minutes: 0,
      hours: 0,
    };
  });

  if (!Array.isArray(studySessions) || studySessions.length === 0) {
    return weekTemplate;
  }

  studySessions.forEach((session) => {
    if (session.status === "Completed" && session.date) {
      const match = weekTemplate.find((d) => d.dateStr === session.date);
      if (match) {
        match.minutes += Number(session.duration) || 0;
      }
    }
  });

  return weekTemplate.map((d) => ({
    ...d,
    hours: parseFloat((d.minutes / 60).toFixed(1)),
  }));
}

/**
 * 3. Transform Subject Grade Points for Performance Bar Chart.
 */
export function transformSubjectPerformanceData(subjects = []) {
  if (!Array.isArray(subjects)) return [];

  return subjects
    .filter(
      (s) =>
        s.gradePoint !== null &&
        s.gradePoint !== undefined &&
        !isNaN(Number(s.gradePoint)) &&
        s.grade &&
        s.grade !== ""
    )
    .map((s) => {
      const gp = Number(s.gradePoint);
      return {
        subject: s.name,
        gradePoint: gp,
        grade: s.grade,
        credits: Number(s.credits) || 0,
        fill: gp >= 9 ? "#16a34a" : gp >= 8 ? "#2563eb" : gp >= 7 ? "#0891b2" : gp >= 6 ? "#d97706" : "#dc2626",
      };
    });
}

/**
 * 4. Transform Assignment Statuses for Pie Chart.
 */
export function transformAssignmentStatusData(assignments = []) {
  if (!Array.isArray(assignments) || assignments.length === 0) return [];

  const todayStr = getLocalDateString();
  let completed = 0;
  let pending = 0;
  let overdue = 0;

  assignments.forEach((task) => {
    if (task.status === "Completed") {
      completed += 1;
    } else {
      const dueDate = task.dueDate || task.date || "";
      if (dueDate && dueDate < todayStr) {
        overdue += 1;
      } else {
        pending += 1;
      }
    }
  });

  const dataset = [];
  if (completed > 0) dataset.push({ name: "Completed", value: completed, color: "#16a34a" });
  if (pending > 0) dataset.push({ name: "Pending", value: pending, color: "#2563eb" });
  if (overdue > 0) dataset.push({ name: "Overdue", value: overdue, color: "#dc2626" });

  return dataset;
}

/**
 * 5. Calculate Comprehensive Academic Summary Statistics.
 */
export function calculateAcademicSummary({ subjects = [], attendance = [], assignments = [], studySessions = [], dateFilter = "week" }) {
  // SGPA Calculation
  const gradedSubjects = subjects.filter(
    (s) => s.grade && s.gradePoint !== null && !isNaN(Number(s.gradePoint)) && Number(s.credits) > 0
  );
  const totalGradedCredits = gradedSubjects.reduce((sum, s) => sum + Number(s.credits), 0);
  const totalQualityPoints = gradedSubjects.reduce((sum, s) => sum + Number(s.credits) * Number(s.gradePoint), 0);
  const currentSGPA = totalGradedCredits > 0 ? (totalQualityPoints / totalGradedCredits).toFixed(2) : "—";
  const totalCredits = subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);

  // Overall Attendance Calculation
  let totalAttended = 0;
  let totalClasses = 0;
  attendance.forEach((r) => {
    totalAttended += Number(r.attendedClasses ?? r.attended ?? 0);
    totalClasses += Number(r.totalClasses ?? r.total ?? 0);
  });
  const overallAttendance = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : null;

  // Assignment Completion Rate
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter((a) => a.status === "Completed").length;
  const assignmentCompletionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  // Filtered Study Hours
  const now = new Date();
  let filteredSessions = studySessions.filter((s) => s.status === "Completed");

  if (dateFilter === "week") {
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const mondayStr = getLocalDateString(monday);
    filteredSessions = filteredSessions.filter((s) => s.date >= mondayStr);
  } else if (dateFilter === "month") {
    const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    filteredSessions = filteredSessions.filter((s) => s.date >= monthStartStr);
  }

  const totalStudyMinutes = filteredSessions.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

  return {
    currentSGPA,
    totalCredits,
    totalGradedCredits,
    overallAttendance,
    totalAttended,
    totalClasses,
    totalAssignments,
    completedAssignments,
    assignmentCompletionRate,
    totalStudyHours,
    totalStudyMinutes,
  };
}

/**
 * 6. Deterministic Rule-based Insights Generator.
 */
export function generateAnalyticsInsights({ subjects = [], attendance = [], assignments = [], studySessions = [], dateFilter = "week" }) {
  const insights = [];
  const todayStr = getLocalDateString();

  // 1. Attendance Analysis
  const attendanceWithMetrics = attendance
    .map((r) => {
      const a = Number(r.attendedClasses ?? r.attended ?? 0);
      const t = Number(r.totalClasses ?? r.total ?? 0);
      return {
        name: r.subjectName || "Subject",
        pct: t > 0 ? Math.round((a / t) * 100) : null,
      };
    })
    .filter((r) => r.pct !== null);

  if (attendanceWithMetrics.length > 0) {
    const lowestAtt = [...attendanceWithMetrics].sort((a, b) => a.pct - b.pct)[0];
    const highestAtt = [...attendanceWithMetrics].sort((a, b) => b.pct - a.pct)[0];

    if (lowestAtt && lowestAtt.pct < 75) {
      insights.push({
        type: "attendance",
        severity: "critical",
        title: "Low Attendance Warning",
        message: `${lowestAtt.name} attendance is critically low at ${lowestAtt.pct}%. Maintain ≥75% to stay eligible.`,
      });
    }

    if (highestAtt && highestAtt.pct >= 85) {
      insights.push({
        type: "attendance",
        severity: "success",
        title: "Attendance Strength",
        message: `Excellent consistency in ${highestAtt.name} with ${highestAtt.pct}% attendance.`,
      });
    }
  }

  // 2. Subject Performance Analysis
  const graded = subjects.filter((s) => s.gradePoint !== null && !isNaN(Number(s.gradePoint)));
  if (graded.length > 0) {
    const strongest = [...graded].sort((a, b) => Number(b.gradePoint) - Number(a.gradePoint))[0];
    const weakest = [...graded].sort((a, b) => Number(a.gradePoint) - Number(b.gradePoint))[0];

    if (strongest) {
      insights.push({
        type: "performance",
        severity: "success",
        title: "Top Academic Subject",
        message: `${strongest.name} is your highest scoring subject with a Grade Point of ${strongest.gradePoint} (${strongest.grade || "N/A"}).`,
      });
    }

    if (weakest && Number(weakest.gradePoint) < 7) {
      insights.push({
        type: "performance",
        severity: "warning",
        title: "Subject Needs Attention",
        message: `${weakest.name} has a Grade Point of ${weakest.gradePoint}. Prioritize revision for upcoming assessments.`,
      });
    }
  }

  // 3. Study Hours Breakdown by Subject
  const completedSessions = studySessions.filter((s) => s.status === "Completed");
  const subjectStudyMap = {};
  completedSessions.forEach((s) => {
    const subName = s.subjectName || "General";
    subjectStudyMap[subName] = (subjectStudyMap[subName] || 0) + (Number(s.duration) || 0);
  });

  const studyEntries = Object.entries(subjectStudyMap).sort((a, b) => b[1] - a[1]);
  if (studyEntries.length > 0) {
    const [topSubject, topMinutes] = studyEntries[0];
    const topHours = (topMinutes / 60).toFixed(1);
    insights.push({
      type: "study",
      severity: "info",
      title: "Study Focus",
      message: `You spent ${topHours} hours studying ${topSubject} (${dateFilter === "week" ? "this week" : "this month"}).`,
    });
  }

  // 4. Overdue Tasks Check
  const overdueCount = assignments.filter(
    (a) => a.status !== "Completed" && a.dueDate && a.dueDate < todayStr
  ).length;

  if (overdueCount > 0) {
    insights.push({
      type: "assignment",
      severity: "critical",
      title: "Overdue Workload",
      message: `You have ${overdueCount} overdue assignment(s). Clear pending submissions to avoid late penalties.`,
    });
  }

  return insights;
}