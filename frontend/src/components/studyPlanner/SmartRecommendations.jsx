// src/components/studyPlanner/SmartRecommendations.jsx
import React from "react";
import { Sparkles, Target, Clock, AlertCircle, PlusCircle } from "lucide-react";

export default function SmartRecommendations({
  recommendations = [],
  onSelectRecommendation,
  loading = false,
}) {
  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "var(--bg-secondary, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: "14px",
          padding: "1.5rem",
          marginBottom: "2rem",
          color: "var(--text-secondary)",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Sparkles size={18} color="#8b5cf6" />
        Analyzing your academic data for smart study priorities...
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "var(--bg-secondary, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: "14px",
          padding: "1.5rem",
          marginBottom: "2rem",
          textAlign: "center",
        }}
      >
        <AlertCircle size={28} color="#94a3b8" style={{ marginBottom: "0.5rem" }} />
        <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "15px", color: "var(--text-primary)" }}>
          No study recommendations yet
        </h3>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
          Add subjects, log attendance, or create assignments to generate personalized study priorities.
        </p>
      </div>
    );
  }

  const topPriority = recommendations[0];
  const otherRecommendations = recommendations.slice(1);

  return (
    <div style={{ marginBottom: "2.5rem" }}>
      {/* Section Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
        <Sparkles size={20} color="#8b5cf6" />
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }}>
          Smart Study Recommendations
        </h2>
      </div>

      {/* 1. TODAY'S TOP PRIORITY CARD */}
      {topPriority && (
        <div
          style={{
            backgroundColor: topPriority.bg,
            border: `1.5px solid ${topPriority.badgeColor}`,
            borderRadius: "14px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <Target size={16} color={topPriority.badgeColor} />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: topPriority.badgeColor,
                  }}
                >
                  🎯 Today's Top Priority
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
                {topPriority.subjectName}
              </h3>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  backgroundColor: "#ffffff",
                  color: topPriority.badgeColor,
                  border: `1px solid ${topPriority.badgeColor}`,
                }}
              >
                {topPriority.priority} PRIORITY (Score: {topPriority.score})
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#475569",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Clock size={14} /> {topPriority.recommendedMinutes} min
              </span>
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
              Why this recommendation?
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
              {topPriority.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onSelectRecommendation(topPriority)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: topPriority.badgeColor,
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <PlusCircle size={15} /> Add to Study Planner
          </button>
        </div>
      )}

      {/* 2. OTHER SUBJECT RECOMMENDATIONS */}
      {otherRecommendations.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem",
          }}
        >
          {otherRecommendations.map((rec) => (
            <div
              key={rec.subjectId}
              style={{
                backgroundColor: "var(--bg-secondary, #ffffff)",
                border: "1px solid var(--border-color, #e2e8f0)",
                borderRadius: "12px",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                    {rec.subjectName}
                  </h4>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      backgroundColor: rec.bg,
                      color: rec.badgeColor,
                      border: `1px solid ${rec.badgeColor}`,
                    }}
                  >
                    {rec.priority}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    marginBottom: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Clock size={13} /> Recommended: <strong>{rec.recommendedMinutes} mins</strong> (Score: {rec.score})
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Reasons:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                    {rec.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectRecommendation(rec)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  width: "100%",
                  padding: "7px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color, #cbd5e1)",
                  backgroundColor: "#f8fafc",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <PlusCircle size={14} /> Add to Study Planner
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}