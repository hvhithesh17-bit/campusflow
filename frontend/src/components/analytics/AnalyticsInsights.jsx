// src/components/analytics/AnalyticsInsights.jsx
import React from "react";
import { Sparkles, AlertTriangle, CheckCircle, Info } from "lucide-react";

export default function AnalyticsInsights({ insights = [] }) {
  if (insights.length === 0) {
    return (
      <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.5rem" }}>
          <Sparkles size={18} color="#8b5cf6" />
          <h3 style={{ margin: 0, fontSize: "16px" }}>Academic Insights</h3>
        </div>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
          Log more courses, attendance, and study blocks to generate personalized analytical insights.
        </p>
      </div>
    );
  }

  const getStyle = (severity) => {
    switch (severity) {
      case "critical":
        return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: <AlertTriangle size={16} color="#dc2626" /> };
      case "warning":
        return { bg: "#fffbeb", border: "#fde68a", text: "#92400e", icon: <AlertTriangle size={16} color="#d97706" /> };
      case "success":
        return { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", icon: <CheckCircle size={16} color="#16a34a" /> };
      default:
        return { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", icon: <Info size={16} color="#2563eb" /> };
    }
  };

  return (
    <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.5rem", marginBottom: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
        <Sparkles size={18} color="#8b5cf6" />
        <h3 style={{ margin: 0, fontSize: "16px" }}>Academic Insights & Advisory</h3>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
        {insights.map((item, idx) => {
          const style = getStyle(item.severity);
          return (
            <div
              key={idx}
              style={{
                backgroundColor: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: "10px",
                padding: "10px 14px",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <div style={{ marginTop: "2px" }}>{style.icon}</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: style.text, marginBottom: "2px" }}>
                  {item.title}
                </div>
                <div style={{ fontSize: "12px", color: style.text, opacity: 0.9, lineHeight: "1.4" }}>
                  {item.message}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}