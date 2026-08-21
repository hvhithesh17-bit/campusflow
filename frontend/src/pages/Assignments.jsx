// src/pages/Assignments.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  collection, addDoc, query, where, onSnapshot,
  deleteDoc, updateDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { validateAssignment } from "../utils/validation";
import { formatFirebaseError } from "../utils/errorHandler";
import {
  ClipboardList, Calendar, CheckCircle2, Trash2, Check, Edit2, X,
  AlertTriangle, Search, Flame, ListChecks, Sparkles,
} from "lucide-react";

/* ===== CampusFlow Assignments UI/UX Upgrade ===== */
const assignmentUXStyles = `
.cf-page{max-width:1240px;margin:0 auto;padding:clamp(14px,3vw,32px);background:radial-gradient(circle at 90% -5%,rgba(37,99,235,.09),transparent 34%),#f8fafc;min-height:100%;font-family:"Plus Jakarta Sans",system-ui,-apple-system,sans-serif;color:#0f172a}
.cf-header{position:relative;overflow:hidden;padding:clamp(22px,4vw,34px);border:1px solid #e2e8f0;border-radius:24px;background:linear-gradient(135deg,#fff,#f8fbff 58%,#eff6ff);box-shadow:0 10px 35px rgba(15,23,42,.055);display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:24px}
.cf-header:after{content:"";position:absolute;right:-100px;top:-120px;width:240px;height:240px;border-radius:50%;background:rgba(37,99,235,.09);pointer-events:none}
.cf-header-main{position:relative;max-width:620px}
.cf-title-row{display:flex;align-items:center;gap:12px}
.cf-title-icon{width:44px;height:44px;border-radius:14px;background:#dbeafe;color:#2563eb;display:flex;align-items:center;justify-content:center}
.cf-header h1{margin:0;font-size:clamp(1.6rem,3vw,2.15rem);letter-spacing:-.035em;font-weight:800}
.cf-header p{margin:12px 0 0;max-width:620px;line-height:1.65;color:#64748b}
.cf-progress-box{position:relative;width:100%;max-width:290px}
.cf-progress-row{display:flex;justify-content:space-between;font-size:.85rem;font-weight:700}
.cf-progress-row span:first-child{color:#64748b}
.cf-track{margin-top:8px;height:10px;border-radius:999px;background:#e2e8f0;overflow:hidden}
.cf-bar{height:100%;border-radius:999px;background:linear-gradient(90deg,#2563eb,#38bdf8);transition:width .5s ease}
.cf-progress-hint{margin:8px 0 0;font-size:.76rem;color:#64748b}
.cf-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:18px}
.cf-stat{display:flex;align-items:center;gap:14px;padding:18px;border-radius:18px;border:1px solid #e2e8f0;background:#fff;box-shadow:0 5px 20px rgba(15,23,42,.035);transition:transform .2s,box-shadow .2s}
.cf-stat:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(15,23,42,.08)}
.cf-stat-ico{width:46px;height:46px;flex:none;border-radius:14px;display:flex;align-items:center;justify-content:center;border:1px solid}
.cf-stat-label{margin:0;font-size:.72rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#64748b}
.cf-stat-value{margin:2px 0 0;font-size:1.5rem;font-weight:850;letter-spacing:-.03em}
.cf-alert{display:flex;align-items:center;gap:8px;margin-top:18px;border-radius:14px;padding:13px 15px;font-size:.9rem;font-weight:600;border:1px solid}
.cf-card{margin-top:18px;padding:clamp(18px,3vw,26px);border-radius:20px;border:1px solid #e2e8f0;background:#fff;box-shadow:0 8px 28px rgba(15,23,42,.045);scroll-margin-top:20px;transition:border-color .2s,box-shadow .2s}
.cf-card.is-editing{border-color:#93c5fd;box-shadow:0 10px 32px rgba(37,99,235,.12)}
.cf-card-head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px}
.cf-card-head h2{margin:0;display:flex;align-items:center;gap:8px;font-size:1.1rem;font-weight:800;letter-spacing:-.02em}
.cf-chip-edit{font-size:.72rem;font-weight:800;padding:4px 10px;border-radius:999px;background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe}
.cf-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.cf-field{display:flex;flex-direction:column;gap:6px}
.cf-field label{font-size:.82rem;font-weight:700;color:#334155}
.cf-input{width:100%;padding:.6rem .85rem;border-radius:11px;border:1px solid #cbd5e1;font-size:.92rem;color:#1e293b;background:#fff;box-sizing:border-box;font-family:inherit;transition:.18s;outline:none}
.cf-input:focus{border-color:#60a5fa;box-shadow:0 0 0 4px rgba(37,99,235,.1)}
.cf-prio{display:flex;gap:8px}
.cf-prio button{flex:1;padding:.6rem 0;border-radius:11px;border:1px solid #cbd5e1;background:#fff;color:#64748b;font-weight:750;font-size:.85rem;cursor:pointer;transition:.18s;font-family:inherit}
.cf-prio button:hover{background:#f8fafc}
.cf-prio button[data-on="1"][data-p="High"]{background:#fef2f2;border-color:#fecaca;color:#dc2626}
.cf-prio button[data-on="1"][data-p="Medium"]{background:#fffbeb;border-color:#fde68a;color:#d97706}
.cf-prio button[data-on="1"][data-p="Low"]{background:#f0fdf4;border-color:#bbf7d0;color:#16a34a}
.cf-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
.cf-btn{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:0 16px;border-radius:11px;font-weight:750;font-size:.88rem;cursor:pointer;border:1px solid transparent;transition:.18s;font-family:inherit}
.cf-btn:disabled{opacity:.6;cursor:not-allowed}
.cf-btn-primary{background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;box-shadow:0 6px 16px rgba(37,99,235,.28)}
.cf-btn-primary:hover:not(:disabled){transform:translateY(-1px)}
.cf-btn-ghost{background:#fff;border-color:#cbd5e1;color:#334155}
.cf-list-head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:14px;margin:30px 0 16px}
.cf-list-head h3{margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-.02em}
.cf-list-head p{margin:2px 0 0;font-size:.85rem;color:#64748b}
.cf-tools{display:flex;gap:10px;flex-wrap:wrap;align-items:center;width:100%;max-width:520px}
.cf-search{position:relative;flex:1;min-width:180px}
.cf-search svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#94a3b8}
.cf-search .cf-input{padding-left:34px}
.cf-pills{display:flex;gap:4px;padding:4px;border-radius:12px;border:1px solid #e2e8f0;background:#fff}
.cf-pills button{border:none;background:transparent;padding:7px 12px;border-radius:9px;font-size:.78rem;font-weight:750;color:#64748b;cursor:pointer;transition:.18s;font-family:inherit}
.cf-pills button:hover{background:#f1f5f9}
.cf-pills button[data-on="1"]{background:#2563eb;color:#fff}
.cf-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
.cf-task{display:flex;flex-direction:column;justify-content:space-between;border-radius:19px;border:1.5px solid #e2e8f0;background:#fff;padding:18px;min-height:230px;box-shadow:0 5px 18px rgba(15,23,42,.035);transition:transform .2s,box-shadow .2s,border-color .2s}
.cf-task:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(15,23,42,.09)}
.cf-task.is-done{background:#f8fafc}
.cf-task.is-editing{border-color:#3b82f6;box-shadow:0 0 0 4px rgba(37,99,235,.12)}
.cf-task-top{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.cf-tag{font-size:.72rem;font-weight:800;padding:3px 9px;border-radius:8px;border:1px solid}
.cf-tag-subject{color:#2563eb;background:#eff6ff;border-color:#dbeafe}
.cf-task h4{margin:12px 0 0;font-size:1.02rem;font-weight:800;line-height:1.4;letter-spacing:-.015em;word-break:break-word}
.cf-task.is-done h4{color:#64748b;text-decoration:line-through}
.cf-task p{margin:8px 0 0;font-size:.83rem;color:#64748b;line-height:1.5;word-break:break-word;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.cf-deadline{display:inline-flex;align-items:center;gap:6px;margin-top:12px;font-size:.75rem;font-weight:700;padding:4px 10px;border-radius:999px;border:1px solid}
.cf-task-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:18px;padding-top:14px;border-top:1px solid #f1f5f9}
.cf-mini{display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:10px;font-size:.79rem;font-weight:750;cursor:pointer;border:1px solid;transition:.18s;font-family:inherit}
.cf-mini:hover:not(:disabled){transform:translateY(-1px)}
.cf-mini:disabled{opacity:.55;cursor:not-allowed}
.cf-mini-todo{background:#eff6ff;color:#2563eb;border-color:#bfdbfe}
.cf-mini-done{background:#f1f5f9;color:#475569;border-color:#cbd5e1}
.cf-mini-edit{background:#fff;color:#334155;border-color:#cbd5e1;padding:7px 10px}
.cf-mini-del{background:#fef2f2;color:#dc2626;border-color:#fecaca;padding:7px 10px}
.cf-empty{border:1px dashed #cbd5e1;border-radius:20px;background:#fff;padding:56px 24px;text-align:center}
.cf-empty-ico{width:52px;height:52px;margin:0 auto 14px;border-radius:50%;background:#f1f5f9;color:#94a3b8;display:flex;align-items:center;justify-content:center}
.cf-empty h4{margin:0 0 6px;font-size:1.05rem;font-weight:800}
.cf-empty p{margin:0;color:#64748b;font-size:.9rem}
.cf-skeleton{height:230px;border-radius:19px;border:1px solid #e2e8f0;background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 37%,#f1f5f9 63%);background-size:400% 100%;animation:cfShimmer 1.3s ease-in-out infinite}
@keyframes cfShimmer{from{background-position:200% 0}to{background-position:-200% 0}}
@media(max-width:950px){.cf-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:640px){.cf-grid-2{grid-template-columns:1fr}.cf-page{padding:12px}.cf-header{border-radius:18px}.cf-stats{grid-template-columns:1fr}.cf-cards{grid-template-columns:1fr}.cf-actions .cf-btn{width:100%;justify-content:center}}
`;

