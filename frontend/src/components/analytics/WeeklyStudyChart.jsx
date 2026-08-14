// src/components/analytics/WeeklyStudyChart.jsx
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
import { calculateWeeklyStudyHours } from "../../utils/analyticsCalculations";
import { Clock, AlertCircle } from "lucide-react";

function CustomStudyTooltip({ active, payload }) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
        <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: "2px" }}>{data.fullDay} ({data.dateStr})</div>
        <div style={{ color: "#ea580c", fontWeight: 700 }}>Study Time: {data.hours} hrs ({data.minutes} mins)</div>
      </div>
    );
  }
  return null;
}

export default function WeeklyStudyChart({ studySessions = [], height = 260 }) {
  const chartData = calculateWeeklyStudyHours(studySessions);
  const totalMins = chartData.reduce((sum, d) => sum + d.minutes, 0);
  const hasData = totalMins > 0;

  return (
    <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Clock size={18} color="#ea580c" />
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Weekly Study Hours</h3>
        </div>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#ea580c" }}>
          {(totalMins / 60).toFixed(1)} hrs total
        </span>
      </div>

      {!hasData ? (
        <div style={{ height: `${height}px`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", borderRadius: "8px", color: "var(--text-secondary)", fontSize: "13px" }}>
          <AlertCircle size={24} color="#94a3b8" style={{ marginBottom: "6px" }} />
          No completed study sessions recorded this week.
        </div>
      ) : (
        <div style={{ width: "100%", height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis unit="h" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomStudyTooltip />} />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.hours > 0 ? "#ea580c" : "#cbd5e1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}