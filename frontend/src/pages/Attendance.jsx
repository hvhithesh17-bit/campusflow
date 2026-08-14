// src/pages/Attendance.jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import {
  calculateAttendancePercentage,
  getAttendanceStatus,
  calculateClassesNeeded,
} from "../utils/attendance";
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Trash2,
  AlertCircle,
  UserCheck,
  UserX,
  RotateCcw,
} from "lucide-react";

export default function Attendance() {
  const { currentUser } = useAuth();

  // Form State
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [totalClasses, setTotalClasses] = useState("");
  const [attendedClasses, setAttendedClasses] = useState("");

  // Data & Status State
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 1. Fetch Subjects for the Dropdown
  useEffect(() => {
    if (!currentUser) return;

    const subjectsQuery = query(
      collection(db, "subjects"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribeSubjects = onSnapshot(
      subjectsQuery,
      (snapshot) => {
        const fetched = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setSubjects(fetched);
      },
      (err) => {
        console.error("Error fetching subjects:", err);
        setError("Failed to load subjects.");
      }
    );

    return () => unsubscribeSubjects();
  }, [currentUser]);

  // 2. Fetch User's Attendance Records
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const attendanceQuery = query(
      collection(db, "attendance"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribeAttendance = onSnapshot(
      attendanceQuery,
      (snapshot) => {
        const records = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setAttendanceList(records);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching attendance:", err);
        setError("Failed to load attendance records.");
        setLoading(false);
      }
    );

    return () => unsubscribeAttendance();
  }, [currentUser]);

  // 3. Create New Attendance Entry
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const total = Number(totalClasses);
    const attended = Number(attendedClasses);

    if (!selectedSubjectId) {
      setError("Please select a subject.");
      return;
    }
    if (total <= 0) {
      setError("Total classes must be greater than 0.");
      return;
    }
    if (attended < 0 || attended > total) {
      setError("Attended classes must be between 0 and total classes.");
      return;
    }

    const targetSubject = subjects.find((s) => s.id === selectedSubjectId);
    const subjectName = targetSubject ? targetSubject.name : "Unknown Subject";
    const percentage = calculateAttendancePercentage(attended, total);

    setSubmitting(true);

    try {
      await addDoc(collection(db, "attendance"), {
        userId: currentUser.uid,
        subjectId: selectedSubjectId,
        subjectName: subjectName,
        totalClasses: total,
        attendedClasses: attended,
        percentage: percentage,
        createdAt: serverTimestamp(),
      });

      setSuccess(`Attendance recorded for ${subjectName}.`);
      setSelectedSubjectId("");
      setTotalClasses("");
      setAttendedClasses("");
    } catch (err) {
      console.error("Error adding attendance:", err);
      setError("Failed to save attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Quick Increment Handlers
  const handleMarkPresent = async (record) => {
    const newAttended = record.attendedClasses + 1;
    const newTotal = record.totalClasses + 1;
    const newPercentage = calculateAttendancePercentage(newAttended, newTotal);

    try {
      const recordRef = doc(db, "attendance", record.id);
      await updateDoc(recordRef, {
        attendedClasses: newAttended,
        totalClasses: newTotal,
        percentage: newPercentage,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error updating attendance:", err);
      setError("Failed to update attendance.");
    }
  };

  const handleMarkAbsent = async (record) => {
    const newAttended = record.attendedClasses;
    const newTotal = record.totalClasses + 1;
    const newPercentage = calculateAttendancePercentage(newAttended, newTotal);

    try {
      const recordRef = doc(db, "attendance", record.id);
      await updateDoc(recordRef, {
        totalClasses: newTotal,
        percentage: newPercentage,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error updating attendance:", err);
      setError("Failed to update attendance.");
    }
  };

  const handleUndo = async (record) => {
    if (record.totalClasses <= 1) return; // Prevent reducing to 0 classes

    const newTotal = record.totalClasses - 1;
    // Don't let attended exceed new total
    const newAttended = Math.min(record.attendedClasses, newTotal);
    const newPercentage = calculateAttendancePercentage(newAttended, newTotal);

    try {
      const recordRef = doc(db, "attendance", record.id);
      await updateDoc(recordRef, {
        attendedClasses: newAttended,
        totalClasses: newTotal,
        percentage: newPercentage,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error undoing attendance:", err);
      setError("Failed to undo attendance.");
    }
  };

  // 5. Delete Handler
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      await deleteDoc(doc(db, "attendance", id));
    } catch (err) {
      console.error("Error deleting attendance:", err);
      setError("Failed to delete record.");
    }
  };

  const renderStatusIcon = (variant) => {
    switch (variant) {
      case "success":
        return <CheckCircle2 size={16} />;
      case "info":
        return <Info size={16} />;
      case "warning":
        return <AlertTriangle size={16} />;
      case "danger":
      default:
        return <AlertOctagon size={16} />;
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>
          Attendance Tracking
        </h1>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>
          Track daily classes with one-click present/absent buttons.
        </p>
      </div>

      {error && (
        <div style={{ padding: "0.75rem 1rem", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "1.5rem", border: "1px solid #fecaca", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ padding: "0.75rem 1rem", backgroundColor: "#ecfdf5", color: "#065f46", borderRadius: "8px", marginBottom: "1.5rem", border: "1px solid #a7f3d0", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Record Attendance Form */}
      <div
        style={{
          backgroundColor: "var(--bg-secondary, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "1.25rem" }}>Initialize Subject Attendance</h3>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: 500 }}>
                Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                required
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid var(--border-color, #cbd5e1)", backgroundColor: "#fff", boxSizing: "border-box" }}
              >
                <option value="">-- Select Subject --</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.credits} Credits)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: 500 }}>
                Initial Total Classes
              </label>
              <input
                type="number"
                min="1"
                required
                value={totalClasses}
                onChange={(e) => setTotalClasses(e.target.value)}
                placeholder="e.g., 20"
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid var(--border-color, #cbd5e1)", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: 500 }}>
                Initial Attended Classes
              </label>
              <input
                type="number"
                min="0"
                required
                value={attendedClasses}
                onChange={(e) => setAttendedClasses(e.target.value)}
                placeholder="e.g., 18"
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid var(--border-color, #cbd5e1)", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || subjects.length === 0}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: submitting ? "#94a3b8" : "var(--accent-color, #2563eb)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: submitting || subjects.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Saving..." : "Add to Tracker"}
          </button>
        </form>
      </div>

      {/* Attendance Cards */}
      <div>
        <h3 style={{ marginBottom: "1rem" }}>My Courses</h3>

        {loading ? (
          <p style={{ color: "var(--text-secondary)" }}>Loading records...</p>
        ) : attendanceList.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No subjects tracked yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {attendanceList.map((record) => {
              const statusInfo = getAttendanceStatus(record.percentage);
              const targetGoal = calculateClassesNeeded(
                record.attendedClasses,
                record.totalClasses,
                75
              );

              return (
                <div
                  key={record.id}
                  style={{
                    backgroundColor: "var(--bg-secondary, #ffffff)",
                    border: `1px solid ${statusInfo.borderColor}`,
                    borderRadius: "12px",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <h4 style={{ margin: 0, fontSize: "16px", color: "var(--text-primary)" }}>
                        {record.subjectName}
                      </h4>
                      <button
                        onClick={() => handleDelete(record.id)}
                        style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
                        title="Delete Record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Classes Count */}
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                      Attended: <strong>{record.attendedClasses}</strong> / {record.totalClasses} classes
                    </div>

                    {/* Percentage & Badge */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                      <span style={{ fontSize: "24px", fontWeight: "700", color: statusInfo.color }}>
                        {record.percentage}%
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: statusInfo.color,
                          backgroundColor: statusInfo.bgColor,
                          border: `1px solid ${statusInfo.borderColor}`,
                          padding: "2px 8px",
                          borderRadius: "9999px",
                        }}
                      >
                        {renderStatusIcon(statusInfo.variant)}
                        {statusInfo.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        width: "100%",
                        height: "6px",
                        backgroundColor: "#e2e8f0",
                        borderRadius: "3px",
                        overflow: "hidden",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(record.percentage, 100)}%`,
                          height: "100%",
                          backgroundColor: statusInfo.color,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>

                    {/* Target Message */}
                    <p style={{ margin: "0 0 1rem 0", fontSize: "12px", color: targetGoal.classesNeeded > 0 ? "#b45309" : "#15803d", lineHeight: "1.4", fontWeight: 500 }}>
                      {targetGoal.message}
                    </p>
                  </div>

                  {/* Quick Action Increment Buttons */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px solid var(--border-color, #f1f5f9)",
                    }}
                  >
                    {/* Mark Present */}
                    <button
                      onClick={() => handleMarkPresent(record)}
                      style={{
                        flex: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                        padding: "8px 10px",
                        backgroundColor: "#dcfce7",
                        color: "#15803d",
                        border: "1px solid #86efac",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <UserCheck size={14} />
                      Present (+1)
                    </button>

                    {/* Mark Absent */}
                    <button
                      onClick={() => handleMarkAbsent(record)}
                      style={{
                        flex: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                        padding: "8px 10px",
                        backgroundColor: "#fee2e2",
                        color: "#b91c1c",
                        border: "1px solid #fca5a5",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <UserX size={14} />
                      Absent (0)
                    </button>

                    {/* Undo */}
                    <button
                      onClick={() => handleUndo(record)}
                      disabled={record.totalClasses <= 1}
                      title="Undo last class"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "8px",
                        backgroundColor: "#f1f5f9",
                        color: record.totalClasses <= 1 ? "#cbd5e1" : "#64748b",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        cursor: record.totalClasses <= 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      <RotateCcw size={14} />
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