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
  X,
  Target,
  BookOpen,
  ChevronRight,
} from "lucide-react";

const uiStyles = `
  .attendance-page {
    --primary:#2563eb;
    --primary-dark:#1d4ed8;
    --primary-soft:#eff6ff;
    --text:#0f172a;
    --muted:#64748b;
    --border:#e2e8f0;
    --surface:#fff;
    min-height:100%;
    padding:clamp(12px,3vw,32px);
    background:
      radial-gradient(circle at 90% 0%,rgba(37,99,235,.08),transparent 28%),
      #f8fafc;
    color:var(--text);
  }

  .attendance-shell{max-width:1280px;margin:auto}

  .attendance-hero{
    position:relative;overflow:hidden;display:flex;justify-content:space-between;
    align-items:center;gap:24px;margin-bottom:18px;padding:clamp(22px,4vw,34px);
    border:1px solid #dbeafe;border-radius:24px;
    background:linear-gradient(135deg,#fff,#f8fbff 58%,#eff6ff);
    box-shadow:0 10px 35px rgba(15,23,42,.055)
  }
  .attendance-hero:after{
    content:"";position:absolute;width:230px;height:230px;right:-100px;top:-120px;
    border-radius:50%;background:rgba(37,99,235,.08)
  }
  .hero-copy{position:relative;z-index:1}
  .eyebrow{
    display:inline-flex;align-items:center;gap:7px;padding:6px 10px;margin-bottom:10px;
    border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:11px;
    font-weight:800;letter-spacing:.05em;text-transform:uppercase
  }
  .hero-title{margin:0;font-size:clamp(1.55rem,3vw,2.2rem);letter-spacing:-.035em}
  .hero-description{max-width:680px;margin:9px 0 0;color:var(--muted);font-size:.92rem;line-height:1.65}

  .stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:18px}
  .stat-card{
    display:flex;align-items:center;gap:14px;padding:18px;border:1px solid var(--border);
    border-radius:18px;background:#fff;box-shadow:0 5px 20px rgba(15,23,42,.035)
  }
  .stat-icon{display:grid;place-items:center;width:46px;height:46px;flex:0 0 46px;border-radius:14px}
  .stat-label{display:block;margin-bottom:3px;color:var(--muted);font-size:.76rem;font-weight:750}
  .stat-value{font-size:1.35rem;font-weight:850;letter-spacing:-.025em}

  .notice{
    display:flex;align-items:flex-start;gap:10px;margin-bottom:14px;padding:13px 15px;
    border-radius:14px;font-size:.86rem;line-height:1.5
  }
  .notice-error{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
  .notice-success{background:#f0fdf4;color:#166534;border:1px solid #bbf7d0}

  .panel{
    margin-bottom:26px;padding:clamp(18px,3vw,26px);border:1px solid var(--border);
    border-radius:20px;background:#fff;box-shadow:0 8px 28px rgba(15,23,42,.045)
  }
  .panel-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}
  .panel-title{display:flex;align-items:center;gap:9px;margin:0;font-size:1rem;font-weight:800}
  .panel-subtitle{margin:4px 0 0;color:var(--muted);font-size:.78rem}

  .form-grid{
    display:grid;grid-template-columns:minmax(0,1.5fr) minmax(150px,.7fr) minmax(150px,.7fr);
    gap:14px
  }
  .field-label{display:block;margin-bottom:7px;color:#334155;font-size:.79rem;font-weight:750}
  .field{
    width:100%;height:45px;box-sizing:border-box;padding:0 12px;border:1px solid #cbd5e1;
    border-radius:11px;background:#fff;color:#0f172a;font:inherit;font-size:.87rem;
    outline:none;transition:.18s
  }
  .field:focus,.search-input:focus,.filter-select:focus{
    border-color:#60a5fa;box-shadow:0 0 0 4px rgba(37,99,235,.1)
  }
  .field:disabled{background:#f8fafc;cursor:not-allowed}

  .primary-btn,.secondary-btn,.danger-btn,.attendance-btn,.undo-btn{
    display:inline-flex;align-items:center;justify-content:center;gap:7px;
    border-radius:10px;font:inherit;font-size:.79rem;font-weight:750;cursor:pointer;
    transition:transform .18s,background .18s,border-color .18s,box-shadow .18s
  }
  .primary-btn{
    min-height:43px;padding:0 15px;border:0;background:var(--primary);color:#fff;
    box-shadow:0 7px 18px rgba(37,99,235,.2)
  }
  .primary-btn:hover{background:var(--primary-dark);transform:translateY(-1px)}
  .secondary-btn{
    min-height:40px;padding:0 13px;border:1px solid #cbd5e1;background:#fff;color:#334155
  }
  .secondary-btn:hover{background:#f8fafc}
  .form-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:17px}

  .section-head{
    display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:14px
  }
  .section-title{margin:0;font-size:1.18rem;letter-spacing:-.02em}
  .section-subtitle{display:block;margin-top:4px;color:var(--muted);font-size:.79rem}
  .toolbar{display:flex;gap:8px;width:min(100%,470px)}
  .search-box{position:relative;flex:1;min-width:150px}
  .search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#94a3b8}
  .search-input{
    width:100%;height:40px;box-sizing:border-box;padding:0 12px 0 34px;
    border:1px solid #cbd5e1;border-radius:10px;background:#fff;outline:none;font-size:.81rem
  }
  .filter-select{
    width:165px;height:40px;padding:0 10px;border:1px solid #cbd5e1;border-radius:10px;
    background:#fff;color:#334155;font-size:.81rem;outline:none
  }

  .attendance-grid{
    display:grid;grid-template-columns:repeat(auto-fill,minmax(275px,1fr));gap:14px
  }
  .attendance-card{
    position:relative;display:flex;flex-direction:column;min-height:275px;padding:18px;
    border:1px solid var(--border);border-radius:19px;background:#fff;
    box-shadow:0 5px 18px rgba(15,23,42,.035);
    transition:transform .2s,box-shadow .2s,border-color .2s
  }
  .attendance-card:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(15,23,42,.08)}
  .card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
  .subject-icon{display:grid;place-items:center;width:39px;height:39px;border-radius:12px;background:#eff6ff;color:#2563eb}
  .delete-icon{
    display:grid;place-items:center;width:32px;height:32px;border:1px solid transparent;
    border-radius:9px;background:transparent;color:#94a3b8;cursor:pointer
  }
  .delete-icon:hover{background:#fef2f2;color:#dc2626;border-color:#fecaca}
  .subject-name{margin:13px 0 5px;font-size:1.02rem;line-height:1.35;font-weight:820;word-break:break-word}
  .class-count{color:var(--muted);font-size:.78rem}
  .metric-row{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin:17px 0 10px}
  .percentage{font-size:2rem;font-weight:900;line-height:1;letter-spacing:-.05em}
  .status-pill{
    display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border-radius:999px;
    font-size:.7rem;font-weight:800;white-space:nowrap
  }
  .progress-track{height:8px;overflow:hidden;border-radius:999px;background:#f1f5f9}
  .progress-fill{height:100%;border-radius:999px;transition:width .35s ease}
  .goal{
    min-height:38px;margin:12px 0 14px;color:#64748b;font-size:.76rem;line-height:1.45;font-weight:650
  }
  .goal strong{color:#0f172a}
  .action-row{
    display:grid;grid-template-columns:1fr 1fr 40px;gap:7px;margin-top:auto;
    padding-top:14px;border-top:1px solid #f1f5f9
  }
  .attendance-btn{min-height:38px;padding:0 8px}
  .present{border:1px solid #86efac;background:#dcfce7;color:#15803d}
  .present:hover{background:#bbf7d0}
  .absent{border:1px solid #fca5a5;background:#fee2e2;color:#b91c1c}
  .absent:hover{background:#fecaca}
  .undo-btn{min-height:38px;border:1px solid #e2e8f0;background:#f8fafc;color:#64748b}
  .undo-btn:hover:not(:disabled){background:#f1f5f9}
  .undo-btn:disabled,.attendance-btn:disabled,.delete-icon:disabled{opacity:.5;cursor:not-allowed}

  .empty-state{
    display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:250px;
    padding:30px;text-align:center;border:1px dashed #cbd5e1;border-radius:20px;background:#fff
  }
  .empty-icon{display:grid;place-items:center;width:58px;height:58px;margin-bottom:14px;border-radius:17px;background:#eff6ff;color:#3b82f6}
  .empty-title{margin:0 0 6px;font-size:1rem}
  .empty-text{max-width:430px;margin:0;color:var(--muted);font-size:.83rem;line-height:1.55}

  .skeleton-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(275px,1fr));gap:14px}
  .skeleton{
    height:275px;border-radius:19px;
    background:linear-gradient(90deg,#eef2f7 25%,#f8fafc 50%,#eef2f7 75%);
    background-size:200% 100%;animation:shimmer 1.3s infinite
  }
  @keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}

  .modal-backdrop{
    position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:18px;
    background:rgba(15,23,42,.48);backdrop-filter:blur(5px)
  }
  .modal{
    width:min(100%,430px);padding:24px;border-radius:20px;background:#fff;
    box-shadow:0 25px 70px rgba(15,23,42,.25);animation:modalIn .18s ease-out
  }
  @keyframes modalIn{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
  .modal-icon{display:grid;place-items:center;width:46px;height:46px;margin-bottom:14px;border-radius:14px;background:#fef2f2;color:#dc2626}
  .modal-title{margin:0 0 7px;font-size:1.1rem}
  .modal-text{margin:0;color:#64748b;font-size:.85rem;line-height:1.55}
  .modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:22px}
  .danger-btn{min-height:40px;padding:0 13px;border:1px solid #fecaca;background:#fff5f5;color:#dc2626}
  .danger-btn:hover{background:#fee2e2}

  @media(max-width:850px){
    .attendance-hero{align-items:flex-start;flex-direction:column}
    .stats-grid{grid-template-columns:1fr}
    .form-grid{grid-template-columns:1fr 1fr}
    .form-grid>div:first-child{grid-column:1/-1}
    .section-head{align-items:stretch;flex-direction:column}
    .toolbar{width:100%}
  }
  @media(max-width:540px){
    .attendance-page{padding:12px}
    .attendance-hero{border-radius:18px}
    .form-grid{grid-template-columns:1fr}
    .form-grid>div:first-child{grid-column:auto}
    .toolbar{flex-direction:column}
    .search-box,.filter-select{width:100%}
    .filter-select{width:100%}
    .attendance-grid{grid-template-columns:1fr}
    .action-row{grid-template-columns:1fr 1fr 42px}
    .modal-actions{flex-direction:column-reverse}
    .modal-actions button{width:100%}
  }
`;

