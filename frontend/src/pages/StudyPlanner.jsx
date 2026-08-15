// src/pages/StudyPlanner.jsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { useLocation } from "react-router-dom";

import {
  AlertCircle,
  BookOpen,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  Timer,
  Trash2,
  Target,
} from "lucide-react";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

import {
  generateStudyRecommendations,
  getTodayDateString,
} from "../utils/studyRecommendations";

import { validateStudySession } from "../utils/validation";
import { formatFirebaseError } from "../utils/errorHandler";

import SmartRecommendations from "../components/studyPlanner/SmartRecommendations";

export default function StudyPlanner() {
  const { currentUser } = useAuth();
  const location = useLocation();

  const formRef = useRef(null);

  // ============================================================
  // FIRESTORE DATA
  // ============================================================

  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [studyGoals, setStudyGoals] = useState([]);

  const [loading, setLoading] = useState(true);

  // ============================================================
  // MESSAGES
  // ============================================================

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ============================================================
  // FORM
  // ============================================================

  const [subjectId, setSubjectId] = useState("");
  const [subjectName, setSubjectName] = useState("");

  const [topic, setTopic] = useState("");

  const [date, setDate] = useState(() => getTodayDateString());

  const [startTime, setStartTime] = useState("18:00");

  const [duration, setDuration] = useState(60);

  const [priority, setPriority] = useState("Medium");

  // Optional data received from SGPA Calculator.
  const [sgpaPrefill, setSgpaPrefill] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  // ============================================================
  // ACTION STATES
  // ============================================================

  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ============================================================
  // FILTER
  // ============================================================

  const [filterTab, setFilterTab] = useState("all");

  // ============================================================
  // CLEAR SUCCESS MESSAGE
  // ============================================================

  const showSuccess = (message) => {
    setSuccessMsg(message);

    setTimeout(() => {
      setSuccessMsg("");
    }, 3500);
  };

  // ============================================================
  // PREFILL FORM FROM OTHER PAGE
  // Supports SGPA -> Study Planner connection.
  // ============================================================

  useEffect(() => {
    const prefill = location.state?.prefill;

    if (!prefill) {
      setSgpaPrefill(null);
      return;
    }

    // Keep the SGPA recommendation available for the banner.
    setSgpaPrefill(prefill.source === "sgpa" ? prefill : null);

    if (prefill.subjectId) {
      setSubjectId(prefill.subjectId);
    }

    if (prefill.subjectName) {
      setSubjectName(prefill.subjectName);
    }

    if (prefill.topic) {
      setTopic(prefill.topic);
    }

    if (prefill.duration) {
      setDuration(Number(prefill.duration));
    }

    if (prefill.priority) {
      setPriority(prefill.priority);
    }

    setDate(getTodayDateString());

    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);

    // Clear route state after reading it so browser refresh/back
    // does not repeatedly prefill the form.
    window.history.replaceState(
      {},
      document.title,
      window.location.href
    );
  }, [location.state]);

  // ============================================================
  // FIRESTORE REAL-TIME LISTENERS
  // ============================================================

  useEffect(() => {
    if (!currentUser?.uid) {
      setSubjects([]);
      setAttendance([]);
      setAssignments([]);
      setStudySessions([]);
      setStudyGoals([]);
      setLoading(false);

      return;
    }

    setLoading(true);
    setError("");

    const userId = currentUser.uid;

    const subjectsQuery = query(
      collection(db, "subjects"),
      where("userId", "==", userId)
    );

    const attendanceQuery = query(
      collection(db, "attendance"),
      where("userId", "==", userId)
    );

    const assignmentsQuery = query(
      collection(db, "assignments"),
      where("userId", "==", userId)
    );

    const studySessionsQuery = query(
      collection(db, "studySessions"),
      where("userId", "==", userId)
    );

    const studyGoalsQuery = query(
      collection(db, "studyGoals"),
      where("userId", "==", userId)
    );

    let loadedCount = 0;

    const markLoaded = () => {
      loadedCount += 1;

      if (loadedCount >= 5) {
        setLoading(false);
      }
    };

    const handleSnapshotError = (err) => {
      console.error("Firestore listener error:", err);

      setError(formatFirebaseError(err));

      markLoaded();
    };

    // SUBJECTS
    const unsubscribeSubjects = onSnapshot(
      subjectsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setSubjects(data);

        markLoaded();
      },
      handleSnapshotError
    );

    // ATTENDANCE
    const unsubscribeAttendance = onSnapshot(
      attendanceQuery,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setAttendance(data);

        markLoaded();
      },
      handleSnapshotError
    );

    // ASSIGNMENTS
    const unsubscribeAssignments = onSnapshot(
      assignmentsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setAssignments(data);

        markLoaded();
      },
      handleSnapshotError
    );

    // STUDY SESSIONS
    const unsubscribeStudySessions = onSnapshot(
      studySessionsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setStudySessions(data);

        markLoaded();
      },
      handleSnapshotError
    );

    // STUDY GOALS
    const unsubscribeStudyGoals = onSnapshot(
      studyGoalsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setStudyGoals(data);

        markLoaded();
      },
      handleSnapshotError
    );

    return () => {
      unsubscribeSubjects();
      unsubscribeAttendance();
      unsubscribeAssignments();
      unsubscribeStudySessions();
      unsubscribeStudyGoals();
    };
  }, [currentUser]);

  // ============================================================
  // SMART RECOMMENDATIONS
  // ============================================================

  const recommendations = useMemo(() => {
    try {
      return generateStudyRecommendations({
        subjects,
        attendance,
        assignments,
        studySessions,
        studyGoals,
      });
    } catch (err) {
      console.error("Recommendation generation error:", err);

      return [];
    }
  }, [
    subjects,
    attendance,
    assignments,
    studySessions,
    studyGoals,
  ]);

  // ============================================================
  // SELECT RECOMMENDATION
  // ============================================================

  const handleSelectRecommendation = (recommendation) => {
    setError("");

    setSubjectId(recommendation.subjectId || "");

    setSubjectName(recommendation.subjectName || "");

    setTopic(
      recommendation.subjectName
        ? `Priority Review: ${recommendation.subjectName}`
        : "Priority Review"
    );

    setDate(getTodayDateString());

    setDuration(
      Number(recommendation.recommendedMinutes) || 60
    );

    if (recommendation.priority === "HIGH") {
      setPriority("High");
    } else if (recommendation.priority === "LOW") {
      setPriority("Low");
    } else {
      setPriority("Medium");
    }

    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  // ============================================================
  // SUBJECT DROPDOWN
  // ============================================================

  const handleSubjectChange = (event) => {
    const selectedId = event.target.value;

    setSubjectId(selectedId);

    const selectedSubject = subjects.find(
      (subject) => subject.id === selectedId
    );

    if (selectedSubject) {
      setSubjectName(
        selectedSubject.name ||
          selectedSubject.subjectName ||
          ""
      );
    } else {
      setSubjectName("");
    }
  };

  // ============================================================
  // CREATE STUDY SESSION
  // ============================================================

  const handleCreateSession = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMsg("");

    if (!currentUser?.uid) {
      setError(
        "You must be logged in to schedule a study session."
      );

      return;
    }

    if (!subjectId) {
      setError("Please select a subject.");

      return;
    }

    if (!topic.trim()) {
      setError("Please enter a topic or study goal.");

      return;
    }

    if (!date) {
      setError("Please select a study date.");

      return;
    }

    const numericDuration = Number(duration);

    if (
      Number.isNaN(numericDuration) ||
      numericDuration < 15 ||
      numericDuration > 360
    ) {
      setError(
        "Duration must be between 15 and 360 minutes."
      );

      return;
    }

    const validation = validateStudySession({
      subjectId,
      topic: topic.trim(),
      durationMinutes: numericDuration,
      date,
    });

    if (!validation.isValid) {
      setError(
        validation.error || "Invalid study session."
      );

      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, "studySessions"), {
        userId: currentUser.uid,

        subjectId,

        subjectName:
          subjectName || "General Study",

        topic: validation.sanitized?.topic || topic.trim(),

        date:
          validation.sanitized?.date || date,

        startTime: startTime || "18:00",

        durationMinutes:
          Number(
            validation.sanitized?.durationMinutes
          ) || numericDuration,

        priority: priority || "Medium",

        // Optional academic context from SGPA Calculator.
        source: sgpaPrefill?.source || "study-planner",

        targetIA2:
          sgpaPrefill?.targetIA2 != null
            ? Number(sgpaPrefill.targetIA2)
            : null,

        ia1Marks:
          sgpaPrefill?.ia1 != null
            ? Number(sgpaPrefill.ia1)
            : null,

        academicRisk:
          sgpaPrefill?.risk || null,

        status: "Scheduled",

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp(),
      });

      showSuccess(
        `Study session "${topic.trim()}" scheduled successfully!`
      );

      // Reset only necessary fields
      setTopic("");
      setDuration(60);
      setPriority("Medium");
      setStartTime("18:00");
      setSgpaPrefill(null);
    } catch (err) {
      console.error(
        "Error creating study session:",
        err
      );

      setError(formatFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // TOGGLE COMPLETE / SCHEDULED
  // ============================================================

  const handleToggleStatus = async (session) => {
    setError("");
    setSuccessMsg("");

    if (!currentUser?.uid) {
      setError("You must be logged in.");

      return;
    }

    if (session.userId !== currentUser.uid) {
      setError(
        "Unauthorized: You can only update your own study sessions."
      );

      return;
    }

    const newStatus =
      session.status === "Completed"
        ? "Scheduled"
        : "Completed";

    setUpdatingId(session.id);

    try {
      const sessionRef = doc(
        db,
        "studySessions",
        session.id
      );

      await updateDoc(sessionRef, {
        status: newStatus,

        completedAt:
          newStatus === "Completed"
            ? serverTimestamp()
            : null,

        updatedAt: serverTimestamp(),
      });

      if (newStatus === "Completed") {
        showSuccess(
          `"${session.topic}" marked as completed!`
        );
      } else {
        showSuccess(
          `"${session.topic}" moved back to scheduled.`
        );
      }
    } catch (err) {
      console.error(
        "Error updating study session:",
        err
      );

      setError(formatFirebaseError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  // ============================================================
  // DELETE SESSION
  // ============================================================

  const handleDeleteSession = async (session) => {
    setError("");
    setSuccessMsg("");

    if (!currentUser?.uid) {
      setError("You must be logged in.");

      return;
    }

    if (session.userId !== currentUser.uid) {
      setError(
        "Unauthorized: You can only delete your own study sessions."
      );

      return;
    }

    const confirmed = window.confirm(
      `Delete study session "${session.topic}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(session.id);

    try {
      const sessionRef = doc(
        db,
        "studySessions",
        session.id
      );

      await deleteDoc(sessionRef);

      showSuccess("Study session deleted successfully.");
    } catch (err) {
      console.error(
        "Error deleting study session:",
        err
      );

      setError(formatFirebaseError(err));
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================================
  // METRICS
  // ============================================================

  const metrics = useMemo(() => {
    const today = getTodayDateString();

    const todaySessions = studySessions.filter(
      (session) => session.date === today
    );

    const completedSessions = studySessions.filter(
      (session) => session.status === "Completed"
    );

    const totalMinutes = studySessions.reduce(
      (total, session) => {
        const minutes = Number(
          session.durationMinutes ||
            session.duration ||
            0
        );

        return total + (Number.isNaN(minutes) ? 0 : minutes);
      },
      0
    );

    const hours = Math.floor(totalMinutes / 60);

    const minutes = totalMinutes % 60;

    const completionRate =
      studySessions.length > 0
        ? Math.round(
            (completedSessions.length /
              studySessions.length) *
              100
          )
        : 0;

    return {
      todayCount: todaySessions.length,

      completedCount: completedSessions.length,

      totalTimeFormatted: `${hours}h ${minutes}m`,

      completionRate,
    };
  }, [studySessions]);

  // ============================================================
  // FILTER SESSIONS
  // ============================================================

  const todayDateStr = getTodayDateString();

  const filteredSessions = useMemo(() => {
    return [...studySessions]
      .filter((session) => {
        if (filterTab === "today") {
          return session.date === todayDateStr;
        }

        if (filterTab === "upcoming") {
          return (
            session.date >= todayDateStr &&
            session.status !== "Completed"
          );
        }

        if (filterTab === "completed") {
          return session.status === "Completed";
        }

        return true;
      })
      .sort((a, b) => {
        // Completed sessions go last
        if (
          (a.status === "Completed") !==
          (b.status === "Completed")
        ) {
          return a.status === "Completed" ? 1 : -1;
        }

        // Nearest date first
        const dateComparison = (
          a.date || ""
        ).localeCompare(b.date || "");

        if (dateComparison !== 0) {
          return dateComparison;
        }

        // Earlier time first
        return (
          a.startTime || ""
        ).localeCompare(b.startTime || "");
      });
  }, [
    studySessions,
    filterTab,
    todayDateStr,
  ]);

  // ============================================================
  // PRIORITY BADGE
  // ============================================================

  const getPriorityBadge = (priorityValue) => {
    switch (priorityValue) {
      case "High":
        return {
          color: "#dc2626",
          bg: "#fef2f2",
          border: "#fecaca",
        };

      case "Low":
        return {
          color: "#16a34a",
          bg: "#f0fdf4",
          border: "#bbf7d0",
        };

      case "Medium":
      default:
        return {
          color: "#d97706",
          bg: "#fffbeb",
          border: "#fde68a",
        };
    }
  };

  // ============================================================
  // NOT LOGGED IN
  // ============================================================

  if (!currentUser) {
    return (
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
        }}
      >
        <AlertCircle
          size={40}
          color="#ef4444"
        />

        <h2>Please Login</h2>

        <p>
          Login to access your Study Planner.
        </p>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        padding: "2rem 2.5rem",
        boxSizing: "border-box",
        minHeight: "100%",
      }}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.25rem",
          marginBottom: "2rem",
          paddingBottom: "1.5rem",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "6px",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563eb",
              }}
            >
              <CalendarDays size={22} />
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "1.75rem",
                fontWeight: "700",
                color: "#0f172a",
              }}
            >
              Study Planner & Roadmap
            </h1>
          </div>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              fontSize: "0.95rem",
            }}
          >
            Plan focused study sessions, follow smart
            recommendations, and complete your study
            targets.
          </p>
        </div>
      </div>

      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        <MetricCard
          icon={<Calendar size={22} />}
          title="Sessions Today"
          value={`${metrics.todayCount} planned`}
        />

        <MetricCard
          icon={<Timer size={22} />}
          title="Total Study Time"
          value={metrics.totalTimeFormatted}
        />

        <MetricCard
          icon={<CheckCircle size={22} />}
          title="Completion Rate"
          value={`${metrics.completionRate}% (${metrics.completedCount}/${studySessions.length})`}
        />
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <MessageBox
          icon={<AlertCircle size={20} />}
          background="#fef2f2"
          border="#fecaca"
          color="#991b1b"
        >
          {error}
        </MessageBox>
      )}

      {/* ======================================================
          SUCCESS
      ====================================================== */}

      {successMsg && (
        <MessageBox
          icon={<CheckCircle2 size={20} />}
          background="#ecfdf5"
          border="#a7f3d0"
          color="#065f46"
        >
          {successMsg}
        </MessageBox>
      )}

      {/* ======================================================
          SMART RECOMMENDATIONS
      ====================================================== */}

      <div style={{ marginBottom: "2rem" }}>
        <SmartRecommendations
          recommendations={recommendations}
          onSelectRecommendation={
            handleSelectRecommendation
          }
          loading={loading}
        />
      </div>

      {/* ======================================================
          SGPA -> STUDY PLANNER CONNECTION
      ====================================================== */}

      {sgpaPrefill && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            padding: "14px 16px",
            marginBottom: "1rem",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "12px",
            color: "#1e40af",
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              flexShrink: 0,
              borderRadius: "9px",
              background: "#dbeafe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Target size={18} color="#2563eb" />
          </div>

          <div style={{ flex: 1 }}>
            <strong
              style={{
                display: "block",
                fontSize: "0.86rem",
                color: "#1e3a8a",
              }}
            >
              SGPA recommendation added
            </strong>

            <p
              style={{
                margin: "3px 0 0",
                fontSize: "0.76rem",
                color: "#475569",
                lineHeight: 1.45,
              }}
            >
              {sgpaPrefill.subjectName || "This subject"} needs attention.
              {sgpaPrefill.targetIA2
                ? ` Target IA-2: ${sgpaPrefill.targetIA2}/50.`
                : ""}
              {sgpaPrefill.studyHours
                ? ` Recommended study: ${sgpaPrefill.studyHours} hrs/week.`
                : ""}
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          CREATE FORM
      ====================================================== */}

      <div
        ref={formRef}
        id="study-session-form"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "1.75rem 2rem",
          marginBottom: "2.5rem",
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <h3
          style={{
            margin: "0 0 1.25rem 0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#1e293b",
          }}
        >
          <Sparkles
            size={18}
            color="#2563eb"
          />

          Schedule Study Session
        </h3>

        <form onSubmit={handleCreateSession}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            {/* SUBJECT */}

            <FormGroup label="Course / Subject *">
              <select
                value={subjectId}
                onChange={handleSubjectChange}
                disabled={submitting}
                style={inputStyle}
              >
                <option value="">
                  Select Enrolled Subject
                </option>

                {subjects.map((subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name ||
                      subject.subjectName ||
                      "Unnamed Subject"}
                  </option>
                ))}
              </select>
            </FormGroup>

            {/* TOPIC */}

            <FormGroup label="Topic / Chapter / Goal *">
              <input
                type="text"
                value={topic}
                placeholder="e.g. Unit 3 Revision"
                onChange={(event) =>
                  setTopic(event.target.value)
                }
                disabled={submitting}
                style={inputStyle}
              />
            </FormGroup>

            {/* DATE */}

            <FormGroup label="Date *">
              <input
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
                disabled={submitting}
                style={inputStyle}
              />
            </FormGroup>

            {/* TIME */}

            <FormGroup label="Start Time">
              <input
                type="time"
                value={startTime}
                onChange={(event) =>
                  setStartTime(event.target.value)
                }
                disabled={submitting}
                style={inputStyle}
              />
            </FormGroup>

            {/* DURATION */}

            <FormGroup label="Duration (Minutes)">
              <input
                type="number"
                min="15"
                max="360"
                step="15"
                value={duration}
                onChange={(event) =>
                  setDuration(
                    Number(event.target.value)
                  )
                }
                disabled={submitting}
                style={inputStyle}
              />
            </FormGroup>

            {/* PRIORITY */}

            <FormGroup label="Priority Level">
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value)
                }
                disabled={submitting}
                style={inputStyle}
              >
                <option value="High">
                  High Priority
                </option>

                <option value="Medium">
                  Medium Priority
                </option>

                <option value="Low">
                  Low Priority
                </option>
              </select>
            </FormGroup>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="submit"
              disabled={submitting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.75rem 1.75rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: submitting
                  ? "#94a3b8"
                  : "#2563eb",
                color: "#ffffff",
                fontWeight: 600,
                cursor: submitting
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              <Plus size={16} />

              {submitting
                ? "Scheduling..."
                : "Add to Schedule"}
            </button>
          </div>
        </form>
      </div>

      {/* ======================================================
          SESSION HEADER + FILTERS
      ====================================================== */}

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                color: "#0f172a",
              }}
            >
              Scheduled Study Sessions
            </h3>

            <span
              style={{
                fontSize: "0.85rem",
                color: "#64748b",
              }}
            >
              Showing {filteredSessions.length} of{" "}
              {studySessions.length} total
            </span>
          </div>

          <div
            style={{
              display: "flex",
              backgroundColor: "#f1f5f9",
              padding: "3px",
              borderRadius: "10px",
              gap: "2px",
            }}
          >
            {[
              ["all", "All"],
              ["today", "Today"],
              ["upcoming", "Upcoming"],
              ["completed", "Completed"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setFilterTab(id)
                }
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "none",

                  backgroundColor:
                    filterTab === id
                      ? "#ffffff"
                      : "transparent",

                  color:
                    filterTab === id
                      ? "#2563eb"
                      : "#64748b",

                  fontWeight:
                    filterTab === id
                      ? 700
                      : 500,

                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading ? (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            Loading study roadmap...
          </div>
        ) : filteredSessions.length === 0 ? (
          /* ==================================================
              EMPTY STATE
          ================================================== */

          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px dashed #cbd5e1",
              borderRadius: "16px",
              padding: "3.5rem 2rem",
              textAlign: "center",
            }}
          >
            <BookOpen
              size={40}
              color="#94a3b8"
            />

            <h4>
              No study sessions in this view
            </h4>

            <p style={{ color: "#64748b" }}>
              Schedule a session above or select a
              smart recommendation.
            </p>
          </div>
        ) : (
          /* ==================================================
              SESSION LIST
          ================================================== */

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.85rem",
            }}
          >
            {filteredSessions.map((session) => {
              const isDone =
                session.status === "Completed";

              const isUpdating =
                updatingId === session.id;

              const isDeleting =
                deletingId === session.id;

              const isToday =
                session.date === todayDateStr;

              const badge =
                getPriorityBadge(
                  session.priority
                );

              return (
                <div
                  key={session.id}
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: "1rem",
                    flexWrap: "wrap",

                    padding: "1rem 1.25rem",

                    borderRadius: "12px",

                    border: `1.5px solid ${
                      isToday && !isDone
                        ? "#bfdbfe"
                        : "#e2e8f0"
                    }`,

                    backgroundColor: isDone
                      ? "#f8fafc"
                      : "#ffffff",

                    opacity:
                      isDone || isDeleting
                        ? 0.65
                        : 1,
                  }}
                >
                  {/* SESSION INFO */}

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "8px",
                        marginBottom: "6px",
                      }}
                    >
                      <strong
                        style={{
                          color: isDone
                            ? "#94a3b8"
                            : "#0f172a",

                          textDecoration: isDone
                            ? "line-through"
                            : "none",
                        }}
                      >
                        {session.topic ||
                          "Study Session"}
                      </strong>

                      <span
                        style={{
                          fontSize: "0.75rem",
                          backgroundColor:
                            "#f1f5f9",
                          padding: "3px 8px",
                          borderRadius: "999px",
                        }}
                      >
                        {session.subjectName ||
                          "General Study"}
                      </span>

                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          backgroundColor:
                            badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {session.priority ||
                          "Medium"}
                      </span>

                      {isToday && !isDone && (
                        <span
                          style={{
                            fontSize:
                              "0.75rem",
                            padding:
                              "3px 8px",
                            borderRadius:
                              "999px",
                            backgroundColor:
                              "#eff6ff",
                            color: "#2563eb",
                            fontWeight: 700,
                          }}
                        >
                          Today
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "6px",
                        color: "#64748b",
                        fontSize: "0.8rem",
                      }}
                    >
                      <Calendar size={13} />

                      <span>
                        {session.date ||
                          "No date"}
                      </span>

                      <span>•</span>

                      <Clock size={13} />

                      <span>
                        {session.startTime ||
                          "18:00"}{" "}
                        (
                        {session.durationMinutes ||
                          session.duration ||
                          60}{" "}
                        min)
                      </span>
                    </div>

                    {session.source === "sgpa" &&
                      session.targetIA2 != null && (
                        <div
                          style={{
                            marginTop: "6px",
                            color: "#2563eb",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}
                        >
                          🎯 IA-2 target: {session.targetIA2}/50
                          {session.ia1Marks != null
                            ? ` • Current IA-1: ${session.ia1Marks}/50`
                            : ""}
                        </div>
                      )}
                  </div>

                  {/* ACTIONS */}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleStatus(
                          session
                        )
                      }
                      disabled={
                        isUpdating ||
                        isDeleting
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "7px 14px",
                        borderRadius: "8px",

                        border:
                          "1px solid #bfdbfe",

                        backgroundColor: isDone
                          ? "#dcfce7"
                          : "#eff6ff",

                        color: isDone
                          ? "#15803d"
                          : "#1d4ed8",

                        cursor:
                          isUpdating ||
                          isDeleting
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {isUpdating ? (
                        "Updating..."
                      ) : isDone ? (
                        <>
                          <Check size={14} />
                          Done
                        </>
                      ) : (
                        <>
                          <CheckCircle2
                            size={14}
                          />
                          Mark Done
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      title="Delete Session"
                      onClick={() =>
                        handleDeleteSession(
                          session
                        )
                      }
                      disabled={
                        isDeleting ||
                        isUpdating
                      }
                      style={{
                        padding: "7px",
                        border: "none",
                        background:
                          "transparent",
                        color: "#ef4444",
                        cursor:
                          isDeleting ||
                          isUpdating
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

function MetricCard({
  icon,
  title,
  value,
}) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: "1.35rem 1.5rem",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.03)",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          backgroundColor: "#eff6ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#2563eb",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: "0.78rem",
            color: "#64748b",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: "3px",
            fontSize: "1.35rem",
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function MessageBox({
  icon,
  children,
  background,
  border,
  color,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.875rem 1.25rem",
        backgroundColor: background,
        color,
        borderRadius: "10px",
        marginBottom: "1.5rem",
        border: `1px solid ${border}`,
      }}
    >
      {icon}

      <span>{children}</span>
    </div>
  );
}

function FormGroup({
  label,
  children,
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: "0.4rem",
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "#334155",
        }}
      >
        {label}
      </label>

      {children}
    </div>
  );
}

// ============================================================
// INPUT STYLE
// ============================================================

const inputStyle = {
  width: "100%",
  padding: "0.75rem 1rem",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  backgroundColor: "#ffffff",
  fontSize: "0.95rem",
  color: "#1e293b",
  boxSizing: "border-box",
};