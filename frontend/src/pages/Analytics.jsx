// src/pages/Analytics.jsx
import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import {
  calculateAcademicSummary,
  generateAnalyticsInsights,
} from "../utils/analyticsCalculations";
import AnalyticsSummary from "../components/analytics/AnalyticsSummary";
import AnalyticsInsights from "../components/analytics/AnalyticsInsights";
import AttendanceChart from "../components/analytics/AttendanceChart";
import WeeklyStudyChart from "../components/analytics/WeeklyStudyChart";
import SubjectPerformanceChart from "../components/analytics/SubjectPerformanceChart";
import AssignmentStatusChart from "../components/analytics/AssignmentStatusChart";
import { BarChart2, Calendar, AlertCircle, RefreshCw } from "lucide-react";

export default function Analytics() {
  const { currentUser } = useAuth();

  // Firestore Data State
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [studySessions, setStudySessions] = useState([]);

  // UI & Filter State
  const [dateFilter, setDateFilter] = useState("week"); // 'week' | 'month'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setError("");

    const qSub = query(collection(db, "subjects"), where("userId", "==", currentUser.uid));
    const qAtt = query(collection(db, "attendance"), where("userId", "==", currentUser.uid));
    const qAsg = query(collection(db, "assignments"), where("userId", "==", currentUser.uid));
    const qStd = query(collection(db, "studySessions"), where("userId", "==", currentUser.uid));

    let loadedCount = 0;
    const checkDone = () => {
      loadedCount += 1;
      if (loadedCount >= 4) setLoading(false);
    };

    const unsubSub = onSnapshot(qSub, (snap) => { setSubjects(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); checkDone(); }, (err) => { console.error(err); setError("Failed to load subjects."); checkDone(); });
    const unsubAtt = onSnapshot(qAtt, (snap) => { setAttendance(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); checkDone(); }, (err) => { console.error(err); setError("Failed to load attendance."); checkDone(); });
    const unsubAsg = onSnapshot(qAsg, (snap) => { setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); checkDone(); }, (err) => { console.error(err); setError("Failed to load assignments."); checkDone(); });
    const unsubStd = onSnapshot(qStd, (snap) => { setStudySessions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); checkDone(); }, (err) => { console.error(err); setError("Failed to load study sessions."); checkDone(); });

    return () => {
      unsubSub();
      unsubAtt();
      unsubAsg();
      unsubStd();
    };
  }, [currentUser]);

  // Derived Summary & Insights
  const summary = calculateAcademicSummary({ subjects, attendance, assignments, studySessions, dateFilter });
  const insights = generateAnalyticsInsights({ subjects, attendance, assignments, studySessions, dateFilter });

  if (loading) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ height: "35px", width: "250px", backgroundColor: "#e2e8f0", borderRadius: "8px", marginBottom: "1.5rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: "100px", backgroundColor: "#e2e8f0", borderRadius: "12px" }} />
          ))}
        </div>
        <div style={{ height: "300px", backgroundColor: "#e2e8f0", borderRadius: "14px" }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem", color: "var(--text-primary)" }}>
      {/* Header with Date Filter */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid var(--border-color, #e2e8f0)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BarChart2 size={24} color="var(--accent-color, #2563eb)" />
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800 }}>Academic Analytics</h1>
          </div>
          <p style={{ margin: "0.3rem 0 0 0", color: "var(--text-secondary)", fontSize: "14px" }}>
            Comprehensive performance visualization, attendance health, and study trends.
          </p>
        </div>

        {/* Date Filter Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <button
            onClick={() => setDateFilter("week")}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: dateFilter === "week" ? "#ffffff" : "transparent",
              color: dateFilter === "week" ? "var(--accent-color, #2563eb)" : "var(--text-secondary)",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: dateFilter === "week" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            This Week
          </button>
          <button
            onClick={() => setDateFilter("month")}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: dateFilter === "month" ? "#ffffff" : "transparent",
              color: dateFilter === "month" ? "var(--accent-color, #2563eb)" : "var(--text-secondary)",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: dateFilter === "month" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            This Month
          </button>
        </div>
      </header>

      {error && (
        <div style={{ padding: "0.75rem 1rem", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* 1. Academic Summary */}
      <AnalyticsSummary summaryData={summary} />

      {/* 2. Rule-Based Insights */}
      <AnalyticsInsights insights={insights} />

      {/* 3. Visual Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
        {/* Attendance by Subject */}
        <AttendanceChart subjects={subjects} attendance={attendance} height={250} />

        {/* Weekly Study Hours */}
        <WeeklyStudyChart studySessions={studySessions} height={250} />

        {/* Subject Performance */}
        <SubjectPerformanceChart subjects={subjects} height={250} />

        {/* Assignment Workload Distribution */}
        <AssignmentStatusChart assignments={assignments} height={250} />
      </div>
    </div>
  );
}