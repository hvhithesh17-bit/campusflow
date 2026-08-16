// src/components/analytics/AnalyticsSummary.jsx
import React from "react";
import { Award, CalendarCheck, Clock, CheckSquare, BookOpen } from "lucide-react";

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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
      {/* SGPA */}
      <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "12px", padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#8b5cf6" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Current SGPA</span>
          <Award size={18} />
        </div>
        <div style={{ fontSize: "28px", fontWeight: 800, margin: "0.4rem 0 0.2rem 0" }}>{currentSGPA}</div>
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{totalCredits} Total Credits</span>
      </div>

      {/* Attendance */}
      <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "12px", padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: overallAttendance >= 75 ? "#16a34a" : "#dc2626" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Overall Attendance</span>
          <CalendarCheck size={18} />
        </div>
        <div style={{ fontSize: "28px", fontWeight: 800, margin: "0.4rem 0 0.2rem 0" }}>
          {overallAttendance !== null ? `${overallAttendance}%` : "—"}
        </div>
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          {totalClasses > 0 ? `${totalAttended}/${totalClasses} Conducted` : "No classes"}
        </span>
      </div>

      {/* Study Time */}
      <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "12px", padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#ea580c" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Study Duration</span>
          <Clock size={18} />
        </div>
        <div style={{ fontSize: "28px", fontWeight: 800, margin: "0.4rem 0 0.2rem 0" }}>{totalStudyHours}h</div>
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Total Logged</span>
      </div>

      {/* Assignments */}
      <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "12px", padding: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#0891b2" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Task Completion</span>
          <CheckSquare size={18} />
        </div>
        <div style={{ fontSize: "28px", fontWeight: 800, margin: "0.4rem 0 0.2rem 0" }}>{assignmentCompletionRate}%</div>
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{completedAssignments} of {totalAssignments} done</span>
      </div>
    </div>
  );
}