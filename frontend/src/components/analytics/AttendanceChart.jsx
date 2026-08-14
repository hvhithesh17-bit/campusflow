// src/components/analytics/AttendanceChart.jsx
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";
import { transformAttendanceChartData } from "../../utils/analyticsCalculations";
import { CalendarCheck, AlertCircle } from "lucide-react";

function CustomAttendanceTooltip({ active, payload }) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
        <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>{data.subject}</div>
        <div style={{ color: "#64748b" }}>Classes: <strong>{data.attended} / {data.total}</strong></div>
        <div style={{ color: data.fill, fontWeight: 700, marginTop: "2px" }}>Attendance: {data.attendance}%</div>
      </div>
    );
  }
  return null;
}

export default function AttendanceChart({ subjects = [], attendance = [], height = 260 }) {
  const chartData = transformAttendanceChartData(subjects, attendance);
  const hasData = chartData.some((d) => d.total > 0);

  return (
    <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CalendarCheck size={18} color="var(--accent-color, #2563eb)" />
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Attendance by Subject</h3>
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Threshold: 75%</span>
      </div>

      {!hasData ? (
        <div style={{ height: `${height}px`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", borderRadius: "8px", color: "var(--text-secondary)", fontSize: "13px" }}>
          <AlertCircle size={24} color="#94a3b8" style={{ marginBottom: "6px" }} />
          No attendance data available yet.
        </div>
      ) : (
        <div style={{ width: "100%", height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="subject" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} ticks={[0, 25, 50, 75, 100]} unit="%" />
              <Tooltip content={<CustomAttendanceTooltip />} />
              <ReferenceLine y={75} stroke="#dc2626" strokeDasharray="4 4" label={{ value: "75%", fill: "#dc2626", fontSize: 10, position: "right" }} />
              <Bar dataKey="attendance" radius={[4, 4, 0, 0]} maxBarSize={44}>
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