/* ========= Helpers ========= */
function getDeadlineStatus(deadlineStr, status) {
  if (status === "Completed")
    return { label: "Completed", color: "#16a34a", bgColor: "#f0fdf4", borderColor: "#bbf7d0", isOverdue: false };
  if (!deadlineStr)
    return { label: "No deadline", color: "#64748b", bgColor: "#f1f5f9", borderColor: "#cbd5e1", isOverdue: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = deadlineStr.split("-").map(Number);
  const due = new Date(y, m - 1, d);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);

  if (diff < 0) {
    const late = Math.abs(diff);
    return { label: `Overdue by ${late} ${late === 1 ? "day" : "days"}`, color: "#dc2626", bgColor: "#fef2f2", borderColor: "#fecaca", isOverdue: true };
  }
  if (diff === 0) return { label: "Due today", color: "#d97706", bgColor: "#fffbeb", borderColor: "#fde68a", isOverdue: false };
  if (diff === 1) return { label: "Due tomorrow", color: "#d97706", bgColor: "#fffbeb", borderColor: "#fde68a", isOverdue: false };
  return { label: `Due in ${diff} days`, color: "#2563eb", bgColor: "#eff6ff", borderColor: "#bfdbfe", isOverdue: false };
}

const PRIORITY_RANK = { High: 1, Medium: 2, Low: 3 };

