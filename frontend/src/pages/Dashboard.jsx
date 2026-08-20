// src/pages/Dashboard.jsx

import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import {
  AlertCircle,
  ArrowRight,
  BarChart2,
  Bell,
  CalendarCheck,
  Check,
  CheckCircle2,
  CheckSquare,
  Clock,
  Flame,
  HeartPulse,
  LogOut,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { formatFirebaseError } from "../utils/errorHandler";
import {
  calculateSGPA,
  calculateOverallAttendance,
  calculateAssignmentStats,
  calculateTodayStudyStats,
  calculateAcademicHealth,
  generateAcademicAlerts,
  getRecentActivity,
  getTimeBasedGreeting,
} from "../utils/dashboardUtils";
import {
  formatStudySubjectDistribution,
  formatAssignmentDistribution,
} from "../utils/analyticsUtils";
import {
  generateAcademicRecommendations,
} from "../utils/academicRecommendations";
import AttendanceChart from "../components/dashboard/AttendanceChart";
import WeeklyStudyChart from "../components/dashboard/WeeklyStudyChart";
import "./Dashboard.css";

const PIE_FALLBACK_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#0891b2",
  "#ea580c",
  "#16a34a",
  "#db2777",
];

// ------------------------------------------------------
// IA / SGPA PREDICTION HELPERS
// These read the same ia1 / ia2 fields saved by Sgpa.jsx.
// ------------------------------------------------------

const DASHBOARD_GRADE_SCALE = [
  { min: 90, point: 10 },
  { min: 80, point: 9 },
  { min: 70, point: 8 },
  { min: 60, point: 7 },
  { min: 55, point: 6 },
  { min: 50, point: 5 },
  { min: 40, point: 4 },
  { min: 0, point: 0 },
];

function getDashboardGradePoint(marks) {
  const numericMarks = Number(marks);

  if (!Number.isFinite(numericMarks)) {
    return 0;
  }

  const match = DASHBOARD_GRADE_SCALE.find(
    (item) => numericMarks >= item.min
  );

  return match?.point ?? 0;
}

function getDashboardCIE(ia1, ia2) {
  if (ia1 === "" || ia1 === null || ia1 === undefined) {
    return null;
  }

  const first = Number(ia1);

  if (!Number.isFinite(first)) {
    return null;
  }

  if (ia2 === "" || ia2 === null || ia2 === undefined) {
    return first;
  }

  const second = Number(ia2);

  if (!Number.isFinite(second)) {
    return first;
  }

  return (first + second) / 2;
}

function calculateDashboardPrediction(subjects, seePercentage = 70) {
  let totalCredits = 0;
  let totalQualityPoints = 0;
  let enteredSubjects = 0;
  let totalIA = 0;

  subjects.forEach((subject) => {
    const credits = Number(subject.credits) || 0;
    const ia1 = subject.ia1;
    const ia2 = subject.ia2;

    if (credits <= 0) {
      return;
    }

    if (
      ia1 === "" ||
      ia1 === null ||
      ia1 === undefined
    ) {
      return;
    }

    const cie = getDashboardCIE(ia1, ia2);

    if (cie === null) {
      return;
    }

    const seeMarks = (seePercentage / 100) * 50;
    const estimatedFinalMarks = cie + seeMarks;
    const gradePoint = getDashboardGradePoint(estimatedFinalMarks);

    totalCredits += credits;
    totalQualityPoints += credits * gradePoint;
    enteredSubjects += 1;
    totalIA += Number(ia1);
  });

  return {
    sgpa:
      totalCredits > 0
        ? (totalQualityPoints / totalCredits).toFixed(2)
        : "0.00",
    averageIA:
      enteredSubjects > 0
        ? totalIA / enteredSubjects
        : null,
    enteredSubjects,
    totalSubjects: subjects.length,
  };
}

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
};

