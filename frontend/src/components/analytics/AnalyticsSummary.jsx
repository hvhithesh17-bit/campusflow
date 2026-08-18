// src/components/analytics/AnalyticsSummary.jsx
import React from "react";
import { Award, CalendarCheck, Clock, CheckSquare } from "lucide-react";

export default function AnalyticsSummary({ summaryData }) {
  const {
    currentSGPA,
    totalCredits,
    overallAttendance,
    totalAttended,
    totalClasses,
    assignmentCompletionRate,
    completedAssignments,
    totalAssignments,
    totalStudyHours,
  } = summaryData;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
        gap: "1rem",
        marginBottom: "1.75rem",
      }}
    >
      {/* SGPA */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#8b5cf6" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>Current SGPA</span>
          <Award size={18} />
        </div>
        <div style={{ fontSize: "28px", fontWeight: 800, margin: "0.4rem 0 0.2rem 0", color: "#8b5cf6" }}>
          {currentSGPA}
        </div>
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{totalCredits} Total Credits</span>
      </div>

      {/* Attendance */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: overallAttendance >= 75 ? "#16a34a" : "#dc2626" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>Overall Attendance</span>
          <CalendarCheck size={18} />
        </div>
        <div style={{ fontSize: "28px", fontWeight: 800, margin: "0.4rem 0 0.2rem 0", color: overallAttendance >= 75 ? "#16a34a" : "#dc2626" }}>
          {overallAttendance !== null ? `${overallAttendance}%` : "—"}
        </div>
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          {totalClasses > 0 ? `${totalAttended}/${totalClasses} Conducted` : "No classes"}
        </span>
      </div>

      {/* Study Time */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#ea580c" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>Study Duration</span>
          <Clock size={18} />
        </div>
        <div style={{ fontSize: "28px", fontWeight: 800, margin: "0.4rem 0 0.2rem 0", color: "#ea580c" }}>
          {totalStudyHours}h
        </div>
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Total Logged</span>
      </div>

      {/* Assignments */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#0891b2" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>Task Completion</span>
          <CheckSquare size={18} />
        </div>
        <div style={{ fontSize: "28px", fontWeight: 800, margin: "0.4rem 0 0.2rem 0", color: "#0891b2" }}>
          {assignmentCompletionRate}%
        </div>
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{completedAssignments} of {totalAssignments} done</span>
      </div>
    </div>
  );
}