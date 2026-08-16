// src/utils/sgpaUtils.js

/**
 * Calculates credit-weighted SGPA from an array of subject documents.
 *
 * @param {Array<Object>} subjects - Array of subject objects from Firestore
 * @returns {Object} Calculated metrics and filtered subject data
 */
export function calculateSGPA(subjects = []) {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return {
      sgpa: "0.00",
      numericSgpa: 0,
      totalCredits: 0,
      totalCreditPoints: 0,
      gradedSubjectsCount: 0,
      hasGradedSubjects: false,
      gradedSubjects: [],
    };
  }

  // 1. Filter only subjects with valid credits and a valid numeric grade point
  const gradedSubjects = subjects
    .filter((sub) => {
      const credits = Number(sub.credits);
      const gradePoint = sub.gradePoint;

      const hasValidCredits = !isNaN(credits) && credits > 0;
      const hasValidGrade =
        sub.grade &&
        sub.grade !== "" &&
        gradePoint !== null &&
        gradePoint !== undefined &&
        !isNaN(Number(gradePoint));

      return hasValidCredits && hasValidGrade;
    })
    .map((sub) => {
      const credits = Number(sub.credits);
      const gradePoint = Number(sub.gradePoint);
      const creditPoints = credits * gradePoint;

      return {
        ...sub,
        credits,
        gradePoint,
        creditPoints,
      };
    });

  // 2. Handle edge case: No graded subjects
  if (gradedSubjects.length === 0) {
    return {
      sgpa: "0.00",
      numericSgpa: 0,
      totalCredits: 0,
      totalCreditPoints: 0,
      gradedSubjectsCount: 0,
      hasGradedSubjects: false,
      gradedSubjects: [],
    };
  }

  // 3. Sum total credits and total credit points
  const totalCredits = gradedSubjects.reduce((sum, s) => sum + s.credits, 0);
  const totalCreditPoints = gradedSubjects.reduce((sum, s) => sum + s.creditPoints, 0);

  // 4. Compute SGPA and round to 2 decimal places
  const rawSgpa = totalCreditPoints / totalCredits;
  const sgpa = rawSgpa.toFixed(2);

  return {
    sgpa,
    numericSgpa: parseFloat(sgpa),
    totalCredits,
    totalCreditPoints,
    gradedSubjectsCount: gradedSubjects.length,
    hasGradedSubjects: true,
    gradedSubjects,
  };
}

/**
 * Returns performance tier and styling based on SGPA (10-point scale).
 */
export function getSGPAStanding(sgpaNum) {
  const val = Number(sgpaNum);
  if (val >= 9.0) return { label: "Outstanding (Distinction)", color: "#16a34a", bg: "#f0fdf4", border: "#86efac" };
  if (val >= 8.0) return { label: "First Class with Distinction", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };
  if (val >= 7.0) return { label: "First Class", color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" };
  if (val >= 6.0) return { label: "Second Class", color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
  if (val >= 5.0) return { label: "Pass Class", color: "#ca8a04", bg: "#fefce8", border: "#fef08a" };
  return { label: "Needs Improvement / Academic Warning", color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" };
}
// src/utils/sgpaUtils.js

/**
 * Categorizes an SGPA score into standard performance tiers.
 * 
 * Scale:
 * - 9.0+         → Excellent
 * - 8.0 – 8.99   → Very Good
 * - 7.0 – 7.99   → Good
 * - 6.0 – 6.99   → Needs Improvement
 * - Below 6.0    → Needs Attention
 * 
 * @param {number|string} sgpa - The calculated SGPA score.
 * @returns {{ label: string, color: string, bg: string, border: string }} Category metadata
 */
export function getPerformanceCategory(sgpa) {
  const score = parseFloat(sgpa);

  // Handle uncalculated, empty, or invalid inputs
  if (isNaN(score) || score === null || score === undefined) {
    return {
      label: "Not Calculated",
      color: "#64748b",
      bg: "#f1f5f9",
      border: "#cbd5e1",
    };
  }

  if (score >= 9.0) {
    return {
      label: "Excellent",
      color: "#16a34a",
      bg: "#f0fdf4",
      border: "#86efac",
    };
  }

  if (score >= 8.0) {
    return {
      label: "Very Good",
      color: "#2563eb",
      bg: "#eff6ff",
      border: "#bfdbfe",
    };
  }

  if (score >= 7.0) {
    return {
      label: "Good",
      color: "#0891b2",
      bg: "#ecfeff",
      border: "#a5f3fc",
    };
  }

  if (score >= 6.0) {
    return {
      label: "Needs Improvement",
      color: "#d97706",
      bg: "#fffbeb",
      border: "#fde68a",
    };
  }

  return {
    label: "Needs Attention",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fca5a5",
  };
}
// src/utils/sgpaUtils.js (or src/utils/subjectAnalysisUtils.js)

/**
 * Analyzes an array of subjects to identify the highest and lowest scoring subjects.
 * Handles ties, single-subject datasets, and ungraded courses.
 *
 * @param {Array<Object>} subjects - Array of subject documents
 * @returns {{
 *   hasGradedSubjects: boolean,
 *   isSingleSubject: boolean,
 *   isAllEqual: boolean,
 *   maxGradePoint: number | null,
 *   minGradePoint: number | null,
 *   strongest: Array<Object>,
 *   weakest: Array<Object>
 * }}
 */
export function getSubjectPerformanceExtremes(subjects = []) {
  // 1. Filter only valid, graded subjects
  const graded = subjects.filter((sub) => {
    const credits = Number(sub.credits);
    const gradePoint = Number(sub.gradePoint);
    return (
      sub.grade &&
      sub.grade !== "" &&
      !isNaN(credits) &&
      credits > 0 &&
      sub.gradePoint !== null &&
      sub.gradePoint !== undefined &&
      !isNaN(gradePoint)
    );
  });

  // Edge Case: No graded subjects
  if (graded.length === 0) {
    return {
      hasGradedSubjects: false,
      isSingleSubject: false,
      isAllEqual: false,
      maxGradePoint: null,
      minGradePoint: null,
      strongest: [],
      weakest: [],
    };
  }

  // Edge Case: Exactly 1 graded subject
  if (graded.length === 1) {
    const single = graded[0];
    return {
      hasGradedSubjects: true,
      isSingleSubject: true,
      isAllEqual: true,
      maxGradePoint: Number(single.gradePoint),
      minGradePoint: Number(single.gradePoint),
      strongest: [single],
      weakest: [single],
    };
  }

  // 2. Find Maximum and Minimum Grade Points
  const gradePoints = graded.map((s) => Number(s.gradePoint));
  const maxGradePoint = Math.max(...gradePoints);
  const minGradePoint = Math.min(...gradePoints);

  // 3. Collect all subjects matching max and min (handles ties)
  const strongest = graded.filter((s) => Number(s.gradePoint) === maxGradePoint);
  const weakest = graded.filter((s) => Number(s.gradePoint) === minGradePoint);

  return {
    hasGradedSubjects: true,
    isSingleSubject: false,
    isAllEqual: maxGradePoint === minGradePoint,
    maxGradePoint,
    minGradePoint,
    strongest,
    weakest,
  };
}