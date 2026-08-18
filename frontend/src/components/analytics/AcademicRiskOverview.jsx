// src/components/analytics/AcademicRiskOverview.jsx
import React, { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { calculateAcademicRisk } from "../../utils/riskAnalysis";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Plus,
  HelpCircle,
  AlertOctagon,
} from "lucide-react";

export default function AcademicRiskOverview({
  subjects = [],
  attendance = [],
  assignments = [],
  studySessions = [],
  studyGoals = [],
  loading = false,
}) {
  const navigate = useNavigate();

  // 1. Calculate rule-based risk for each subject
  const riskAssessments = useMemo(() => {
    if (!subjects || subjects.length === 0) return [];
    return calculateAcademicRisk({
      subjects,
      attendance,
      assignments,
      studySessions,
      studyGoals,
    });
  }, [subjects, attendance, assignments, studySessions, studyGoals]);

  // 2. Aggregate Risk Metrics & Top-Risk Course
  const aggregateMetrics = useMemo(() => {
    if (riskAssessments.length === 0) {
      return {
        overallScore: 0,
        overallLevel: "LOW",
        highCount: 0,
        medCount: 0,
        lowCount: 0,
        topRiskSubject: null,
      };
    }

    const totalScore = riskAssessments.reduce((sum, r) => sum + r.riskScore, 0);
    const avgScore = Math.round(totalScore / riskAssessments.length);

    let level = "LOW";
    if (avgScore >= 60) level = "HIGH";
    else if (avgScore >= 30) level = "MEDIUM";

    const highCount = riskAssessments.filter((r) => r.riskLevel === "HIGH").length;
    const medCount = riskAssessments.filter((r) => r.riskLevel === "MEDIUM").length;
    const lowCount = riskAssessments.filter((r) => r.riskLevel === "LOW").length;

    const sorted = [...riskAssessments].sort((a, b) => b.riskScore - a.riskScore);
    const topRisk = sorted[0]?.riskScore > 0 ? sorted[0] : null;

    return {
      overallScore: avgScore,
      overallLevel: level,
      highCount,
      medCount,
      lowCount,
      topRiskSubject: topRisk,
    };
  }, [riskAssessments]);

  // Color Utility
  const getRiskColor = (score) => {
    if (score >= 60) return { primary: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
    if (score >= 30) return { primary: "#d97706", bg: "#fffbeb", border: "#fde68a" };
    return { primary: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
  };

  // Inter-Feature Action Handlers
  const handleCreateStudySession = (sub) => {
    navigate("/study-planner", {
      state: {
        prefill: {
          subjectId: sub.subjectId,
          subjectName: sub.subjectName,
          topic: `Priority Focus: ${sub.subjectName}`,
          duration: sub.recommendedDuration,
          priority: sub.recommendedPriority,
        },
      },
    });
  };

  const chartData = useMemo(() => {
    return riskAssessments.map((r) => ({
      name: r.subjectName.length > 14 ? `${r.subjectName.slice(0, 12)}…` : r.subjectName,
      fullName: r.subjectName,
      riskScore: r.riskScore,
      riskLevel: r.riskLevel,
    }));
  }, [riskAssessments]);

  if (loading) {
    return (
      <div
        style={{
          padding: "3rem 2rem",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          textAlign: "center",
          color: "#64748b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <Sparkles size={20} color="#2563eb" />
          <span style={{ fontSize: "1rem", fontWeight: 600 }}>Analyzing academic performance...</span>
        </div>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px dashed #cbd5e1",
          borderRadius: "16px",
          padding: "3rem 2rem",
          textAlign: "center",
        }}
      >
        <AlertOctagon size={32} color="#94a3b8" style={{ margin: "0 auto 0.75rem auto" }} />
        <h3 style={{ margin: "0 0 0.5rem 0", color: "#0f172a", fontSize: "1.1rem" }}>
          Not enough academic data to calculate reliable risk.
        </h3>
        <p style={{ margin: "0 0 1.25rem 0", color: "#64748b", fontSize: "0.9rem" }}>
          Enroll subjects to initiate rule-based diagnostic evaluation.
        </p>
        <Link
          to="/subjects"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Enroll Courses <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const overallColors = getRiskColor(aggregateMetrics.overallScore);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Transparency / Model Disclaimer Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "0.75rem 1rem",
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          fontSize: "0.8rem",
          color: "#475569",
        }}
      >
        <HelpCircle size={15} color="#2563eb" style={{ flexShrink: 0 }} />
        <span>
          <strong>Rule-Based Academic Risk Analysis:</strong> This system uses deterministic academic indicators (attendance, assignments, grades, and study goals) to evaluate risk. It does not predict future grades.
        </span>
      </div>

      {/* 1. ACADEMIC RISK SUMMARY SPOTLIGHT */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: aggregateMetrics.topRiskSubject ? "1px solid #fecaca" : "1px solid #e2e8f0",
          borderLeft: aggregateMetrics.topRiskSubject ? "5px solid #dc2626" : "5px solid #16a34a",
          borderRadius: "16px",
          padding: "1.75rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            ACADEMIC RISK SUMMARY
          </span>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 800,
              padding: "3px 10px",
              borderRadius: "9999px",
              backgroundColor: overallColors.bg,
              color: overallColors.primary,
              border: `1px solid ${overallColors.border}`,
            }}
          >
            Overall: {aggregateMetrics.overallScore} / 100 ({aggregateMetrics.overallLevel})
          </span>
        </div>

        {aggregateMetrics.topRiskSubject ? (
          <div>
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem", color: "#0f172a" }}>
              Your highest-risk subject is <strong>{aggregateMetrics.topRiskSubject.subjectName}</strong>.
            </h3>
            <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "#dc2626", fontWeight: 700 }}>
              Risk: {aggregateMetrics.topRiskSubject.riskScore} / 100 — {aggregateMetrics.topRiskSubject.statusMessage}
            </p>

            {aggregateMetrics.topRiskSubject.reasons.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>Main concerns:</span>
                <ol style={{ margin: "0.25rem 0 0 0", paddingLeft: "1.25rem", fontSize: "0.85rem", color: "#475569" }}>
                  {aggregateMetrics.topRiskSubject.reasons.map((r, idx) => (
                    <li key={idx} style={{ marginBottom: "2px" }}>
                      {r}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div style={{ padding: "0.75rem 1rem", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>Recommended next step: </span>
              <span style={{ fontSize: "0.85rem", color: "#475569" }}>
                Schedule a {aggregateMetrics.topRiskSubject.recommendedDuration}-minute study session and clear pending requirements for {aggregateMetrics.topRiskSubject.subjectName}.
              </span>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => handleCreateStudySession(aggregateMetrics.topRiskSubject)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Plus size={15} /> Create Study Session
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0.5rem 0" }}>
            <ShieldCheck size={24} color="#16a34a" />
            <div>
              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>All subjects are currently in good standing!</div>
              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Maintain your current study consistency to prevent score degradation.</div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Visual Risk Score Distribution */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
              Risk Scores by Subject
            </h3>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Distribution of current risk levels (0 = Safe, 100 = Critical)
            </span>
          </div>
        </div>

        <div style={{ width: "100%", height: "240px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} interval={0} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip
                formatter={(val, name, props) => [`${val} / 100 (${props.payload.riskLevel})`, "Risk Score"]}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
              />
              <Bar dataKey="riskScore" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getRiskColor(entry.riskScore).primary} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Actionable Subject Risk Table */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
          Subject Risk Actions & Navigation
        </h3>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                <th style={{ padding: "10px 8px", fontWeight: 600 }}>Subject</th>
                <th style={{ padding: "10px 8px", textAlign: "center", fontWeight: 600, width: "90px" }}>Risk</th>
                <th style={{ padding: "10px 8px", textAlign: "center", fontWeight: 600, width: "90px" }}>Level</th>
                <th style={{ padding: "10px 8px", textAlign: "center", fontWeight: 600, width: "100px" }}>Attendance</th>
                <th style={{ padding: "10px 8px", textAlign: "center", fontWeight: 600, width: "80px" }}>Grade</th>
                <th style={{ padding: "10px 8px", textAlign: "center", fontWeight: 600, width: "90px" }}>Overdue</th>
                <th style={{ padding: "10px 8px", textAlign: "center", fontWeight: 600, width: "90px" }}>Goal</th>
                <th style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600 }}>Action Plan</th>
              </tr>
            </thead>
            <tbody>
              {riskAssessments.map((sub) => {
                const colors = getRiskColor(sub.riskScore);

                return (
                  <tr key={sub.subjectId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {/* Subject */}
                    <td style={{ padding: "12px 8px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{sub.subjectName}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{sub.statusMessage}</div>
                    </td>

                    {/* Risk Score */}
                    <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: 800, color: colors.primary }}>
                      {sub.riskScore}
                    </td>

                    {/* Risk Level Badge */}
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          backgroundColor: colors.bg,
                          color: colors.primary,
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        {sub.riskLevel}
                      </span>
                    </td>

                    {/* Attendance */}
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>
                      {sub.attendance !== null ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                          <span style={{ fontWeight: 600, color: sub.attendance < 75 ? "#dc2626" : "#16a34a" }}>
                            {sub.attendance}%
                          </span>
                          {sub.attendance < 75 && (
                            <Link to="/attendance" style={{ fontSize: "0.7rem", color: "#2563eb", textDecoration: "none" }}>
                              View Attendance
                            </Link>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      )}
                    </td>

                    {/* Grade */}
                    <td style={{ padding: "12px 8px", textAlign: "center", color: "#334155", fontWeight: 600 }}>
                      {sub.gradePoint !== null ? `${sub.gradePoint} GP` : "—"}
                    </td>

                    {/* Overdue Assignments */}
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>
                      {sub.overdueAssignments > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                          <span style={{ fontWeight: 700, color: "#dc2626" }}>⚠️ {sub.overdueAssignments}</span>
                          <Link to="/assignments" style={{ fontSize: "0.7rem", color: "#2563eb", textDecoration: "none" }}>
                            View Tasks
                          </Link>
                        </div>
                      ) : (
                        <span style={{ color: "#16a34a", fontWeight: 600 }}>0</span>
                      )}
                    </td>

                    {/* Goal Progress */}
                    <td style={{ padding: "12px 8px", textAlign: "center", color: "#334155", fontWeight: 600 }}>
                      {sub.studyGoalProgress !== null ? `${sub.studyGoalProgress}%` : "—"}
                    </td>

                    {/* Action Toolbar */}
                    <td style={{ padding: "12px 8px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        {(sub.riskLevel === "HIGH" || sub.riskLevel === "MEDIUM") ? (
                          <button
                            type="button"
                            onClick={() => handleCreateStudySession(sub)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid #bfdbfe",
                              backgroundColor: "#eff6ff",
                              color: "#1d4ed8",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            <Plus size={13} /> Session
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}