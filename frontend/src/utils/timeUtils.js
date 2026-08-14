// src/utils/timeUtils.js

/**
 * Validates whether a string matches standard 24-hour "HH:mm" format.
 */
function isValidTimeFormat(timeStr) {
  if (typeof timeStr !== "string") return false;
  // Matches "00:00" to "23:59"
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeStr);
}

/**
 * Converts a "HH:mm" string into total minutes since midnight.
 */
export function timeToMinutes(timeStr) {
  if (!isValidTimeFormat(timeStr)) return null;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Formats raw minutes into clean, human-readable text.
 * e.g., 90 -> "1 hr 30 mins", 45 -> "45 mins", 120 -> "2 hrs"
 */
export function formatDuration(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) return "0 mins";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} mins`;
  }
  
  if (minutes === 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}`;
  }

  return `${hours} hr${hours > 1 ? "s" : ""} ${minutes} mins`;
}

/**
 * Calculates the duration between two 24-hour time strings.
 *
 * @param {string} startTime - Format "HH:mm" (e.g., "18:00")
 * @param {string} endTime - Format "HH:mm" (e.g., "19:30")
 * @returns {{
 *   durationMinutes: number,
 *   formattedDuration: string,
 *   isValid: boolean,
 *   error: string | null
 * }}
 */
export function calculateStudyDuration(startTime, endTime) {
  // 1. Check for missing or malformed inputs
  if (!startTime || !endTime) {
    return {
      durationMinutes: 0,
      formattedDuration: "0 mins",
      isValid: false,
      error: "Both start time and end time are required.",
    };
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes === null || endMinutes === null) {
    return {
      durationMinutes: 0,
      formattedDuration: "0 mins",
      isValid: false,
      error: "Invalid time format. Expected HH:mm (e.g., '14:30').",
    };
  }

  // 2. Check for same start and end time
  if (startMinutes === endMinutes) {
    return {
      durationMinutes: 0,
      formattedDuration: "0 mins",
      isValid: false,
      error: "End time cannot be the same as start time.",
    };
  }

  // 3. Check for end time before start time
  if (endMinutes < startMinutes) {
    return {
      durationMinutes: 0,
      formattedDuration: "0 mins",
      isValid: false,
      error: "End time cannot be earlier than start time.",
    };
  }

  // 4. Calculate valid difference
  const difference = endMinutes - startMinutes;

  return {
    durationMinutes: difference,
    formattedDuration: formatDuration(difference),
    isValid: true,
    error: null,
  };
}