import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Plus,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
  subjectsAPI,
  attendanceAPI,
  assignmentsAPI,
  timetableAPI,
  gradePredictionAPI,
} from "../../services/api";

import { useAuth } from "../../context/AuthContext";

import "./Dashboard.css";

/* =========================================================
   HELPERS
========================================================= */

function getArray(response, keys = []) {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  for (const key of keys) {
    if (Array.isArray(response[key])) {
      return response[key];
    }
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.results)) {
    return response.results;
  }

  return [];
}

function normalizeSubject(subject) {
  return {
    id: subject?._id || subject?.id || "",
    name: subject?.name || "Unnamed Subject",
    code: subject?.code || "",
    credits: Number(subject?.credits) || 0,
    faculty: subject?.faculty || "",
    color: subject?.color || "#2563eb",
  };
}

function normalizeAttendance(record) {
  return {
    id: record?._id || record?.id || "",
    subjectId:
      record?.subject?._id ||
      record?.subject ||
      record?.subjectId ||
      "",

    subjectName:
      record?.subjectName ||
      record?.name ||
      "",

    attended:
      Number(
        record?.attended ??
        record?.present ??
        record?.classesAttended ??
        0
      ),

    total:
      Number(
        record?.totalClasses ??
        record?.total ??
        record?.classes ??
        0
      ),

    percentage:
      Number(
        record?.attendance ??
        record?.percentage ??
        record?.attendancePercentage ??
        0
      ),
  };
}

function normalizeAssignment(assignment) {
  return {
    id:
      assignment?._id ||
      assignment?.id ||
      "",

    title:
      assignment?.title ||
      assignment?.name ||
      "Untitled Assignment",

    subject:
      assignment?.subjectName ||
      assignment?.subject?.name ||
      assignment?.subject ||
      "",

    dueDate:
      assignment?.dueDate ||
      assignment?.deadline ||
      assignment?.due ||
      "",

    status:
      assignment?.status ||
      "pending",

    priority:
      assignment?.priority ||
      "medium",
  };
}

function normalizeTimetable(item) {
  return {
    id: item?._id || item?.id || "",
    subject:
      item?.subjectName ||
      item?.subject?.name ||
      item?.subject ||
      "Class",

    day:
      item?.day ||
      item?.dayOfWeek ||
      "",

    startTime:
      item?.startTime ||
      item?.start ||
      item?.time ||
      "",

    endTime:
      item?.endTime ||
      item?.end ||
      "",

    room:
      item?.room ||
      item?.location ||
      "",
  };
}

function getPredictionValue(prediction) {
  if (!prediction) {
    return null;
  }

  const possibleValues = [
    prediction.predictedSGPA,
    prediction.sgpa,
    prediction.prediction,
    prediction.predictedCgpa,
    prediction.cgpa,
  ];

  for (const value of possibleValues) {
    if (
      value !== undefined &&
      value !== null &&
      !Number.isNaN(Number(value))
    ) {
      return Number(value);
    }
  }

  return null;
}

function getTodayName() {
  return new Date().toLocaleDateString(
    "en-US",
    {
      weekday: "long",
    }
  );
}

function formatDate(date) {
  if (!date) {
    return "No deadline";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
    }
  );
}

function getDaysRemaining(date) {
  if (!date) {
    return "";
  }

  const today = new Date();
  const due = new Date(date);

  if (Number.isNaN(due.getTime())) {
    return "";
  }

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const difference =
    Math.ceil(
      (due - today) /
        (1000 * 60 * 60 * 24)
    );

  if (difference < 0) {
    return "Overdue";
  }

  if (difference === 0) {
    return "Due today";
  }

  if (difference === 1) {
    return "Due tomorrow";
  }

  return `${difference} days left`;
}

