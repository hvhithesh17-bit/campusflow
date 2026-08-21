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
  Sector,
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
  School,
  Sparkles,
  Target,
  TrendingUp,
  User,
  BookOpen,
  ClipboardList,
  Activity,
  ChevronRight,
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
  "#4f46e5",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

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

    if (credits <= 0) return;

    if (
      ia1 === "" ||
      ia1 === null ||
      ia1 === undefined
    ) {
      return;
    }

    const cie = getDashboardCIE(ia1, ia2);

    if (cie === null) return;

    const seeMarks = (seePercentage / 100) * 50;
    const estimatedFinalMarks = cie + seeMarks;

    const gradePoint = getDashboardGradePoint(
      estimatedFinalMarks
    );

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
  const [updatingSessionId, setUpdatingSessionId] =
    useState(null);

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

      if (!cancelled && loaded >= configs.length) {
        setLoading(false);
      }
    };

    const unsubscribers = configs.map(
      ([name, setter]) => {
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
            console.error(
              `Dashboard ${name} error:`,
              err
            );

            setError(
              (current) =>
                current || formatFirebaseError(err)
            );

            setter([]);
            markLoaded();
          }
        );
      }
    );

    return () => {
      cancelled = true;

      unsubscribers.forEach((unsubscribe) =>
        unsubscribe()
      );
    };
  }, [currentUser]);

  const handleToggleStudySession = async (session) => {
    if (
      !currentUser?.uid ||
      session.userId !== currentUser.uid
    ) {
      setError(
        "You can only update your own study sessions."
      );
      return;
    }

    setError("");
    setActionSuccess("");
    setUpdatingSessionId(session.id);

    const newStatus =
      session.status === "Completed"
        ? "Scheduled"
        : "Completed";

    try {
      await updateDoc(
        doc(db, "studySessions", session.id),
        {
          status: newStatus,

          completedAt:
            newStatus === "Completed"
              ? serverTimestamp()
              : null,

          updatedAt: serverTimestamp(),
        }
      );

      setActionSuccess(
        newStatus === "Completed"
          ? "Study session completed. Great work!"
          : "Study session moved back to scheduled."
      );

      window.setTimeout(() => {
        setActionSuccess("");
      }, 3000);
    } catch (err) {
      console.error(
        "Study session update error:",
        err
      );

      setError(formatFirebaseError(err));
    } finally {
      setUpdatingSessionId(null);
    }
  };

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      }

      navigate("/login", {
        replace: true,
      });
    } catch (err) {
      console.error("Logout error:", err);

      setError(
        "Unable to sign out. Please try again."
      );
    }
  };

  const safeCalculate = (fn, fallback) => {
    try {
      return fn();
    } catch (err) {
      console.error(
        "Dashboard calculation error:",
        err
      );

      return fallback;
    }
  };

  const sgpaData = useMemo(
    () =>
      safeCalculate(
        () => calculateSGPA(subjects),
        {
          sgpa: "0.00",
          status: "No graded subjects",
          hasGradedSubjects: false,
          totalGradedCredits: 0,
        }
      ),
    [subjects]
  );

  const iaPrediction = useMemo(
    () =>
      safeCalculate(
        () =>
          calculateDashboardPrediction(
            subjects,
            70
          ),
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
    () =>
      safeCalculate(
        () =>
          calculateOverallAttendance(
            attendance
          ),
        {
          formatted: "0%",
          percentage: 0,
          attended: 0,
          total: 0,
          hasRecords: false,
          status: "No data",
        }
      ),
    [attendance]
  );

  const assignmentData = useMemo(
    () =>
      safeCalculate(
        () =>
          calculateAssignmentStats(
            assignments
          ),
        {
          pending: 0,
          completed: 0,
          overdue: 0,
          total: 0,
          nextDeadline: null,
        }
      ),
    [assignments]
  );

  const studyData = useMemo(
    () =>
      safeCalculate(
        () =>
          calculateTodayStudyStats(
            studySessions
          ),
        {
          totalCount: 0,
          completedCount: 0,
          progressPercentage: 0,
          todaySessions: [],
        }
      ),
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
          summary:
            "Add academic activity to build your health score.",
          color: "#64748b",
          bg: "#f8fafc",
          border: "#e2e8f0",
        }
      ),
    [
      sgpaData,
      attendanceData,
      assignmentData,
      studyData,
    ]
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
    [
      subjects,
      attendance,
      assignments,
      studySessions,
      studyGoals,
    ]
  );

  const recentActivities = useMemo(
    () =>
      safeCalculate(
        () =>
          getRecentActivity({
            subjects,
            attendance,
            assignments,
            studySessions,
          }),
        []
      ),
    [
      subjects,
      attendance,
      assignments,
      studySessions,
    ]
  );

  const studySubjectDistributionData = useMemo(
    () =>
      safeCalculate(
        () =>
          formatStudySubjectDistribution(
            studySessions
          ),
        []
      ),
    [studySessions]
  );

  const assignmentDistributionData = useMemo(
    () =>
      safeCalculate(
        () =>
          formatAssignmentDistribution(
            assignments
          ),
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

  if (!currentUser) {
    return (
      <div className="cf-auth-state">
        <div className="cf-auth-card">
          <div className="cf-auth-icon">
            <AlertCircle size={28} />
          </div>

          <h2>Please log in</h2>

          <p>
            Sign in to access your CampusFlow
            dashboard and academic insights.
          </p>

          <button
            className="btn btn-primary"
            onClick={() => navigate("/login")}
          >
            Go to Login
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <main className="cf-dashboard-pro">

      {/* HERO */}

      <section className="cf-dashboard-hero">
        <div className="cf-hero-content">

          <div className="cf-hero-badge">
            <School size={15} />
            <span>CampusFlow Dashboard</span>
          </div>

          <h1>
            {greeting},{" "}
            <span>{studentName}</span> 👋
          </h1>

          <p>
            Track your academic performance,
            priorities, and daily study progress
            from one place.
          </p>

          <div className="cf-hero-actions">
            <Link
              to="/profile"
              className="btn btn-hero-secondary"
            >
              <User size={16} />
              Profile
            </Link>

            <button
              onClick={handleLogout}
              className="btn btn-hero-secondary"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>

        <div className="cf-hero-orb">
          <div className="cf-hero-orb-inner">
            <Activity size={42} />
          </div>
        </div>
      </section>

      {actionSuccess && (
        <Feedback type="success">
          {actionSuccess}
        </Feedback>
      )}

      {error && (
        <Feedback type="error">
          {error}
        </Feedback>
      )}

      {/* OVERVIEW */}

      <SectionLabel
        title="Academic Overview"
        text="Your key numbers at a glance"
      />

      <section className="cf-stats-grid">

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
              ? `${iaPrediction.enteredSubjects}/${iaPrediction.totalSubjects} subjects tracked`
              : "Add IA marks to predict"
          }
          tone="indigo"
        />

        <MetricCard
          to="/sgpa"
          icon={<Target size={21} />}
          label="IA-1 Average"
          value={
            iaPrediction.averageIA !== null
              ? `${iaPrediction.averageIA.toFixed(
                  1
                )}/50`
              : "—"
          }
          detail={
            iaPrediction.enteredSubjects > 0
              ? "Based on entered IA marks"
              : "No IA marks yet"
          }
          tone="blue"
        />

        <MetricCard
          to="/attendance"
          icon={<CalendarCheck size={21} />}
          label="Attendance"
          value={attendanceData.formatted}
          detail={
            attendanceData.hasRecords
              ? `${attendanceData.attended}/${attendanceData.total} classes`
              : "Start tracking attendance"
          }
          tone="green"
        />

        <MetricCard
          to="/assignments"
          icon={<ClipboardList size={21} />}
          label="Pending Tasks"
          value={assignmentData.pending}
          detail={
            assignmentData.overdue > 0
              ? `${assignmentData.overdue} overdue`
              : `${assignmentData.completed} completed`
          }
          tone={
            assignmentData.overdue > 0
              ? "red"
              : "orange"
          }
        />

        <MetricCard
          to="/study-planner"
          icon={<BookOpen size={21} />}
          label="Today's Progress"
          value={`${studyData.progressPercentage || 0}%`}
          detail={`${studyData.completedCount}/${studyData.totalCount} sessions`}
          tone="purple"
        />

      </section>

      {/* PRIORITY SECTION */}

      <section className="cf-priority-grid">

        <div className="cf-card cf-study-focus">

          <div className="cf-card-header">
            <div className="cf-heading-with-icon">
              <div className="cf-icon-box cf-icon-orange">
                <Flame size={19} />
              </div>

              <div>
                <h3 className="cf-card-title">
                  Today's Study Plan
                </h3>

                <p className="cf-card-subtitle">
                  Focus on what matters today
                </p>
              </div>
            </div>

            <Link
              to="/study-planner"
              className="cf-icon-action"
            >
              <ChevronRight size={20} />
            </Link>
          </div>

          <div className="cf-study-progress-row">
            <div>
              <span>Daily completion</span>

              <strong>
                {studyData.progressPercentage || 0}%
              </strong>
            </div>

            <div className="cf-mini-progress">
              <div
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      Number(
                        studyData.progressPercentage
                      ) || 0
                    )
                  )}%`,
                }}
              />
            </div>
          </div>

          {studyData.todaySessions?.length ? (
            <div className="cf-session-list">

              {studyData.todaySessions
                .slice(0, 4)
                .map((session) => {
                  const done =
                    session.status ===
                    "Completed";

                  const updating =
                    updatingSessionId ===
                    session.id;

                  return (
                    <div
                      key={session.id}
                      className={`cf-session-item ${
                        done
                          ? "is-completed"
                          : ""
                      }`}
                    >
                      <div className="cf-session-check">
                        {done ? (
                          <Check size={15} />
                        ) : (
                          <Clock size={15} />
                        )}
                      </div>

                      <div className="cf-session-info">
                        <strong>
                          {session.topic ||
                            "Study Session"}
                        </strong>

                        <span>
                          {session.subjectName ||
                            "General Study"}
                          {" • "}
                          {session.durationMinutes ||
                            session.duration ||
                            60}
                          m
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleStudySession(
                            session
                          )
                        }
                        disabled={updating}
                        className={
                          done
                            ? "cf-session-done"
                            : "cf-session-complete"
                        }
                      >
                        {done
                          ? "Done"
                          : updating
                          ? "..."
                          : "Complete"}
                      </button>
                    </div>
                  );
                })}

            </div>
          ) : (
            <div className="cf-empty-soft">
              <CheckCircle2 size={20} />

              <div>
                <strong>
                  Your day is open
                </strong>

                <span>
                  Add a study session to create
                  today's plan.
                </span>
              </div>
            </div>
          )}

        </div>

        <div className="cf-card cf-health-card">

          <div className="cf-card-header">
            <div className="cf-heading-with-icon">
              <div
                className="cf-icon-box"
                style={{
                  color: healthData.color,
                  background: healthData.bg,
                }}
              >
                <HeartPulse size={19} />
              </div>

              <div>
                <h3 className="cf-card-title">
                  Academic Health
                </h3>

                <p className="cf-card-subtitle">
                  Your overall academic condition
                </p>
              </div>
            </div>
          </div>

          <div className="cf-health-main">

            <div
              className="cf-health-score"
              style={{
                "--health-color":
                  healthData.color ||
                  "#4f46e5",
              }}
            >
              <strong>
                {healthData.score}
              </strong>

              <span>/100</span>
            </div>

            <div className="cf-health-info">
              <span
                className="cf-status-pill"
                style={{
                  color: healthData.color,
                  background:
                    healthData.bg,
                }}
              >
                {healthData.status}
              </span>

              <p>
                {healthData.summary}
              </p>
            </div>

          </div>

          <div className="cf-health-progress">
            <div
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    Number(
                      healthData.score
                    ) || 0
                  )
                )}%`,
                background:
                  healthData.color ||
                  "#4f46e5",
              }}
            />
          </div>

          <div className="cf-health-stats">

            <div>
              <span>Attendance</span>
              <strong>
                {attendanceData.formatted}
              </strong>
            </div>

            <div>
              <span>SGPA</span>
              <strong>
                {sgpaData.sgpa}
              </strong>
            </div>

            <div>
              <span>Tasks</span>
              <strong>
                {assignmentData.pending}
              </strong>
            </div>

          </div>

        </div>

      </section>

      {/* IA PERFORMANCE */}

      <section className="cf-card cf-section-card">

        <div className="cf-card-header">

          <div className="cf-heading-with-icon">
            <div className="cf-icon-box cf-icon-gold">
              <Sparkles size={19} />
            </div>

            <div>
              <h3 className="cf-card-title">
                IA Performance & Suggestions
              </h3>

              <p className="cf-card-subtitle">
                Personalized insights based on
                your marks
              </p>
            </div>
          </div>

          <Link
            to="/sgpa"
            className="btn btn-outline"
          >
            SGPA
            <ArrowRight size={14} />
          </Link>

        </div>

        {academicRecommendations.length === 0 ? (

          <div className="cf-empty-inline">

            <div className="cf-empty-icon">
              <Target size={20} />
            </div>

            <div>
              <strong>
                Start tracking your IA marks
              </strong>

              <p>
                Enter IA-1 marks in the SGPA
                Calculator to receive expected
                SGPA and personalized study
                recommendations.
              </p>

              <Link
                to="/sgpa"
                className="cf-small-primary-link"
              >
                Add IA Marks
                <ArrowRight size={14} />
              </Link>
            </div>

          </div>

        ) : (

          <>
            <div className="cf-insight-grid">

              <InsightBox
                label="IA Average"
                value={
                  iaPrediction.averageIA !== null
                    ? `${iaPrediction.averageIA.toFixed(
                        1
                      )}/50`
                    : "—"
                }
                hint={`${iaPrediction.enteredSubjects}/${iaPrediction.totalSubjects} subjects`}
              />

              <InsightBox
                label="Expected SGPA"
                value={iaPrediction.sgpa}
                hint="Assuming 70% SEE performance"
                highlight
              />

              <InsightBox
                label="Needs Attention"
                value={
                  highPriorityRecommendations.length
                }
                hint="High priority subjects"
                danger={
                  highPriorityRecommendations.length >
                  0
                }
              />

            </div>

            <div className="cf-recommendation-list">

              {academicRecommendations
                .slice()
                .sort((a, b) => {
                  const order = {
                    HIGH: 0,
                    MEDIUM: 1,
                    LOW: 2,
                  };

                  return (
                    (order[a.priority] ?? 3) -
                    (order[b.priority] ?? 3)
                  );
                })
                .slice(0, 4)
                .map((item) => (

                  <div
                    key={item.subjectId}
                    className="cf-recommendationCard"
                  >

                    <div className="cf-recommendation-top">

                      <div>
                        <strong>
                          {item.subjectName}
                        </strong>

                        <span>
                          IA-1: {item.ia1}/50
                        </span>
                      </div>

                      <span
                        className="cf-risk-badge"
                        style={{
                          color:
                            item.color ||
                            "#64748b",
                          background:
                            item.background ||
                            "#f8fafc",
                        }}
                      >
                        {item.risk}
                      </span>

                    </div>

                    <p>
                      {item.suggestion}
                    </p>

                    {item.recommendedStudyHours >
                      0 && (
                      <div className="cf-recommendation-footer">
                        <Clock size={14} />

                        <span>
                          Study target:
                        </span>

                        <strong>
                          {
                            item.recommendedStudyHours
                          }{" "}
                          hrs/week
                        </strong>
                      </div>
                    )}

                  </div>
                ))}

            </div>
          </>
        )}

      </section>

      {/* ANALYTICS */}

      <SectionHeading
        icon={<BarChart2 size={20} />}
        title="Analytics & Progress"
        action={{
          label: "Open Analytics",
          to: "/analytics",
        }}
      />

      <section className="cf-chart-grid">

        <AttendanceChart
          subjects={subjects}
          attendance={attendance}
          height={250}
        />

        <WeeklyStudyChart
          studySessions={studySessions}
          height={250}
        />

        <ChartCard
          title="Study Time Breakdown"
          icon={<Clock size={18} />}
        >
          {studySubjectDistributionData.length ? (
            <div className="cf-pie-chart">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>

                  <Pie
                    data={
                      studySubjectDistributionData
                    }
                    dataKey="hours"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    customized={(props) => {
                      const {
                        index,
                        ...rest
                      } = props;

                      const fill =
                        studySubjectDistributionData[
                          index
                        ]?.fill ||
                        PIE_FALLBACK_COLORS[
                          index %
                            PIE_FALLBACK_COLORS.length
                        ];

                      return (
                        <Sector
                          {...rest}
                          fill={fill}
                        />
                      );
                    }}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${value} hrs`,
                      "Study Time",
                    ]}
                  />

                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                    }}
                  />

                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart text="Complete study sessions to see subject-wise study time." />
          )}
        </ChartCard>

        <ChartCard
          title="Assignment Workload"
          icon={<CheckSquare size={18} />}
        >
          {assignmentDistributionData.length ? (
            <div className="cf-pie-chart">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>

                  <Pie
                    data={
                      assignmentDistributionData
                    }
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={78}
                    paddingAngle={3}
                    customized={(props) => {
                      const {
                        index,
                        ...rest
                      } = props;

                      const fill =
                        assignmentDistributionData[
                          index
                        ]?.fill ||
                        PIE_FALLBACK_COLORS[
                          index %
                            PIE_FALLBACK_COLORS.length
                        ];

                      return (
                        <Sector
                          {...rest}
                          fill={fill}
                        />
                      );
                    }}
                  />

                  <Tooltip />

                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                    }}
                  />

                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart text="Add assignments to see workload distribution." />
          )}
        </ChartCard>

      </section>

      {/* ALERTS + DEADLINE */}

      <section className="cf-two-column-grid">

        <div className="cf-card cf-section-card">

          <div className="cf-card-header">

            <div className="cf-heading-with-icon">

              <div className="cf-icon-box cf-icon-red">
                <Bell size={19} />
              </div>

              <div>
                <h3 className="cf-card-title">
                  Academic Alerts
                </h3>

                <p className="cf-card-subtitle">
                  Things that may need attention
                </p>
              </div>

            </div>

            <span className="cf-countPill">
              {academicAlerts.length}
            </span>

          </div>

          {academicAlerts.length === 0 ? (

            <div className="cf-successEmpty">
              <CheckCircle2 size={20} />

              <div>
                <strong>
                  Everything looks good
                </strong>

                <span>
                  No important academic alerts.
                </span>
              </div>
            </div>

          ) : (

            <div className="cf-alertList">

              {academicAlerts
                .slice(0, 4)
                .map((alert) => (

                  <div
                    key={alert.id}
                    className={`cf-alert-item ${getAlertClass(
                      alert.severity
                    )}`}
                  >
                    <AlertCircle size={18} />

                    <div>
                      <strong>
                        {alert.title}
                      </strong>

                      <span>
                        {alert.message}
                      </span>
                    </div>

                  </div>
                ))}

            </div>
          )}

        </div>

        <div className="cf-card cf-section-card">

          <div className="cf-card-header">

            <div className="cf-heading-with-icon">

              <div className="cf-icon-box cf-icon-blue">
                <CheckSquare size={19} />
              </div>

              <div>
                <h3 className="cf-card-title">
                  Next Deadline
                </h3>

                <p className="cf-card-subtitle">
                  Your upcoming assignment
                </p>
              </div>

            </div>

            <Link
              to="/assignments"
              className="cf-icon-action"
            >
              <ChevronRight size={20} />
            </Link>

          </div>

          {assignmentData.nextDeadline ? (

            <div className="cf-deadlineBox">

              <div className="cf-deadline-top">
                <span className="cf-dueBadge">
                  Due Next
                </span>

                <Clock size={18} />
              </div>

              <h4>
                {
                  assignmentData.nextDeadline
                    .title
                }
              </h4>

              <p>
                {
                  assignmentData.nextDeadline
                    .subjectName || "General"
                }
                {" • "}
                {
                  assignmentData.nextDeadline
                    .dueDate
                }
              </p>

              <Link
                to="/assignments"
                className="cf-small-primary-link"
              >
                View assignment
                <ArrowRight size={14} />
              </Link>

            </div>

          ) : (

            <div className="cf-successEmpty">
              <CheckCircle2 size={20} />

              <div>
                <strong>
                  No upcoming deadlines
                </strong>

                <span>
                  You have no assignments due soon.
                </span>
              </div>
            </div>
          )}

        </div>

      </section>

      {/* QUICK ACTIONS + ACTIVITY */}

      <section className="cf-two-column-grid">

        <div className="cf-card cf-section-card">

          <div className="cf-card-header">

            <div className="cf-heading-with-icon">

              <div className="cf-icon-box cf-icon-green">
                <Target size={19} />
              </div>

              <div>
                <h3 className="cf-card-title">
                  Quick Actions
                </h3>

                <p className="cf-card-subtitle">
                  Jump to your most-used tools
                </p>
              </div>

            </div>

          </div>

          <div className="cf-quickGrid">

            <QuickLink
              to="/sgpa"
              label="SGPA Calculator"
              icon={<TrendingUp size={18} />}
              tone="indigo"
            />

            <QuickLink
              to="/attendance"
              label="Attendance"
              icon={<CalendarCheck size={18} />}
              tone="green"
            />

            <QuickLink
              to="/assignments"
              label="Assignments"
              icon={<ClipboardList size={18} />}
              tone="red"
            />

            <QuickLink
              to="/study-planner"
              label="Study Planner"
              icon={<BookOpen size={18} />}
              tone="orange"
            />

          </div>

        </div>

        <div className="cf-card cf-section-card">

          <div className="cf-card-header">

            <div className="cf-heading-with-icon">

              <div className="cf-icon-box cf-icon-slate">
                <Clock size={19} />
              </div>

              <div>
                <h3 className="cf-card-title">
                  Recent Activity
                </h3>

                <p className="cf-card-subtitle">
                  Your latest academic updates
                </p>
              </div>

            </div>

          </div>

          {recentActivities.length > 0 ? (

            <div className="cf-activityList">

              {recentActivities
                .slice(0, 5)
                .map((activity) => (

                  <div
                    key={activity.id}
                    className="cf-activity-item"
                  >

                    <span className="cf-activity-dot" />

                    <div>
                      <strong>
                        {activity.text}
                      </strong>

                      <span>
                        {activity.date?.toLocaleString?.() ||
                          "Recently"}
                      </span>
                    </div>

                  </div>
                ))}

            </div>

          ) : (

            <div className="cf-empty-soft">
              <Activity size={20} />

              <div>
                <strong>
                  No recent activity
                </strong>

                <span>
                  Your academic updates will
                  appear here.
                </span>
              </div>
            </div>
          )}

        </div>

      </section>

    </main>
  );
}

/* =========================================================
   COMPONENTS
   ========================================================= */

function MetricCard({
  to,
  icon,
  label,
  value,
  detail,
  tone = "indigo",
}) {
  return (
    <Link
      to={to}
      className={`cf-metricCard cf-tone-${tone}`}
    >
      <div className="cf-metric-top">

        <span className="cf-metric-label">
          {label}
        </span>

        <span className="cf-metric-icon">
          {icon}
        </span>

      </div>

      <strong className="cf-metric-value">
        {value}
      </strong>

      <span className="cf-metric-detail">
        {detail}
      </span>

      <span className="cf-metric-arrow">
        <ArrowRight size={15} />
      </span>
    </Link>
  );
}

function InsightBox({
  label,
  value,
  hint,
  highlight = false,
  danger = false,
}) {
  return (
    <div
      className={`cf-insight-box ${
        highlight
          ? "is-highlight"
          : ""
      } ${
        danger
          ? "is-danger"
          : ""
      }`}
    >
      <span>{label}</span>

      <strong>{value}</strong>

      <small>{hint}</small>
    </div>
  );
}

function EmptyChart({ text }) {
  return (
    <div className="cf-emptyChart">
      <div className="cf-empty-chart-icon">
        <BarChart2 size={24} />
      </div>

      <p>{text}</p>
    </div>
  );
}

function ChartCard({
  title,
  icon,
  children,
}) {
  return (
    <div className="cf-card cf-chart-card">

      <div className="cf-card-header">

        <div className="cf-heading-with-icon">

          <div className="cf-icon-box cf-icon-blue">
            <IconComponent
              icon={icon}
              size={18}
              color="currentColor"
            />
          </div>

          <h3 className="cf-card-title">
            {title}
          </h3>

        </div>

      </div>

      {children}
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  action,
}) {
  return (
    <div className="cf-sectionHeading">

      <div className="cf-headingWithIcon">

        <div className="cf-section-icon">
          {icon}
        </div>

        <h2 className="cf-sectionTitle">
          {title}
        </h2>

      </div>

      {action && (
        <Link
          to={action.to}
          className="cf-textLink"
        >
          {action.label}
          <ArrowRight size={15} />
        </Link>
      )}

    </div>
  );
}

function SectionLabel({
  title,
  text,
}) {
  return (
    <div className="cf-section-label">
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  );
}

function QuickLink({
  to,
  label,
  icon,
  tone = "indigo",
}) {
  return (
    <Link
      to={to}
      className={`cf-quickLink cf-quick-${tone}`}
    >
      <span className="cf-quick-icon">
        {icon}
      </span>

      <span className="cf-quick-label">
        {label}
      </span>

      <ChevronRight size={17} />
    </Link>
  );
}

function Feedback({
  type,
  children,
}) {
  const success = type === "success";

  return (
    <div
      className={
        success
          ? "cf-feedback-success"
          : "cf-feedback-error"
      }
    >
      {success ? (
        <CheckCircle2 size={19} />
      ) : (
        <AlertCircle size={19} />
      )}

      <span>{children}</span>
    </div>
  );
}

function getAlertClass(severity) {
  if (severity === "critical") {
    return "cf-alert-critical";
  }

  if (severity === "warning") {
    return "cf-alert-warning";
  }

  return "cf-alert-info";
}

function DashboardSkeleton() {
  return (
    <main className="cf-dashboard-pro">

      <div className="cf-skeleton cf-skeleton-hero" />

      <div className="cf-skeleton-label" />

      <div className="cf-skeleton-grid">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="cf-skeleton cf-skeleton-metric"
          />
        ))}
      </div>

      <div className="cf-skeleton-large-grid">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="cf-skeleton cf-skeleton-card"
          />
        ))}
      </div>

    </main>
  );
}

function IconComponent({
  icon,
  size,
  color,
}) {
  return icon
    ? React.cloneElement(icon, {
        size,
        color,
      })
    : null;
}