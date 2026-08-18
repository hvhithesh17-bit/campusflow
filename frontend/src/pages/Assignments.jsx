/* ===== CampusFlow Assignments UI/UX Upgrade ===== */
const assignmentUXStyles = `
.cf-page-container{max-width:1280px!important;margin:0 auto!important;padding:clamp(14px,3vw,32px)!important;background:radial-gradient(circle at 90% 0%,rgba(37,99,235,.07),transparent 28%),#f8fafc!important;min-height:100%!important}
.cf-page-header{position:relative!important;overflow:hidden!important;padding:clamp(22px,4vw,34px)!important;border:1px solid #dbeafe!important;border-radius:24px!important;background:linear-gradient(135deg,#fff,#f8fbff 58%,#eff6ff)!important;box-shadow:0 10px 35px rgba(15,23,42,.055)!important;margin-bottom:18px!important}
.cf-page-header:after{content:"";position:absolute;right:-100px;top:-120px;width:230px;height:230px;border-radius:50%;background:rgba(37,99,235,.08);pointer-events:none}
.cf-page-header-title{gap:11px!important}.cf-page-header-icon{width:42px!important;height:42px!important;border-radius:13px!important;background:#dbeafe!important;color:#2563eb!important}.cf-page-header h1{font-size:clamp(1.55rem,3vw,2.2rem)!important;letter-spacing:-.035em!important}.cf-page-header p{max-width:700px!important;line-height:1.65!important;color:#64748b!important}
.cf-stats-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important;margin-bottom:18px!important}.cf-stat-card{padding:18px!important;border-radius:18px!important;border:1px solid #e2e8f0!important;background:#fff!important;box-shadow:0 5px 20px rgba(15,23,42,.035)!important;transition:.2s!important}.cf-stat-card:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(15,23,42,.07)!important}.cf-stat-icon-wrap{width:46px!important;height:46px!important;border-radius:14px!important}.cf-stat-label{font-size:.76rem!important;font-weight:750!important}.cf-stat-value{font-size:1.35rem!important;font-weight:850!important}
.cf-alert{border-radius:14px!important;padding:13px 15px!important;box-shadow:none!important}
.cf-form-card{padding:clamp(18px,3vw,26px)!important;border-radius:20px!important;border:1px solid #e2e8f0!important;background:#fff!important;box-shadow:0 8px 28px rgba(15,23,42,.045)!important;margin-bottom:26px!important;scroll-margin-top:20px!important}.cf-form-card.is-editing{border-color:#93c5fd!important;box-shadow:0 10px 32px rgba(37,99,235,.1)!important}
.cf-form-card input,.cf-form-card select,.cf-form-card textarea{border-radius:11px!important;border:1px solid #cbd5e1!important;transition:.18s!important}.cf-form-card input:focus,.cf-form-card select:focus,.cf-form-card textarea:focus{border-color:#60a5fa!important;box-shadow:0 0 0 4px rgba(37,99,235,.1)!important;outline:none!important}
.cf-form-card .btn{border-radius:10px!important;min-height:40px!important;font-weight:750!important}
.cf-cards-grid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(275px,1fr))!important;gap:14px!important}.cf-cards-grid>div{border-radius:19px!important;padding:18px!important;min-height:235px!important;box-shadow:0 5px 18px rgba(15,23,42,.035)!important;transition:transform .2s,box-shadow .2s,border-color .2s!important}.cf-cards-grid>div:hover{transform:translateY(-3px)!important;box-shadow:0 12px 28px rgba(15,23,42,.08)!important}
.cf-cards-grid h4{font-size:1.03rem!important;line-height:1.4!important}.cf-cards-grid button{border-radius:9px!important;transition:.18s!important}.cf-cards-grid button:hover:not(:disabled){transform:translateY(-1px)}
.cf-cards-grid [style*="borderTop"]{border-top:1px solid #f1f5f9!important}
@keyframes cfShimmer{from{background-position:200% 0}to{background-position:-200% 0}}
@media(max-width:950px){.cf-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
@media(max-width:560px){.cf-page-container{padding:12px!important}.cf-page-header{border-radius:18px!important}.cf-stats-grid{grid-template-columns:1fr!important}.cf-cards-grid{grid-template-columns:1fr!important}.cf-page-header .btn{width:100%!important}}
`;
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

  // 5. Create or Update Assignment
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
      deadline,
      priority,
    });

    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    const targetSubject = subjects.find((s) => s.id === selectedSubjectId);
    const subjectName = targetSubject ? targetSubject.name : "Subject";

    setSubmitting(true);

    try {
      if (editingId) {
        const docRef = doc(db, "assignments", editingId);
        await updateDoc(docRef, {
          title: validation.sanitized.title,
          subjectId: selectedSubjectId,
          subjectName: subjectName,
          description: description.trim(),
          deadline: validation.sanitized.deadline,
          dueDate: validation.sanitized.deadline,
          priority: validation.sanitized.priority,
          userId: currentUser.uid,
          updatedAt: serverTimestamp(),
        });

        setSuccess(`Assignment "${validation.sanitized.title}" updated.`);
        handleCancelEdit();
      } else {
        await addDoc(collection(db, "assignments"), {
          title: validation.sanitized.title,
          subjectId: selectedSubjectId,
          subjectName: subjectName,
          description: description.trim(),
          deadline: validation.sanitized.deadline,
          dueDate: validation.sanitized.deadline,
          priority: validation.sanitized.priority,
          status: "Pending",
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setSuccess(`Assignment "${validation.sanitized.title}" added.`);
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

  // 6. Toggle Assignment Completion Status
  const handleToggleStatus = async (assignment) => {
    setError("");
    setSuccess("");

    const newStatus = assignment.status === "Completed" ? "Pending" : "Completed";
    setUpdatingId(assignment.id);

    try {
      const docRef = doc(db, "assignments", assignment.id);
      await updateDoc(docRef, {
        status: newStatus,
        completedAt: newStatus === "Completed" ? serverTimestamp() : null,
        userId: currentUser.uid,
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
    <>
      <style>{assignmentUXStyles}</style>
      <div className="cf-page-container">
        {/* Top Banner Header */}
        <div className="cf-page-header">
          <div className="cf-page-header-info">
            <div className="cf-page-header-title">
              <div className="cf-page-header-icon">
                <ClipboardList size={20} />
              </div>
              <h1>Assignment Planner</h1>
            </div>
            <p>Track coursework, set submission priorities, and complete assignments before deadlines.</p>
          </div>
        </div>

        {/* Analytics Summary Cards */}
        <div className="cf-stats-grid">
          {/* Total Assignments */}
          <div className="cf-stat-card">
            <div className="cf-stat-icon-wrap" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", color: "#334155" }}>
              <FileText size={22} />
            </div>
            <div className="cf-stat-meta">
              <span className="cf-stat-label">Total Tasks</span>
              <div className="cf-stat-value">{metrics.total}</div>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="cf-stat-card">
            <div className="cf-stat-icon-wrap" style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb" }}>
              <Clock size={22} />
            </div>
            <div className="cf-stat-meta">
              <span className="cf-stat-label">Pending</span>
              <div className="cf-stat-value" style={{ color: "#2563eb" }}>{metrics.pending}</div>
            </div>
          </div>

          {/* Overdue Tasks */}
          <div className="cf-stat-card">
            <div className="cf-stat-icon-wrap" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
              <Flame size={22} />
            </div>
            <div className="cf-stat-meta">
              <span className="cf-stat-label">Overdue</span>
              <div className="cf-stat-value" style={{ color: metrics.overdue > 0 ? "#dc2626" : "#0f172a" }}>
                {metrics.overdue}
              </div>
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="cf-stat-card">
            <div className="cf-stat-icon-wrap" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }}>
              <CheckCircle size={22} />
            </div>
            <div className="cf-stat-meta">
              <span className="cf-stat-label">Completed</span>
              <div className="cf-stat-value" style={{ color: "#16a34a" }}>{metrics.completed}</div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="cf-alert cf-alert-error">
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="cf-alert cf-alert-success">
            <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* Form Container */}
        <div
          ref={formRef}
          className={`cf-form-card ${editingId ? "is-editing" : ""}`}
        >
          <div className="flex-between" style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
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
              <span className="badge badge-primary">
                Editing Mode
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
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
                    backgroundColor: "#ffffff",
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
                  Priority Level *
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
                  <option value="High">🔴 High Priority</option>
                  <option value="Medium">🟡 Medium Priority</option>
                  <option value="Low">🟢 Low Priority</option>
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
                Description & Notes (Optional)
              </label>
              <textarea
                rows={2}
                disabled={submitting}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add submission details, professor guidelines, or file links..."
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.95rem",
                  color: "#1e293b",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
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
                  className="btn btn-outline"
                >
                  <X size={16} />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Task List Section */}
        <div>
          <div
            className="flex-between"
            style={{
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1.25rem",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
                Active Tasks
              </h3>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Showing {filteredAssignments.length} of {assignments.length} assignments
              </span>
            </div>

            {/* Search & Filter Bar */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", width: "100%", maxWidth: "440px" }}>
              <div style={{ position: "relative", flex: 1, minWidth: "160px" }}>
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
                  placeholder="Search tasks..."
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
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Dynamic Card Grid */}
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
                padding: "3rem 1.5rem",
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
                  : "No assignments added yet"}
              </h4>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                {searchTerm || statusFilter !== "all"
                  ? "Try clearing your search query or adjusting status filters."
                  : "Add assignments and course projects using the form above."}
              </p>
            </div>
          ) : (
            <div className="cf-cards-grid">
              {filteredAssignments.map((assignment) => {
                const isCompleted = assignment.status === "Completed";
                const deadlineInfo = getDeadlineStatus(
                  assignment.deadline || assignment.dueDate,
                  assignment.status
                );
                const pStyle = getPriorityStyle(assignment.priority);
                const isDeleting = deletingId === assignment.id;
                const isUpdating = updatingId === assignment.id;
                const isBeingEdited = editingId === assignment.id;

                return (
                  <div
                    key={assignment.id}
                    style={{
                      backgroundColor: isCompleted ? "#f8fafc" : "#ffffff",
                      border: `1.5px solid ${isBeingEdited ? "#3b82f6" : "#e2e8f0"}`,
                      borderRadius: "14px",
                      padding: "1.25rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      opacity: isDeleting ? 0.6 : 1,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div>
                      {/* Header Row: Subject & Priority Chip */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "0.6rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "#2563eb",
                            backgroundColor: "#eff6ff",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            border: "1px solid #dbeafe",
                          }}
                        >
                          {assignment.subjectName || "Subject"}
                        </span>

                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: pStyle.color,
                            backgroundColor: pStyle.bg,
                            padding: "2px 7px",
                            borderRadius: "6px",
                            border: `1px solid ${pStyle.border}`,
                            textTransform: "uppercase",
                          }}
                        >
                          {assignment.priority || "Medium"}
                        </span>
                      </div>

                      {/* Assignment Title */}
                      <h4
                        style={{
                          margin: "0 0 0.5rem 0",
                          fontSize: "1.05rem",
                          fontWeight: 700,
                          color: isCompleted ? "#64748b" : "#0f172a",
                          textDecoration: isCompleted ? "line-through" : "none",
                          lineHeight: 1.35,
                          wordBreak: "break-word",
                        }}
                      >
                        {assignment.title}
                      </h4>

                      {/* Description (Optional) */}
                      {assignment.description && (
                        <p
                          style={{
                            margin: "0 0 0.75rem 0",
                            fontSize: "0.825rem",
                            color: "#64748b",
                            lineHeight: 1.45,
                            wordBreak: "break-word",
                          }}
                        >
                          {assignment.description}
                        </p>
                      )}

                      {/* Deadline Chip */}
                      <div style={{ marginBottom: "1rem" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: deadlineInfo.color,
                            backgroundColor: deadlineInfo.bgColor,
                            border: `1px solid ${deadlineInfo.borderColor}`,
                            padding: "3px 9px",
                            borderRadius: "9999px",
                          }}
                        >
                          {deadlineInfo.isOverdue ? (
                            <AlertTriangle size={13} />
                          ) : (
                            <Calendar size={13} />
                          )}
                          {deadlineInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: "0.75rem",
                        borderTop: "1px solid #f1f5f9",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Toggle Status Button */}
                      <button
                        onClick={() => handleToggleStatus(assignment)}
                        disabled={isUpdating || isDeleting}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "6px 12px",
                          backgroundColor: isCompleted ? "#f1f5f9" : "#eff6ff",
                          color: isCompleted ? "#475569" : "#2563eb",
                          border: `1px solid ${isCompleted ? "#cbd5e1" : "#bfdbfe"}`,
                          borderRadius: "8px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          cursor: isUpdating || isDeleting ? "not-allowed" : "pointer",
                        }}
                      >
                        <Check size={14} />
                        {isCompleted ? "Mark Pending" : "Mark Done"}
                      </button>

                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button
                          onClick={() => handleStartEdit(assignment)}
                          disabled={isUpdating || isDeleting}
                          className="btn btn-outline"
                          style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                          title="Edit Task"
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          onClick={() => handleDelete(assignment)}
                          disabled={isUpdating || isDeleting}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "6px 10px",
                            backgroundColor: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                            fontSize: "0.8rem",
                            cursor: isUpdating || isDeleting ? "not-allowed" : "pointer",
                          }}
                          title="Delete Task"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}