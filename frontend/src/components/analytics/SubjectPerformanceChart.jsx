// src/components/analytics/SubjectPerformanceChart.jsx
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { transformSubjectPerformanceData } from "../../utils/analyticsCalculations";
import { Award, AlertCircle } from "lucide-react";

export default function SubjectPerformanceChart({ subjects = [], height = 260 }) {
  const chartData = transformSubjectPerformanceData(subjects);
  const hasData = chartData.length > 0;

  return (
    <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Award size={18} color="#8b5cf6" />
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Subject Performance (Grade Points)</h3>
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Scale: 0 - 10</span>
      </div>

      {!hasData ? (
        <div style={{ height: `${height}px`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", borderRadius: "8px", color: "var(--text-secondary)", fontSize: "13px" }}>
          <AlertCircle size={24} color="#94a3b8" style={{ marginBottom: "6px" }} />
          No graded subjects found. Assign grades in SGPA/Subjects to view.
        </div>
      ) : (
        <div style={{ width: "100%", height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="subject" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
              <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val, name, props) => [`${val} GP (Grade: ${props.payload.grade})`, "Score"]} />
              <Bar dataKey="gradePoint" radius={[4, 4, 0, 0]} maxBarSize={44}>
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}