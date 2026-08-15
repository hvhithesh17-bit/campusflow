// src/pages/Analytics.jsx

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import {
  BarChart2,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";

import { formatFirebaseError } from "../utils/errorHandler";

import {
  calculateAcademicSummary,
  generateAnalyticsInsights,
} from "../utils/analyticsCalculations";

import AnalyticsSummary from "../components/analytics/AnalyticsSummary";
import AnalyticsInsights from "../components/analytics/AnalyticsInsights";
import AcademicRiskOverview from "../components/analytics/AcademicRiskOverview";
import AttendanceChart from "../components/analytics/AttendanceChart";
import WeeklyStudyChart from "../components/analytics/WeeklyStudyChart";
import SubjectPerformanceChart from "../components/analytics/SubjectPerformanceChart";
import AssignmentStatusChart from "../components/analytics/AssignmentStatusChart";


// ============================================================
// ANALYTICS PAGE
// ============================================================

export default function Analytics() {
  const { currentUser } = useAuth();

  // ==========================================================
  // FIRESTORE DATA
  // ==========================================================

  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [studyGoals, setStudyGoals] = useState([]);

  // ==========================================================
  // UI STATE
  // ==========================================================

  const [dateFilter, setDateFilter] = useState("week");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ==========================================================
  // FIRESTORE LISTENERS
  // ==========================================================

  useEffect(() => {
    // If there is no authenticated user,
    // don't keep the page stuck in loading state.
    if (!currentUser?.uid) {
      setSubjects([]);
      setAttendance([]);
      setAssignments([]);
      setStudySessions([]);
      setStudyGoals([]);

      setLoading(false);

      return undefined;
    }

    const userId = currentUser.uid;

    setLoading(true);
    setError("");

    // --------------------------------------------------------
    // Create queries
    // --------------------------------------------------------

    const subjectsQuery = query(
      collection(db, "subjects"),
      where("userId", "==", userId)
    );

    const attendanceQuery = query(
      collection(db, "attendance"),
      where("userId", "==", userId)
    );

    const assignmentsQuery = query(
      collection(db, "assignments"),
      where("userId", "==", userId)
    );

    const studySessionsQuery = query(
      collection(db, "studySessions"),
      where("userId", "==", userId)
    );

    const studyGoalsQuery = query(
      collection(db, "studyGoals"),
      where("userId", "==", userId)
    );

    // --------------------------------------------------------
    // Loading tracker
    // --------------------------------------------------------

    const loaded = {
      subjects: false,
      attendance: false,
      assignments: false,
      studySessions: false,
      studyGoals: false,
    };

    const updateLoadingState = (key) => {
      loaded[key] = true;

      const everythingLoaded =
        loaded.subjects &&
        loaded.attendance &&
        loaded.assignments &&
        loaded.studySessions &&
        loaded.studyGoals;

      if (everythingLoaded) {
        setLoading(false);
      }
    };

    // --------------------------------------------------------
    // Generic Firestore error handler
    // --------------------------------------------------------

    const handleFirestoreError = (err) => {
      console.error(
        "Analytics Firestore error:",
        err
      );

      setError(
        formatFirebaseError(err) ||
          "Unable to load academic analytics."
      );
    };

    // ========================================================
    // SUBJECTS
    // ========================================================

    const unsubscribeSubjects = onSnapshot(
      subjectsQuery,
      (snapshot) => {
        const data = snapshot.docs.map(
          (document) => ({
            id: document.id,
            ...document.data(),
          })
        );

        setSubjects(data);

        updateLoadingState("subjects");
      },
      (err) => {
        handleFirestoreError(err);

        setSubjects([]);

        updateLoadingState("subjects");
      }
    );

    // ========================================================
    // ATTENDANCE
    // ========================================================

    const unsubscribeAttendance = onSnapshot(
      attendanceQuery,
      (snapshot) => {
        const data = snapshot.docs.map(
          (document) => ({
            id: document.id,
            ...document.data(),
          })
        );

        setAttendance(data);

        updateLoadingState("attendance");
      },
      (err) => {
        handleFirestoreError(err);

        setAttendance([]);

        updateLoadingState("attendance");
      }
    );

    // ========================================================
    // ASSIGNMENTS
    // ========================================================

    const unsubscribeAssignments = onSnapshot(
      assignmentsQuery,
      (snapshot) => {
        const data = snapshot.docs.map(
          (document) => ({
            id: document.id,
            ...document.data(),
          })
        );

        setAssignments(data);

        updateLoadingState("assignments");
      },
      (err) => {
        handleFirestoreError(err);

        setAssignments([]);

        updateLoadingState("assignments");
      }
    );

    // ========================================================
    // STUDY SESSIONS
    // ========================================================

    const unsubscribeStudySessions = onSnapshot(
      studySessionsQuery,
      (snapshot) => {
        const data = snapshot.docs.map(
          (document) => ({
            id: document.id,
            ...document.data(),
          })
        );

        setStudySessions(data);

        updateLoadingState("studySessions");
      },
      (err) => {
        handleFirestoreError(err);

        setStudySessions([]);

        updateLoadingState("studySessions");
      }
    );

    // ========================================================
    // STUDY GOALS
    // ========================================================

    const unsubscribeStudyGoals = onSnapshot(
      studyGoalsQuery,
      (snapshot) => {
        const data = snapshot.docs.map(
          (document) => ({
            id: document.id,
            ...document.data(),
          })
        );

        setStudyGoals(data);

        updateLoadingState("studyGoals");
      },
      (err) => {
        handleFirestoreError(err);

        setStudyGoals([]);

        updateLoadingState("studyGoals");
      }
    );

    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {
      unsubscribeSubjects();
      unsubscribeAttendance();
      unsubscribeAssignments();
      unsubscribeStudySessions();
      unsubscribeStudyGoals();
    };
  }, [currentUser]);

  // ==========================================================
  // ACADEMIC SUMMARY
  // ==========================================================

  const summary = useMemo(() => {
    try {
      return calculateAcademicSummary({
        subjects,
        attendance,
        assignments,
        studySessions,
        dateFilter,
      });
    } catch (err) {
      console.error(
        "Academic summary calculation error:",
        err
      );

      return {};
    }
  }, [
    subjects,
    attendance,
    assignments,
    studySessions,
    dateFilter,
  ]);

  // ==========================================================
  // ANALYTICS INSIGHTS
  // ==========================================================

  const insights = useMemo(() => {
    try {
      return generateAnalyticsInsights({
        subjects,
        attendance,
        assignments,
        studySessions,
        dateFilter,
      });
    } catch (err) {
      console.error(
        "Analytics insights calculation error:",
        err
      );

      return [];
    }
  }, [
    subjects,
    attendance,
    assignments,
    studySessions,
    dateFilter,
  ]);

  // ==========================================================
  // LOGGED OUT STATE
  // ==========================================================

  if (!currentUser) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "500px",
            textAlign: "center",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "3rem 2rem",
            boxShadow:
              "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <AlertCircle
            size={48}
            color="#2563eb"
            style={{
              marginBottom: "1rem",
            }}
          />

          <h2
            style={{
              margin: "0 0 0.75rem",
              color: "#0f172a",
            }}
          >
            Please Login
          </h2>

          <p
            style={{
              margin: 0,
              color: "#64748b",
            }}
          >
            Login to view your academic analytics
            and performance dashboard.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

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
      {/* ====================================================
          HEADER
      ==================================================== */}

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.25rem",
          marginBottom: "2rem",
          paddingBottom: "1.5rem",
          borderBottom:
            "1px solid #e2e8f0",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "6px",
            }}
          >
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
              <BarChart2 size={22} />
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "#0f172a",
                letterSpacing:
                  "-0.02em",
              }}
            >
              Academic Analytics
            </h1>
          </div>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              fontSize: "0.95rem",
            }}
          >
            Comprehensive performance
            visualization, attendance health,
            study trends, and academic risk
            intelligence.
          </p>
        </div>

        {/* ==================================================
            DATE FILTER
        ================================================== */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            backgroundColor: "#f1f5f9",
            padding: "4px",
            borderRadius: "10px",
            border:
              "1px solid #e2e8f0",
          }}
        >
          <button
            type="button"
            onClick={() =>
              setDateFilter("week")
            }
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border: "none",

              backgroundColor:
                dateFilter === "week"
                  ? "#ffffff"
                  : "transparent",

              color:
                dateFilter === "week"
                  ? "#2563eb"
                  : "#64748b",

              fontWeight:
                dateFilter === "week"
                  ? 700
                  : 500,

              fontSize: "0.85rem",

              cursor: "pointer",

              boxShadow:
                dateFilter === "week"
                  ? "0 1px 3px rgba(0,0,0,0.05)"
                  : "none",
            }}
          >
            This Week
          </button>

          <button
            type="button"
            onClick={() =>
              setDateFilter("month")
            }
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border: "none",

              backgroundColor:
                dateFilter === "month"
                  ? "#ffffff"
                  : "transparent",

              color:
                dateFilter === "month"
                  ? "#2563eb"
                  : "#64748b",

              fontWeight:
                dateFilter === "month"
                  ? 700
                  : 500,

              fontSize: "0.85rem",

              cursor: "pointer",

              boxShadow:
                dateFilter === "month"
                  ? "0 1px 3px rgba(0,0,0,0.05)"
                  : "none",
            }}
          >
            This Month
          </button>
        </div>
      </header>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
            padding:
              "0.875rem 1.25rem",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
            borderRadius: "10px",
            marginBottom: "1.5rem",
            border:
              "1px solid #fecaca",
            fontSize: "0.9rem",
          }}
        >
          <AlertCircle
            size={20}
            style={{
              flexShrink: 0,
              marginTop: "1px",
            }}
          />

          <span>{error}</span>
        </div>
      )}

      {/* ====================================================
          LOADING
      ==================================================== */}

      {loading ? (
        <AnalyticsLoading />
      ) : (
        <>
          {/* ==================================================
              SUMMARY
          ================================================== */}

          <section
            style={{
              marginBottom: "2.5rem",
            }}
          >
            <AnalyticsSummary
              summaryData={summary}
            />
          </section>

          {/* ==================================================
              RISK
          ================================================== */}

          <section
            style={{
              marginBottom: "2.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "1.25rem",
              }}
            >
              <ShieldAlert
                size={22}
                color="#2563eb"
              />

              <h2
                style={{
                  margin: 0,
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Academic Risk Diagnostics
              </h2>
            </div>

            <AcademicRiskOverview
              subjects={subjects}
              attendance={attendance}
              assignments={assignments}
              studySessions={studySessions}
              studyGoals={studyGoals}
              loading={loading}
            />
          </section>

          {/* ==================================================
              INSIGHTS
          ================================================== */}

          <section
            style={{
              marginBottom: "2.5rem",
            }}
          >
            <AnalyticsInsights
              insights={insights}
            />
          </section>

          {/* ==================================================
              CHARTS
          ================================================== */}

          <section
            style={{
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "1.25rem",
              }}
            >
              <BarChart2
                size={20}
                color="#2563eb"
              />

              <h2
                style={{
                  margin: 0,
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Detailed Visual Breakdowns
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(340px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {/* ATTENDANCE */}

              <AttendanceChart
                subjects={subjects}
                attendance={attendance}
                height={250}
              />

              {/* WEEKLY STUDY */}

              <WeeklyStudyChart
                studySessions={
                  studySessions
                }
                height={250}
              />

              {/* SUBJECT PERFORMANCE */}

              <SubjectPerformanceChart
                subjects={subjects}
                height={250}
              />

              {/* ASSIGNMENTS */}

              <AssignmentStatusChart
                assignments={assignments}
                height={250}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}


// ============================================================
// LOADING COMPONENT
// ============================================================

function AnalyticsLoading() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "1.5rem",
      }}
    >
      {[1, 2, 3, 4].map(
        (item) => (
          <div
            key={item}
            style={{
              height: "250px",
              backgroundColor:
                "#f8fafc",
              border:
                "1px solid #e2e8f0",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
            }}
          >
            Loading analytics...
          </div>
        )
      )}
    </div>
  );
}