function sortAssignments(items) {
  return [...items].sort((a, b) => {
    const ac = a.status === "Completed", bc = b.status === "Completed";
    if (ac !== bc) return ac ? 1 : -1;
    const pa = PRIORITY_RANK[a.priority] || 2, pb = PRIORITY_RANK[b.priority] || 2;
    if (pa !== pb) return pa - pb;
    const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
    const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
    return da - db;
  });
}

const PRIORITY_STYLE = {
  High: { color: "#dc2626", background: "#fef2f2", borderColor: "#fecaca" },
  Medium: { color: "#d97706", background: "#fffbeb", borderColor: "#fde68a" },
  Low: { color: "#16a34a", background: "#f0fdf4", borderColor: "#bbf7d0" },
};

const STAT_TONES = {
  info: { color: "#2563eb", background: "#eff6ff", borderColor: "#bfdbfe" },
  warn: { color: "#d97706", background: "#fffbeb", borderColor: "#fde68a" },
  danger: { color: "#dc2626", background: "#fef2f2", borderColor: "#fecaca" },
  success: { color: "#16a34a", background: "#f0fdf4", borderColor: "#bbf7d0" },
};

function StatCard({ icon, label, value, tone }) {
  return (
    <div className="cf-stat">
      <div className="cf-stat-ico" style={STAT_TONES[tone]}>{icon}</div>
      <div>
        <p className="cf-stat-label">{label}</p>
        <p className="cf-stat-value" style={tone === "danger" && value > 0 ? { color: "#dc2626" } : undefined}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ========= Component ========= */
export default function Assignments() {
  const { currentUser } = useAuth();
  const formRef = useRef(null);

  const [title, setTitle] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("Medium");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);

  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "subjects"), where("userId", "==", currentUser.uid));
    return onSnapshot(
      q,
      (snap) => setSubjects(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => setError(formatFirebaseError(err))
    );
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    const q = query(collection(db, "assignments"), where("userId", "==", currentUser.uid));
    return onSnapshot(
      q,
      (snap) => {
        setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(formatFirebaseError(err));
        setLoading(false);
      }
    );
  }, [currentUser]);

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setSelectedSubjectId("");
    setDescription("");
    setDeadline("");
    setPriority("Medium");
    setError("");
  };

  const handleStartEdit = (item) => {
    setError("");
    setSuccess("");
    setEditingId(item.id);
    setTitle(item.title || "");
    setSelectedSubjectId(item.subjectId || "");
    setDescription(item.description || "");
    setDeadline(item.deadline || item.dueDate || "");
    setPriority(item.priority || "Medium");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!currentUser) return setError("You must be logged in to manage assignments.");

    const validation = validateAssignment({ title, subjectId: selectedSubjectId, deadline, priority });
    if (!validation.isValid) return setError(validation.error);

    const subjectName = subjects.find((s) => s.id === selectedSubjectId)?.name || "Subject";
    setSubmitting(true);
    try {
      const payload = {
        title: validation.sanitized.title,
        subjectId: selectedSubjectId,
        subjectName,
        description: description.trim(),
        deadline: validation.sanitized.deadline,
        dueDate: validation.sanitized.deadline,
        priority: validation.sanitized.priority,
        userId: currentUser.uid,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "assignments", editingId), payload);
        setSuccess(`Assignment "${validation.sanitized.title}" updated.`);
        handleCancelEdit();
      } else {
        await addDoc(collection(db, "assignments"), {
          ...payload,
          status: "Pending",
          createdAt: serverTimestamp(),
        });
        setSuccess(`Assignment "${validation.sanitized.title}" added.`);
        handleCancelEdit();
      }
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (assignment) => {
    setError("");
    setSuccess("");
    const newStatus = assignment.status === "Completed" ? "Pending" : "Completed";
    setUpdatingId(assignment.id);
    try {
      await updateDoc(doc(db, "assignments", assignment.id), {
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

  const handleDelete = async (assignment) => {
    setError("");
    setSuccess("");
    if (!currentUser || assignment.userId !== currentUser.uid)
      return setError("Unauthorized: You can only delete your own assignments.");
    if (!window.confirm(`Are you sure you want to delete "${assignment.title}"?`)) return;

    setDeletingId(assignment.id);
    try {
      await deleteDoc(doc(db, "assignments", assignment.id));
      if (editingId === assignment.id) handleCancelEdit();
      setSuccess(`Assignment "${assignment.title}" was deleted.`);
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const metrics = useMemo(() => {
    const pending = assignments.filter((a) => a.status !== "Completed").length;
    const completed = assignments.filter((a) => a.status === "Completed").length;
    const overdue = assignments.filter(
      (a) => a.status !== "Completed" && getDeadlineStatus(a.deadline || a.dueDate, a.status).isOverdue
    ).length;
    return { total: assignments.length, pending, completed, overdue };
  }, [assignments]);

  const progress = metrics.total ? Math.round((metrics.completed / metrics.total) * 100) : 0;

  const filteredAssignments = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return sortAssignments(assignments).filter((item) => {
      const matchesSearch =
        item.title?.toLowerCase().includes(term) || item.subjectName?.toLowerCase().includes(term);
      const info = getDeadlineStatus(item.deadline || item.dueDate, item.status);
      const matchesStatus =
        statusFilter === "all" ? true
        : statusFilter === "pending" ? item.status !== "Completed"
        : statusFilter === "completed" ? item.status === "Completed"
        : info.isOverdue && item.status !== "Completed";
      return matchesSearch && matchesStatus;
    });
  }, [assignments, searchTerm, statusFilter]);

  return (
    <>
      <style>{assignmentUXStyles}</style>

      <div className="cf-page">
        {/* Header */}
        <header className="cf-header">
          <div className="cf-header-main">
            <div className="cf-title-row">
              <span className="cf-title-icon"><ClipboardList size={22} /></span>
              <h1>Assignment Planner</h1>
            </div>
            <p>Track coursework, set submission priorities and clear every deadline before it turns red.</p>
          </div>
          <div className="cf-progress-box">
            <div className="cf-progress-row">
              <span>Term progress</span>
              <span>{progress}%</span>
            </div>
            <div className="cf-track"><div className="cf-bar" style={{ width: `${progress}%` }} /></div>
            <p className="cf-progress-hint">{metrics.completed} of {metrics.total} assignments submitted</p>
          </div>
        </header>

        {/* Stats */}
        <section className="cf-stats">
          <StatCard icon={<ListChecks size={20} />} label="Total tasks" value={metrics.total} tone="info" />
          <StatCard icon={<Calendar size={20} />} label="Pending" value={metrics.pending} tone="warn" />
          <StatCard icon={<Flame size={20} />} label="Overdue" value={metrics.overdue} tone="danger" />
          <StatCard icon={<CheckCircle2 size={20} />} label="Completed" value={metrics.completed} tone="success" />
        </section>

        {/* Alerts */}
        {error && (
          <div className="cf-alert" style={{ color: "#dc2626", background: "#fef2f2", borderColor: "#fecaca" }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="cf-alert" style={{ color: "#16a34a", background: "#f0fdf4", borderColor: "#bbf7d0" }}>
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        {/* Form */}
        <section ref={formRef} className={`cf-card${editingId ? " is-editing" : ""}`}>
          <div className="cf-card-head">
            <h2>
              {editingId ? <Edit2 size={18} /> : <Sparkles size={18} />}
              {editingId ? "Edit assignment" : "Add new assignment"}
            </h2>
            {editingId && <span className="cf-chip-edit">Editing mode</span>}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="cf-grid-2">
              <div className="cf-field">
                <label htmlFor="cf-title">Assignment title *</label>
                <input
                  id="cf-title" className="cf-input" type="text" value={title}
                  disabled={submitting} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Data Structures lab report"
                />
              </div>

              <div className="cf-field">
                <label htmlFor="cf-subject">Subject *</label>
                <select
                  id="cf-subject" className="cf-input" value={selectedSubjectId}
                  disabled={submitting} onChange={(e) => setSelectedSubjectId(e.target.value)}
                >
                  <option value="">-- Select subject --</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div className="cf-field">
                <label htmlFor="cf-deadline">Deadline date *</label>
                <input
                  id="cf-deadline" className="cf-input" type="date" value={deadline}
                  disabled={submitting} onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="cf-field">
                <label>Priority level *</label>
                <div className="cf-prio">
                  {["High", "Medium", "Low"].map((p) => (
                    <button
                      key={p} type="button" data-p={p} data-on={priority === p ? "1" : "0"}
                      disabled={submitting} onClick={() => setPriority(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="cf-field" style={{ marginTop: 16 }}>
              <label htmlFor="cf-desc">Description &amp; notes (optional)</label>
              <textarea
                id="cf-desc" className="cf-input" rows={3} value={description}
                disabled={submitting} onChange={(e) => setDescription(e.target.value)}
                placeholder="Add submission details, professor guidelines, or file links..."
                style={{ resize: "vertical" }}
              />
            </div>

            <div className="cf-actions">
              <button type="submit" className="cf-btn cf-btn-primary" disabled={submitting}>
                <Sparkles size={16} />
                {submitting ? "Saving..." : editingId ? "Update assignment" : "Add assignment"}
              </button>
              {editingId && (
                <button type="button" className="cf-btn cf-btn-ghost" disabled={submitting} onClick={handleCancelEdit}>
                  <X size={16} /> Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* List header + tools */}
        <div className="cf-list-head">
          <div>
            <h3>Active tasks</h3>
            <p>Showing {filteredAssignments.length} of {assignments.length} assignments</p>
          </div>
          <div className="cf-tools">
            <div className="cf-search">
              <Search size={16} />
              <input
                className="cf-input" type="text" value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks or subjects..." aria-label="Search assignments"
              />
            </div>
            <div className="cf-pills">
              {[
                { key: "all", label: "All" },
                { key: "pending", label: "Pending" },
                { key: "overdue", label: "Overdue" },
                { key: "completed", label: "Completed" },
              ].map((f) => (
                <button
                  key={f.key} type="button" data-on={statusFilter === f.key ? "1" : "0"}
                  onClick={() => setStatusFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="cf-cards">
            {[0, 1, 2].map((i) => <div key={i} className="cf-skeleton" />)}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="cf-empty">
            <div className="cf-empty-ico"><ClipboardList size={24} /></div>
            <h4>{searchTerm || statusFilter !== "all" ? "No matching assignments" : "No assignments yet"}</h4>
            <p>
              {searchTerm || statusFilter !== "all"
                ? "Try clearing your search or switching the filter."
                : "Add coursework and projects using the form above."}
            </p>
          </div>
        ) : (
          <div className="cf-cards">
            {filteredAssignments.map((assignment) => {
              const isCompleted = assignment.status === "Completed";
              const info = getDeadlineStatus(assignment.deadline || assignment.dueDate, assignment.status);
              const pStyle = PRIORITY_STYLE[assignment.priority] || PRIORITY_STYLE.Medium;
              const isDeleting = deletingId === assignment.id;
              const isUpdating = updatingId === assignment.id;
              const busy = isDeleting || isUpdating;

              return (
                <article
                  key={assignment.id}
                  className={`cf-task${isCompleted ? " is-done" : ""}${editingId === assignment.id ? " is-editing" : ""}`}
                  style={{ opacity: isDeleting ? 0.6 : 1 }}
                >
                  <div>
                    <div className="cf-task-top">
                      <span className="cf-tag cf-tag-subject">{assignment.subjectName || "Subject"}</span>
                      <span className="cf-tag" style={{ ...pStyle, textTransform: "uppercase", fontSize: ".68rem" }}>
                        {assignment.priority || "Medium"}
                      </span>
                    </div>

                    <h4>{assignment.title}</h4>
                    {assignment.description && <p>{assignment.description}</p>}

                    <span
                      className="cf-deadline"
                      style={{ color: info.color, background: info.bgColor, borderColor: info.borderColor }}
                    >
                      {info.isOverdue ? <AlertTriangle size={13} /> : <Calendar size={13} />}
                      {info.label}
                    </span>
                  </div>

                  <div className="cf-task-foot">
                    <button
                      className={`cf-mini ${isCompleted ? "cf-mini-done" : "cf-mini-todo"}`}
                      disabled={busy} onClick={() => handleToggleStatus(assignment)}
                    >
                      <Check size={14} />
                      {isUpdating ? "Saving..." : isCompleted ? "Mark pending" : "Mark done"}
                    </button>

                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="cf-mini cf-mini-edit" disabled={busy}
                        onClick={() => handleStartEdit(assignment)} title="Edit task"
                        aria-label={`Edit ${assignment.title}`}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="cf-mini cf-mini-del" disabled={busy}
                        onClick={() => handleDelete(assignment)} title="Delete task"
                        aria-label={`Delete ${assignment.title}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
