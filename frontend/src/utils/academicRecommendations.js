// src/utils/academicRecommendations.js

export const calculateIAPercentage = (ia1) => {
  if (
    ia1 === null ||
    ia1 === undefined ||
    ia1 === ""
  ) {
    return null;
  }

  return (Number(ia1) / 50) * 100;
};


// ---------------------------------------------
// RISK ANALYSIS
// ---------------------------------------------

export const getAcademicRisk = (ia1) => {
  const percentage = calculateIAPercentage(ia1);

  if (percentage === null) {
    return {
      level: "UNKNOWN",
      priority: "NONE",
      label: "Marks not entered",
      color: "#64748b",
      background: "#f8fafc",
    };
  }

  if (percentage >= 80) {
    return {
      level: "LOW",
      priority: "LOW",
      label: "Excellent performance",
      color: "#16a34a",
      background: "#f0fdf4",
    };
  }

  if (percentage >= 70) {
    return {
      level: "LOW",
      priority: "LOW",
      label: "Good performance",
      color: "#16a34a",
      background: "#f0fdf4",
    };
  }

  if (percentage >= 60) {
    return {
      level: "MEDIUM",
      priority: "MEDIUM",
      label: "Needs improvement",
      color: "#d97706",
      background: "#fffbeb",
    };
  }

  return {
    level: "HIGH",
    priority: "HIGH",
    label: "Needs attention",
    color: "#dc2626",
    background: "#fef2f2",
  };
};


// ---------------------------------------------
// IA-2 TARGET
// ---------------------------------------------

export const getRecommendedIA2 = (ia1) => {
  const percentage = calculateIAPercentage(ia1);

  if (percentage === null) {
    return null;
  }

  if (percentage < 50) {
    return 40;
  }

  if (percentage < 60) {
    return 38;
  }

  if (percentage < 70) {
    return 35;
  }

  if (percentage < 80) {
    return 40;
  }

  return 45;
};


// ---------------------------------------------
// STUDY TIME RECOMMENDATION
// ---------------------------------------------

export const getRecommendedStudyHours = (ia1) => {
  const percentage = calculateIAPercentage(ia1);

  if (percentage === null) {
    return 0;
  }

  if (percentage < 50) {
    return 5;
  }

  if (percentage < 60) {
    return 4;
  }

  if (percentage < 70) {
    return 3;
  }

  if (percentage < 80) {
    return 2;
  }

  return 1;
};


// ---------------------------------------------
// SUBJECT SUGGESTION
// ---------------------------------------------

export const generateSubjectSuggestion = (
  subjectName,
  ia1
) => {
  const percentage = calculateIAPercentage(ia1);

  if (percentage === null) {
    return `Enter IA-1 marks for ${subjectName}.`;
  }

  if (percentage < 50) {
    return `${subjectName} needs urgent attention. Focus on your weak topics and target at least 40/50 in IA-2.`;
  }

  if (percentage < 60) {
    return `${subjectName} needs improvement. Revise regularly and target 38+/50 in IA-2.`;
  }

  if (percentage < 70) {
    return `${subjectName} is at a moderate level. Focus on weak topics and target 35+/50 in IA-2.`;
  }

  if (percentage < 80) {
    return `${subjectName} is doing well. Increase revision and target 40+/50 in IA-2.`;
  }

  return `${subjectName} is performing very well. Maintain your preparation and target 45+/50 in IA-2.`;
};


// ---------------------------------------------
// COMPLETE RECOMMENDATION
// ---------------------------------------------

export const createAcademicRecommendation = (
  subject
) => {
  const ia1 = subject.ia1;

  const percentage =
    calculateIAPercentage(ia1);

  const risk =
    getAcademicRisk(ia1);

  const recommendedIA2 =
    getRecommendedIA2(ia1);

  const studyHours =
    getRecommendedStudyHours(ia1);

  const suggestion =
    generateSubjectSuggestion(
      subject.name || "Subject",
      ia1
    );

  return {
    subjectId: subject.id,

    subjectName:
      subject.name ||
      subject.subjectName ||
      "Subject",

    credits:
      Number(subject.credits) || 0,

    ia1:
      ia1 === undefined
        ? null
        : ia1,

    ia2:
      subject.ia2 === undefined
        ? null
        : subject.ia2,

    percentage,

    risk: risk.level,

    priority: risk.priority,

    riskLabel: risk.label,

    color: risk.color,

    background: risk.background,

    recommendedIA2,

    recommendedStudyHours: studyHours,

    suggestion,
  };
};


// ---------------------------------------------
// ALL SUBJECT RECOMMENDATIONS
// ---------------------------------------------

export const generateAcademicRecommendations = (
  subjects
) => {
  if (!Array.isArray(subjects)) {
    return [];
  }

  return subjects
    .filter(
      (subject) =>
        subject.ia1 !== undefined &&
        subject.ia1 !== null &&
        subject.ia1 !== ""
    )
    .map((subject) =>
      createAcademicRecommendation(subject)
    );
};


// ---------------------------------------------
// HIGH PRIORITY
// ---------------------------------------------

export const getHighPrioritySubjects = (
  recommendations
) => {
  return recommendations.filter(
    (item) =>
      item.priority === "HIGH"
  );
};


// ---------------------------------------------
// MEDIUM PRIORITY
// ---------------------------------------------

export const getMediumPrioritySubjects = (
  recommendations
) => {
  return recommendations.filter(
    (item) =>
      item.priority === "MEDIUM"
  );
};