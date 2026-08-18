// src/pages/Analytics.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import {
  BarChart2,
  AlertCircle,
  ShieldAlert,
  Calendar,
  Sparkles,
  PieChart,
  Layers,
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

export default function Analytics() {
  const { currentUser } = useAuth();

  // Firestore Data State
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [studyGoals, setStudyGoals] = useState([]);

  // UI State
  const [dateFilter, setDateFilter] = useState("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Firestore Listeners
  useEffect(() => {
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

    const loaded = {
      subjects: false,
      attendance: false,
      assignments: false,
      studySessions: false,
      studyGoals: false,
    };

    const updateLoadingState = (key) => {
      loaded[key] = true;
      if (
        loaded.subjects &&
        loaded.attendance &&
        loaded.assignments &&
        loaded.studySessions &&
        loaded.studyGoals
      ) {
        setLoading(false);
      }
    };

    const handleFirestoreError = (err) => {
      console.error("Analytics Firestore error:", err);
      setError(formatFirebaseError(err) || "Unable to load academic analytics.");
    };

    const unsubSub = onSnapshot(
      subjectsQuery,
      (s) => {
        setSubjects(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        updateLoadingState("subjects");
      },
      (err) => {
        handleFirestoreError(err);
        updateLoadingState("subjects");
      }
    );

    const unsubAtt = onSnapshot(
      attendanceQuery,
      (s) => {
        setAttendance(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        updateLoadingState("attendance");
      },
      (err) => {
        handleFirestoreError(err);
        updateLoadingState("attendance");
      }
    );

    const unsubAsg = onSnapshot(
      assignmentsQuery,
      (s) => {
        setAssignments(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        updateLoadingState("assignments");
      },
      (err) => {
        handleFirestoreError(err);
        updateLoadingState("assignments");
      }
    );

    const unsubStd = onSnapshot(
      studySessionsQuery,
      (s) => {
        setStudySessions(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        updateLoadingState("studySessions");
      },
      (err) => {
        handleFirestoreError(err);
        updateLoadingState("studySessions");
      }
    );

    const unsubGol = onSnapshot(
      studyGoalsQuery,
      (s) => {
        setStudyGoals(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        updateLoadingState("studyGoals");
      },
      (err) => {
        handleFirestoreError(err);
        updateLoadingState("studyGoals");
      }
    );

    return () => {
      unsubSub();
      unsubAtt();
      unsubAsg();
      unsubStd();
      unsubGol();
    };
  }, [currentUser]);

  // Derived Analytics Summary
  const summary = useMemo(() => {
    return calculateAcademicSummary({
      subjects,
      attendance,
      assignments,
      studySessions,
      studyGoals,
    });
  }, [subjects, attendance, assignments, studySessions, studyGoals]);

  // Derived Analytics Insights
  const insights = useMemo(() => {
    return generateAnalyticsInsights({
      subjects,
      attendance,
      assignments,
      studySessions,
      studyGoals,
    });
  }, [subjects, attendance, assignments, studySessions, studyGoals]);

  const analyticsStyles = `
    .cf-analytics-root {
      min-height: 100%;
      padding: 24px clamp(14px, 3vw, 32px) 44px;
      background: #f8fafc;
      color: #0f172a;
      box-sizing: border-box;
      font-family: inherit;
    }
    .cf-analytics-container {
      max-width: 1240px;
      margin: 0 auto;
    }
    .cf-analytics-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 24px 28px;
      margin-bottom: 24px;
      border: 1px solid #dbeafe;
      border-radius: 20px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fbff 60%, #eff6ff 100%);
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
      flex-wrap: wrap;
    }
    .cf-analytics-header-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .cf-analytics-kicker {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      background: #dbeafe;
      color: #1d4ed8;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      width: fit-content;
    }
    .cf-analytics-header h1 {
      margin: 2px 0 0;
      font-size: clamp(1.4rem, 2.5vw, 1.85rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #0f172a;
    }
    .cf-analytics-header p {
      margin: 0;
      color: #64748b;
      font-size: 0.86rem;
      line-height: 1.5;
    }
    .cf-analytics-filter-group {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #ffffff;
      padding: 4px;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }
    .cf-analytics-filter-btn {
      padding: 6px 14px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }
    .cf-analytics-filter-btn.active {
      background: #2563eb;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
    }
    .cf-analytics-alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 12px;
      margin-bottom: 20px;
      font-size: 0.825rem;
    }
    .cf-analytics-alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    .cf-analytics-section {
      margin-bottom: 28px;
    }
    .cf-analytics-section-head {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }
    .cf-analytics-section-head h2 {
      margin: 0;
      font-size: 1.12rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .cf-analytics-charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
      gap: 16px;
    }
    .cf-analytics-chart-wrapper {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 16px;
      box-shadow: 0 3px 12px rgba(15, 23, 42, 0.03);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .cf-analytics-chart-wrapper:hover {
      box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
    }

    /* Loading Skeletons */
    .cf-skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
      gap: 16px;
    }
    .cf-skeleton-card {
      height: 240px;
      border-radius: 18px;
      background: linear-gradient(90deg, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: cfShimmer 1.3s infinite;
      border: 1px solid #e2e8f0;
    }
    @keyframes cfShimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @media (max-width: 640px) {
      .cf-analytics-header {
        flex-direction: column;
        align-items: flex-start;
        padding: 20px;
      }
      .cf-analytics-filter-group {
        width: 100%;
      }
      .cf-analytics-filter-btn {
        flex: 1;
        text-align: center;
      }
      .cf-analytics-charts-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  return (
    <main className="cf-analytics-root">
      <style>{analyticsStyles}</style>
      <div className="cf-analytics-container">
        {/* Header Banner */}
        <header className="cf-analytics-header">
          <div className="cf-analytics-header-info">
            <span className="cf-analytics-kicker">
              <BarChart2 size={12} /> Real-Time Intelligence
            </span>
            <h1>Performance Analytics</h1>
            <p>
              Comprehensive performance visualization, attendance health, study trends, and risk intelligence.
            </p>
          </div>

          {/* Date Filter */}
          <div className="cf-analytics-filter-group" role="group" aria-label="Time period filter">
            <button
              type="button"
              className={`cf-analytics-filter-btn ${dateFilter === "week" ? "active" : ""}`}
              onClick={() => setDateFilter("week")}
            >
              This Week
            </button>
            <button
              type="button"
              className={`cf-analytics-filter-btn ${dateFilter === "month" ? "active" : ""}`}
              onClick={() => setDateFilter("month")}
            >
              This Month
            </button>
          </div>
        </header>

        {/* Error Alert */}
        {error && (
          <div className="cf-analytics-alert cf-analytics-alert-error" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <AnalyticsLoading />
        ) : (
          <>
            {/* 1. Summary KPIs */}
            <section className="cf-analytics-section" aria-label="Key Performance Indicators">
              <AnalyticsSummary summaryData={summary} />
            </section>

            {/* 2. Academic Risk Diagnostics */}
            <section className="cf-analytics-section" aria-label="Academic Risk Diagnostics">
              <div className="cf-analytics-section-head">
                <ShieldAlert size={19} color="#2563eb" />
                <h2>Academic Risk Diagnostics</h2>
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

            {/* 3. AI Insights & Observations */}
            <section className="cf-analytics-section" aria-label="Smart Insights">
              <div className="cf-analytics-section-head">
                <Sparkles size={18} color="#2563eb" />
                <h2>Smart Academic Insights</h2>
              </div>
              <AnalyticsInsights insights={insights} />
            </section>

            {/* 4. Detailed Visual Charts */}
            <section className="cf-analytics-section" aria-label="Visual Analytics Charts">
              <div className="cf-analytics-section-head">
                <PieChart size={19} color="#2563eb" />
                <h2>Visual Breakdowns & Distributions</h2>
              </div>

              <div className="cf-analytics-charts-grid">
                {/* Attendance Chart */}
                <div className="cf-analytics-chart-wrapper">
                  <AttendanceChart
                    subjects={subjects}
                    attendance={attendance}
                    height={260}
                  />
                </div>

                {/* Weekly Study Chart */}
                <div className="cf-analytics-chart-wrapper">
                  <WeeklyStudyChart
                    studySessions={studySessions}
                    height={260}
                  />
                </div>

                {/* Subject Performance Chart */}
                <div className="cf-analytics-chart-wrapper">
                  <SubjectPerformanceChart
                    subjects={subjects}
                    height={260}
                  />
                </div>

                {/* Assignment Status Chart */}
                <div className="cf-analytics-chart-wrapper">
                  <AssignmentStatusChart
                    assignments={assignments}
                    height={260}
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function AnalyticsLoading() {
  return (
    <div className="cf-skeleton-grid" aria-label="Loading analytics dashboard...">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="cf-skeleton-card" />
      ))}
    </div>
  );
}