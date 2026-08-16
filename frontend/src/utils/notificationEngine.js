// src/utils/notificationEngine.js

/**
 * Pure generator function to derive smart reminders from academic state.
 * Generates deterministic relevantDate values for daily & entity-level deduplication.
 */
export function generateNotifications({
  subjects = [],
  attendance = [],
  assignments = [],
  studySessions = [],
  studyGoals = []
}) {
  const notifications = [];
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

  const subjectMap = subjects.reduce((acc, sub) => {
    acc[sub.id] = sub.name || "Subject";
    return acc;
  }, {});

  // 1. ATTENDANCE REMINDERS (<65% Critical, 65-74% Warning)
  attendance.forEach((record) => {
    const totalClasses = Number(record.totalClasses || record.total || 0);
    const attendedClasses = Number(record.attendedClasses || record.attended || 0);

    if (totalClasses > 0) {
      const percentage = Math.round((attendedClasses / totalClasses) * 100);
      const subjectName = subjectMap[record.subjectId] || record.subjectName || "Subject";
      const sourceId = record.subjectId || record.id || "unknown";

      if (percentage < 65) {
        notifications.push({
          sourceId: String(sourceId),
          relevantDate: todayStr,
          type: "low_attendance_critical",
          severity: "critical",
          targetRoute: "/attendance",
          title: "Critical Attendance Alert",
          message: `${subjectName} attendance dropped to ${percentage}%. Immediate attention needed.`
        });
      } else if (percentage < 75) {
        notifications.push({
          sourceId: String(sourceId),
          relevantDate: todayStr,
          type: "low_attendance_warning",
          severity: "warning",
          targetRoute: "/attendance",
          title: "Low Attendance",
          message: `${subjectName} attendance is ${percentage}%. Consider attending upcoming classes.`
        });
      }
    }
  });

  // 2. ASSIGNMENT REMINDERS (Overdue, Due Today, Due Soon within 24h)
  assignments.forEach((assignment) => {
    const isPending = assignment.status !== "completed" && !assignment.completed;
    if (assignment.dueDate && isPending) {
      const dueDate = new Date(assignment.dueDate);
      
      if (!isNaN(dueDate.getTime())) {
        const titleName = assignment.title || assignment.name || "Assignment";
        const sourceId = String(assignment.id);
        const dueLocalDateStr = dueDate.toISOString().split("T")[0];
        const diffMs = dueDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffMs < 0) {
          // Overdue
          notifications.push({
            sourceId,
            relevantDate: dueLocalDateStr,
            type: "assignment_overdue",
            severity: "critical",
            targetRoute: "/assignments",
            title: "Overdue Assignment",
            message: `"${titleName}" is overdue.`
          });
        } else if (dueLocalDateStr === todayStr) {
          // Due Today
          notifications.push({
            sourceId,
            relevantDate: todayStr,
            type: "assignment_due_today",
            severity: "critical",
            targetRoute: "/assignments",
            title: "Assignment Due Today",
            message: `"${titleName}" is due today.`
          });
        } else if (diffHours > 0 && diffHours <= 24) {
          // Due within 24 Hours
          notifications.push({
            sourceId,
            relevantDate: todayStr,
            type: "assignment_due_soon",
            severity: "warning",
            targetRoute: "/assignments",
            title: "Assignment Due Soon",
            message: `"${titleName}" is due within 24 hours.`
          });
        }
      }
    }
  });

  // 3. STUDY GOAL PROGRESS (<40% Warning, 40-79% Info, >=80% Success)
  studyGoals.forEach((goal) => {
    const target = Number(goal.targetHours || goal.target || 0);
    const completed = Number(goal.completedHours || goal.current || 0);

    if (target > 0) {
      const progress = Math.min(100, Math.round((completed / target) * 100));
      const subjectName = subjectMap[goal.subjectId] || goal.subjectName || goal.title || "Subject";
      const sourceId = String(goal.id);

      if (progress < 40) {
        notifications.push({
          sourceId,
          relevantDate: todayStr,
          type: "study_goal_behind",
          severity: "warning",
          targetRoute: "/planner",
          title: "Study Goal Behind",
          message: `Your ${subjectName} study goal is only ${progress}% complete.`
        });
      } else if (progress >= 80) {
        notifications.push({
          sourceId,
          relevantDate: todayStr,
          type: "study_goal_strong",
          severity: "success",
          targetRoute: "/planner",
          title: progress >= 100 ? "Study Goal Complete" : "Strong Goal Progress",
          message:
            progress >= 100
              ? `You completed your ${subjectName} weekly study goal.`
              : `Great work! Your ${subjectName} study goal is at ${progress}%.`
        });
      } else {
        // 40% - 79%
        notifications.push({
          sourceId,
          relevantDate: todayStr,
          type: "study_goal_progress",
          severity: "info",
          targetRoute: "/planner",
          title: "Study Goal In Progress",
          message: `Your ${subjectName} study goal is at ${progress}%. Keep going!`
        });
      }
    }
  });

  // 4. STUDY SESSIONS SCHEDULED FOR TODAY
  studySessions.forEach((session) => {
    if (session.date) {
      const sessionDateStr = new Date(session.date).toISOString().split("T")[0];
      if (sessionDateStr === todayStr && !session.completed) {
        const subjectName = subjectMap[session.subjectId] || session.subjectName || "Study Session";
        const topic = session.topic || session.title || "General Revision";
        const time = session.time || session.startTime || "Scheduled Time";

        notifications.push({
          sourceId: String(session.id),
          relevantDate: todayStr,
          type: "study_session_today",
          severity: "info",
          targetRoute: "/planner",
          title: "Study Session Today",
          message: `${subjectName} — ${topic} is scheduled for ${time}.`
        });
      }
    }
  });

  return notifications;
}