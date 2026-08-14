// src/utils/analyticsUtils.js

/**
 * 1. Formats attendance data for a Comparative Bar Chart.
 * Adds visual color coding based on the 75% attendance threshold.
 */
export function formatAttendanceChartData(attendance = []) {
  if (!Array.isArray(attendance) || attendance.length === 0) return [];

  return attendance.map((rec) => {
    const attended = Number(rec.attendedClasses ?? rec.attended ?? 0);
    const total = Number(rec.totalClasses ?? rec.total ?? 0);
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

    return {
      name: rec.subjectName || "Subject",
      attendance: percentage,
      attended,
      total,
      fill: percentage >= 85 ? "#16a34a" : percentage >= 75 ? "#2563eb" : "#dc2626",
    };
  });
}

/**
 * 2. Formats weekly study data for a 7-day Daily Trend Area Chart (Mon-Sun).
 */
export function formatWeeklyDailyTrend(studySessions = []) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const now = new Date();
  const diffToMonday = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);

  // Pre-fill all 7 days with 0 minutes
  const dayMap = days.map((dayName, index) => {
    const dateObj = new Date(monday);
    dateObj.setDate(monday.getDate() + index);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return {
      day: dayName,
      dateStr: `${y}-${m}-${d}`,
      minutes: 0,
      hours: 0,
    };
  });

  studySessions.forEach((s) => {
    if (s.status === "Completed" && s.date) {
      const match = dayMap.find((d) => d.dateStr === s.date);
      if (match) {
        match.minutes += Number(s.duration) || 0;
      }
    }
  });

  return dayMap.map((d) => ({
    day: d.day,
    minutes: d.minutes,
    hours: parseFloat((d.minutes / 60).toFixed(1)),
  }));
}

/**
 * 3. Formats study time by subject for a Donut/Pie Chart.
 */
export function formatStudySubjectDistribution(studySessions = []) {
  if (!Array.isArray(studySessions) || studySessions.length === 0) return [];

  const subjectMap = {};
  const palette = ["#2563eb", "#8b5cf6", "#0891b2", "#ea580c", "#16a34a", "#f59e0b", "#ec4899"];

  studySessions.forEach((s) => {
    if (s.status === "Completed") {
      const name = s.subjectName || "General";
      const dur = Number(s.duration) || 0;
      subjectMap[name] = (subjectMap[name] || 0) + dur;
    }
  });

  return Object.entries(subjectMap)
    .filter(([_, minutes]) => minutes > 0)
    .map(([name, minutes], index) => ({
      name,
      minutes,
      hours: parseFloat((minutes / 60).toFixed(1)),
      fill: palette[index % palette.length],
    }));
}

/**
 * 4. Formats assignment status distribution for a Pie Chart.
 */
export function formatAssignmentDistribution(assignments = []) {
  if (!Array.isArray(assignments) || assignments.length === 0) return [];

  const todayStr = new Date().toISOString().split("T")[0];
  let completed = 0;
  let pending = 0;
  let overdue = 0;

  assignments.forEach((a) => {
    if (a.status === "Completed") {
      completed += 1;
    } else {
      const dueDate = a.dueDate || a.date || "";
      if (dueDate && dueDate < todayStr) {
        overdue += 1;
      } else {
        pending += 1;
      }
    }
  });

  const data = [];
  if (completed > 0) data.push({ name: "Completed", value: completed, fill: "#16a34a" });
  if (pending > 0) data.push({ name: "Pending", value: pending, fill: "#2563eb" });
  if (overdue > 0) data.push({ name: "Overdue", value: overdue, fill: "#dc2626" });

  return data;
}

/**
 * 5. Formats subject grades and grade points for a Performance Bar Chart.
 */
export function formatSubjectGradeChartData(subjects = []) {
  if (!Array.isArray(subjects) || subjects.length === 0) return [];

  return subjects
    .filter((s) => s.gradePoint !== null && s.gradePoint !== undefined && !isNaN(Number(s.gradePoint)))
    .map((s) => {
      const gp = Number(s.gradePoint);
      return {
        name: s.name,
        gradePoint: gp,
        grade: s.grade || "",
        credits: Number(s.credits) || 0,
        fill: gp >= 9 ? "#16a34a" : gp >= 8 ? "#2563eb" : gp >= 7 ? "#0891b2" : gp >= 6 ? "#f59e0b" : "#dc2626",
      };
    });
}
// src/utils/analyticsUtils.js

/**
 * Calculates completed study hours for each day of the current week (Monday–Sunday).
 * 
 * Rules:
 * - Only sessions with status === "Completed" are counted.
 * - Days with 0 completed sessions show 0.0 hours.
 * - Minutes are converted to fractional hours (e.g. 90 mins -> 1.5 hrs).
 * 
 * @param {Array<Object>} studySessions - Raw studySessions from Firestore
 * @param {Date} [referenceDate=new Date()] - Reference date for the week
 * @returns {Array<{ day: string, fullDay: string, dateStr: string, minutes: number, hours: number }>}
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

  // 1. Calculate Monday's date of the reference week
  const dayOfWeek = referenceDate.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() - diffToMonday);

  // 2. Initialize the 7-day array
  const weeklyMap = days.map((item, index) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    return {
      day: item.short,
      fullDay: item.full,
      dateStr,
      minutes: 0,
      hours: 0,
    };
  });

  if (!Array.isArray(studySessions) || studySessions.length === 0) {
    return weeklyMap;
  }

  // 3. Filter & Aggregate completed durations
  studySessions.forEach((session) => {
    if (session.status === "Completed" && session.date) {
      const match = weeklyMap.find((d) => d.dateStr === session.date);
      if (match) {
        const duration = Number(session.duration) || 0;
        match.minutes += duration;
      }
    }
  });

  // 4. Convert minutes to hours rounded to 1 decimal place
  return weeklyMap.map((d) => ({
    ...d,
    hours: parseFloat((d.minutes / 60).toFixed(1)),
  }));
}