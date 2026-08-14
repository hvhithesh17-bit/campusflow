// src/components/dashboard/AttendanceChart.jsx
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
  ReferenceLine,
  Cell,
} from "recharts";
import { CalendarCheck, AlertCircle } from "lucide-react";

/**
 * Custom Tooltip component for rich data inspection.
 */
function CustomAttendanceTooltip({ active, payload }) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    const isBelowThreshold = data.percentage < 75;

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
          {data.fullName}
        </div>
        <div style={{ color: "#64748b", marginBottom: "2px" }}>
          Classes Attended: <strong style={{ color: "#0f172a" }}>{data.attended} / {data.total}</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
          <span style={{ color: "#64748b" }}>Attendance:</span>
          <strong
            style={{
              color: data.percentage >= 85 ? "#16a34a" : data.percentage >= 75 ? "#2563eb" : "#dc2626",
              fontSize: "13px",
            }}
          >
            {data.percentage}%
          </strong>
        </div>
        {data.total > 0 && isBelowThreshold && (
          <div style={{ color: "#dc2626", fontSize: "11px", fontWeight: 600, marginTop: "4px" }}>
            ⚠️ Below 75% requirement
          </div>
        )}
      </div>
    );
  }
  return null;
}

/**
 * Reusable Attendance Bar Chart component.
 *
 * @param {Object} props
 * @param {Array} props.subjects - Raw subjects array from Firestore
 * @param {Array} props.attendance - Raw attendance array from Firestore
 * @param {number} [props.height=260] - Chart height in pixels
 */
export default function AttendanceChart({ subjects = [], attendance = [], height = 260 }) {
  // 1. Process & link subjects with attendance records using subjectId
  const chartData = (subjects.length > 0 ? subjects : attendance).map((item) => {
    let subjectName = item.name || item.subjectName || "Subject";
    let attended = 0;
    let total = 0;

    if (item.id) {
      // Matching by subjectId
      const attRecord = attendance.find(
        (a) => a.subjectId === item.id || a.subjectName === item.name
      );
      if (attRecord) {
        attended = Number(attRecord.attendedClasses ?? attRecord.attended ?? 0);
        total = Number(attRecord.totalClasses ?? attRecord.total ?? 0);
      }
    } else {
      // Direct attendance record fallback
      attended = Number(item.attendedClasses ?? item.attended ?? 0);
      total = Number(item.totalClasses ?? item.total ?? 0);
    }

    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

    // Truncate long labels for clean X-axis display
    const shortName =
      subjectName.length > 12 ? `${subjectName.substring(0, 10)}...` : subjectName;

    // Color logic: Green >= 85%, Blue >= 75%, Red < 75%
    let fill = "#dc2626";
    if (total === 0) fill = "#94a3b8";
    else if (percentage >= 85) fill = "#16a34a";
    else if (percentage >= 75) fill = "#2563eb";

    return {
      name: shortName,
      fullName: subjectName,
      percentage,
      attended,
      total,
      fill,
    };
  });

  const hasData = chartData.some((d) => d.total > 0);

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
      {/* Chart Card Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CalendarCheck size={18} color="var(--accent-color, #2563eb)" />
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
            Subject Attendance
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", color: "var(--text-secondary)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#16a34a" }} />
            ≥85%
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#2563eb" }} />
            75–84%
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#dc2626" }} />
            &lt;75%
          </span>
        </div>
      </div>

      {/* Empty State */}
      {!hasData ? (
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
            No attendance records logged yet.
          </p>
          <Link
            to="/attendance"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--accent-color, #2563eb)",
              textDecoration: "none",
            }}
          >
            Log Attendance →
          </Link>
        </div>
      ) : (
        /* Recharts Responsive Container */
        <div style={{ width: "100%", height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 15, left: -20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#64748b" }}
                interval={0}
                angle={-18}
                textAnchor="end"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#64748b" }}
                ticks={[0, 25, 50, 75, 100]}
                unit="%"
              />
              <Tooltip content={<CustomAttendanceTooltip />} />
              <ReferenceLine
                y={75}
                stroke="#dc2626"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: "75% Req",
                  position: "insideTopRight",
                  fill: "#dc2626",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
              <Bar dataKey="percentage" radius={[5, 5, 0, 0]} maxBarSize={48}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}