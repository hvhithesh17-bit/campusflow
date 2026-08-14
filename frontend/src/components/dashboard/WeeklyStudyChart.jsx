// src/components/dashboard/WeeklyStudyChart.jsx
import React from "react";
import { Link } from "react-router-dom";
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
import { calculateWeeklyStudyHours } from "../../utils/analyticsUtils";
import { Clock, AlertCircle } from "lucide-react";

/**
 * Custom Tooltip component for study hours breakdown.
 */
function CustomStudyTooltip({ active, payload }) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;

    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "10px 14px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          fontSize: "12px",
        }}
      >
        <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
          {data.fullDay} ({data.dateStr})
        </div>
        <div style={{ color: "#64748b" }}>
          Completed Study:{" "}
          <strong style={{ color: "#ea580c", fontSize: "13px" }}>
            {data.hours} hrs ({data.minutes} mins)
          </strong>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Reusable Weekly Study Hours Bar Chart.
 *
 * @param {Object} props
 * @param {Array} props.studySessions - Raw studySessions collection from Firestore
 * @param {number} [props.height=260] - Chart height in pixels
 */
export default function WeeklyStudyChart({ studySessions = [], height = 260 }) {
  const chartData = calculateWeeklyStudyHours(studySessions);
  const totalWeeklyMinutes = chartData.reduce((sum, d) => sum + d.minutes, 0);
  const totalWeeklyHours = (totalWeeklyMinutes / 60).toFixed(1);
  const hasStudyActivity = totalWeeklyMinutes > 0;

  return (
    <div
      style={{
        backgroundColor: "var(--bg-secondary, #ffffff)",
        border: "1px solid var(--border-color, #e2e8f0)",
        borderRadius: "14px",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Clock size={18} color="#ea580c" />
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
            Weekly Study Hours
          </h3>
        </div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "#ea580c",
            backgroundColor: "#fff7ed",
            padding: "2px 8px",
            borderRadius: "6px",
            border: "1px solid #ffedd5",
          }}
        >
          {totalWeeklyHours} hrs this week
        </span>
      </div>

      {/* Chart Canvas / Empty State */}
      {!hasStudyActivity ? (
        <div
          style={{
            height: `${height}px`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f8fafc",
            borderRadius: "10px",
            border: "1px dashed #cbd5e1",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <AlertCircle size={28} color="#94a3b8" style={{ marginBottom: "0.5rem" }} />
          <p style={{ margin: "0 0 0.5rem 0", fontSize: "13px", color: "var(--text-secondary)" }}>
            No completed study sessions recorded this week.
          </p>
          <Link
            to="/study-planner"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--accent-color, #2563eb)",
              textDecoration: "none",
            }}
          >
            Schedule Study Session →
          </Link>
        </div>
      ) : (
        <div style={{ width: "100%", height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                unit="h"
                allowDecimals={true}
              />
              <Tooltip content={<CustomStudyTooltip />} />
              <Bar dataKey="hours" radius={[5, 5, 0, 0]} maxBarSize={44}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.hours > 0 ? "#ea580c" : "#cbd5e1"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}