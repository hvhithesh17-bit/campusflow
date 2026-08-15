// src/pages/SGPA.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { formatFirebaseError } from "../utils/errorHandler";
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
  GraduationCap,
  Layers,
  Percent,
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
  if (score >= 9.0) return { label: "Outstanding Performance", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
  if (score >= 8.0) return { label: "Very Good Standing", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };
  if (score >= 7.0) return { label: "Good Academic Standing", color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" };
  if (score >= 6.0) return { label: "Needs Improvement", color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
  return { label: "Academic Attention Required", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
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
        setError(formatFirebaseError(err));
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
        userId: currentUser.uid,
        updatedAt: serverTimestamp(),
      });
      setSuccess("Grade standing updated successfully!");
      setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setUpdatingSubjectId(null);
    }
  };

  // 3. Mathematical Calculations
  const gradedSubjects = useMemo(() => {
    return subjects
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
  }, [subjects]);

  const totalRegisteredCredits = useMemo(
    () => subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0),
    [subjects]
  );

  const totalGradedCredits = useMemo(
    () => gradedSubjects.reduce((sum, s) => sum + s.creditsNum, 0),
    [gradedSubjects]
  );

  const totalQualityPoints = useMemo(
    () => gradedSubjects.reduce((sum, s) => sum + s.creditPoints, 0),
    [gradedSubjects]
  );

  const hasGraded = totalGradedCredits > 0;
  const sgpaValue = hasGraded ? (totalQualityPoints / totalGradedCredits).toFixed(2) : "0.00";
  const performance = hasGraded ? getPerformanceCategory(sgpaValue) : null;

  // 4. Strengths & Weaknesses Analysis
  const analytics = useMemo(() => {
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
  }, [gradedSubjects]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        padding: "2rem 2.5rem",
        boxSizing: "border-box",
        minHeight: "100%",
      }}
    >
      {/* Top Banner Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.25rem",
          marginBottom: "2rem",
          paddingBottom: "1.5rem",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563eb",
              }}
            >
              <Calculator size={22} />
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: "1.75rem",
                fontWeight: "700",
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              SGPA & Performance Analyzer
            </h1>
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
            Calculate your semester credit-weighted Grade Point Average and inspect academic strengths.
          </p>
        </div>

        <Link
          to="/subjects"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            borderRadius: "10px",
            fontSize: "0.875rem",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
            transition: "all 0.2s ease",
          }}
        >
          <BookOpen size={16} />
          Manage Curriculum <ArrowRight size={14} />
        </Link>
      </div>

      {/* Notifications / Feedback */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.875rem 1.25rem",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
            borderRadius: "10px",
            marginBottom: "1.5rem",
            border: "1px solid #fecaca",
            fontSize: "0.9rem",
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.875rem 1.25rem",
            backgroundColor: "#ecfdf5",
            color: "#065f46",
            borderRadius: "10px",
            marginBottom: "1.5rem",
            border: "1px solid #a7f3d0",
            fontSize: "0.9rem",
          }}
        >
          <CheckCircle2 size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Hero SGPA Display & Primary Breakdown */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: `1.5px solid ${performance ? performance.border : "#e2e8f0"}`,
          borderRadius: "16px",
          padding: "2.5rem 2rem",
          textAlign: "center",
          marginBottom: "2rem",
          boxShadow: hasGraded
            ? "0 8px 24px -4px rgba(37, 99, 235, 0.08)"
            : "0 1px 3px rgba(0, 0, 0, 0.03)",
          transition: "all 0.25s ease",
        }}
      >
        <span
          style={{
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            display: "block",
            marginBottom: "0.5rem",
          }}
        >
          Semester Grade Point Average
        </span>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "baseline",
            gap: "8px",
            marginBottom: "1rem",
          }}
        >
          <span
            style={{
              fontSize: "4.25rem",
              fontWeight: 900,
              lineHeight: 1,
              color: performance ? performance.color : "#0f172a",
              letterSpacing: "-0.03em",
            }}
          >
            {hasGraded ? sgpaValue : "0.00"}
          </span>
          <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#94a3b8" }}>
            / 10.00
          </span>
        </div>

        {performance ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 18px",
              borderRadius: "9999px",
              backgroundColor: performance.bg,
              color: performance.color,
              border: `1px solid ${performance.border}`,
              fontSize: "0.95rem",
              fontWeight: 700,
            }}
          >
            <Award size={18} />
            {performance.label}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
            Select grades for your registered courses below to calculate your live SGPA.
          </p>
        )}
      </div>

      {/* Analytics Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {/* Total Graded Credits */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "1.35rem 1.5rem",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2563eb",
            }}
          >
            <BookOpen size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Graded Credits (Σ C)
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>
              {totalGradedCredits} <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#64748b" }}>/ {totalRegisteredCredits}</span>
            </div>
          </div>
        </div>

        {/* Quality Points */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "1.35rem 1.5rem",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#faf5ff",
              border: "1px solid #e9d5ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9333ea",
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Quality Points (Σ C × GP)
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#9333ea" }}>
              {totalQualityPoints} <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#64748b" }}>pts</span>
            </div>
          </div>
        </div>

        {/* Graded Courses Ratio */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "1.35rem 1.5rem",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#16a34a",
            }}
          >
            <GraduationCap size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Course Status
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#16a34a" }}>
              {gradedSubjects.length} / {subjects.length}{" "}
              <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#64748b" }}>Evaluated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths & Focus Areas */}
      {analytics.hasGraded && !analytics.isSingle && !analytics.isAllEqual && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          {/* Strongest Subjects */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #bbf7d0",
              borderRadius: "14px",
              padding: "1.35rem 1.5rem",
              borderLeft: "5px solid #16a34a",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#15803d", fontWeight: 700, fontSize: "0.95rem" }}>
                <TrendingUp size={18} />
                <span>Strongest Course{analytics.strongest.length > 1 ? "s" : ""}</span>
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, backgroundColor: "#dcfce7", color: "#15803d", padding: "3px 10px", borderRadius: "9999px" }}>
                {analytics.maxPoint} GP
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {analytics.strongest.map((s) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>{s.name}</span>
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>Grade {s.grade}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Focus Areas */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #fecaca",
              borderRadius: "14px",
              padding: "1.35rem 1.5rem",
              borderLeft: "5px solid #dc2626",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#b91c1c", fontWeight: 700, fontSize: "0.95rem" }}>
                <TrendingDown size={18} />
                <span>Focus Course{analytics.weakest.length > 1 ? "s" : ""}</span>
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, backgroundColor: "#fee2e2", color: "#991b1b", padding: "3px 10px", borderRadius: "9999px" }}>
                {analytics.minPoint} GP
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {analytics.weakest.map((s) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>{s.name}</span>
                  <span style={{ color: "#dc2626", fontWeight: 700 }}>Grade {s.grade}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Grade Entry Table */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "1.75rem 2rem",
          marginBottom: "2rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
              Enrolled Course Grades
            </h3>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Update grade standings directly to see real-time GPA calculations.
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>Loading curriculum grades...</div>
          </div>
        ) : subjects.length === 0 ? (
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px dashed #cbd5e1",
              borderRadius: "14px",
              padding: "3rem 2rem",
              textAlign: "center",
            }}
          >
            <p style={{ margin: "0 0 1rem 0", color: "#64748b", fontSize: "0.95rem" }}>
              No subjects registered yet. Enroll courses first to enable grade tracking.
            </p>
            <Link
              to="/subjects"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Enroll Courses Now <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                  <th style={{ padding: "12px 10px", fontWeight: 600 }}>Course / Subject</th>
                  <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: 600, width: "130px" }}>Credits (C)</th>
                  <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: 600, width: "230px" }}>Assigned Grade</th>
                  <th style={{ padding: "12px 10px", textAlign: "center", fontWeight: 600, width: "130px" }}>Grade Points (GP)</th>
                  <th style={{ padding: "12px 10px", textAlign: "right", fontWeight: 600, width: "160px" }}>Quality Score (C × GP)</th>
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
                        backgroundColor: hasGrade ? "#ffffff" : "#fbfcfd",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      {/* Course Title */}
                      <td style={{ padding: "14px 10px", fontWeight: 600, color: "#0f172a" }}>
                        {sub.name}
                      </td>

                      {/* Credits */}
                      <td style={{ padding: "14px 10px", textAlign: "center", color: "#475569", fontWeight: 600 }}>
                        {credits}
                      </td>

                      {/* Grade Selector */}
                      <td style={{ padding: "14px 10px", textAlign: "center" }}>
                        <select
                          value={sub.grade || ""}
                          disabled={isUpdating}
                          onChange={(e) => handleGradeChange(sub.id, e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: `1px solid ${hasGrade ? "#bfdbfe" : "#cbd5e1"}`,
                            backgroundColor: hasGrade ? "#eff6ff" : "#ffffff",
                            color: hasGrade ? "#1d4ed8" : "#334155",
                            fontWeight: 600,
                            cursor: isUpdating ? "not-allowed" : "pointer",
                            fontSize: "0.85rem",
                            outline: "none",
                          }}
                        >
                          <option value="">-- Ungraded --</option>
                          {Object.entries(GRADE_SCALE).map(([code, details]) => (
                            <option key={code} value={code}>
                              {details.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Grade Point */}
                      <td style={{ padding: "14px 10px", textAlign: "center", fontWeight: 700, color: hasGrade ? "#0f172a" : "#94a3b8" }}>
                        {hasGrade ? gradePoint : "—"}
                      </td>

                      {/* Weighted Quality Score */}
                      <td style={{ padding: "14px 10px", textAlign: "right", fontWeight: 700, color: hasGrade ? "#2563eb" : "#94a3b8" }}>
                        {hasGrade ? `${credits} × ${gradePoint} = ${creditPoints}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {hasGraded && (
                <tfoot>
                  <tr style={{ borderTop: "2px solid #e2e8f0", fontWeight: 700, backgroundColor: "#f8fafc" }}>
                    <td style={{ padding: "14px 10px", color: "#0f172a" }}>Weighted Total</td>
                    <td style={{ padding: "14px 10px", textAlign: "center", color: "#2563eb" }}>
                      Σ C = {totalGradedCredits}
                    </td>
                    <td colSpan="2" style={{ padding: "14px 10px", textAlign: "center", color: "#64748b" }}>
                      SGPA = {totalQualityPoints} / {totalGradedCredits}
                    </td>
                    <td style={{ padding: "14px 10px", textAlign: "right", color: performance ? performance.color : "#16a34a", fontSize: "1.1rem" }}>
                      = {sgpaValue}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Formula Reference Footer */}
      <div
        style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "1.35rem 1.5rem",
          fontSize: "0.85rem",
          color: "#64748b",
          lineHeight: "1.6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", fontWeight: 700, marginBottom: "6px" }}>
          <HelpCircle size={16} /> Formula Reference & Quality Score Calculation
        </div>
        <div>
          The Semester Grade Point Average (SGPA) is computed using credit-weighted summation:
          <br />
          <code
            style={{
              display: "inline-block",
              marginTop: "6px",
              padding: "4px 8px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              fontWeight: 600,
              color: "#2563eb",
            }}
          >
            SGPA = Σ (Subject Credits × Grade Point) / Σ (Graded Subject Credits)
          </code>
        </div>
      </div>
    </div>
  );
}