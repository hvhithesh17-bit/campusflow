// src/components/analytics/AssignmentStatusChart.jsx
import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { transformAssignmentStatusData } from "../../utils/analyticsCalculations";
import { CheckSquare, AlertCircle } from "lucide-react";

export default function AssignmentStatusChart({ assignments = [], height = 260 }) {
  const chartData = transformAssignmentStatusData(assignments);
  const hasData = chartData.length > 0;

  return (
    <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
        <CheckSquare size={18} color="#0891b2" />
        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Assignment Distribution</h3>
      </div>

      {!hasData ? (
        <div style={{ height: `${height}px`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", borderRadius: "8px", color: "var(--text-secondary)", fontSize: "13px" }}>
          <AlertCircle size={24} color="#94a3b8" style={{ marginBottom: "6px" }} />
          No assignments recorded yet.
        </div>
      ) : (
        <div style={{ width: "100%", height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} Task(s)`, name]} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}