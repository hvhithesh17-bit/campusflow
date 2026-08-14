// src/pages/Assignments.jsx
import React, { useState, useEffect, useRef } from "react";
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
      borderColor: "#86efac",
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
      borderColor: "#fca5a5",
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
        console.error("Error fetching subjects:", err);
        setError("Failed to load subjects for selection.");
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
        console.error("Error fetching assignments:", err);
        setError("Failed to load assignments.");
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
    setDeadline(item.deadline || "");
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

    if (!title.trim()) {
      setError("Please enter an assignment title.");
      return;
    }
    if (!selectedSubjectId) {
      setError("Please select a subject.");
      return;
    }
    if (!deadline) {
      setError("Please select a deadline date.");
      return;
    }

    const targetSubject = subjects.find((s) => s.id === selectedSubjectId);
    const subjectName = targetSubject ? targetSubject.name : "Unknown Subject";

    setSubmitting(true);

    try {
      if (editingId) {
        // Update existing document
        const assignmentRef = doc(db, "assignments", editingId);
        await updateDoc(assignmentRef, {
          title: title.trim(),
          subjectId: selectedSubjectId,
          subjectName: subjectName,
          description: description.trim(),
          deadline: deadline,
          priority: priority,
          updatedAt: serverTimestamp(),
        });

        setSuccess(`Assignment "${title}" updated successfully!`);
        handleCancelEdit();
      } else {
        // Add new document
        await addDoc(collection(db, "assignments"), {
          title: title.trim(),
          subjectId: selectedSubjectId,
          subjectName: subjectName,
          description: description.trim(),
          deadline: deadline,
          priority: priority,
          status: "Pending",
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
        });

        setSuccess(`Assignment "${title}" added successfully!`);
        setTitle("");
        setSelectedSubjectId("");
        setDescription("");
        setDeadline("");
        setPriority("Medium");
      }
    } catch (err) {
      console.error("Error saving assignment:", err);
      setError("Failed to save assignment. Please try again.");
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
        completedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error marking complete:", err);
      setError("Failed to mark assignment as complete.");
    } finally {
      setUpdatingId(null);
    }
  };

  // 7. Delete Assignment with Confirmation and Ownership Check
  const handleDelete = async (assignment) => {
    setError("");
    setSuccess("");

    if (assignment.userId !== currentUser.uid) {
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
      console.error("Error deleting assignment:", err);
      setError("Failed to delete assignment.");
    } finally {
      setDeletingId(null);
    }
  };

  // Priority badge styling
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

  // Apply sorting rules
  const sortedAssignments = sortAssignments(assignments);

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>
          Assignment Planner
        </h1>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>
          Track coursework, manage priorities, and complete assignments on time.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            border: "1px solid #fecaca",
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            backgroundColor: "#ecfdf5",
            color: "#065f46",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            border: "1px solid #a7f3d0",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Form Container */}
      <div
        ref={formRef}
        style={{
          backgroundColor: "var(--bg-secondary, #ffffff)",
          border: `1px solid ${editingId ? "var(--accent-color, #2563eb)" : "var(--border-color, #e2e8f0)"}`,
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "2rem",
          boxShadow: editingId ? "0 0 0 2px rgba(37, 99, 235, 0.15)" : "none",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {editingId ? (
            <>
              <Edit2 size={20} color="var(--accent-color, #2563eb)" />
              Edit Assignment
            </>
          ) : (
            <>
              <PlusCircle size={20} color="var(--accent-color, #2563eb)" />
              Add New Assignment
            </>
          )}
        </h3>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "14px", fontWeight: 500 }}>
                Assignment Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Data Structures Lab Report"
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid var(--border-color, #cbd5e1)", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "14px", fontWeight: 500 }}>
                Subject *
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
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "14px", fontWeight: 500 }}>
                Deadline Date *
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid var(--border-color, #cbd5e1)", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "14px", fontWeight: 500 }}>
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid var(--border-color, #cbd5e1)", backgroundColor: "#fff", boxSizing: "border-box" }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "14px", fontWeight: 500 }}>
              Description / Notes (Optional)
            </label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add submission guidelines, textbook chapters, or reference links..."
              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid var(--border-color, #cbd5e1)", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
              {submitting
                ? "Saving..."
                : editingId
                ? "Update Assignment"
                : "Add Assignment"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "0.75rem 1.25rem",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
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
        <h3 style={{ marginBottom: "1rem" }}>My Assignments ({assignments.length})</h3>

        {loading ? (
          <p style={{ color: "var(--text-secondary)" }}>Loading assignments...</p>
        ) : sortedAssignments.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No assignments recorded yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {sortedAssignments.map((item) => {
              const prio = getPriorityStyle(item.priority);
              const deadlineInfo = getDeadlineStatus(item.deadline, item.status);
              const isCompleted = item.status === "Completed";
              const isUpdating = updatingId === item.id;
              const isDeleting = deletingId === item.id;
              const isBeingEdited = editingId === item.id;

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "var(--bg-secondary, #ffffff)",
                    border: `1px solid ${
                      isBeingEdited
                        ? "var(--accent-color, #2563eb)"
                        : deadlineInfo.isOverdue
                        ? "#fca5a5"
                        : "var(--border-color, #e2e8f0)"
                    }`,
                    borderRadius: "10px",
                    padding: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    opacity: isCompleted || isDeleting ? 0.65 : 1,
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
                          fontSize: "16px",
                          textDecoration: isCompleted ? "line-through" : "none",
                          color: isCompleted ? "var(--text-secondary)" : "var(--text-primary)",
                        }}
                      >
                        {item.title}
                      </h4>

                      {/* Subject Name */}
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          backgroundColor: "#f1f5f9",
                          color: "#475569",
                          fontWeight: 500,
                        }}
                      >
                        {item.subjectName}
                      </span>

                      {/* Priority Badge */}
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          backgroundColor: prio.bg,
                          color: prio.color,
                          border: `1px solid ${prio.border}`,
                          fontWeight: 600,
                        }}
                      >
                        {item.priority} Priority
                      </span>

                      {/* Deadline Status Badge */}
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          backgroundColor: deadlineInfo.bgColor,
                          color: deadlineInfo.color,
                          border: `1px solid ${deadlineInfo.borderColor}`,
                          fontWeight: 600,
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
                          fontSize: "13px",
                          color: "var(--text-secondary)",
                          lineHeight: "1.4",
                        }}
                      >
                        {item.description}
                      </p>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
                      <Calendar size={13} />
                      <span>Due: {item.deadline}</span>
                      <span style={{ margin: "0 4px" }}>•</span>
                      <Clock size={13} />
                      <span>
                        Status:{" "}
                        <strong style={{ color: isCompleted ? "#16a34a" : "#d97706" }}>
                          {item.status}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {/* Mark Complete Button */}
                    <button
                      onClick={() => handleMarkComplete(item.id)}
                      disabled={isCompleted || isUpdating || isDeleting}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        backgroundColor: isCompleted ? "#f1f5f9" : "#dcfce7",
                        color: isCompleted ? "#94a3b8" : "#15803d",
                        border: `1px solid ${isCompleted ? "#e2e8f0" : "#86efac"}`,
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: isCompleted || isUpdating || isDeleting ? "not-allowed" : "pointer",
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
                      disabled={isDeleting}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 10px",
                        backgroundColor: "#f8fafc",
                        color: "#334155",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: isDeleting ? "not-allowed" : "pointer",
                      }}
                      title="Edit Assignment"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={isDeleting}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: isDeleting ? "#cbd5e1" : "#ef4444",
                        cursor: isDeleting ? "not-allowed" : "pointer",
                        padding: "6px",
                        borderRadius: "4px",
                      }}
                      title="Delete Assignment"
                    >
                      <Trash2 size={16} />
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