const linkReset = {
  textDecoration: "none",
  color: "inherit",
};

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [studyGoals, setStudyGoals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [updatingSessionId, setUpdatingSessionId] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setSubjects([]);
      setAttendance([]);
      setAssignments([]);
      setStudySessions([]);
      setStudyGoals([]);
      setLoading(false);
      return undefined;
    }

    const userId = currentUser.uid;
    setLoading(true);
    setError("");

    const configs = [
      ["subjects", setSubjects],
      ["attendance", setAttendance],
      ["assignments", setAssignments],
      ["studySessions", setStudySessions],
      ["studyGoals", setStudyGoals],
    ];

    let loaded = 0;
    let cancelled = false;

    const markLoaded = () => {
      loaded += 1;
      if (!cancelled && loaded >= configs.length) setLoading(false);
    };

    const unsubscribers = configs.map(([name, setter]) => {
      const q = query(
        collection(db, name),
        where("userId", "==", userId)
      );

      return onSnapshot(
        q,
        (snapshot) => {
          setter(
            snapshot.docs.map((item) => ({
              id: item.id,
              ...item.data(),
            }))
          );
          markLoaded();
        },
        (err) => {
          console.error(`Dashboard ${name} error:`, err);
          setError((current) => current || formatFirebaseError(err));
          setter([]);
          markLoaded();
        }
      );
    });

    return () => {
      cancelled = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [currentUser]);

  const handleToggleStudySession = async (session) => {
    if (!currentUser?.uid || session.userId !== currentUser.uid) {
      setError("You can only update your own study sessions.");
      return;
    }

    setError("");
    setActionSuccess("");
    setUpdatingSessionId(session.id);

    const newStatus =
      session.status === "Completed" ? "Scheduled" : "Completed";

    try {
      await updateDoc(doc(db, "studySessions", session.id), {
        status: newStatus,
        completedAt:
          newStatus === "Completed" ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });

      setActionSuccess(
        newStatus === "Completed"
          ? "Study session completed. Great work!"
          : "Study session moved back to scheduled."
      );

      window.setTimeout(() => setActionSuccess(""), 3000);
    } catch (err) {
      console.error("Study session update error:", err);
      setError(formatFirebaseError(err));
    } finally {
      setUpdatingSessionId(null);
    }
  };

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
      setError("Unable to sign out. Please try again.");
    }
  };

  const safeCalculate = (fn, fallback) => {
    try {
      return fn();
    } catch (err) {
      console.error("Dashboard calculation error:", err);
      return fallback;
    }
  };

  const sgpaData = useMemo(
    () => safeCalculate(() => calculateSGPA(subjects), {
      sgpa: "0.00",
      status: "No graded subjects",
      hasGradedSubjects: false,
      totalGradedCredits: 0,
    }),
    [subjects]
  );

  // IA data is stored on the same subject documents by Sgpa.jsx.
  // Because subjects is fed by onSnapshot, Dashboard updates automatically
  // whenever IA-1 or IA-2 is saved.
  const iaPrediction = useMemo(
    () =>
      safeCalculate(
        () => calculateDashboardPrediction(subjects, 70),
        {
          sgpa: "0.00",
          averageIA: null,
          enteredSubjects: 0,
          totalSubjects: subjects.length,
        }
      ),
    [subjects]
  );

  const academicRecommendations = useMemo(
    () =>
      safeCalculate(
        () =>
          generateAcademicRecommendations(
            subjects.map((subject) => ({
              ...subject,
              ia1: subject.ia1 ?? "",
              ia2: subject.ia2 ?? "",
            }))
          ),
        []
      ),
    [subjects]
  );

  const highPriorityRecommendations = useMemo(
    () =>
      academicRecommendations.filter(
        (item) => item.priority === "HIGH"
      ),
    [academicRecommendations]
  );

  const attendanceData = useMemo(
    () => safeCalculate(() => calculateOverallAttendance(attendance), {
      formatted: "0%",
      percentage: 0,
      attended: 0,
      total: 0,
      hasRecords: false,
      status: "No data",
    }),
    [attendance]
  );

  const assignmentData = useMemo(
    () => safeCalculate(() => calculateAssignmentStats(assignments), {
      pending: 0,
      completed: 0,
      overdue: 0,
      total: 0,
      nextDeadline: null,
    }),
    [assignments]
  );

  const studyData = useMemo(
    () => safeCalculate(() => calculateTodayStudyStats(studySessions), {
      totalCount: 0,
      completedCount: 0,
      progressPercentage: 0,
      todaySessions: [],
    }),
    [studySessions]
  );


  const healthData = useMemo(
    () =>
      safeCalculate(
        () =>
          calculateAcademicHealth({
            sgpaData,
            attendanceData,
            assignmentData,
            studyData,
          }),
        {
          score: 0,
          status: "Getting Started",
          summary: "Add academic activity to build your health score.",
          color: "#64748b",
          bg: "#f8fafc",
          border: "#e2e8f0",
        }
      ),
    [sgpaData, attendanceData, assignmentData, studyData]
  );

  const academicAlerts = useMemo(
    () =>
      safeCalculate(
        () =>
          generateAcademicAlerts({
            subjects,
            attendance,
            assignments,
            studySessions,
            studyGoals,
          }),
        []
      ),
    [subjects, attendance, assignments, studySessions, studyGoals]
  );

  const recentActivities = useMemo(
    () =>
      safeCalculate(
        () => getRecentActivity({ subjects, attendance, assignments, studySessions }),
        []
      ),
    [subjects, attendance, assignments, studySessions]
  );

  const studySubjectDistributionData = useMemo(
    () =>
      safeCalculate(
        () => formatStudySubjectDistribution(studySessions),
        []
      ),
    [studySessions]
  );

  const assignmentDistributionData = useMemo(
    () =>
      safeCalculate(
        () => formatAssignmentDistribution(assignments),
        []
      ),
    [assignments]
  );

  const greeting = safeCalculate(
    () => getTimeBasedGreeting(),
    "Welcome"
  );

  const studentName =
    currentUser?.displayName ||
    currentUser?.email?.split("@")[0] ||
    "Student";

  const userInitials = studentName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (!currentUser) {
    return (
      <div style={styles.centerState}>
        <div style={{ ...cardStyle, padding: "2.5rem", maxWidth: 460, textAlign: "center" }}>
          <AlertCircle size={42} color="#2563eb" />
          <h2 style={styles.stateTitle}>Please log in</h2>
          <p style={styles.muted}>Sign in to access your CampusFlow dashboard.</p>
          <button style={styles.primaryButton} onClick={() => navigate("/login")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="cf-dashboard-pro" style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <div style={styles.brandRow}>
            <span style={styles.brand}>CampusFlow</span>
            <span style={styles.liveBadge}>Live Academic Hub</span>
          </div>
          <h1 style={styles.title}>
            {greeting}, {studentName} 👋
          </h1>
          <p style={styles.subtitle}>
            Your academic progress, priorities, and study plan in one place.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            style={styles.avatar}
            aria-label="Open profile"
          >
            {userInitials}
          </button>
          <button type="button" onClick={handleLogout} style={styles.secondaryButton}>
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </header>

      {actionSuccess && (
        <Feedback type="success">{actionSuccess}</Feedback>
      )}
      {error && <Feedback type="error">{error}</Feedback>}

      {/* Metrics */}
      <section style={styles.metricGrid}>
        <MetricCard
          to="/sgpa"
          icon={<TrendingUp size={21} />}
          label="Expected SGPA"
          value={
            iaPrediction.enteredSubjects > 0
              ? iaPrediction.sgpa
              : "—"
          }
          detail={
            iaPrediction.enteredSubjects > 0
              ? `Based on IA marks • ${iaPrediction.enteredSubjects}/${iaPrediction.totalSubjects} subjects`
              : "Enter IA marks in SGPA Calculator"
          }
          tone="#2563eb"
        />
        <MetricCard
          to="/sgpa"
          icon={<Target size={21} />}
          label="IA-1 Average"
          value={
            iaPrediction.averageIA !== null
              ? `${iaPrediction.averageIA.toFixed(1)}/50`
              : "—"
          }
          detail={
            iaPrediction.enteredSubjects > 0
              ? `${iaPrediction.enteredSubjects} subject${iaPrediction.enteredSubjects > 1 ? "s" : ""} tracked`
              : "No IA-1 marks entered yet"
          }
          tone="#0891b2"
        />
        <MetricCard
          to="/attendance"
          icon={<CalendarCheck size={21} />}
          label="Attendance Rate"
          value={attendanceData.formatted}
          detail={
            attendanceData.hasRecords
              ? `${attendanceData.attended}/${attendanceData.total} classes • ${attendanceData.status}`
              : "No attendance records yet"
          }
          tone="#2563eb"
        />
        <MetricCard
          to="/assignments"
          icon={<CheckSquare size={21} />}
          label="Pending Tasks"
          value={assignmentData.pending}
          detail={
            assignmentData.overdue > 0
              ? `${assignmentData.overdue} overdue task${assignmentData.overdue > 1 ? "s" : ""}`
              : `${assignmentData.completed} completed of ${assignmentData.total}`
          }
          tone={assignmentData.overdue > 0 ? "#dc2626" : "#0891b2"}
        />
        <MetricCard
          to="/study-planner"
          icon={<Target size={21} />}
          label="Today's Study Target"
          value={`${studyData.progressPercentage || 0}%`}
          detail={`${studyData.completedCount} / ${studyData.totalCount} sessions completed`}
          tone="#ea580c"
        />
      </section>

      {/* IA performance + personalized suggestions */}
      <section
        style={{
          ...cardStyle,
          padding: "1.5rem",
          marginBottom: 30,
        }}
      >
        <div style={styles.cardHeader}>
          <div style={styles.headingWithIcon}>
            <Sparkles size={19} color="#d97706" />
            <h3 style={styles.cardTitle}>
              IA Performance & Suggestions
            </h3>
          </div>

          <Link to="/sgpa" style={styles.textLink}>
            Open SGPA Calculator <ArrowRight size={13} />
          </Link>
        </div>

        {academicRecommendations.length === 0 ? (
          <div style={styles.emptyInline}>
            <div style={styles.emptyIcon}>
              <Target size={18} />
            </div>
            <div>
              <strong style={{ color: "#0f172a" }}>
                Start tracking your IA marks
              </strong>
              <p style={{ ...styles.muted, margin: "3px 0 10px" }}>
                Enter IA-1 marks in SGPA Calculator. Your Dashboard will
                automatically show your IA average, expected SGPA, risk level,
                and study recommendations.
              </p>
              <Link to="/sgpa" style={styles.smallPrimaryLink}>
                Enter IA Marks <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div style={styles.iaSummaryGrid}>
              <div style={styles.iaSummaryCard}>
                <span style={styles.iaSummaryLabel}>IA Average</span>
                <strong style={styles.iaSummaryValue}>
                  {iaPrediction.averageIA !== null
                    ? `${iaPrediction.averageIA.toFixed(1)}/50`
                    : "—"}
                </strong>
                <span style={styles.iaSummaryHint}>
                  {iaPrediction.enteredSubjects} of{" "}
                  {iaPrediction.totalSubjects} subjects
                </span>
              </div>

              <div style={styles.iaSummaryCard}>
                <span style={styles.iaSummaryLabel}>Expected SGPA</span>
                <strong style={{ ...styles.iaSummaryValue, color: "#2563eb" }}>
                  {iaPrediction.sgpa}
                </strong>
                <span style={styles.iaSummaryHint}>
                  Assuming 70% SEE performance
                </span>
              </div>

              <div style={styles.iaSummaryCard}>
                <span style={styles.iaSummaryLabel}>High Priority</span>
                <strong
                  style={{
                    ...styles.iaSummaryValue,
                    color:
                      highPriorityRecommendations.length > 0
                        ? "#dc2626"
                        : "#16a34a",
                  }}
                >
                  {highPriorityRecommendations.length}
                </strong>
                <span style={styles.iaSummaryHint}>
                  Subject{highPriorityRecommendations.length === 1 ? "" : "s"} needing attention
                </span>
              </div>
            </div>

            <div style={styles.recommendationList}>
              {academicRecommendations
                .slice()
                .sort((a, b) => {
                  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
                  return (
                    (order[a.priority] ?? 3) -
                    (order[b.priority] ?? 3)
                  );
                })
                .slice(0, 4)
                .map((item) => (
                  <div
                    key={item.subjectId}
                    style={{
                      ...styles.recommendationCard,
                      background: item.background || "#f8fafc",
                      borderColor: `${item.color || "#cbd5e1"}55`,
                    }}
                  >
                    <div style={styles.recommendationTop}>
                      <div>
                        <strong style={styles.recommendationSubject}>
                          {item.subjectName}
                        </strong>
                        <div style={styles.recommendationMeta}>
                          IA-1: {item.ia1}/50
                          {item.recommendedIA2
                            ? ` • Target IA-2: ${item.recommendedIA2}/50`
                            : ""}
                        </div>
                      </div>

                      <span
                        style={{
                          ...styles.recommendationPill,
                          color: item.color || "#64748b",
                        }}
                      >
                        {item.risk}
                      </span>
                    </div>

                    <p style={styles.recommendationText}>
                      {item.suggestion}
                    </p>

                    {item.recommendedStudyHours > 0 && (
                      <div style={styles.recommendationFooter}>
                        <Clock size={14} />
                        Recommended study:{" "}
                        <strong>
                          {item.recommendedStudyHours} hrs/week
                        </strong>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {academicRecommendations.length > 4 && (
              <Link
                to="/sgpa"
                style={{
                  ...styles.smallPrimaryLink,
                  marginTop: 12,
                }}
              >
                View all subject suggestions <ArrowRight size={13} />
              </Link>
            )}
          </>
        )}
      </section>

      {/* Visual analytics */}
      <SectionHeading
        icon={<BarChart2 size={20} color="#2563eb" />}
        title="Visual Analytics & Progress"
        action={{ label: "Open Analytics", to: "/analytics" }}
      />

      <section style={styles.chartGrid}>
        <AttendanceChart subjects={subjects} attendance={attendance} height={230} />
        <WeeklyStudyChart studySessions={studySessions} height={230} />
        <ChartCard title="Study Time Breakdown" icon={<Clock size={18} />}>
          {studySubjectDistributionData.length ? (
            <div style={{ width: "100%", height: 235 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={studySubjectDistributionData}
                    dataKey="hours"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                  >
                    {studySubjectDistributionData.map((entry, index) => (
                      <Cell
                        key={`study-cell-${index}`}
                        fill={entry.fill || PIE_FALLBACK_COLORS[index % PIE_FALLBACK_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} hrs`, "Time"]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart text="Complete study sessions to see subject-wise time distribution." />
          )}
        </ChartCard>
        <ChartCard title="Assignment Workload" icon={<CheckSquare size={18} />}>
          {assignmentDistributionData.length ? (
            <div style={{ width: "100%", height: 235 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assignmentDistributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    outerRadius={78}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {assignmentDistributionData.map((entry, index) => (
                      <Cell
                        key={`assignment-cell-${index}`}
                        fill={entry.fill || PIE_FALLBACK_COLORS[index % PIE_FALLBACK_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart text="Add assignments to see your workload distribution." />
          )}
        </ChartCard>
      </section>

      {/* Health + alerts */}
      <section style={styles.twoColumnGrid}>
        <div style={{ ...cardStyle, padding: "1.5rem", borderLeft: `5px solid ${healthData.color || "#2563eb"}` }}>
          <div style={styles.cardHeader}>
            <div style={styles.headingWithIcon}>
              <HeartPulse size={19} color={healthData.color || "#2563eb"} />
              <h3 style={styles.cardTitle}>Academic Health Score</h3>
            </div>
            <span style={{ ...styles.statusPill, color: healthData.color, background: healthData.bg, borderColor: healthData.border }}>
              {healthData.status} • {healthData.score}/100
            </span>
          </div>
          <p style={styles.bodyText}>{healthData.summary}</p>
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressBar,
                width: `${Math.max(0, Math.min(100, Number(healthData.score) || 0))}%`,
                background: healthData.color || "#2563eb",
              }}
            />
          </div>
          <div style={styles.healthFooter}>
            <span>Attendance</span>
            <strong>{attendanceData.formatted}</strong>
            <span>•</span>
            <span>SGPA</span>
            <strong>{sgpaData.sgpa}</strong>
          </div>
        </div>

        <div style={{ ...cardStyle, padding: "1.5rem" }}>
          <div style={styles.cardHeader}>
            <div style={styles.headingWithIcon}>
              <Bell size={19} color="#ea580c" />
              <h3 style={styles.cardTitle}>Academic Alerts</h3>
            </div>
            <span style={styles.countPill}>{academicAlerts.length}</span>
          </div>
          {academicAlerts.length === 0 ? (
            <div style={styles.successEmpty}>
              <Check size={18} />
              <span>All systems clear. No critical alerts.</span>
            </div>
          ) : (
            <div style={styles.alertList}>
              {academicAlerts.slice(0, 4).map((alert) => (
                <div key={alert.id} style={alertStyle(alert.severity)}>
                  <strong>{alert.title}</strong>
                  <span>{alert.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Today's plan + deadline */}
      <section style={styles.twoColumnGrid}>
        <div style={{ ...cardStyle, padding: "1.5rem" }}>
          <div style={styles.cardHeader}>
            <div style={styles.headingWithIcon}>
              <Flame size={19} color="#ea580c" />
              <h3 style={styles.cardTitle}>Today's Study Schedule</h3>
            </div>
            <Link to="/study-planner" style={styles.textLink}>Planner <ArrowRight size={13} /></Link>
          </div>

          {studyData.todaySessions?.length ? (
            <div style={styles.list}>
              {studyData.todaySessions.map((session) => {
                const done = session.status === "Completed";
                const updating = updatingSessionId === session.id;
                return (
                  <div key={session.id} style={{ ...styles.sessionRow, opacity: done ? 0.65 : 1 }}>
                    <div style={styles.sessionInfo}>
                      <div style={{ ...styles.sessionTitle, textDecoration: done ? "line-through" : "none" }}>
                        {session.topic || "Study Session"}
                      </div>
                      <div style={styles.sessionMeta}>
                        {session.subjectName || "General Study"} • {session.startTime || "18:00"} • {session.durationMinutes || session.duration || 60}m
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleStudySession(session)}
                      disabled={updating}
                      style={done ? styles.doneButton : styles.completeButton}
                    >
                      {done ? <><Check size={13} /> Done</> : updating ? "Updating..." : "Complete"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyInline
              title="No study blocks today"
              text="Plan a focused block and keep your streak moving."
              action="Create Study Session"
              to="/study-planner"
            />
          )}
        </div>

        <div style={{ ...cardStyle, padding: "1.5rem" }}>
          <div style={styles.cardHeader}>
            <div style={styles.headingWithIcon}>
              <Target size={19} color="#2563eb" />
              <h3 style={styles.cardTitle}>Next Assignment Deadline</h3>
            </div>
            <Link to="/assignments" style={styles.textLink}>All Tasks <ArrowRight size={13} /></Link>
          </div>

          {assignmentData.nextDeadline ? (
            <div style={styles.deadlineBox}>
              <span style={styles.dueBadge}>Due Next</span>
              <div style={styles.deadlineTitle}>{assignmentData.nextDeadline.title}</div>
              <div style={styles.sessionMeta}>
                {assignmentData.nextDeadline.subjectName || "Subject"} • Deadline: {assignmentData.nextDeadline.deadline || assignmentData.nextDeadline.dueDate || "No date"}
              </div>
            </div>
          ) : (
            <div style={styles.successEmpty}>
              <CheckCircle2 size={18} />
              <span>No upcoming assignment deadline.</span>
            </div>
          )}
        </div>
      </section>

      {/* Quick launch + activity */}
      <section style={styles.twoColumnGrid}>
        <div style={{ ...cardStyle, padding: "1.5rem" }}>
          <div style={styles.cardHeader}>
            <div style={styles.headingWithIcon}>
              <Sparkles size={19} color="#7c3aed" />
              <h3 style={styles.cardTitle}>Quick Launchpad</h3>
            </div>
          </div>
          <div style={styles.quickGrid}>
            <QuickLink to="/subjects" label="+ Add Subject" />
            <QuickLink to="/assignments" label="+ Add Task" />
            <QuickLink to="/study-planner" label="+ Study Block" />
            <QuickLink to="/analytics" label="View Analytics" featured />
          </div>
        </div>

        <div style={{ ...cardStyle, padding: "1.5rem" }}>
          <div style={styles.cardHeader}>
            <div style={styles.headingWithIcon}>
              <Clock size={19} color="#2563eb" />
              <h3 style={styles.cardTitle}>Recent Activity</h3>
            </div>
          </div>
          {recentActivities.length ? (
            <div style={styles.activityList}>
              {recentActivities.slice(0, 6).map((activity) => (
                <div key={activity.id} style={styles.activityRow}>
                  <span style={styles.activityDot} />
                  <span style={styles.activityText}>{activity.text}</span>
                  <span style={styles.activityDate}>
                    {activity.date instanceof Date && !Number.isNaN(activity.date.getTime())
                      ? activity.date.toLocaleDateString()
                      : "Recent"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.muted}>No recent activity yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ to, icon, label, value, detail, tone }) {
  return (
    <Link to={to} style={linkReset}>
      <div style={{ ...cardStyle, padding: "1.35rem 1.5rem", height: "100%", boxSizing: "border-box", transition: "transform .18s ease, box-shadow .18s ease" }}>
        <div style={styles.metricTop}>
          <span style={styles.metricLabel}>{label}</span>
          <span style={{ ...styles.metricIcon, color: tone, background: `${tone}12` }}>{icon}</span>
        </div>
        <div style={styles.metricValue}>{value}</div>
        <div style={{ ...styles.metricDetail, color: tone }}>{detail}</div>
      </div>
    </Link>
  );
}

function SectionHeading({ icon, title, action }) {
  return (
    <div style={styles.sectionHeading}>
      <div style={styles.headingWithIcon}>{icon}<h2 style={styles.sectionTitle}>{title}</h2></div>
      {action && <Link to={action.to} style={styles.textLink}>{action.label} <ArrowRight size={14} /></Link>}
    </div>
  );
}

function ChartCard({ title, icon, children }) {
  return (
    <div style={{ ...cardStyle, padding: "1.5rem" }}>
      <div style={styles.headingWithIcon}><span style={{ color: "#2563eb" }}>{icon}</span><h3 style={styles.cardTitle}>{title}</h3></div>
      {children}
    </div>
  );
}

function EmptyChart({ text }) {
  return <div style={styles.emptyChart}>{text}</div>;
}

function EmptyInline({ title, text, action, to }) {
  return (
    <div style={styles.emptyInline}>
      <div style={styles.emptyIcon}><Sparkles size={18} /></div>
      <div>
        <strong style={{ color: "#0f172a" }}>{title}</strong>
        <p style={{ ...styles.muted, margin: "3px 0 10px" }}>{text}</p>
        <Link to={to} style={styles.smallPrimaryLink}>{action} <ArrowRight size={13} /></Link>
      </div>
    </div>
  );
}

function QuickLink({ to, label, featured = false }) {
  return (
    <Link to={to} style={{ ...styles.quickLink, ...(featured ? styles.quickLinkFeatured : {}) }}>
      {label}
      <ArrowRight size={14} />
    </Link>
  );
}

function Feedback({ type, children }) {
  const success = type === "success";
  return (
    <div style={{ ...styles.feedback, ...(success ? styles.successFeedback : styles.errorFeedback) }}>
      {success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{children}</span>
    </div>
  );
}

function alertStyle(severity) {
  if (severity === "critical") {
    return { ...styles.alert, background: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" };
  }
  if (severity === "warning") {
    return { ...styles.alert, background: "#fffbeb", borderColor: "#fde68a", color: "#92400e" };
  }
  return { ...styles.alert, background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e40af" };
}

function DashboardSkeleton() {
  return (
    <div className="cf-dashboard-pro" style={styles.page}>
      <div style={{ ...styles.header, borderBottom: "none" }}>
        <div>
          <div style={{ ...styles.skeleton, width: 120, height: 14 }} />
          <div style={{ ...styles.skeleton, width: 330, height: 30, marginTop: 12 }} />
          <div style={{ ...styles.skeleton, width: 420, height: 14, marginTop: 10 }} />
        </div>
      </div>
      <div style={styles.metricGrid}>{[1, 2, 3, 4].map((i) => <div key={i} style={{ ...cardStyle, height: 150, background: "#f8fafc" }} />)}</div>
      <div style={{ ...styles.chartGrid, marginTop: 24 }}>{[1, 2, 3, 4].map((i) => <div key={i} style={{ ...cardStyle, height: 300, background: "#f8fafc" }} />)}</div>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    maxWidth: "100%",
    padding: "2rem 2.5rem 3rem",
    boxSizing: "border-box",
    minHeight: "100%",
    background: "#f8fafc",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1.25rem",
    marginBottom: "1.5rem",
    paddingBottom: "1.5rem",
    borderBottom: "1px solid #e2e8f0",
  },
  brandRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  brand: { fontSize: "1.05rem", fontWeight: 800, color: "#2563eb" },
  liveBadge: { fontSize: "0.7rem", padding: "3px 8px", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 999, fontWeight: 700 },
  title: { margin: 0, fontSize: "clamp(1.45rem, 2.5vw, 1.9rem)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" },
  subtitle: { margin: "6px 0 0", color: "#64748b", fontSize: "0.9rem" },
  headerActions: { display: "flex", alignItems: "center", gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 12, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", fontWeight: 800, cursor: "pointer" },
  primaryButton: { display: "inline-flex", alignItems: "center", gap: 7, border: 0, borderRadius: 9, padding: "10px 16px", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer" },
  secondaryButton: { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 13px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 600, cursor: "pointer" },
  feedback: { display: "flex", alignItems: "center", gap: 10, padding: "11px 15px", borderRadius: 10, marginBottom: 18, fontSize: "0.88rem" },
  successFeedback: { background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" },
  errorFeedback: { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" },
  metricGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 30 },
  metricTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  metricLabel: { fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em" },
  metricIcon: { width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" },
  metricValue: { fontSize: "2rem", lineHeight: 1.1, fontWeight: 800, color: "#0f172a", margin: "13px 0 6px" },
  metricDetail: { fontSize: "0.78rem", fontWeight: 600, lineHeight: 1.4 },
  sectionHeading: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, margin: "0 0 14px" },
  sectionTitle: { margin: 0, fontSize: "1.15rem", fontWeight: 750, color: "#0f172a" },
  headingWithIcon: { display: "flex", alignItems: "center", gap: 8 },
  textLink: { display: "inline-flex", alignItems: "center", gap: 5, color: "#2563eb", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none" },
  chartGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18, marginBottom: 30 },
  twoColumnGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18, marginBottom: 30 },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 },
  cardTitle: { margin: 0, fontSize: "1rem", fontWeight: 750, color: "#0f172a" },
  statusPill: { fontSize: "0.72rem", padding: "4px 9px", border: "1px solid", borderRadius: 999, fontWeight: 700 },
  countPill: { minWidth: 25, height: 25, padding: "0 7px", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 999, background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", fontSize: "0.72rem", fontWeight: 800 },
  bodyText: { margin: "0 0 15px", color: "#64748b", fontSize: "0.84rem", lineHeight: 1.65 },
  progressTrack: { height: 9, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" },
  progressBar: { height: "100%", borderRadius: 999, transition: "width .4s ease" },
  healthFooter: { display: "flex", gap: 7, alignItems: "center", marginTop: 10, color: "#64748b", fontSize: "0.74rem" },
  alertList: { display: "flex", flexDirection: "column", gap: 8, maxHeight: 160, overflowY: "auto" },
  alert: { display: "flex", flexDirection: "column", gap: 2, padding: "9px 11px", border: "1px solid", borderRadius: 9, fontSize: "0.78rem", lineHeight: 1.45 },
  successEmpty: { display: "flex", alignItems: "center", gap: 8, padding: "12px", borderRadius: 10, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", fontSize: "0.8rem", fontWeight: 600 },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  sessionRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 11px", border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff" },
  sessionInfo: { minWidth: 0 },
  sessionTitle: { fontSize: "0.84rem", fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  sessionMeta: { fontSize: "0.73rem", color: "#64748b", marginTop: 3 },
  completeButton: { border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", borderRadius: 7, padding: "6px 10px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  doneButton: { display: "inline-flex", alignItems: "center", gap: 4, border: "1px solid #86efac", background: "#dcfce7", color: "#15803d", borderRadius: 7, padding: "6px 10px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  deadlineBox: { padding: 15, borderRadius: 11, background: "#f8fafc", border: "1px solid #e2e8f0" },
  dueBadge: { display: "inline-block", fontSize: "0.68rem", fontWeight: 800, color: "#2563eb", background: "#eff6ff", padding: "3px 7px", borderRadius: 5, border: "1px solid #bfdbfe", textTransform: "uppercase" },
  deadlineTitle: { fontSize: "0.95rem", fontWeight: 750, color: "#0f172a", margin: "8px 0 3px" },
  quickGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 },
  quickLink: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "11px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, color: "#334155", fontSize: "0.78rem", fontWeight: 700, textDecoration: "none" },
  quickLinkFeatured: { background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" },
  activityList: { display: "flex", flexDirection: "column" },
  activityRow: { display: "grid", gridTemplateColumns: "8px minmax(0,1fr) auto", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #f1f5f9" },
  activityDot: { width: 6, height: 6, borderRadius: "50%", background: "#2563eb" },
  activityText: { color: "#334155", fontSize: "0.78rem", fontWeight: 550 },
  activityDate: { color: "#94a3b8", fontSize: "0.7rem" },
  iaSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 10,
    marginBottom: 14,
  },
  iaSummaryCard: {
    padding: "12px 14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
  },
  iaSummaryLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "0.7rem",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: ".04em",
  },
  iaSummaryValue: {
    display: "block",
    marginTop: 5,
    color: "#0f172a",
    fontSize: "1.35rem",
    fontWeight: 850,
  },
  iaSummaryHint: {
    display: "block",
    marginTop: 2,
    color: "#94a3b8",
    fontSize: "0.7rem",
  },
  recommendationList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 10,
  },
  recommendationCard: {
    padding: "12px 13px",
    border: "1px solid",
    borderRadius: 11,
  },
  recommendationTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  recommendationSubject: {
    color: "#0f172a",
    fontSize: "0.86rem",
  },
  recommendationMeta: {
    marginTop: 3,
    color: "#64748b",
    fontSize: "0.7rem",
  },
  recommendationPill: {
    flexShrink: 0,
    padding: "4px 8px",
    background: "#ffffff",
    borderRadius: 999,
    fontSize: "0.66rem",
    fontWeight: 900,
  },
  recommendationText: {
    margin: "8px 0 7px",
    color: "#475569",
    fontSize: "0.76rem",
    lineHeight: 1.5,
  },
  recommendationFooter: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    color: "#7c3aed",
    fontSize: "0.7rem",
  },
  emptyChart: { height: 235, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: "#94a3b8", fontSize: "0.8rem", padding: "0 20px" },
  emptyInline: { display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 10 },
  emptyIcon: { width: 36, height: 36, flexShrink: 0, borderRadius: 9, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" },
  smallPrimaryLink: { display: "inline-flex", alignItems: "center", gap: 4, color: "#2563eb", textDecoration: "none", fontSize: "0.75rem", fontWeight: 750 },
  muted: { color: "#64748b", fontSize: "0.84rem", lineHeight: 1.5 },
  centerState: { minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#f8fafc", boxSizing: "border-box" },
  stateTitle: { margin: "14px 0 6px", color: "#0f172a" },
  skeleton: { background: "#e2e8f0", borderRadius: 8 },
};