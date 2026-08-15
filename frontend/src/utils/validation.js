// src/utils/validation.js

/**
 * Validates and sanitizes Subject inputs.
 */
export function validateSubject(data) {
  const name = (data.name || "").trim();
  const credits = Number(data.credits);

  if (!name) {
    return { isValid: false, error: "Subject name is required." };
  }
  if (name.length < 2) {
    return { isValid: false, error: "Subject name must be at least 2 characters." };
  }
  if (isNaN(credits) || credits < 0 || !Number.isInteger(credits)) {
    return { isValid: false, error: "Credits must be a positive whole number (0 or greater)." };
  }
  if (credits > 10) {
    return { isValid: false, error: "Credits cannot exceed 10 per subject." };
  }

  return {
    isValid: true,
    error: null,
    sanitized: {
      ...data,
      name,
      credits
    }
  };
}

/**
 * Validates Attendance counts.
 */
export function validateAttendance(data) {
  const attended = Number(data.attendedClasses ?? data.attended ?? 0);
  const total = Number(data.totalClasses ?? data.total ?? 0);

  if (isNaN(attended) || attended < 0 || !Number.isInteger(attended)) {
    return { isValid: false, error: "Attended classes must be a non-negative whole number." };
  }
  if (isNaN(total) || total < 0 || !Number.isInteger(total)) {
    return { isValid: false, error: "Total classes must be a non-negative whole number." };
  }
  if (attended > total) {
    return { isValid: false, error: "Attended classes cannot exceed total classes." };
  }

  return {
    isValid: true,
    error: null,
    sanitized: {
      ...data,
      attendedClasses: attended,
      totalClasses: total
    }
  };
}

/**
 * Validates Assignment records.
 */
export function validateAssignment(data) {
  const title = (data.title || data.name || "").trim();
  const subjectId = (data.subjectId || "").trim();
  const dueDateStr = data.dueDate || "";

  if (!title) {
    return { isValid: false, error: "Assignment title is required." };
  }
  if (!subjectId) {
    return { isValid: false, error: "Please select an associated subject." };
  }
  if (!dueDateStr) {
    return { isValid: false, error: "Due date is required." };
  }

  const dueDate = new Date(dueDateStr);
  if (isNaN(dueDate.getTime())) {
    return { isValid: false, error: "Please provide a valid deadline date." };
  }

  return {
    isValid: true,
    error: null,
    sanitized: {
      ...data,
      title,
      subjectId,
      dueDate: dueDateStr
    }
  };
}

/**
 * Validates Study Planner Sessions.
 */
export function validateStudySession(data) {
  const subjectId = (data.subjectId || "").trim();
  const topic = (data.topic || data.title || "").trim();
  const duration = Number(data.durationMinutes ?? data.duration ?? 0);
  const dateStr = data.date || "";

  if (!subjectId) {
    return { isValid: false, error: "Please select a subject for the study session." };
  }
  if (!topic) {
    return { isValid: false, error: "Session topic or description is required." };
  }
  if (isNaN(duration) || duration <= 0) {
    return { isValid: false, error: "Duration must be greater than 0 minutes." };
  }
  if (!dateStr || isNaN(new Date(dateStr).getTime())) {
    return { isValid: false, error: "A valid session date is required." };
  }

  return {
    isValid: true,
    error: null,
    sanitized: {
      ...data,
      subjectId,
      topic,
      durationMinutes: duration,
      date: dateStr
    }
  };
}

/**
 * Validates Study Goals.
 */
export function validateStudyGoal(data) {
  const subjectId = (data.subjectId || "").trim();
  const targetHours = Number(data.targetHours ?? (data.targetMinutes ? data.targetMinutes / 60 : 0));

  if (!subjectId) {
    return { isValid: false, error: "Please select a subject for this goal." };
  }
  if (isNaN(targetHours) || targetHours <= 0) {
    return { isValid: false, error: "Target study time must be greater than 0." };
  }
  if (targetHours > 168) {
    return { isValid: false, error: "Weekly target cannot exceed total hours in a week (168)." };
  }

  return {
    isValid: true,
    error: null,
    sanitized: {
      ...data,
      subjectId,
      targetHours: Number(targetHours.toFixed(1))
    }
  };
}

/**
 * Validates AI Assistant Queries.
 */
export function validateAiPrompt(prompt) {
  const cleanPrompt = (prompt || "").trim();

  if (!cleanPrompt) {
    return { isValid: false, error: "Please enter a question or topic for the AI assistant." };
  }
  if (cleanPrompt.length < 3) {
    return { isValid: false, error: "Prompt is too short. Please provide more detail." };
  }
  if (cleanPrompt.length > 2000) {
    return { isValid: false, error: "Prompt exceeds maximum allowed character limit (2000)." };
  }

  return {
    isValid: true,
    error: null,
    sanitizedPrompt: cleanPrompt
  };
}