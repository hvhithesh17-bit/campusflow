// src/utils/attendance.js

/**
 * Calculates the attendance percentage safely.
 */
export function calculateAttendancePercentage(attended, total) {
  const attendedNum = Number(attended);
  const totalNum = Number(total);

  if (isNaN(attendedNum) || isNaN(totalNum) || totalNum <= 0) {
    return 0;
  }
  if (attendedNum < 0) {
    return 0;
  }
  if (attendedNum > totalNum) {
    return 100;
  }

  const percentage = (attendedNum / totalNum) * 100;
  return Number(percentage.toFixed(2));
}

/**
 * Evaluates attendance percentage and returns status, message, and color styling.
 */
export function getAttendanceStatus(percentage) {
  const val = Number(percentage);

  if (val >= 85) {
    return {
      status: "Excellent",
      message: "Outstanding attendance! Keep it up.",
      variant: "success",
      color: "#15803d",
      bgColor: "#f0fdf4",
      borderColor: "#86efac",
    };
  }

  if (val >= 75) {
    return {
      status: "Good",
      message: "Above the mandatory 75% attendance threshold.",
      variant: "info",
      color: "#0369a1",
      bgColor: "#f0f9ff",
      borderColor: "#7dd3fc",
    };
  }

  if (val >= 65) {
    return {
      status: "Warning",
      message: "Approaching the minimum limit. Try not to miss classes.",
      variant: "warning",
      color: "#b45309",
      bgColor: "#fffbeb",
      borderColor: "#fde68a",
    };
  }

  return {
    status: "Critical",
    message: "Below minimum requirement! High risk of debarment.",
    variant: "danger",
    color: "#b91c1c",
    bgColor: "#fef2f2",
    borderColor: "#fca5a5",
  };
}
// src/utils/attendance.js

/**
 * Calculates the number of consecutive classes required to reach a target attendance percentage.
 *
 * @param {number|string} attended - Classes attended so far
 * @param {number|string} total - Total classes held so far
 * @param {number} [targetPercentage=75] - Target attendance percentage (defaults to 75)
 * @returns {{ classesNeeded: number, possible: boolean, message: string }}
 */
export function calculateClassesNeeded(attended, total, targetPercentage = 75) {
  const A = Number(attended);
  const T = Number(total);
  const P = Number(targetPercentage);

  // 1. Validate numbers
  if (isNaN(A) || isNaN(T) || isNaN(P)) {
    return { classesNeeded: 0, possible: false, message: "Invalid numeric input." };
  }

  // 2. Validate bounds
  if (T <= 0) {
    return { classesNeeded: 0, possible: false, message: "Total classes must be greater than 0." };
  }
  if (A < 0 || A > T) {
    return { classesNeeded: 0, possible: false, message: "Attended classes cannot exceed total classes." };
  }

  // 3. Target is greater than 100%
  if (P > 100) {
    return {
      classesNeeded: 0,
      possible: false,
      message: "Target attendance cannot exceed 100%.",
    };
  }

  // 4. Target is 0% or lower
  if (P <= 0) {
    return {
      classesNeeded: 0,
      possible: true,
      message: "Target percentage already met.",
    };
  }

  // 5. Check if already meeting or exceeding target
  const currentPercentage = (A / T) * 100;
  if (currentPercentage >= P) {
    return {
      classesNeeded: 0,
      possible: true,
      message: `You are already at or above your ${P}% target!`,
    };
  }

  // 6. Target is exactly 100%, but at least one class was missed
  if (P === 100) {
    return {
      classesNeeded: 0,
      possible: false,
      message: "100% attendance is impossible because classes have already been missed.",
    };
  }

  // 7. Calculate required classes
  const required = Math.ceil((P * T - 100 * A) / (100 - P));

  return {
    classesNeeded: required,
    possible: true,
    message: `Attend the next ${required} consecutive class${required > 1 ? "es" : ""} to reach ${P}%.`,
  };
}