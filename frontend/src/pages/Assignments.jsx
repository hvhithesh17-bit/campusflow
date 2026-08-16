// src/pages/Assignments.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { validateAssignment } from "../utils/validation";
import { formatFirebaseError } from "../utils/errorHandler";
import {
  ClipboardList,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Clock,
  Check,
  PlusCircle,
  Edit2,
  X,
  AlertTriangle,
  Search,
  CheckCircle,
  Flame,
  FileText,
  Sparkles,
} from "lucide-react";

// ==========================================
// 1. HELPER: Deadline Status Calculator
// ==========================================
function getDeadlineStatus(deadlineStr, status) {
  if (status === "Completed") {
    return {
      label: "Completed",
      variant: "completed",
      color: "#16a34a",
      bgColor: "#f0fdf4",
      borderColor: "#bbf7d0",
      isOverdue: false,
    };
  }

  if (!deadlineStr) {
    return {
      label: "No Deadline",
      variant: "default",
      color: "#64748b",
      bgColor: "#f1f5f9",
      borderColor: "#cbd5e1",
      isOverdue: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = deadlineStr.split("-").map(Number);
  const deadlineDate = new Date(year, month - 1, day);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffInMs = deadlineDate.getTime() - today.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) {
    const daysAgo = Math.abs(diffInDays);
    return {
      label: `Overdue (${daysAgo} ${daysAgo === 1 ? "day" : "days"} late)`,
      variant: "danger",
      color: "#dc2626",
      bgColor: "#fef2f2",
      borderColor: "#fecaca",
      isOverdue: true,
    };
  }

  if (diffInDays === 0) {
    return {
      label: "Due Today",
      variant: "warning",
      color: "#d97706",
      bgColor: "#fffbeb",
      borderColor: "#fde68a",
      isOverdue: false,
    };
  }

  if (diffInDays === 1) {
    return {
      label: "Due Tomorrow",
      variant: "warning",
      color: "#d97706",
      bgColor: "#fffbeb",
      borderColor: "#fde68a",
      isOverdue: false,
    };
  }

  return {
    label: `Due in ${diffInDays} days`,
    variant: "info",
    color: "#2563eb",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    isOverdue: false,
  };
}

// ==========================================
// 2. HELPER: Multi-Tier Sorting
// ==========================================
const PRIORITY_RANK = {
  High: 1,
  Medium: 2,
  Low: 3,
};

function sortAssignments(items) {
  return [...items].sort((a, b) => {
    // 1. Status: Pending before Completed
    const aCompleted = a.status === "Completed";
    const bCompleted = b.status === "Completed";
    if (aCompleted !== bCompleted) {
      return aCompleted ? 1 : -1;
    }

    // 2. Priority: High -> Medium -> Low
    const priorityA = PRIORITY_RANK[a.priority] || 2;
    const priorityB = PRIORITY_RANK[b.priority] || 2;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // 3. Deadline: Earliest due date first
    const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
    const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
    return dateA - dateB;
  });
}

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function Assignments() {
  const { currentUser } = useAuth();
  const formRef = useRef(null);

  // Form State
  const [title, setTitle] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("Medium");

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'pending' | 'overdue' | 'completed'

  // Edit Mode State
  const [editingId, setEditingId] = useState(null);

  // Data & Status State
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 1. Fetch User's Subjects for the Dropdown
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

  // 2. Fetch User's Assignments in Real-Time
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const assignmentsQuery = query(
      collection(db, "assignments"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribeAssignments = onSnapshot(
      assignmentsQuery,
      (snapshot) => {
        const fetched = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setAssignments(fetched);
        setLoading(false);
      },
      (err) => {
        setError(formatFirebaseError(err));
        setLoading(false);
      }
    );

    return () => unsubscribeAssignments();
  }, [currentUser]);

  // 3. Populate Form for Edit
  const handleStartEdit = (item) => {
    setError("");
    setSuccess("");
    setEditingId(item.id);
    setTitle(item.title || "");
    setSelectedSubjectId(item.subjectId || "");
    setDescription(item.description || "");
    setDeadline(item.deadline || item.dueDate || "");
    setPriority(item.priority || "Medium");

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 4. Cancel Edit Mode
  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setSelectedSubjectId("");
    setDescription("");
    setDeadline("");
    setPriority("Medium");
    setError("");
  };

  // 5. Submit Form (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentUser) {
      setError("You must be logged in to manage assignments.");
      return;
    }

    const validation = validateAssignment({
      title,
      subjectId: selectedSubjectId,
      dueDate: deadline,
    });

    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    const targetSubject = subjects.find((s) => s.id === selectedSubjectId);
    const subjectName = targetSubject ? targetSubject.name : "Subject";
    const cleanDescription = (description || "").trim();

    setSubmitting(true);

    try {
      if (editingId) {
        const assignmentRef = doc(db, "assignments", editingId);
        await updateDoc(assignmentRef, {
          title: validation.sanitized.title,
          subjectId: selectedSubjectId,
          subjectName: subjectName,
          description: cleanDescription,
          deadline: validation.sanitized.dueDate,
          dueDate: validation.sanitized.dueDate,
          priority: priority,
          userId: currentUser.uid,
          updatedAt: serverTimestamp(),
        });

        setSuccess(`Assignment "${validation.sanitized.title}" updated successfully!`);
        handleCancelEdit();
      } else {
        await addDoc(collection(db, "assignments"), {
          title: validation.sanitized.title,
          subjectId: selectedSubjectId,
          subjectName: subjectName,
          description: cleanDescription,
          deadline: validation.sanitized.dueDate,
          dueDate: validation.sanitized.dueDate,
          priority: priority,
          status: "Pending",
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setSuccess(`Assignment "${validation.sanitized.title}" added successfully!`);
        setTitle("");
        setSelectedSubjectId("");
        setDescription("");
        setDeadline("");
        setPriority("Medium");
      }
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Mark Complete
  const handleMarkComplete = async (assignmentId) => {
    setError("");
    setUpdatingId(assignmentId);

    try {
      const assignmentRef = doc(db, "assignments", assignmentId);
      await updateDoc(assignmentRef, {
        status: "Completed",
        userId: currentUser.uid,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  // 7. Delete Assignment with Confirmation
  const handleDelete = async (assignment) => {
    setError("");
    setSuccess("");

    if (!currentUser || assignment.userId !== currentUser.uid) {
      setError("Unauthorized: You can only delete your own assignments.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${assignment.title}"?`
    );
    if (!confirmDelete) return;

    setDeletingId(assignment.id);

    try {
      const docRef = doc(db, "assignments", assignment.id);
      await deleteDoc(docRef);

      if (editingId === assignment.id) {
        handleCancelEdit();
      }

      setSuccess(`Assignment "${assignment.title}" was deleted.`);
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setDeletingId(null);
    }
  };

  // Priority badge styling
  const getPriorityStyle = (lvl) => {
    switch (lvl) {
      case "High":
        return { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
      case "Medium":
        return { color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
      case "Low":
      default:
        return { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
    }
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    const pendingCount = assignments.filter((a) => a.status !== "Completed").length;
    const completedCount = assignments.filter((a) => a.status === "Completed").length;
    const overdueCount = assignments.filter((a) => {
      if (a.status === "Completed") return false;
      const statusInfo = getDeadlineStatus(a.deadline || a.dueDate, a.status);
      return statusInfo.isOverdue;
    }).length;

    return {
      total: assignments.length,
      pending: pendingCount,
      completed: completedCount,
      overdue: overdueCount,
    };
  }, [assignments]);

  // Search & Filter Pipeline
  const filteredAssignments = useMemo(() => {
    const sorted = sortAssignments(assignments);
    return sorted.filter((item) => {
      const matchesSearch =
        item.title?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        item.subjectName?.toLowerCase().includes(searchTerm.toLowerCase().trim());

      const deadlineInfo = getDeadlineStatus(item.deadline || item.dueDate, item.status);

      let matchesStatus = true;
      if (statusFilter === "pending") matchesStatus = item.status !== "Completed";
      else if (statusFilter === "completed") matchesStatus = item.status === "Completed";
      else if (statusFilter === "overdue") matchesStatus = deadlineInfo.isOverdue && item.status !== "Completed";

      return matchesSearch && matchesStatus;
    });
  }, [assignments, searchTerm, statusFilter]);

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
              <ClipboardList size={22} />
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
              Assignment Planner
            </h1>
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
            Track coursework, set submission priorities, and complete assignments before deadlines.
          </p>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {/* Total Assignments */}
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
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#334155",
            }}
          >
            <FileText size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Total Tasks
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>
              {metrics.total}
            </div>
          </div>
        </div>

        {/* Pending Tasks */}
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
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#d97706",
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Pending Tasks
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#d97706" }}>
              {metrics.pending}
            </div>
          </div>
        </div>

        {/* Overdue Tasks */}
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
            <Flame size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Overdue
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: metrics.overdue > 0 ? "#dc2626" : "#0f172a" }}>
              {metrics.overdue}
            </div>
          </div>
        </div>

        {/* Completed Tasks */}
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
            <CheckCircle size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Completed
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#16a34a" }}>
              {metrics.completed}
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

      {/* Form Container */}
      <div
        ref={formRef}
        style={{
          backgroundColor: "#ffffff",
          border: `1.5px solid ${editingId ? "#3b82f6" : "#e2e8f0"}`,
          borderRadius: "16px",
          padding: "1.75rem 2rem",
          marginBottom: "2.5rem",
          boxShadow: editingId
            ? "0 8px 24px -4px rgba(59, 130, 246, 0.15)"
            : "0 1px 3px rgba(0,0,0,0.03)",
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#1e293b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {editingId ? (
              <>
                <Edit2 size={18} color="#2563eb" />
                Edit Assignment
              </>
            ) : (
              <>
                <PlusCircle size={18} color="#2563eb" />
                Add New Assignment
              </>
            )}
          </h3>

          {editingId && (
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#2563eb",
                backgroundColor: "#eff6ff",
                padding: "3px 10px",
                borderRadius: "9999px",
              }}
            >
              Editing Mode
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
              marginBottom: "1.25rem",
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
                Assignment Title *
              </label>
              <input
                type="text"
                disabled={submitting}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Data Structures Lab Report"
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
                Subject *
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
                <option value="">-- Select Subject --</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
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
                Deadline Date *
              </label>
              <input
                type="date"
                disabled={submitting}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
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
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
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
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.4rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#334155",
              }}
            >
              Description / Notes (Optional)
            </label>
            <textarea
              rows="3"
              disabled={submitting}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add submission guidelines, textbook chapters, or reference links..."
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.95rem",
                color: "#1e293b",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              type="submit"
              disabled={submitting || subjects.length === 0}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor:
                  submitting || subjects.length === 0
                    ? "#94a3b8"
                    : "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor:
                  submitting || subjects.length === 0
                    ? "not-allowed"
                    : "pointer",
                boxShadow: "0 2px 4px rgba(37, 99, 235, 0.15)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Sparkles size={16} />
              {submitting
                ? "Saving..."
                : editingId
                ? "Update Assignment"
                : "Add Assignment"}
            </button>

            {editingId && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleCancelEdit}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "0.75rem 1.25rem",
                  backgroundColor: "#f8fafc",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                <X size={16} />
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Assignment Cards List */}
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
              My Assignments
            </h3>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Showing {filteredAssignments.length} of {assignments.length} assignments
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
                placeholder="Search assignment or subject..."
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
              <option value="all">All Assignments</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>Loading assignments...</div>
          </div>
        ) : filteredAssignments.length === 0 ? (
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
              <ClipboardList size={24} />
            </div>
            <h4 style={{ margin: "0 0 0.5rem 0", color: "#1e293b", fontSize: "1.1rem" }}>
              {searchTerm || statusFilter !== "all"
                ? "No matching assignments found"
                : "No assignments recorded yet"}
            </h4>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
              {searchTerm || statusFilter !== "all"
                ? "Try clearing your search query or adjusting your status filters."
                : "Add your semester assignments using the planner form above."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filteredAssignments.map((item) => {
              const prio = getPriorityStyle(item.priority);
              const deadlineDateStr = item.deadline || item.dueDate || "";
              const deadlineInfo = getDeadlineStatus(deadlineDateStr, item.status);
              const isCompleted = item.status === "Completed";
              const isUpdating = updatingId === item.id;
              const isDeleting = deletingId === item.id;
              const isBeingEdited = editingId === item.id;

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "#ffffff",
                    border: `1.5px solid ${
                      isBeingEdited
                        ? "#3b82f6"
                        : deadlineInfo.isOverdue
                        ? "#fecaca"
                        : "#e2e8f0"
                    }`,
                    borderRadius: "14px",
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1.25rem",
                    opacity: isCompleted || isDeleting ? 0.65 : 1,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Left Column: Info & Badges */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginBottom: "6px",
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "1.05rem",
                          fontWeight: 700,
                          textDecoration: isCompleted ? "line-through" : "none",
                          color: isCompleted ? "#64748b" : "#0f172a",
                        }}
                      >
                        {item.title}
                      </h4>

                      {/* Subject Name */}
                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          backgroundColor: "#f1f5f9",
                          color: "#334155",
                          fontWeight: 600,
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {item.subjectName}
                      </span>

                      {/* Priority Badge */}
                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "3px 8px",
                          borderRadius: "9999px",
                          backgroundColor: prio.bg,
                          color: prio.color,
                          border: `1px solid ${prio.border}`,
                          fontWeight: 700,
                        }}
                      >
                        {item.priority} Priority
                      </span>

                      {/* Deadline Status Badge */}
                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "3px 8px",
                          borderRadius: "9999px",
                          backgroundColor: deadlineInfo.bgColor,
                          color: deadlineInfo.color,
                          border: `1px solid ${deadlineInfo.borderColor}`,
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {deadlineInfo.isOverdue && <AlertTriangle size={12} />}
                        {isCompleted && <CheckCircle2 size={12} />}
                        {deadlineInfo.label}
                      </span>
                    </div>

                    {item.description && (
                      <p
                        style={{
                          margin: "0 0 6px 0",
                          fontSize: "0.85rem",
                          color: "#64748b",
                          lineHeight: "1.4",
                        }}
                      >
                        {item.description}
                      </p>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.8rem",
                        color: "#64748b",
                      }}
                    >
                      <Calendar size={13} />
                      <span>Due: {deadlineDateStr || "N/A"}</span>
                      <span style={{ margin: "0 4px" }}>•</span>
                      <Clock size={13} />
                      <span>
                        Status:{" "}
                        <strong
                          style={{
                            color: isCompleted ? "#16a34a" : "#d97706",
                          }}
                        >
                          {item.status}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {/* Mark Complete Button */}
                    <button
                      onClick={() => handleMarkComplete(item.id)}
                      disabled={isCompleted || isUpdating || isDeleting || submitting}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "7px 14px",
                        backgroundColor: isCompleted ? "#f1f5f9" : "#dcfce7",
                        color: isCompleted ? "#94a3b8" : "#15803d",
                        border: `1px solid ${
                          isCompleted ? "#e2e8f0" : "#86efac"
                        }`,
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor:
                          isCompleted || isUpdating || isDeleting || submitting
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {isCompleted ? (
                        <>
                          <Check size={14} />
                          Completed
                        </>
                      ) : isUpdating ? (
                        "Updating..."
                      ) : (
                        <>
                          <Check size={14} />
                          Complete
                        </>
                      )}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleStartEdit(item)}
                      disabled={isDeleting || submitting}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "7px 12px",
                        backgroundColor: "#ffffff",
                        color: "#334155",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: isDeleting || submitting ? "not-allowed" : "pointer",
                      }}
                      title="Edit Assignment"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={isDeleting || submitting}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "7px 12px",
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        color: isDeleting ? "#cbd5e1" : "#dc2626",
                        cursor: isDeleting || submitting ? "not-allowed" : "pointer",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                      title="Delete Assignment"
                    >
                      <Trash2 size={14} /> {isDeleting ? "Removing..." : "Delete"}
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