export default function Attendance() {
  const { currentUser } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [totalClasses, setTotalClasses] = useState("");
  const [attendedClasses, setAttendedClasses] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setSubjects([]);
      return;
    }

    const subjectsQuery = query(
      collection(db, "subjects"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      subjectsQuery,
      (snapshot) => {
        const fetched = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        setSubjects(fetched);
      },
      (err) => setError(formatFirebaseError(err))
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setAttendanceList([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const attendanceQuery = query(
      collection(db, "attendance"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
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

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!error && !success) return;

    const timer = setTimeout(() => {
      setError("");
      setSuccess("");
    }, 4500);

    return () => clearTimeout(timer);
  }, [error, success]);

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

    const alreadyTracked = attendanceList.some(
      (record) => record.subjectId === selectedSubjectId
    );

    if (alreadyTracked) {
      setError(
        "This subject is already being tracked. Use the Present or Absent buttons below."
      );
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

    const {
      attendedClasses: attended,
      totalClasses: total,
    } = validation.sanitized;

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
        subjectName,
        totalClasses: total,
        attendedClasses: attended,
        percentage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess(`Attendance tracking started for "${subjectName}".`);
      setSelectedSubjectId("");
      setTotalClasses("");
      setAttendedClasses("");
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const updateAttendance = async (record, attended, total) => {
    const validation = validateAttendance({
      attendedClasses: attended,
      totalClasses: total,
    });

    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    const newPercentage = calculateAttendancePercentage(attended, total);
    setUpdatingId(record.id);
    setError("");

    try {
      await updateDoc(doc(db, "attendance", record.id), {
        attendedClasses: attended,
        totalClasses: total,
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

  const handleMarkPresent = async (record) => {
    const attended = (Number(record.attendedClasses) || 0) + 1;
    const total = (Number(record.totalClasses) || 0) + 1;
    await updateAttendance(record, attended, total);
  };

  const handleMarkAbsent = async (record) => {
    const attended = Number(record.attendedClasses) || 0;
    const total = (Number(record.totalClasses) || 0) + 1;
    await updateAttendance(record, attended, total);
  };

  const handleUndo = async (record) => {
    const currentTotal = Number(record.totalClasses) || 0;
    const currentAttended = Number(record.attendedClasses) || 0;

    if (currentTotal <= 1) {
      setError("Cannot undo the initial attendance state.");
      return;
    }

    const newTotal = currentTotal - 1;
    const newAttended = Math.min(currentAttended, newTotal);

    await updateAttendance(record, newAttended, newTotal);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !currentUser) return;

    const record = deleteTarget;

    if (record.userId !== currentUser.uid) {
      setError(
        "Unauthorized action: You can only delete your own attendance records."
      );
      setDeleteTarget(null);
      return;
    }

    setDeletingId(record.id);

    try {
      await deleteDoc(doc(db, "attendance", record.id));
      setSuccess(`Attendance record for "${record.subjectName}" deleted.`);
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const metrics = useMemo(() => {
    if (!attendanceList.length) {
      return { average: 0, onTrack: 0, atRisk: 0 };
    }

    const totalPercentage = attendanceList.reduce(
      (sum, record) => sum + (Number(record.percentage) || 0),
      0
    );
    const onTrack = attendanceList.filter(
      (record) => Number(record.percentage) >= 75
    ).length;

    return {
      average: Math.round(totalPercentage / attendanceList.length),
      onTrack,
      atRisk: attendanceList.length - onTrack,
    };
  }, [attendanceList]);

  const filteredAttendance = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return attendanceList.filter((record) => {
      const matchesSearch = (record.subjectName || "")
        .toLowerCase()
        .includes(search);

      const pct = Number(record.percentage) || 0;
      let matchesFilter = true;

      if (statusFilter === "critical") matchesFilter = pct < 65;
      else if (statusFilter === "warning")
        matchesFilter = pct >= 65 && pct < 75;
      else if (statusFilter === "good") matchesFilter = pct >= 75;

      return matchesSearch && matchesFilter;
    });
  }, [attendanceList, searchTerm, statusFilter]);

  const renderStatusIcon = (variant) => {
    if (variant === "success") return <CheckCircle2 size={13} />;
    if (variant === "info") return <Info size={13} />;
    if (variant === "warning") return <AlertTriangle size={13} />;
    return <AlertOctagon size={13} />;
  };

  return (
    <>
      <style>{uiStyles}</style>

      <main className="attendance-page">
        <div className="attendance-shell">
          <section className="attendance-hero">
            <div className="hero-copy">
              <div className="eyebrow">
                <CalendarCheck size={13} />
                Academic Monitor
              </div>
              <h1 className="hero-title">Attendance Tracking</h1>
              <p className="hero-description">
                Track every class, stay above the 75% requirement, and instantly
                see how many classes you need to attend to get back on track.
              </p>
            </div>
          </section>

          <section className="stats-grid" aria-label="Attendance summary">
            <div className="stat-card">
              <div
                className="stat-icon"
                style={{ background: "#eff6ff", color: "#2563eb" }}
              >
                <Percent size={21} />
              </div>
              <div>
                <span className="stat-label">Average Attendance</span>
                <div className="stat-value" style={{ color: "#2563eb" }}>
                  {metrics.average}%
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div
                className="stat-icon"
                style={{ background: "#f0fdf4", color: "#16a34a" }}
              >
                <ShieldCheck size={21} />
              </div>
              <div>
                <span className="stat-label">On Track · ≥75%</span>
                <div className="stat-value" style={{ color: "#16a34a" }}>
                  {metrics.onTrack}
                  <span
                    style={{
                      marginLeft: 5,
                      color: "#64748b",
                      fontSize: ".77rem",
                      fontWeight: 650,
                    }}
                  >
                    courses
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div
                className="stat-icon"
                style={{ background: "#fef2f2", color: "#dc2626" }}
              >
                <ShieldAlert size={21} />
              </div>
              <div>
                <span className="stat-label">At Risk · &lt;75%</span>
                <div
                  className="stat-value"
                  style={{ color: metrics.atRisk ? "#dc2626" : "#0f172a" }}
                >
                  {metrics.atRisk}
                  <span
                    style={{
                      marginLeft: 5,
                      color: "#64748b",
                      fontSize: ".77rem",
                      fontWeight: 650,
                    }}
                  >
                    courses
                  </span>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="notice notice-error" role="alert">
              <AlertCircle size={19} />
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
                style={{
                  marginLeft: "auto",
                  border: 0,
                  background: "transparent",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                <X size={17} />
              </button>
            </div>
          )}

          {success && (
            <div className="notice notice-success" role="status">
              <CheckCircle2 size={19} />
              <span>{success}</span>
              <button
                type="button"
                onClick={() => setSuccess("")}
                aria-label="Dismiss success"
                style={{
                  marginLeft: "auto",
                  border: 0,
                  background: "transparent",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                <X size={17} />
              </button>
            </div>
          )}

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2 className="panel-title">
                  <PlusCircle size={18} color="#2563eb" />
                  Initialize Attendance
                </h2>
                <p className="panel-subtitle">
                  Add a subject once, then use quick actions to record every class.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div>
                  <label className="field-label" htmlFor="attendance-subject">
                    Course / Subject
                  </label>
                  <select
                    id="attendance-subject"
                    className="field"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    disabled={submitting}
                    required
                  >
                    <option value="">Choose a subject...</option>
                    {subjects.map((subject) => {
                      const tracked = attendanceList.some(
                        (record) => record.subjectId === subject.id
                      );

                      return (
                        <option key={subject.id} value={subject.id} disabled={tracked}>
                          {subject.name}
                          {tracked ? " — Already tracked" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="field-label" htmlFor="total-classes">
                    Total Classes
                  </label>
                  <input
                    id="total-classes"
                    className="field"
                    type="number"
                    min="1"
                    value={totalClasses}
                    onChange={(e) => setTotalClasses(e.target.value)}
                    placeholder="e.g. 20"
                    disabled={submitting}
                    required
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="attended-classes">
                    Classes Attended
                  </label>
                  <input
                    id="attended-classes"
                    className="field"
                    type="number"
                    min="0"
                    value={attendedClasses}
                    onChange={(e) => setAttendedClasses(e.target.value)}
                    placeholder="e.g. 17"
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={submitting}
                  style={{ opacity: submitting ? 0.65 : 1 }}
                >
                  <CalendarCheck size={16} />
                  {submitting ? "Starting..." : "Start Tracking"}
                  {!submitting && <ChevronRight size={15} />}
                </button>
              </div>
            </form>
          </section>

          <section>
            <div className="section-head">
              <div>
                <h2 className="section-title">Active Attendance</h2>
                <span className="section-subtitle">
                  Showing {filteredAttendance.length} of {attendanceList.length} monitored subjects
                </span>
              </div>

              <div className="toolbar">
                <div className="search-box">
                  <Search className="search-icon" size={16} />
                  <input
                    className="search-input"
                    type="search"
                    placeholder="Search subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search attendance records"
                  />
                </div>

                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter attendance status"
                >
                  <option value="all">All Statuses</option>
                  <option value="good">On Track · ≥75%</option>
                  <option value="warning">Warning · 65–74%</option>
                  <option value="critical">Critical · &lt;65%</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="skeleton-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div className="skeleton" key={index} />
                ))}
              </div>
            ) : filteredAttendance.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <CalendarCheck size={25} />
                </div>
                <h3 className="empty-title">
                  {searchTerm || statusFilter !== "all"
                    ? "No matching attendance records"
                    : "No attendance tracked yet"}
                </h3>
                <p className="empty-text">
                  {searchTerm || statusFilter !== "all"
                    ? "Try a different search term or clear the status filter."
                    : "Initialize your first subject above to start recording attendance."}
                </p>

                {(searchTerm || statusFilter !== "all") && (
                  <button
                    type="button"
                    className="secondary-btn"
                    style={{ marginTop: 16 }}
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                  >
                    <X size={15} />
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="attendance-grid">
                {filteredAttendance.map((record) => {
                  const statusInfo = getAttendanceStatus(record.percentage);
                  const targetGoal = calculateClassesNeeded(
                    record.attendedClasses,
                    record.totalClasses,
                    75
                  );

                  const isDeleting = deletingId === record.id;
                  const isUpdating = updatingId === record.id;
                  const percentage = Number(record.percentage) || 0;

                  return (
                    <article
                      className="attendance-card"
                      key={record.id}
                      style={{
                        opacity: isDeleting ? 0.55 : 1,
                        borderColor: statusInfo.borderColor,
                      }}
                    >
                      <div>
                        <div className="card-top">
                          <div className="subject-icon">
                            <BookOpen size={19} />
                          </div>

                          <button
                            type="button"
                            className="delete-icon"
                            onClick={() => setDeleteTarget(record)}
                            disabled={isDeleting || isUpdating}
                            aria-label={`Delete attendance for ${record.subjectName}`}
                            title="Delete tracker"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <h3 className="subject-name">{record.subjectName}</h3>

                        <div className="class-count">
                          Attended{" "}
                          <strong style={{ color: "#0f172a" }}>
                            {record.attendedClasses}
                          </strong>{" "}
                          of {record.totalClasses} classes
                        </div>

                        <div className="metric-row">
                          <span
                            className="percentage"
                            style={{ color: statusInfo.color }}
                          >
                            {percentage}%
                          </span>

                          <span
                            className="status-pill"
                            style={{
                              color: statusInfo.color,
                              backgroundColor: statusInfo.bgColor,
                              border: `1px solid ${statusInfo.borderColor}`,
                            }}
                          >
                            {renderStatusIcon(statusInfo.variant)}
                            {statusInfo.status}
                          </span>
                        </div>

                        <div
                          className="progress-track"
                          aria-label={`${percentage}% attendance`}
                        >
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(Math.max(percentage, 0), 100)}%`,
                              background: statusInfo.color,
                            }}
                          />
                        </div>

                        <p className="goal">
                          <Target
                            size={13}
                            style={{ verticalAlign: "middle", marginRight: 4 }}
                          />
                          {targetGoal.message}
                        </p>
                      </div>

                      <div className="action-row">
                        <button
                          type="button"
                          className="attendance-btn present"
                          onClick={() => handleMarkPresent(record)}
                          disabled={isUpdating || isDeleting}
                        >
                          <UserCheck size={14} />
                          Present
                        </button>

                        <button
                          type="button"
                          className="attendance-btn absent"
                          onClick={() => handleMarkAbsent(record)}
                          disabled={isUpdating || isDeleting}
                        >
                          <UserX size={14} />
                          Absent
                        </button>

                        <button
                          type="button"
                          className="undo-btn"
                          onClick={() => handleUndo(record)}
                          disabled={
                            Number(record.totalClasses) <= 1 ||
                            isUpdating ||
                            isDeleting
                          }
                          title="Undo last recorded class"
                          aria-label="Undo last recorded class"
                        >
                          <RotateCcw size={15} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {deleteTarget && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="attendance-delete-title"
          >
            <div className="modal-icon">
              <Trash2 size={22} />
            </div>

            <h2 className="modal-title" id="attendance-delete-title">
              Delete attendance tracker?
            </h2>

            <p className="modal-text">
              <strong>{deleteTarget.subjectName}</strong> attendance history
              will be permanently removed. This action cannot be undone.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setDeleteTarget(null)}
                disabled={Boolean(deletingId)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger-btn"
                onClick={confirmDelete}
                disabled={Boolean(deletingId)}
              >
                <Trash2 size={15} />
                {deletingId ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}