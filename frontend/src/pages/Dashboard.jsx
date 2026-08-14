// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import {
  calculateSGPA,
  calculateOverallAttendance,
  calculateAssignmentStats,
  calculateTodayStudyStats,
  calculateWeeklyStudyStats,
  calculateAcademicHealth,
  generateAcademicAlerts,
  getRecentActivity,
  getTimeBasedGreeting,
} from "../utils/dashboardUtils";
import {
  formatStudySubjectDistribution,
  formatAssignmentDistribution,
} from "../utils/analyticsUtils";
import AttendanceChart from "../components/dashboard/AttendanceChart";
import WeeklyStudyChart from "../components/dashboard/WeeklyStudyChart";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import {
  Award,
  CalendarCheck,
  CheckSquare,
  Clock,
  Target,
  CheckCircle2,
  HeartPulse,
  AlertCircle,
  Bell,
  LogOut,
  BarChart2,
} from "lucide-react";

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Firestore raw states
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [studyGoals, setStudyGoals] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Real-time data fetching scoped strictly to authenticated user
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    setError("");

    const qSub = query(collection(db, "subjects"), where("userId", "==", currentUser.uid));
    const qAtt = query(collection(db, "attendance"), where("userId", "==", currentUser.uid));
    const qAsg = query(collection(db, "assignments"), where("userId", "==", currentUser.uid));
    const qStd = query(collection(db, "studySessions"), where("userId", "==", currentUser.uid));
    const qGol = query(collection(db, "studyGoals"), where("userId", "==", currentUser.uid));

    let count = 0;
    const checkDone = () => {
      count += 1;
      if (count >= 5) setLoading(false);
    };

    const unsubSub = onSnapshot(qSub, (s) => { setSubjects(s.docs.map((d) => ({ id: d.id, ...d.data() }))); checkDone(); }, (err) => { console.error(err); setError("Failed to load subjects."); checkDone(); });
    const unsubAtt = onSnapshot(qAtt, (s) => { setAttendance(s.docs.map((d) => ({ id: d.id, ...d.data() }))); checkDone(); }, (err) => { console.error(err); setError("Failed to load attendance."); checkDone(); });
    const unsubAsg = onSnapshot(qAsg, (s) => { setAssignments(s.docs.map((d) => ({ id: d.id, ...d.data() }))); checkDone(); }, (err) => { console.error(err); setError("Failed to load assignments."); checkDone(); });
    const unsubStd = onSnapshot(qStd, (s) => { setStudySessions(s.docs.map((d) => ({ id: d.id, ...d.data() }))); checkDone(); }, (err) => { console.error(err); setError("Failed to load study planner."); checkDone(); });
    const unsubGol = onSnapshot(qGol, (s) => { setStudyGoals(s.docs.map((d) => ({ id: d.id, ...d.data() }))); checkDone(); }, (err) => { console.error(err); setError("Failed to load goals."); checkDone(); });

    return () => {
      unsubSub();
      unsubAtt();
      unsubAsg();
      unsubStd();
      unsubGol();
    };
  }, [currentUser]);

  // Toggle study session status directly from dashboard
  const handleToggleStudySession = async (session) => {
    try {
      const newStatus = session.status === "Completed" ? "Scheduled" : "Completed";
      await updateDoc(doc(db, "studySessions", session.id), {
        status: newStatus,
        completedAt: newStatus === "Completed" ? serverTimestamp() : null,
      });
      setActionSuccess(`Session marked as ${newStatus}`);
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to update study session status.");
    }
  };

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  // Statistical derivations
  const sgpaData = calculateSGPA(subjects);
  const attendanceData = calculateOverallAttendance(attendance);
  const assignmentData = calculateAssignmentStats(assignments);
  const studyData = calculateTodayStudyStats(studySessions);
  const weeklyStudy = calculateWeeklyStudyStats(studySessions);
  const healthData = calculateAcademicHealth({ sgpaData, attendanceData, assignmentData, studyData });
  const academicAlerts = generateAcademicAlerts({ subjects, attendance, assignments, studySessions, studyGoals });
  const recentActivities = getRecentActivity({ subjects, attendance, assignments, studySessions });

  // Visual chart datasets
  const studySubjectDistributionData = formatStudySubjectDistribution(studySessions);
  const assignmentDistributionData = formatAssignmentDistribution(assignments);

  const greeting = getTimeBasedGreeting();
  const studentName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Student";
  const userInitials = studentName.substring(0, 2).toUpperCase();

  if (loading) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ height: "40px", width: "300px", backgroundColor: "#e2e8f0", borderRadius: "8px", marginBottom: "1.5rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: "130px", backgroundColor: "#e2e8f0", borderRadius: "14px" }} />
          ))}
        </div>
        <div style={{ height: "250px", backgroundColor: "#e2e8f0", borderRadius: "14px" }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem", color: "var(--text-primary)" }}>
      {/* 1. Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid var(--border-color, #e2e8f0)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent-color, #2563eb)", letterSpacing: "-0.5px" }}>
              CampusFlow
            </span>
            <span style={{ fontSize: "12px", padding: "2px 8px", backgroundColor: "#eff6ff", color: "#1d4ed8", borderRadius: "9999px", fontWeight: 600 }}>
              Live Dashboard
            </span>
          </div>
          <h1 style={{ margin: "0.4rem 0 0 0", fontSize: "24px", fontWeight: 800 }}>
            {greeting}, {studentName} 👋
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "var(--accent-color, #2563eb)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            {userInitials}
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid var(--border-color, #cbd5e1)",
              backgroundColor: "transparent",
              color: "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </header>

      {/* Alerts / Feedback Banner */}
      {actionSuccess && (
        <div style={{ padding: "0.75rem 1rem", backgroundColor: "#ecfdf5", color: "#065f46", borderRadius: "8px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={16} /> {actionSuccess}
        </div>
      )}
      {error && (
        <div style={{ padding: "0.75rem 1rem", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* 2. Key Metric Cards */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        <Link to="/sgpa" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#8b5cf6" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Current SGPA</span>
              <Award size={20} />
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, margin: "0.5rem 0 0.25rem 0" }}>{sgpaData.sgpa}</div>
            <span style={{ fontSize: "12px", color: sgpaData.hasGradedSubjects ? "#8b5cf6" : "var(--text-secondary)", fontWeight: 600 }}>
              {sgpaData.status} {sgpaData.hasGradedSubjects ? `(${sgpaData.totalGradedCredits} Credits)` : ""}
            </span>
          </div>
        </Link>

        <Link to="/attendance" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#2563eb" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Attendance Rate</span>
              <CalendarCheck size={20} />
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, margin: "0.5rem 0 0.25rem 0" }}>{attendanceData.formatted}</div>
            <span style={{ fontSize: "12px", color: attendanceData.percentage >= 75 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
              {attendanceData.hasRecords ? `${attendanceData.attended}/${attendanceData.total} Classes (${attendanceData.status})` : "No classes recorded"}
            </span>
          </div>
        </Link>

        <Link to="/assignments" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: assignmentData.overdue > 0 ? "#dc2626" : "#0891b2" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Pending Tasks</span>
              <CheckSquare size={20} />
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, margin: "0.5rem 0 0.25rem 0" }}>{assignmentData.pending}</div>
            <span style={{ fontSize: "12px", color: assignmentData.overdue > 0 ? "#dc2626" : "var(--text-secondary)", fontWeight: assignmentData.overdue > 0 ? 700 : 500 }}>
              {assignmentData.overdue > 0 ? `⚠️ ${assignmentData.overdue} Overdue` : `${assignmentData.completed} Completed of ${assignmentData.total}`}
            </span>
          </div>
        </Link>

        <Link to="/study-planner" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#ea580c" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Today's Study</span>
              <Target size={20} />
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, margin: "0.5rem 0 0.25rem 0" }}>
              {studyData.totalCount > 0 ? `${studyData.progressPercentage}%` : "0%"}
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
              {studyData.completedCount} / {studyData.totalCount} sessions done today
            </span>
          </div>
        </Link>
      </section>

      {/* 3. Visual Analytics & Charts Grid */}
      <section style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
          <BarChart2 size={20} color="var(--accent-color, #2563eb)" />
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Academic Visualizations & Analytics</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
          <AttendanceChart subjects={subjects} attendance={attendance} height={220} />
          <WeeklyStudyChart studySessions={studySessions} height={220} />

          {/* Study Time Distribution */}
          <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.25rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "15px" }}>Study Time Breakdown</h3>
            {studySubjectDistributionData.length === 0 ? (
              <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                Complete study sessions to generate breakdown.
              </div>
            ) : (
              <div style={{ width: "100%", height: "220px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={studySubjectDistributionData} dataKey="hours" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                      {studySubjectDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} hrs`, "Time"]} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Assignment Status Distribution */}
          <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.25rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "15px" }}>Assignment Workload Status</h3>
            {assignmentDistributionData.length === 0 ? (
              <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                No assignments found.
              </div>
            ) : (
              <div style={{ width: "100%", height: "220px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={assignmentDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {assignmentDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Academic Health & Alerts */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: `1px solid ${healthData.border}`, borderLeft: `5px solid ${healthData.color}`, borderRadius: "14px", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <HeartPulse size={20} color={healthData.color} />
              <h3 style={{ margin: 0, fontSize: "16px" }}>Academic Health</h3>
            </div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: healthData.color, backgroundColor: healthData.bg, padding: "3px 10px", borderRadius: "9999px", border: `1px solid ${healthData.border}` }}>
              {healthData.status} ({healthData.score}/100)
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 1rem 0" }}>{healthData.summary}</p>
          <div style={{ width: "100%", height: "8px", backgroundColor: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ width: `${healthData.score}%`, height: "100%", backgroundColor: healthData.color, transition: "width 0.4s ease" }} />
          </div>
        </div>

        <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
            <Bell size={18} color="#ea580c" />
            <h3 style={{ margin: 0, fontSize: "16px" }}>Academic Alerts ({academicAlerts.length})</h3>
          </div>
          {academicAlerts.length === 0 ? (
            <div style={{ padding: "1rem", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
              ✨ No urgent alerts. You are up to date!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "140px", overflowY: "auto" }}>
              {academicAlerts.slice(0, 3).map((alt) => (
                <div
                  key={alt.id}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    backgroundColor: alt.severity === "critical" ? "#fef2f2" : alt.severity === "warning" ? "#fffbeb" : "#eff6ff",
                    border: `1px solid ${alt.severity === "critical" ? "#fca5a5" : alt.severity === "warning" ? "#fde68a" : "#bfdbfe"}`,
                    color: alt.severity === "critical" ? "#991b1b" : alt.severity === "warning" ? "#92400e" : "#1e40af",
                  }}
                >
                  <strong>{alt.title}:</strong> {alt.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Today's Study Plan & Assignments */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} color="#ea580c" /> Today's Study Plan
            </h3>
            <Link to="/study-planner" style={{ fontSize: "12px", color: "var(--accent-color, #2563eb)", textDecoration: "none", fontWeight: 600 }}>
              Study Planner →
            </Link>
          </div>

          {studyData.todaySessions.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>No sessions scheduled for today.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {studyData.todaySessions.map((session) => {
                const isDone = session.status === "Completed";
                return (
                  <div key={session.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: "8px", backgroundColor: isDone ? "#f8fafc" : "#ffffff", border: "1px solid #e2e8f0", opacity: isDone ? 0.65 : 1 }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600, textDecoration: isDone ? "line-through" : "none" }}>{session.topic}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{session.subjectName} • {session.startTime} ({session.duration} min)</div>
                    </div>
                    <button
                      onClick={() => handleToggleStudySession(session)}
                      style={{ padding: "3px 8px", fontSize: "11px", fontWeight: 600, borderRadius: "4px", border: "1px solid", borderColor: isDone ? "#86efac" : "#bfdbfe", backgroundColor: isDone ? "#dcfce7" : "#eff6ff", color: isDone ? "#15803d" : "#1d4ed8", cursor: "pointer" }}
                    >
                      {isDone ? "✓ Done" : "Complete"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "16px" }}>Next Assignment Deadline</h3>
            <Link to="/assignments" style={{ fontSize: "12px", color: "var(--accent-color, #2563eb)", textDecoration: "none", fontWeight: 600 }}>
              View Tasks →
            </Link>
          </div>

          {assignmentData.nextDeadline ? (
            <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", textTransform: "uppercase" }}>Due Next</span>
              <div style={{ fontSize: "14px", fontWeight: 700, margin: "4px 0" }}>{assignmentData.nextDeadline.title}</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {assignmentData.nextDeadline.subjectName} • Due: <strong>{assignmentData.nextDeadline.dueDate || "No date"}</strong>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>No pending tasks! All caught up. 🎉</p>
          )}
        </div>
      </section>

      {/* 6. Quick Actions & Recent Activity */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "16px" }}>Quick Actions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <Link to="/subjects" style={{ textDecoration: "none", padding: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", textAlign: "center" }}>
              + Add Subject
            </Link>
            <Link to="/assignments" style={{ textDecoration: "none", padding: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", textAlign: "center" }}>
              + Add Task
            </Link>
            <Link to="/study-planner" style={{ textDecoration: "none", padding: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", textAlign: "center" }}>
              + Study Block
            </Link>
            <Link to="/sgpa" style={{ textDecoration: "none", padding: "10px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", fontSize: "13px", fontWeight: 600, color: "#1d4ed8", textAlign: "center" }}>
              Calculate SGPA
            </Link>
          </div>
        </div>

        <div style={{ backgroundColor: "var(--bg-secondary, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "14px", padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "16px" }}>Recent Activity</h3>
          {recentActivities.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>No recent timestamps recorded.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {recentActivities.map((act) => (
                <div key={act.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderBottom: "1px solid #f8fafc", paddingBottom: "4px" }}>
                  <span>✓ {act.text}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{act.date.toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}