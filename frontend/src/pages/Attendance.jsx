// src/pages/Attendance.jsx
import React, { useState, useEffect, useMemo } from "react";
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
import { validateAttendance } from "../utils/validation";
import { formatFirebaseError } from "../utils/errorHandler";
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
  PlusCircle,
  Search,
  Percent,
  ShieldCheck,
  ShieldAlert,
  CalendarCheck,
} from "lucide-react";

export default function Attendance() {
  const { currentUser } = useAuth();

  // Form State
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [totalClasses, setTotalClasses] = useState("");
  const [attendedClasses, setAttendedClasses] = useState("");

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'critical' | 'warning' | 'good'

  // Data & Status State
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
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
        setError(formatFirebaseError(err));
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
        setError(formatFirebaseError(err));
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

    if (!currentUser) {
      setError("You must be logged in to record attendance.");
      return;
    }

    if (!selectedSubjectId) {
      setError("Please select a subject.");
      return;
    }

    const alreadyTracked = attendanceList.some((rec) => rec.subjectId === selectedSubjectId);
    if (alreadyTracked) {
      setError("This subject is already being tracked. Use the action buttons to log classes.");
      return;
    }

    const validation = validateAttendance({
      attendedClasses,
      totalClasses,
    });

    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    const { attendedClasses: attended, totalClasses: total } = validation.sanitized;

    if (total === 0) {
      setError("Initial total classes must be at least 1.");
      return;
    }

    const targetSubject = subjects.find((s) => s.id === selectedSubjectId);
    const subjectName = targetSubject ? targetSubject.name : "Subject";
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
        updatedAt: serverTimestamp(),
      });

      setSuccess(`Attendance tracker initialized for ${subjectName}.`);
      setSelectedSubjectId("");
      setTotalClasses("");
      setAttendedClasses("");
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Quick Increment Handlers
  const handleMarkPresent = async (record) => {
    setError("");
    setSuccess("");

    const newAttended = (Number(record.attendedClasses) || 0) + 1;
    const newTotal = (Number(record.totalClasses) || 0) + 1;

    const validation = validateAttendance({
      attendedClasses: newAttended,
      totalClasses: newTotal,
    });

    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    const newPercentage = calculateAttendancePercentage(newAttended, newTotal);
    setUpdatingId(record.id);

    try {
      const recordRef = doc(db, "attendance", record.id);
      await updateDoc(recordRef, {
        attendedClasses: newAttended,
        totalClasses: newTotal,
        percentage: newPercentage,
        userId: currentUser.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkAbsent = async (record) => {
    setError("");
    setSuccess("");

    const newAttended = Number(record.attendedClasses) || 0;
    const newTotal = (Number(record.totalClasses) || 0) + 1;

    const validation = validateAttendance({
      attendedClasses: newAttended,
      totalClasses: newTotal,
    });

    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    const newPercentage = calculateAttendancePercentage(newAttended, newTotal);
    setUpdatingId(record.id);

    try {
      const recordRef = doc(db, "attendance", record.id);
      await updateDoc(recordRef, {
        attendedClasses: newAttended,
        totalClasses: newTotal,
        percentage: newPercentage,
        userId: currentUser.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUndo = async (record) => {
    setError("");
    setSuccess("");

    const currentTotal = Number(record.totalClasses) || 0;
    const currentAttended = Number(record.attendedClasses) || 0;

    if (currentTotal <= 1) {
      setError("Cannot undo: Total classes cannot be less than 1.");
      return;
    }

    const newTotal = currentTotal - 1;
    const newAttended = Math.min(currentAttended, newTotal);

    const validation = validateAttendance({
      attendedClasses: newAttended,
      totalClasses: newTotal,
    });

    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    const newPercentage = calculateAttendancePercentage(newAttended, newTotal);
    setUpdatingId(record.id);

    try {
      const recordRef = doc(db, "attendance", record.id);
      await updateDoc(recordRef, {
        attendedClasses: newAttended,
        totalClasses: newTotal,
        percentage: newPercentage,
        userId: currentUser.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  // 5. Delete Handler
  const handleDelete = async (record) => {
    setError("");
    setSuccess("");

    if (!currentUser || record.userId !== currentUser.uid) {
      setError("Unauthorized action: You can only delete your own attendance records.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete attendance for "${record.subjectName}"?`
    );
    if (!confirmed) return;

    setDeletingId(record.id);

    try {
      await deleteDoc(doc(db, "attendance", record.id));
      setSuccess(`Attendance record for "${record.subjectName}" deleted.`);
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setDeletingId(null);
    }
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    if (!attendanceList.length) return { average: 0, onTrack: 0, atRisk: 0 };
    const totalPercentage = attendanceList.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0);
    const onTrack = attendanceList.filter((r) => Number(r.percentage) >= 75).length;
    const atRisk = attendanceList.length - onTrack;
    return {
      average: Math.round(totalPercentage / attendanceList.length),
      onTrack,
      atRisk,
    };
  }, [attendanceList]);

  // Filtered Courses
  const filteredAttendance = useMemo(() => {
    return attendanceList.filter((record) => {
      const matchesSearch = record.subjectName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase().trim());

      const pct = Number(record.percentage) || 0;
      let matchesFilter = true;

      if (statusFilter === "critical") matchesFilter = pct < 65;
      else if (statusFilter === "warning") matchesFilter = pct >= 65 && pct < 75;
      else if (statusFilter === "good") matchesFilter = pct >= 75;

      return matchesSearch && matchesFilter;
    });
  }, [attendanceList, searchTerm, statusFilter]);

  const renderStatusIcon = (variant) => {
    switch (variant) {
      case "success":
        return <CheckCircle2 size={14} />;
      case "info":
        return <Info size={14} />;
      case "warning":
        return <AlertTriangle size={14} />;
      case "danger":
      default:
        return <AlertOctagon size={14} />;
    }
  };

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
      {/* Top Banner Header */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
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
              <CalendarCheck size={22} />
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: "1.75rem",
                fontWeight: "700",
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              Attendance Tracking
            </h1>
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
            Log daily classroom attendance, track 75% thresholds, and monitor needed classes.
          </p>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {/* Average Attendance */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "1.35rem 1.5rem",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
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
              border: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2563eb",
            }}
          >
            <Percent size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Overall Average
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>
              {metrics.average}%
            </div>
          </div>
        </div>

        {/* On Track (>= 75%) */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "1.35rem 1.5rem",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
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
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#16a34a",
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Safe Courses (≥75%)
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#16a34a" }}>
              {metrics.onTrack} <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#64748b" }}>courses</span>
            </div>
          </div>
        </div>

        {/* At Risk (< 75%) */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "1.35rem 1.5rem",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
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
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#dc2626",
            }}
          >
            <ShieldAlert size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              At-Risk Courses (&lt;75%)
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: metrics.atRisk > 0 ? "#dc2626" : "#0f172a" }}>
              {metrics.atRisk} <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#64748b" }}>courses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications / Feedback */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.875rem 1.25rem",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
            borderRadius: "10px",
            marginBottom: "1.5rem",
            border: "1px solid #fecaca",
            fontSize: "0.9rem",
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.875rem 1.25rem",
            backgroundColor: "#ecfdf5",
            color: "#065f46",
            borderRadius: "10px",
            marginBottom: "1.5rem",
            border: "1px solid #a7f3d0",
            fontSize: "0.9rem",
          }}
        >
          <CheckCircle2 size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Initialize Attendance Form */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "1.75rem 2rem",
          marginBottom: "2.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <h3
          style={{
            margin: "0 0 1.25rem 0",
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#1e293b",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <PlusCircle size={18} color="#2563eb" />
          Initialize Subject Tracker
        </h3>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
              marginBottom: "1.5rem",
            }}
          >
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
                Select Course / Subject *
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  fontSize: "0.95rem",
                  color: "#1e293b",
                  boxSizing: "border-box",
                }}
              >
                <option value="">-- Choose Subject --</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.credits} Credits)
                  </option>
                ))}
              </select>
            </div>

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
                Total Held Classes *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                disabled={submitting}
                value={totalClasses}
                onChange={(e) => setTotalClasses(e.target.value)}
                placeholder="e.g., 20"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.95rem",
                  color: "#1e293b",
                  boxSizing: "border-box",
                }}
              />
            </div>

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
                Classes Attended *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                disabled={submitting}
                value={attendedClasses}
                onChange={(e) => setAttendedClasses(e.target.value)}
                placeholder="e.g., 18"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.95rem",
                  color: "#1e293b",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || subjects.length === 0}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor:
                submitting || subjects.length === 0 ? "#94a3b8" : "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor:
                submitting || subjects.length === 0 ? "not-allowed" : "pointer",
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.15)",
            }}
          >
            {submitting ? "Saving..." : "Start Tracking"}
          </button>
        </form>
      </div>

      {/* Courses List Section */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
              Active Course Records
            </h3>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Showing {filteredAttendance.length} of {attendanceList.length} tracked
            </span>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ position: "relative", minWidth: "240px" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="text"
                placeholder="Search course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem 0.5rem 2rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.85rem",
                  backgroundColor: "#ffffff",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                backgroundColor: "#ffffff",
                color: "#334155",
                fontWeight: 500,
              }}
            >
              <option value="all">All Statuses</option>
              <option value="good">On Track (≥75%)</option>
              <option value="warning">Warning (65%–74%)</option>
              <option value="critical">Critical (&lt;65%)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Card Grid */}
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>Loading attendance metrics...</div>
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px dashed #cbd5e1",
              borderRadius: "16px",
              padding: "3.5rem 2rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                margin: "0 auto 1rem auto",
                borderRadius: "50%",
                backgroundColor: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
              }}
            >
              <CalendarCheck size={24} />
            </div>
            <h4 style={{ margin: "0 0 0.5rem 0", color: "#1e293b", fontSize: "1.1rem" }}>
              {searchTerm || statusFilter !== "all"
                ? "No matching records found"
                : "No attendance tracked yet"}
            </h4>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
              {searchTerm || statusFilter !== "all"
                ? "Try clearing your search query or adjusting status filters."
                : "Initialize a subject using the form above to log daily classes."}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {filteredAttendance.map((record) => {
              const statusInfo = getAttendanceStatus(record.percentage);
              const targetGoal = calculateClassesNeeded(
                record.attendedClasses,
                record.totalClasses,
                75
              );
              const isDeleting = deletingId === record.id;
              const isUpdating = updatingId === record.id;

              return (
                <div
                  key={record.id}
                  style={{
                    backgroundColor: "#ffffff",
                    border: `1.5px solid ${statusInfo.borderColor}`,
                    borderRadius: "14px",
                    padding: "1.35rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    opacity: isDeleting ? 0.6 : 1,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div>
                    {/* Header Row: Subject & Delete */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "10px",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "1.05rem",
                          fontWeight: 700,
                          color: "#0f172a",
                          lineHeight: 1.35,
                        }}
                      >
                        {record.subjectName}
                      </h4>
                      <button
                        onClick={() => handleDelete(record)}
                        disabled={isDeleting || isUpdating}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: isDeleting ? "#cbd5e1" : "#94a3b8",
                          cursor: isDeleting || isUpdating ? "not-allowed" : "pointer",
                          padding: "4px",
                        }}
                        title="Delete Record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Classes Count */}
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "#64748b",
                        marginBottom: "0.85rem",
                      }}
                    >
                      Attended: <strong style={{ color: "#0f172a" }}>{record.attendedClasses}</strong> /{" "}
                      {record.totalClasses} total classes
                    </div>

                    {/* Percentage & Status Pill */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "0.85rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "1.75rem",
                          fontWeight: "800",
                          color: statusInfo.color,
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {record.percentage}%
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          color: statusInfo.color,
                          backgroundColor: statusInfo.bgColor,
                          border: `1px solid ${statusInfo.borderColor}`,
                          padding: "3px 10px",
                          borderRadius: "9999px",
                        }}
                      >
                        {renderStatusIcon(statusInfo.variant)}
                        {statusInfo.status}
                      </span>
                    </div>

                    {/* Progress Bar Meter */}
                    <div
                      style={{
                        width: "100%",
                        height: "7px",
                        backgroundColor: "#f1f5f9",
                        borderRadius: "9999px",
                        overflow: "hidden",
                        marginBottom: "0.85rem",
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

                    {/* Target Classes Message */}
                    <p
                      style={{
                        margin: "0 0 1.25rem 0",
                        fontSize: "0.8rem",
                        color: targetGoal.classesNeeded > 0 ? "#b45309" : "#15803d",
                        lineHeight: "1.4",
                        fontWeight: 600,
                      }}
                    >
                      {targetGoal.message}
                    </p>
                  </div>

                  {/* Increment / Decrement Action Buttons */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      paddingTop: "0.85rem",
                      borderTop: "1px solid #f1f5f9",
                    }}
                  >
                    {/* Mark Present */}
                    <button
                      onClick={() => handleMarkPresent(record)}
                      disabled={isUpdating || isDeleting}
                      style={{
                        flex: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px",
                        padding: "8px 10px",
                        backgroundColor: isUpdating ? "#f1f5f9" : "#dcfce7",
                        color: isUpdating ? "#94a3b8" : "#15803d",
                        border: "1px solid #86efac",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: isUpdating || isDeleting ? "not-allowed" : "pointer",
                      }}
                    >
                      <UserCheck size={14} />
                      Present (+1)
                    </button>

                    {/* Mark Absent */}
                    <button
                      onClick={() => handleMarkAbsent(record)}
                      disabled={isUpdating || isDeleting}
                      style={{
                        flex: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px",
                        padding: "8px 10px",
                        backgroundColor: isUpdating ? "#f1f5f9" : "#fee2e2",
                        color: isUpdating ? "#94a3b8" : "#b91c1c",
                        border: "1px solid #fca5a5",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: isUpdating || isDeleting ? "not-allowed" : "pointer",
                      }}
                    >
                      <UserX size={14} />
                      Absent (0)
                    </button>

                    {/* Undo */}
                    <button
                      onClick={() => handleUndo(record)}
                      disabled={record.totalClasses <= 1 || isUpdating || isDeleting}
                      title="Undo last recorded class"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "8px 10px",
                        backgroundColor: "#f8fafc",
                        color:
                          record.totalClasses <= 1 || isUpdating || isDeleting
                            ? "#cbd5e1"
                            : "#64748b",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        cursor:
                          record.totalClasses <= 1 || isUpdating || isDeleting
                            ? "not-allowed"
                            : "pointer",
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