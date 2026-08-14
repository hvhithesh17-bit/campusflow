// src/pages/StudyPlanner.jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  updateDoc,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import {
  Clock,
  BookOpen,
  PlusCircle,
  CheckCircle2,
  Trash2,
  AlertCircle,
  CheckSquare,
  Square,
  Calendar,
  Sparkles,
  Timer,
  Target,
  BarChart3,
  Flame,
} from "lucide-react";

// ==========================================
// 1. TIME & DURATION HELPERS
// ==========================================

function timeToMinutes(timeStr) {
  if (typeof timeStr !== "string") return null;
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!regex.test(timeStr)) return null;

  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatDuration(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) return "0 mins";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} mins`;
  if (minutes === 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
  return `${hours} hr${hours > 1 ? "s" : ""} ${minutes} mins`;
}

function calculateStudyDuration(startTime, endTime) {
  if (!startTime || !endTime) {
    return { durationMinutes: 0, formattedDuration: "0 mins", isValid: false, error: "Provide both start and end times." };
  }

  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);

  if (startMins === null || endMins === null) {
    return { durationMinutes: 0, formattedDuration: "0 mins", isValid: false, error: "Invalid time format (HH:mm)." };
  }

  if (startMins === endMins) {
    return { durationMinutes: 0, formattedDuration: "0 mins", isValid: false, error: "End time cannot match start time." };
  }

  if (endMins < startMins) {
    return { durationMinutes: 0, formattedDuration: "0 mins", isValid: false, error: "End time cannot be earlier than start time." };
  }

  const diff = endMins - startMins;
  return { durationMinutes: diff, formattedDuration: formatDuration(diff), isValid: true, error: null };
}

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

export default function StudyPlanner() {
  const { currentUser } = useAuth();

  const getTodayDateStr = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const todayDateStr = getTodayDateStr();

  // Session Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState(todayDateStr);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");
  const [priority, setPriority] = useState("Medium");

  // Goal Form State
  const [goalSubjectId, setGoalSubjectId] = useState("");
  const [targetMinutesInput, setTargetMinutesInput] = useState("");

  // Data State
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const durationResult = calculateStudyDuration(startTime, endTime);

  // 1. Fetch Subjects
  useEffect(() => {
    if (!currentUser) return;

    const subjectsQuery = query(
      collection(db, "subjects"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribeSubjects = onSnapshot(
      subjectsQuery,
      (snapshot) => {
        setSubjects(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error("Error fetching subjects:", err);
        setError("Failed to load subjects.");
      }
    );

    return () => unsubscribeSubjects();
  }, [currentUser]);

  // 2. Fetch Study Sessions
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const sessionsQuery = query(
      collection(db, "studySessions"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribeSessions = onSnapshot(
      sessionsQuery,
      (snapshot) => {
        setSessions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching study sessions:", err);
        setError("Failed to load study sessions.");
        setLoading(false);
      }
    );

    return () => unsubscribeSessions();
  }, [currentUser]);

  // 3. Fetch Study Goals
  useEffect(() => {
    if (!currentUser) return;

    const goalsQuery = query(
      collection(db, "studyGoals"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribeGoals = onSnapshot(
      goalsQuery,
      (snapshot) => {
        setGoals(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error("Error fetching study goals:", err);
      }
    );

    return () => unsubscribeGoals();
  }, [currentUser]);

  // 4. Create Session Handler
  const handleSubmitSession = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedSubjectId) {
      setError("Please select a subject.");
      return;
    }
    if (!topic.trim()) {
      setError("Please enter a study topic.");
      return;
    }
    if (!date) {
      setError("Please select a date.");
      return;
    }
    if (!durationResult.isValid) {
      setError(durationResult.error);
      return;
    }

    const targetSubject = subjects.find((s) => s.id === selectedSubjectId);
    const subjectName = targetSubject ? targetSubject.name : "Unknown Subject";

    setSubmitting(true);

    try {
      await addDoc(collection(db, "studySessions"), {
        subjectId: selectedSubjectId,
        subjectName: subjectName,
        topic: topic.trim(),
        date: date,
        startTime: startTime,
        endTime: endTime,
        duration: durationResult.durationMinutes,
        priority: priority,
        status: "Scheduled",
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      setSuccess(`Study session for "${topic.trim()}" scheduled!`);
      setTopic("");
      setSelectedSubjectId("");
    } catch (err) {
      console.error("Error adding session:", err);
      setError("Failed to schedule session.");
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Save Weekly Goal Handler
  const handleSaveGoal = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const targetMins = Number(targetMinutesInput);
    if (!goalSubjectId) {
      setError("Please select a subject to set a weekly goal.");
      return;
    }
    if (isNaN(targetMins) || targetMins <= 0) {
      setError("Please provide a valid target duration in minutes greater than 0.");
      return;
    }

    const targetSubject = subjects.find((s) => s.id === goalSubjectId);
    const subjectName = targetSubject ? targetSubject.name : "Unknown Subject";

    setSavingGoal(true);

    try {
      // Deterministic document ID ensures 1 goal per subject per user
      const goalDocId = `${currentUser.uid}_${goalSubjectId}`;
      const goalRef = doc(db, "studyGoals", goalDocId);

      await setDoc(goalRef, {
        userId: currentUser.uid,
        subjectId: goalSubjectId,
        subjectName: subjectName,
        targetMinutes: targetMins,
        updatedAt: serverTimestamp(),
      });

      setSuccess(`Weekly goal for ${subjectName} set to ${targetMins} mins!`);
      setGoalSubjectId("");
      setTargetMinutesInput("");
    } catch (err) {
      console.error("Error saving goal:", err);
      setError("Failed to save study goal.");
    } finally {
      setSavingGoal(false);
    }
  };

  // 6. Delete Goal Handler
  const handleDeleteGoal = async (goalId) => {
    try {
      await deleteDoc(doc(db, "studyGoals", goalId));
    } catch (err) {
      console.error("Error deleting goal:", err);
      setError("Failed to delete goal.");
    }
  };

  // 7. Toggle Completion Status
  const handleToggleComplete = async (session) => {
    setError("");
    const newStatus = session.status === "Completed" ? "Scheduled" : "Completed";

    try {
      const sessionRef = doc(db, "studySessions", session.id);
      await updateDoc(sessionRef, {
        status: newStatus,
        completedAt: newStatus === "Completed" ? serverTimestamp() : null,
      });
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status.");
    }
  };

  // 8. Delete Session
  const handleDeleteSession = async (session) => {
    if (session.userId !== currentUser.uid) {
      setError("Unauthorized deletion attempt.");
      return;
    }

    if (!window.confirm(`Delete study session "${session.topic}"?`)) return;

    try {
      await deleteDoc(doc(db, "studySessions", session.id));
    } catch (err) {
      console.error("Error deleting session:", err);
      setError("Failed to delete session.");
    }
  };

  // ==========================================
  // STATISTICAL & GOAL CALCULATIONS
  // ==========================================

  // Today's Progress
  const todaySessions = sessions
    .filter((s) => s.date === todayDateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const totalTodaySessions = todaySessions.length;
  const completedTodaySessions = todaySessions.filter((s) => s.status === "Completed").length;
  const progressPercentage = totalTodaySessions > 0 
    ? Math.round((completedTodaySessions / totalTodaySessions) * 100) 
    : 0;

  // Current Week Boundaries (Monday to Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const completedThisWeek = sessions.filter((s) => {
    if (s.status !== "Completed" || !s.date) return false;
    const sessionDate = new Date(`${s.date}T00:00:00`);
    return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
  });

  // Map of completed study minutes per subjectId
  const weeklySubjectMinutes = completedThisWeek.reduce((acc, curr) => {
    const id = curr.subjectId;
    acc[id] = (acc[id] || 0) + (Number(curr.duration) || 0);
    return acc;
  }, {});

  const getPriorityStyle = (lvl) => {
    switch (lvl) {
      case "High":
        return { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" };
      case "Medium":
        return { color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
      case "Low":
      default:
        return { color: "#16a34a", bg: "#f0fdf4", border: "#86efac" };
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>
          Study Planner & Goals
        </h1>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>
          Plan study sessions and track progress against your weekly learning targets.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "1.5rem", border: "1px solid #fecaca" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", backgroundColor: "#ecfdf5", color: "#065f46", borderRadius: "8px", marginBottom: "1.5rem", border: "1px solid #a7f3d0" }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* 1. WEEKLY STUDY GOALS PROGRESS SECTION */}
      <div
        style={{
          backgroundColor: "var(--bg-secondary, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Flame size={22} color="#ea580c" />
            <h2 style={{ margin: 0, fontSize: "18px", color: "var(--text-primary)" }}>
              Weekly Study Goals
            </h2>
          </div>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Current Week Progress
          </span>
        </div>

        {/* Set Goal Mini Form */}
        <form
          onSubmit={handleSaveGoal}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "0.75rem",
            padding: "1rem",
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            marginBottom: "1.5rem",
            alignItems: "flex-end",
          }}
        >
          <div>
            <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "13px", fontWeight: 500 }}>
              Subject
            </label>
            <select
              value={goalSubjectId}
              onChange={(e) => setGoalSubjectId(e.target.value)}
              required
              style={{ width: "100%", padding: "0.55rem", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
            >
              <option value="">-- Select Subject --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "13px", fontWeight: 500 }}>
              Target (Minutes / Week)
            </label>
            <input
              type="number"
              min="1"
              step="15"
              required
              value={targetMinutesInput}
              onChange={(e) => setTargetMinutesInput(e.target.value)}
              placeholder="e.g., 300 (5 hrs)"
              style={{ width: "100%", padding: "0.55rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            />
          </div>

          <button
            type="submit"
            disabled={savingGoal || subjects.length === 0}
            style={{
              padding: "0.6rem 1.2rem",
              backgroundColor: savingGoal ? "#94a3b8" : "#ea580c",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              cursor: savingGoal || subjects.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            {savingGoal ? "Saving..." : "Set Goal"}
          </button>
        </form>

        {/* Goals Progress Cards */}
        {goals.length === 0 ? (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", fontStyle: "italic" }}>
            No weekly study goals set. Pick a subject above to start tracking your targets!
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {goals.map((g) => {
              const completedMins = weeklySubjectMinutes[g.subjectId] || 0;
              const targetMins = g.targetMinutes || 1;
              const remainingMins = Math.max(0, targetMins - completedMins);

              const targetHours = (targetMins / 60).toFixed(1);
              const completedHours = (completedMins / 60).toFixed(1);
              const remainingHours = (remainingMins / 60).toFixed(1);

              const goalPercent = Math.min(100, Math.round((completedMins / targetMins) * 100));
              const isGoalMet = completedMins >= targetMins;

              return (
                <div
                  key={g.id}
                  style={{
                    backgroundColor: "#ffffff",
                    border: `1px solid ${isGoalMet ? "#86efac" : "#e2e8f0"}`,
                    borderRadius: "10px",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <h4 style={{ margin: 0, fontSize: "15px", color: "var(--text-primary)" }}>
                        {g.subjectName}
                      </h4>
                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "2px" }}
                        title="Remove Goal"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Progress Percentage & Label */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "20px", fontWeight: 700, color: isGoalMet ? "#16a34a" : "#ea580c" }}>
                        {goalPercent}%
                      </span>
                      <span style={{ fontSize: "12px", color: isGoalMet ? "#16a34a" : "var(--text-secondary)", fontWeight: 500 }}>
                        {isGoalMet ? "Goal Reached!" : `${remainingHours} hrs remaining`}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: "100%", height: "8px", backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden", marginBottom: "0.75rem" }}>
                      <div
                        style={{
                          width: `${goalPercent}%`,
                          height: "100%",
                          backgroundColor: isGoalMet ? "#16a34a" : "#ea580c",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Hours Breakdown Footer */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)", paddingTop: "0.5rem", borderTop: "1px solid #f8fafc" }}>
                    <span>Target: <strong>{targetHours}h</strong></span>
                    <span>Done: <strong>{completedHours}h</strong></span>
                    <span>Left: <strong>{remainingHours}h</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. TODAY'S PROGRESS & SCHEDULE FORM */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {/* Today's Completion Widget */}
        <div
          style={{
            backgroundColor: "var(--bg-secondary, #ffffff)",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "12px",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Target size={20} color="var(--accent-color, #2563eb)" />
                <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text-primary)" }}>
                  Today's Session Progress
                </h3>
              </div>
              <span style={{ fontSize: "18px", fontWeight: 700, color: progressPercentage === 100 && totalTodaySessions > 0 ? "#16a34a" : "var(--accent-color, #2563eb)" }}>
                {progressPercentage}%
              </span>
            </div>

            <div style={{ width: "100%", height: "8px", backgroundColor: "#e2e8f0", borderRadius: "4px", overflow: "hidden", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: `${progressPercentage}%`,
                  height: "100%",
                  backgroundColor: progressPercentage === 100 ? "#16a34a" : "var(--accent-color, #2563eb)",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>

          <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            {totalTodaySessions === 0 ? (
              "No sessions scheduled for today"
            ) : (
              <>Completed <strong>{completedTodaySessions}</strong> of <strong>{totalTodaySessions}</strong> session{totalTodaySessions > 1 ? "s" : ""}</>
            )}
          </div>
        </div>

        {/* Quick Add Session Form */}
        <div
          style={{
            backgroundColor: "var(--bg-secondary, #ffffff)",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "12px",
            padding: "1.5rem",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px", fontSize: "16px" }}>
            <PlusCircle size={18} color="var(--accent-color, #2563eb)" />
            Schedule Study Session
          </h3>

          <form onSubmit={handleSubmitSession}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  required
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                >
                  <option value="">-- Subject --</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Topic / Goal (e.g., Arrays & Linked Lists)"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{ width: "100%", padding: "0.45rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
              />
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{ width: "100%", padding: "0.45rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{ width: "100%", padding: "0.45rem", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Med</option>
                <option value="High">High</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: durationResult.isValid ? "#15803d" : "#dc2626" }}>
                {durationResult.isValid ? `${durationResult.formattedDuration}` : "Invalid time"}
              </span>

              <button
                type="submit"
                disabled={submitting || subjects.length === 0 || !durationResult.isValid}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: submitting || !durationResult.isValid ? "#94a3b8" : "var(--accent-color, #2563eb)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: submitting || !durationResult.isValid ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Saving..." : "Add"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. TODAY'S SESSIONS LIST */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={20} color="#d97706" />
            <h3 style={{ margin: 0, fontSize: "18px", color: "var(--text-primary)" }}>
              Today's Schedule ({todaySessions.length})
            </h3>
          </div>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Date: <strong>{todayDateStr}</strong>
          </span>
        </div>

        {loading ? (
          <p style={{ color: "var(--text-secondary)" }}>Loading today's sessions...</p>
        ) : todaySessions.length === 0 ? (
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px dashed #cbd5e1",
              borderRadius: "10px",
              padding: "2rem",
              textAlign: "center",
              color: "var(--text-secondary)",
              fontSize: "14px",
            }}
          >
            No study sessions scheduled for today. Use the form above to add one!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {todaySessions.map((session) => {
              const prio = getPriorityStyle(session.priority);
              const isCompleted = session.status === "Completed";

              return (
                <div
                  key={session.id}
                  style={{
                    backgroundColor: "var(--bg-secondary, #ffffff)",
                    border: `1px solid ${isCompleted ? "#e2e8f0" : "var(--border-color, #e2e8f0)"}`,
                    borderLeft: `4px solid ${prio.color}`,
                    borderRadius: "10px",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    opacity: isCompleted ? 0.7 : 1,
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
                    <button
                      onClick={() => handleToggleComplete(session)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        color: isCompleted ? "#16a34a" : "#94a3b8",
                      }}
                      title={isCompleted ? "Mark Scheduled" : "Mark Completed"}
                    >
                      {isCompleted ? <CheckSquare size={22} /> : <Square size={22} />}
                    </button>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "15px",
                            textDecoration: isCompleted ? "line-through" : "none",
                            color: isCompleted ? "var(--text-secondary)" : "var(--text-primary)",
                          }}
                        >
                          {session.topic}
                        </h4>

                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "9999px", backgroundColor: "#f1f5f9", color: "#475569", fontWeight: 500 }}>
                          {session.subjectName}
                        </span>

                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "9999px", backgroundColor: prio.bg, color: prio.color, border: `1px solid ${prio.border}`, fontWeight: 600 }}>
                          {session.priority}
                        </span>

                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "9999px", backgroundColor: isCompleted ? "#dcfce7" : "#eff6ff", color: isCompleted ? "#15803d" : "#1d4ed8", border: `1px solid ${isCompleted ? "#86efac" : "#bfdbfe"}`, fontWeight: 600 }}>
                          {session.status}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
                        <Clock size={13} />
                        <span>
                          {session.startTime} – {session.endTime}
                        </span>
                        <span style={{ margin: "0 2px" }}>•</span>
                        <Timer size={13} />
                        <span>
                          Duration: <strong>{formatDuration(session.duration)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteSession(session)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      padding: "6px",
                      borderRadius: "4px",
                    }}
                    title="Delete Study Session"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}