function getAttendanceStatus(value) {
  if (value >= 85) {
    return "good";
  }

  if (value >= 75) {
    return "warning";
  }

  return "danger";
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Dashboard() {
  const { user } = useAuth();

  const [subjects, setSubjects] =
    useState([]);

  const [attendance, setAttendance] =
    useState([]);

  const [assignments, setAssignments] =
    useState([]);

  const [timetable, setTimetable] =
    useState([]);

  const [predictions, setPredictions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD DASHBOARD DATA
  ======================================================= */

  const loadDashboard =
    useCallback(async () => {
      try {
        setError("");

        const [
          subjectsResponse,
          attendanceResponse,
          assignmentsResponse,
          timetableResponse,
          predictionsResponse,
        ] = await Promise.all([
          subjectsAPI.getAll(),
          attendanceAPI.getAll(),
          assignmentsAPI.getAll(),
          timetableAPI.getAll(),
          gradePredictionAPI.getAll(
            user?.semester
          ),
        ]);

        console.log(
          "DASHBOARD SUBJECTS:",
          subjectsResponse
        );

        console.log(
          "DASHBOARD ATTENDANCE:",
          attendanceResponse
        );

        console.log(
          "DASHBOARD ASSIGNMENTS:",
          assignmentsResponse
        );

        console.log(
          "DASHBOARD TIMETABLE:",
          timetableResponse
        );

        console.log(
          "DASHBOARD PREDICTIONS:",
          predictionsResponse
        );

        const cleanSubjects =
          getArray(
            subjectsResponse,
            ["subjects"]
          )
            .filter(Boolean)
            .map(normalizeSubject);

        const cleanAttendance =
          getArray(
            attendanceResponse,
            ["attendance", "records"]
          )
            .filter(Boolean)
            .map(normalizeAttendance);

        const cleanAssignments =
          getArray(
            assignmentsResponse,
            ["assignments"]
          )
            .filter(Boolean)
            .map(normalizeAssignment);

        const cleanTimetable =
          getArray(
            timetableResponse,
            ["timetable", "classes", "entries"]
          )
            .filter(Boolean)
            .map(normalizeTimetable);

        const cleanPredictions =
          getArray(
            predictionsResponse,
            [
              "predictions",
              "gradePredictions",
            ]
          );

        setSubjects(cleanSubjects);

        setAttendance(
          cleanAttendance
        );

        setAssignments(
          cleanAssignments
        );

        setTimetable(
          cleanTimetable
        );

        setPredictions(
          cleanPredictions
        );
      } catch (err) {
        console.error(
          "Dashboard loading error:",
          err
        );

        setError(
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [user?.semester]);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = async () => {
    setRefreshing(true);

    await loadDashboard();
  };

  /* =======================================================
     ATTENDANCE MAP
  ======================================================= */

  const attendanceBySubject =
    useMemo(() => {
      const map = {};

      attendance.forEach(
        (record) => {
          if (
            record.subjectId
          ) {
            map[
              String(
                record.subjectId
              )
            ] = record;
          }
        }
      );

      return map;
    }, [attendance]);

  /* =======================================================
     SUBJECT ATTENDANCE
  ======================================================= */

  const subjectAttendance =
    useMemo(() => {
      return subjects.map(
        (subject) => {
          const record =
            attendanceBySubject[
              String(subject.id)
            ];

          let percentage = 0;

          if (record) {
            if (
              record.percentage > 0
            ) {
              percentage =
                record.percentage;
            } else if (
              record.total > 0
            ) {
              percentage =
                Math.round(
                  (record.attended /
                    record.total) *
                    100
                );
            }
          }

          return {
            ...subject,
            attended:
              record?.attended || 0,

            total:
              record?.total || 0,

            attendance:
              percentage,
          };
        }
      );
    }, [
      subjects,
      attendanceBySubject,
    ]);

  /* =======================================================
     OVERALL ATTENDANCE
  ======================================================= */

  const overallAttendance =
    useMemo(() => {
      let attended = 0;
      let total = 0;

      attendance.forEach(
        (record) => {
          attended +=
            Number(
              record.attended
            ) || 0;

          total +=
            Number(
              record.total
            ) || 0;
        }
      );

      if (total > 0) {
        return Math.round(
          (attended / total) * 100
        );
      }

      const validRecords =
        attendance.filter(
          (record) =>
            record.percentage > 0
        );

      if (
        validRecords.length === 0
      ) {
        return null;
      }

      const average =
        validRecords.reduce(
          (sum, record) =>
            sum +
            record.percentage,
          0
        ) /
        validRecords.length;

      return Math.round(average);
    }, [attendance]);

  /* =======================================================
     TOTAL CLASSES
  ======================================================= */

  const totalClasses =
    useMemo(() => {
      return attendance.reduce(
        (sum, record) =>
          sum +
          (Number(record.total) || 0),
        0
      );
    }, [attendance]);

  const attendedClasses =
    useMemo(() => {
      return attendance.reduce(
        (sum, record) =>
          sum +
          (Number(
            record.attended
          ) || 0),
        0
      );
    }, [attendance]);

  /* =======================================================
     PENDING ASSIGNMENTS
  ======================================================= */

  const pendingAssignments =
    useMemo(() => {
      return assignments.filter(
        (assignment) => {
          const status =
            assignment.status
              .toLowerCase()
              .trim();

          return ![
            "completed",
            "complete",
            "submitted",
            "done",
          ].includes(status);
        }
      );
    }, [assignments]);

  /* =======================================================
     UPCOMING ASSIGNMENTS
  ======================================================= */

  const upcomingAssignments =
    useMemo(() => {
      return [...pendingAssignments]
        .sort(
          (a, b) => {
            const first =
              a.dueDate
                ? new Date(
                    a.dueDate
                  ).getTime()
                : Infinity;

            const second =
              b.dueDate
                ? new Date(
                    b.dueDate
                  ).getTime()
                : Infinity;

            return first - second;
          }
        )
        .slice(0, 5);
    }, [pendingAssignments]);

  /* =======================================================
     TODAY'S TIMETABLE
  ======================================================= */

  const todayName =
    getTodayName();

  const todaysClasses =
    useMemo(() => {
      return timetable
        .filter((item) => {
          if (!item.day) {
            return false;
          }

          return (
            item.day
              .toLowerCase()
              .trim() ===
            todayName
              .toLowerCase()
              .trim()
          );
        })
        .sort(
          (a, b) =>
            a.startTime.localeCompare(
              b.startTime
            )
        );
    }, [
      timetable,
      todayName,
    ]);

  /* =======================================================
     LATEST SGPA
  ======================================================= */

  const predictedSGPA =
    useMemo(() => {
      if (
        predictions.length === 0
      ) {
        return null;
      }

      const sorted = [
        ...predictions,
      ].sort(
        (a, b) => {
          const first =
            new Date(
              a.updatedAt ||
                a.createdAt ||
                0
            ).getTime();

          const second =
            new Date(
              b.updatedAt ||
                b.createdAt ||
                0
            ).getTime();

          return second - first;
        }
      );

      return getPredictionValue(
        sorted[0]
      );
    }, [predictions]);

  /* =======================================================
     GREETING
  ======================================================= */

  const greeting =
    useMemo(() => {
      const hour =
        new Date().getHours();

      if (hour < 12) {
        return "Good morning";
      }

      if (hour < 17) {
        return "Good afternoon";
      }

      return "Good evening";
    }, []);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="dashboard-spinner" />

          <p>
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="dashboard-page">

      {/* ===============================================
          HEADER
      =============================================== */}

      <section className="dashboard-header">

        <div>
          <div className="dashboard-eyebrow">
            <GraduationCap
              size={16}
            />

            Academic Dashboard
          </div>

          <h1>
            {greeting},{" "}

            {user?.name
              ?.split(" ")[0] ||
              "Student"}{" "}
            👋
          </h1>

          <p>
            Here's your academic
            overview for today.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-refresh"
          onClick={
            handleRefresh
          }
          disabled={
            refreshing
          }
        >
          <RefreshCw
            size={16}
            className={
              refreshing
                ? "spinning"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </section>

      {/* ===============================================
          ERROR
      =============================================== */}

      {error && (
        <div className="dashboard-error">

          <AlertCircle
            size={18}
          />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={
              handleRefresh
            }
          >
            Try Again
          </button>

        </div>
      )}

      {/* ===============================================
          STATS
      =============================================== */}

      <section className="dashboard-stats">

        <article className="dashboard-stat-card">

          <div className="dashboard-stat-icon subjects">
            <BookOpen size={21} />
          </div>

          <div>
            <span>
              Total Subjects
            </span>

            <strong>
              {subjects.length}
            </strong>

            <small>
              Semester{" "}
              {user?.semester ||
                "—"}
            </small>
          </div>

        </article>

        <article className="dashboard-stat-card">

          <div className="dashboard-stat-icon attendance">
            <TrendingUp size={21} />
          </div>

          <div>
            <span>
              Overall Attendance
            </span>

            <strong>
              {overallAttendance !==
              null
                ? `${overallAttendance}%`
                : "--"}
            </strong>

            <small>
              {totalClasses > 0
                ? `${attendedClasses}/${totalClasses} classes`
                : "No attendance yet"}
            </small>
          </div>

        </article>

        <article className="dashboard-stat-card">

          <div className="dashboard-stat-icon assignments">
            <ClipboardList
              size={21}
            />
          </div>

          <div>
            <span>
              Pending Assignments
            </span>

            <strong>
              {
                pendingAssignments.length
              }
            </strong>

            <small>
              {assignments.length}{" "}
              total assignments
            </small>
          </div>

        </article>

        <article className="dashboard-stat-card">

          <div className="dashboard-stat-icon sgpa">
            <GraduationCap
              size={21}
            />
          </div>

          <div>
            <span>
              Predicted SGPA
            </span>

            <strong>
              {predictedSGPA !==
              null
                ? predictedSGPA.toFixed(
                    2
                  )
                : "--"}
            </strong>

            <small>
              {predictedSGPA !==
              null
                ? "Latest prediction"
                : "Not predicted yet"}
            </small>
          </div>

        </article>

      </section>

      {/* ===============================================
          MAIN GRID
      =============================================== */}

      <section className="dashboard-content-grid">

        {/* ===========================================
            ATTENDANCE OVERVIEW
        ============================================ */}

        <article className="dashboard-panel attendance-panel">

          <div className="dashboard-panel-header">

            <div>
              <h2>
                Attendance Overview
              </h2>

              <p>
                Track your subject-wise
                attendance
              </p>
            </div>

            <Link
              to="/attendance"
              className="dashboard-link"
            >
              View All

              <ArrowRight
                size={15}
              />
            </Link>

          </div>

          {subjectAttendance.length ===
          0 ? (
            <div className="dashboard-empty-small">

              <TrendingUp
                size={24}
              />

              <p>
                Add subjects and mark
                attendance to see your
                progress.
              </p>

              <Link
                to="/subjects"
              >
                Add Subjects
              </Link>

            </div>
          ) : (
            <div className="dashboard-attendance-list">

              {subjectAttendance
                .slice(0, 6)
                .map(
                  (
                    subject
                  ) => {

                    const status =
                      getAttendanceStatus(
                        subject.attendance
                      );

                    return (
                      <div
                        className="dashboard-attendance-item"
                        key={
                          subject.id
                        }
                      >

                        <div className="dashboard-subject-row">

                          <div className="dashboard-subject-info">

                            <div
                              className="dashboard-subject-icon"
                              style={{
                                background: `${subject.color}18`,
                                color:
                                  subject.color,
                              }}
                            >
                              <BookOpen
                                size={16}
                              />
                            </div>

                            <div>

                              <strong>
                                {
                                  subject.name
                                }
                              </strong>

                              <span>
                                {
                                  subject.code ||
                                  "No code"
                                }
                              </span>

                            </div>

                          </div>

                          <strong
                            className={`attendance-value ${status}`}
                          >
                            {
                              subject.attendance
                            }%
                          </strong>

                        </div>

                        <div className="dashboard-progress">

                          <div
                            className={
                              status
                            }
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  subject.attendance,
                                  0
                                ),
                                100
                              )}%`,
                            }}
                          />

                        </div>

                      </div>
                    );
                  }
                )}

            </div>
          )}

        </article>

        {/* ===========================================
            TODAY'S CLASSES
        ============================================ */}

        <article className="dashboard-panel today-panel">

          <div className="dashboard-panel-header">

            <div>
              <h2>
                Today's Classes
              </h2>

              <p>
                {todayName}
              </p>
            </div>
          </div>

          {todaysClasses.length ===
          0 ? (
            <div className="dashboard-empty-small">
              <p>
                No classes scheduled
                for today.
              </p>

              <Link
                to="/timetable"
              >
                View Timetable
              </Link>

            </div>
          ) : (
            <div className="dashboard-timetable-list">

              {todaysClasses.map(
                (item) => (
                  <div
                    className="dashboard-class-item"
                    key={
                      item.id
                    }
                  >

                    <div className="dashboard-class-time">

                      <Clock
                        size={14}
                      />

                      <span>
                        {
                          item.startTime ||
                          "--"
                        }
                      </span>

                    </div>

                    <div className="dashboard-class-details">

                      <strong>
                        {
                          item.subject
                        }
                      </strong>

                      <span>
                        {item.room
                          ? `Room: ${item.room}`
                          : "Scheduled class"}
                      </span>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

          <Link
            to="/timetable"
            className="dashboard-panel-button"
          >
            Open Timetable

            <ArrowRight
              size={16}
            />
          </Link>

        </article>

        {/* ===========================================
            UPCOMING ASSIGNMENTS
        ============================================ */}

        <article className="dashboard-panel assignments-panel">

          <div className="dashboard-panel-header">

            <div>
              <h2>
                Upcoming Assignments
              </h2>

              <p>
                Don't miss your deadlines
              </p>
            </div>

            <Link
              to="/assignments"
              className="dashboard-link"
            >
              View All

              <ArrowRight
                size={15}
              />
            </Link>

          </div>

          {upcomingAssignments.length ===
          0 ? (
            <div className="dashboard-empty-small">

              <CheckCircle2
                size={24}
              />

              <p>
                No pending assignments.
                You're all caught up!
              </p>

              <Link
                to="/assignments"
              >
                Add Assignment
              </Link>

            </div>
          ) : (
            <div className="dashboard-assignment-list">

              {upcomingAssignments.map(
                (
                  assignment
                ) => (
                  <div
                    className="dashboard-assignment-item"
                    key={
                      assignment.id
                    }
                  >

                    <div className="dashboard-assignment-icon">
                      <ClipboardList
                        size={17}
                      />
                    </div>

                    <div className="dashboard-assignment-info">

                      <strong>
                        {
                          assignment.title
                        }
                      </strong>

                      <span>
                        {
                          assignment.subject ||
                          "No subject"
                        }
                      </span>

                    </div>

                    <div className="dashboard-assignment-date">

                      <span>
                        {formatDate(
                          assignment.dueDate
                        )}
                      </span>

                      <small>
                        {getDaysRemaining(
                          assignment.dueDate
                        )}
                      </small>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </article>

        {/* ===========================================
            QUICK ACTIONS
        ============================================ */}

        <article className="dashboard-panel quick-actions-panel">

          <div className="dashboard-panel-header">

            <div>
              <h2>
                Quick Actions
              </h2>

              <p>
                Manage your academics
                faster
              </p>
            </div>

          </div>

          <div className="dashboard-quick-actions">

            <Link
              to="/subjects"
              className="dashboard-quick-action"
            >
              <BookOpen
                size={19}
              />

              <span>
                Manage Subjects
              </span>

              <ArrowRight
                size={15}
              />
            </Link>

            <Link
              to="/attendance"
              className="dashboard-quick-action"
            >
              <TrendingUp
                size={19}
              />

              <span>
                Mark Attendance
              </span>

              <ArrowRight
                size={15}
              />
            </Link>

            <Link
              to="/assignments"
              className="dashboard-quick-action"
            >
              <Plus
                size={19}
              />

              <span>
                Add Assignment
              </span>

              <ArrowRight
                size={15}
              />
            </Link>

            <Link
              to="/sgpa"
              className="dashboard-quick-action"
            >
              <GraduationCap
                size={19}
              />

              <span>
                Predict SGPA
              </span>

              <ArrowRight
                size={15}
              />
            </Link>

          </div>

        </article>

      </section>

      {/* ===============================================
          BOTTOM SUMMARY
      =============================================== */}

      <section className="dashboard-summary">

        
        <div>

          <h3>
            Semester{" "}
            {user?.semester || "—"}{" "}
            Progress
          </h3>

          <p>
            You currently have{" "}

            <strong>
              {subjects.length} subjects
            </strong>

            {" "}and{" "}

            <strong>
              {pendingAssignments.length} pending assignments
            </strong>

            .
          </p>

        </div>

        <Link
          to="/subjects"
        >
          View Subjects

          <ArrowRight
            size={16}
          />
        </Link>

      </section>

    </div>
  );
}