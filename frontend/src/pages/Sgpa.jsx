// src/pages/SGPA.jsx
import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import {
  Award,
  BookOpen,
  Calculator,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

// ============================================================================
// 1. GRADE CONFIGURATION & UTILITY FUNCTIONS
// ============================================================================

export const GRADE_SCALE = {
  "O": { point: 10, label: "O (Outstanding - 10)" },
  "A+": { point: 9, label: "A+ (Excellent - 9)" },
  "A": { point: 8, label: "A (Very Good - 8)" },
  "B+": { point: 7, label: "B+ (Good - 7)" },
  "B": { point: 6, label: "B (Above Average - 6)" },
  "C": { point: 5, label: "C (Average - 5)" },
  "P": { point: 4, label: "P (Pass - 4)" },
  "F": { point: 0, label: "F (Fail - 0)" },
};

export function getPerformanceCategory(sgpa) {
  const score = parseFloat(sgpa);
  if (isNaN(score) || score === null || score === undefined) {
    return { label: "Not Calculated", color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1" };
  }
  if (score >= 9.0) return { label: "Excellent", color: "#16a34a", bg: "#f0fdf4", border: "#86efac" };
  if (score >= 8.0) return { label: "Very Good", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };
  if (score >= 7.0) return { label: "Good", color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" };
  if (score >= 6.0) return { label: "Needs Improvement", color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
  return { label: "Needs Attention", color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" };
}

// ============================================================================
// 2. MAIN COMPONENT
// ============================================================================

export default function SGPA() {
  const { currentUser } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingSubjectId, setUpdatingSubjectId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 1. Fetch user's registered subjects from Firestore
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const q = query(
      collection(db, "subjects"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setSubjects(fetched);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching subjects:", err);
        setError("Failed to load subject records from Firestore.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // 2. Handle direct inline grade selection & Firestore update
  const handleGradeChange = async (subjectId, newGrade) => {
    setError("");
    setSuccess("");
    setUpdatingSubjectId(subjectId);

    const calculatedGradePoint = newGrade && GRADE_SCALE[newGrade] ? GRADE_SCALE[newGrade].point : null;

    try {
      const subjectRef = doc(db, "subjects", subjectId);
      await updateDoc(subjectRef, {
        grade: newGrade || null,
        gradePoint: calculatedGradePoint,
        updatedAt: serverTimestamp(),
      });
      setSuccess("Grade updated successfully!");
    } catch (err) {
      console.error("Error updating subject grade:", err);
      setError("Failed to save grade changes. Please try again.");
    } finally {
      setUpdatingSubjectId(null);
    }
  };

  // 3. Mathematical Calculations
  const gradedSubjects = subjects
    .filter((s) => {
      const cr = Number(s.credits);
      return (
        !isNaN(cr) &&
        cr > 0 &&
        s.grade &&
        s.gradePoint !== null &&
        s.gradePoint !== undefined &&
        !isNaN(Number(s.gradePoint))
      );
    })
    .map((s) => ({
      ...s,
      creditsNum: Number(s.credits),
      pointNum: Number(s.gradePoint),
      creditPoints: Number(s.credits) * Number(s.gradePoint),
    }));

  const totalRegisteredCredits = subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);
  const totalGradedCredits = gradedSubjects.reduce((sum, s) => sum + s.creditsNum, 0);
  const totalQualityPoints = gradedSubjects.reduce((sum, s) => sum + s.creditPoints, 0);
  const hasGraded = totalGradedCredits > 0;
  const sgpaValue = hasGraded ? (totalQualityPoints / totalGradedCredits).toFixed(2) : "0.00";
  const performance = hasGraded ? getPerformanceCategory(sgpaValue) : null;

  // 4. Strengths & Weaknesses Analysis
  const getSubjectAnalytics = () => {
    if (gradedSubjects.length === 0) return { hasGraded: false };
    if (gradedSubjects.length === 1) return { hasGraded: true, isSingle: true, single: gradedSubjects[0] };

    const points = gradedSubjects.map((s) => s.pointNum);
    const maxP = Math.max(...points);
    const minP = Math.min(...points);

    if (maxP === minP) {
      return { hasGraded: true, isAllEqual: true, point: maxP };
    }

    return {
      hasGraded: true,
      isAllEqual: false,
      maxPoint: maxP,
      minPoint: minP,
      strongest: gradedSubjects.filter((s) => s.pointNum === maxP),
      weakest: gradedSubjects.filter((s) => s.pointNum === minP),
    };
  };

  const analytics = getSubjectAnalytics();

  if (loading) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem", color: "var(--text-secondary)" }}>
        Loading subjects & calculating SGPA...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>
          SGPA & Grade Calculator
        </h1>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>
          Assign grades to your enrolled subjects to calculate your credit-weighted Semester GPA.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            border: "1px solid #fecaca",
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            backgroundColor: "#ecfdf5",
            color: "#065f46",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            border: "1px solid #a7f3d0",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Hero SGPA Display */}
      <div
        style={{
          backgroundColor: "var(--bg-secondary, #ffffff)",
          border: `1px solid ${performance ? performance.border : "var(--border-color, #e2e8f0)"}`,
          borderRadius: "16px",
          padding: "2rem",
          textAlign: "center",
          marginBottom: "1.75rem",
          boxShadow: hasGraded ? "0 4px 15px rgba(0, 0, 0, 0.04)" : "none",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--text-secondary)",
            marginBottom: "0.5rem",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Semester Grade Point Average
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "baseline",
            gap: "6px",
            marginBottom: "0.75rem",
          }}
        >
          <span
            style={{
              fontSize: "64px",
              fontWeight: 900,
              lineHeight: 1,
              color: performance ? performance.color : "var(--text-primary)",
            }}
          >
            {hasGraded ? sgpaValue : "—"}
          </span>
          <span style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-secondary)" }}>
            / 10.00
          </span>
        </div>

        {performance ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 16px",
              borderRadius: "9999px",
              backgroundColor: performance.bg,
              color: performance.color,
              border: `1px solid ${performance.border}`,
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            <Award size={16} />
            {performance.label}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
            Select grades for your subjects in the table below to calculate SGPA.
          </p>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--bg-secondary, #ffffff)",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "12px",
            padding: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", color: "#2563eb" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>
              Graded Credits (Σ C)
            </span>
            <BookOpen size={20} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "0.5rem", color: "var(--text-primary)" }}>
            {totalGradedCredits}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Out of {totalRegisteredCredits} total enrolled credits
          </span>
        </div>

        <div
          style={{
            backgroundColor: "var(--bg-secondary, #ffffff)",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "12px",
            padding: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", color: "#8b5cf6" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>
              Quality Points (Σ C × GP)
            </span>
            <Calculator size={20} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "0.5rem", color: "var(--text-primary)" }}>
            {totalQualityPoints}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Numerator quality score
          </span>
        </div>

        <div
          style={{
            backgroundColor: "var(--bg-secondary, #ffffff)",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "12px",
            padding: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", color: "#0891b2" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>
              Graded Subjects
            </span>
            <Award size={20} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "0.5rem", color: "var(--text-primary)" }}>
            {gradedSubjects.length} / {subjects.length}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            {subjects.length - gradedSubjects.length} ungraded / in-progress
          </span>
        </div>
      </div>

      {/* Subject Strengths & Focus Areas */}
      {analytics.hasGraded && !analytics.isSingle && !analytics.isAllEqual && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          {/* Strongest */}
          <div
            style={{
              backgroundColor: "var(--bg-secondary, #ffffff)",
              border: "1px solid #bbf7d0",
              borderRadius: "12px",
              padding: "1.25rem",
              borderLeft: "4px solid #16a34a",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#16a34a", fontWeight: 700, fontSize: "14px" }}>
                <TrendingUp size={18} />
                <span>Strongest Course{analytics.strongest.length > 1 ? "s" : ""}</span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, backgroundColor: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "9999px" }}>
                {analytics.maxPoint} GP
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {analytics.strongest.map((s) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</span>
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>Grade {s.grade}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Focus Areas */}
          <div
            style={{
              backgroundColor: "var(--bg-secondary, #ffffff)",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              padding: "1.25rem",
              borderLeft: "4px solid #dc2626",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#dc2626", fontWeight: 700, fontSize: "14px" }}>
                <TrendingDown size={18} />
                <span>Focus Course{analytics.weakest.length > 1 ? "s" : ""}</span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, backgroundColor: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: "9999px" }}>
                {analytics.minPoint} GP
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {analytics.weakest.map((s) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</span>
                  <span style={{ color: "#dc2626", fontWeight: 700 }}>Grade {s.grade}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Subjects & Grade Entry Table */}
      <div
        style={{
          backgroundColor: "var(--bg-secondary, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text-primary)" }}>
            Enter Grades for Enrolled Subjects
          </h3>
          <Link
            to="/subjects"
            style={{
              fontSize: "13px",
              color: "var(--accent-color, #2563eb)",
              textDecoration: "none",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Manage Enrolled Subjects <ArrowRight size={14} />
          </Link>
        </div>

        {subjects.length === 0 ? (
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px" }}>
            No subjects found. Please go to <Link to="/subjects" style={{ color: "var(--accent-color, #2563eb)", fontWeight: 600 }}>Subjects</Link> to enroll your courses first.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color, #e2e8f0)", color: "var(--text-secondary)", textAlign: "left" }}>
                  <th style={{ padding: "8px 6px", fontWeight: 600 }}>Subject Name</th>
                  <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: 600, width: "100px" }}>Credits (C)</th>
                  <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: 600, width: "190px" }}>Select Grade</th>
                  <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: 600, width: "100px" }}>Points (GP)</th>
                  <th style={{ padding: "8px 6px", textAlign: "right", fontWeight: 600, width: "140px" }}>C × GP</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub) => {
                  const hasGrade = sub.grade && sub.gradePoint !== null && sub.gradePoint !== undefined;
                  const credits = Number(sub.credits) || 0;
                  const gradePoint = hasGrade ? Number(sub.gradePoint) : 0;
                  const creditPoints = credits * gradePoint;
                  const isUpdating = updatingSubjectId === sub.id;

                  return (
                    <tr
                      key={sub.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        backgroundColor: hasGrade ? "transparent" : "#fafafa",
                      }}
                    >
                      {/* Subject Name */}
                      <td style={{ padding: "10px 6px", fontWeight: 500, color: "var(--text-primary)" }}>
                        {sub.name}
                      </td>

                      {/* Credits */}
                      <td style={{ padding: "10px 6px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>
                        {credits}
                      </td>

                      {/* Direct Grade Selector Dropdown */}
                      <td style={{ padding: "10px 6px", textAlign: "center" }}>
                        <select
                          value={sub.grade || ""}
                          disabled={isUpdating}
                          onChange={(e) => handleGradeChange(sub.id, e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            border: `1px solid ${hasGrade ? "#bfdbfe" : "var(--border-color, #cbd5e1)"}`,
                            backgroundColor: hasGrade ? "#eff6ff" : "#ffffff",
                            color: hasGrade ? "#1d4ed8" : "#334155",
                            fontWeight: 600,
                            cursor: isUpdating ? "not-allowed" : "pointer",
                            fontSize: "13px",
                          }}
                        >
                          <option value="">-- Not Graded --</option>
                          {Object.entries(GRADE_SCALE).map(([code, details]) => (
                            <option key={code} value={code}>
                              {details.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Grade Point */}
                      <td style={{ padding: "10px 6px", textAlign: "center", fontWeight: 600, color: "#334155" }}>
                        {hasGrade ? gradePoint : "—"}
                      </td>

                      {/* Weighted Points */}
                      <td style={{ padding: "10px 6px", textAlign: "right", fontWeight: 700, color: hasGrade ? "var(--text-primary)" : "#94a3b8" }}>
                        {hasGrade ? `${credits} × ${gradePoint} = ${creditPoints}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {hasGraded && (
                <tfoot>
                  <tr style={{ borderTop: "2px solid var(--border-color, #e2e8f0)", fontWeight: 700 }}>
                    <td style={{ padding: "12px 6px" }}>Summary</td>
                    <td style={{ padding: "12px 6px", textAlign: "center", color: "#2563eb" }}>
                      Σ C = {totalGradedCredits}
                    </td>
                    <td colSpan="2" style={{ padding: "12px 6px", textAlign: "center" }}>
                      SGPA = {totalQualityPoints} / {totalGradedCredits}
                    </td>
                    <td style={{ padding: "12px 6px", textAlign: "right", color: performance ? performance.color : "#16a34a", fontSize: "15px" }}>
                      = {sgpaValue}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Formula Explanation Footer */}
      <div
        style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "1.25rem",
          fontSize: "13px",
          color: "var(--text-secondary)",
          lineHeight: "1.6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)", fontWeight: 600, marginBottom: "4px" }}>
          <HelpCircle size={16} /> Formula Reference
        </div>
        <div>
          The Semester Grade Point Average is computed as:
          <br />
          <code>SGPA = Total Quality Points (Σ Credits × Grade Point) / Total Graded Credits (Σ Credits)</code>
        </div>
      </div>
    </div>
  );
}