// src/utils/assignmentUtils.js

/**
 * Calculates the deadline display status and styling.
 *
 * @param {string} deadlineStr - Due date formatted as 'YYYY-MM-DD'
 * @param {string} status - 'Pending' or 'Completed'
 * @returns {object} { label, variant, color, bgColor, borderColor, isOverdue }
 */
export function getDeadlineStatus(deadlineStr, status) {
  // 1. If already completed, ignore deadlines
  if (status === "Completed") {
    return {
      label: "Completed",
      variant: "completed",
      color: "#16a34a",
      bgColor: "#f0fdf4",
      borderColor: "#86efac",
      isOverdue: false,
    };
  }

  // Guard against missing deadline strings
  if (!deadlineStr) {
    return {
      label: "No Deadline",
      variant: "default",
      color: "#64748b",
      bgColor: "#f1f5f9",
      borderColor: "#cbd5e1",
      isOverdue: false,
    };
  }

  // 2. Normalize "Today" to midnight local time
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 3. Parse "YYYY-MM-DD" into local midnight date
  const [year, month, day] = deadlineStr.split("-").map(Number);
  const deadlineDate = new Date(year, month - 1, day);
  deadlineDate.setHours(0, 0, 0, 0);

  // 4. Calculate day difference
  const diffInMs = deadlineDate.getTime() - today.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

  // 5. Evaluate status rules
  if (diffInDays < 0) {
    const daysAgo = Math.abs(diffInDays);
    return {
      label: `Overdue (${daysAgo} ${daysAgo === 1 ? "day" : "days"} late)`,
      variant: "danger",
      color: "#dc2626",
      bgColor: "#fef2f2",
      borderColor: "#fca5a5",
      isOverdue: true,
    };
  }

  if (diffInDays === 0) {
    return {
      label: "Due Today",
      variant: "warning",
      color: "#d97706",
      bgColor: "#fffbeb",
      borderColor: "#fde68a",
      isOverdue: false,
    };
  }

  if (diffInDays === 1) {
    return {
      label: "Due Tomorrow",
      variant: "warning",
      color: "#d97706",
      bgColor: "#fffbeb",
      borderColor: "#fde68a",
      isOverdue: false,
    };
  }

  return {
    label: `Due in ${diffInDays} days`,
    variant: "info",
    color: "#2563eb",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    isOverdue: false,
  };
}
// src/utils/assignmentUtils.js

const PRIORITY_RANK = {
  High: 1,
  Medium: 2,
  Low: 3,
};

/**
 * Sorts assignments:
 * 1. Pending before Completed
 * 2. High -> Medium -> Low priority
 * 3. Nearest deadline first
 */
export function sortAssignments(assignments) {
  return [...assignments].sort((a, b) => {
    // 1. Status Check: Pending comes before Completed
    const aCompleted = a.status === "Completed";
    const bCompleted = b.status === "Completed";

    if (aCompleted !== bCompleted) {
      return aCompleted ? 1 : -1;
    }

    // 2. Priority Check: High (1) -> Medium (2) -> Low (3)
    const priorityA = PRIORITY_RANK[a.priority] || 2;
    const priorityB = PRIORITY_RANK[b.priority] || 2;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // 3. Deadline Check: Nearest due date first
    const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
    const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;

    return dateA - dateB;
  });
}
// src/utils/assignmentUtils.js

/**
 * Returns today's date formatted as YYYY-MM-DD in local time.
 */
export function getTodayDateString() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 1. Returns the total number of assignments.
 * @param {Array} assignments
 * @returns {number}
 */
export function getTotalAssignments(assignments = []) {
  if (!Array.isArray(assignments)) return 0;
  return assignments.length;
}

/**
 * 2. Returns the count of pending (incomplete) assignments.
 * @param {Array} assignments
 * @returns {number}
 */
export function getPendingAssignments(assignments = []) {
  if (!Array.isArray(assignments)) return 0;
  return assignments.filter((item) => item.status !== "Completed").length;
}

/**
 * 3. Returns the count of completed assignments.
 * @param {Array} assignments
 * @returns {number}
 */
export function getCompletedAssignments(assignments = []) {
  if (!Array.isArray(assignments)) return 0;
  return assignments.filter((item) => item.status === "Completed").length;
}

/**
 * 4. Returns the count of overdue assignments.
 * (Status is NOT completed AND due date is strictly before the reference date)
 * 
 * @param {Array} assignments
 * @param {string} [referenceDate] - YYYY-MM-DD string (defaults to today)
 * @returns {number}
 */
export function getOverdueAssignments(assignments = [], referenceDate = getTodayDateString()) {
  if (!Array.isArray(assignments)) return 0;

  return assignments.filter((item) => {
    const isPending = item.status !== "Completed";
    const dueDate = item.dueDate || item.date || "";
    
    // Check if item has a due date and that date has passed
    const isPastDue = Boolean(dueDate && dueDate < referenceDate);

    return isPending && isPastDue;
  }).length;
}