// src/utils/gradeUtils.js

/**
 * Standard 10-point academic grading scale.
 */
export const GRADE_SCALE = {
  "O": { point: 10, label: "O (Outstanding)" },
  "A+": { point: 9, label: "A+ (Excellent)" },
  "A": { point: 8, label: "A (Very Good)" },
  "B+": { point: 7, label: "B+ (Good)" },
  "B": { point: 6, label: "B (Above Average)" },
  "C": { point: 5, label: "C (Average)" },
  "P": { point: 4, label: "P (Pass)" },
  "F": { point: 0, label: "F (Fail)" },
};

/**
 * Returns the numeric grade point for a given letter grade.
 * Returns null if no grade is selected or in-progress.
 */
export function getGradePoint(grade) {
  if (!grade || !GRADE_SCALE[grade]) {
    return null;
  }
  return GRADE_SCALE[grade].point;
}