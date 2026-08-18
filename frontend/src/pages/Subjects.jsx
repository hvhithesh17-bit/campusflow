// src/pages/Subjects.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { validateSubject } from "../utils/validation";
import { formatFirebaseError } from "../utils/errorHandler";
import {
  BookOpen,
  Calculator,
  PlusCircle,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Search,
  Award,
  Layers,
  GraduationCap,
  Sparkles,
  MoreVertical,
  BookMarked,
  Check,
} from "lucide-react";

const styles = `
  .subjects-page {
    --primary: #2563eb;
    --primary-dark: #1d4ed8;
    --primary-soft: #eff6ff;
    --text: #0f172a;
    --muted: #64748b;
    --border: #e2e8f0;
    --surface: #ffffff;
    --surface-soft: #f8fafc;
    --success: #16a34a;
    --danger: #dc2626;
    min-height: 100%;
    padding: clamp(16px, 3vw, 32px);
    background:
      radial-gradient(circle at 90% 0%, rgba(37,99,235,.08), transparent 28%),
      #f8fafc;
    color: var(--text);
  }

  .subjects-shell {
    max-width: 1280px;
    margin: 0 auto;
  }

  .subjects-hero {
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: center;
    padding: clamp(22px, 4vw, 34px);
    margin-bottom: 20px;
    border: 1px solid #dbeafe;
    border-radius: 24px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fbff 55%, #eff6ff 100%);
    box-shadow: 0 10px 35px rgba(15, 23, 42, .06);
  }

  .subjects-hero::after {
    content: "";
    position: absolute;
    width: 220px;
    height: 220px;
    right: -90px;
    top: -100px;
    border-radius: 50%;
    background: rgba(37,99,235,.08);
    pointer-events: none;
  }

  .hero-copy {
    position: relative;
    z-index: 1;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 10px;
    padding: 6px 10px;
    border-radius: 999px;
    background: #dbeafe;
    color: #1d4ed8;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .04em;
    text-transform: uppercase;
  }

  .hero-title {
    margin: 0;
    font-size: clamp(1.55rem, 3vw, 2.25rem);
    line-height: 1.15;
    letter-spacing: -.035em;
  }

  .hero-description {
    max-width: 650px;
    margin: 10px 0 0;
    color: var(--muted);
    line-height: 1.65;
    font-size: .95rem;
  }

  .primary-action,
  .secondary-action,
  .danger-action,
  .icon-action {
    border: 0;
    font: inherit;
    cursor: pointer;
    transition: transform .18s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease;
  }

  .primary-action {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 16px;
    border-radius: 12px;
    background: var(--primary);
    color: white;
    font-weight: 750;
    text-decoration: none;
    box-shadow: 0 7px 18px rgba(37,99,235,.22);
    white-space: nowrap;
  }

  .primary-action:hover { background: var(--primary-dark); transform: translateY(-1px); }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 20px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
    padding: 18px;
    border: 1px solid var(--border);
    border-radius: 18px;
    background: var(--surface);
    box-shadow: 0 5px 20px rgba(15,23,42,.035);
  }

  .stat-icon {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    flex: 0 0 46px;
    border-radius: 14px;
  }

  .stat-label {
    display: block;
    margin-bottom: 3px;
    color: var(--muted);
    font-size: .78rem;
    font-weight: 700;
  }

  .stat-value {
    font-size: 1.35rem;
    font-weight: 850;
    letter-spacing: -.025em;
  }

  .notice {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 16px;
    padding: 13px 15px;
    border-radius: 14px;
    font-size: .88rem;
    line-height: 1.5;
  }

  .notice-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
  .notice-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

  .form-card {
    margin-bottom: 28px;
    padding: clamp(18px, 3vw, 26px);
    border: 1px solid var(--border);
    border-radius: 20px;
    background: var(--surface);
    box-shadow: 0 8px 28px rgba(15,23,42,.045);
    scroll-margin-top: 24px;
  }

  .form-card.editing {
    border-color: #93c5fd;
    box-shadow: 0 10px 32px rgba(37,99,235,.10);
  }

  .form-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
  }

  .form-title {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0;
    font-size: 1rem;
    font-weight: 800;
  }

  .editing-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 9px;
    border-radius: 999px;
    background: var(--primary-soft);
    color: var(--primary);
    font-size: .72rem;
    font-weight: 800;
  }

  .form-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.8fr) minmax(160px, .7fr);
    gap: 16px;
  }

  .field-label {
    display: block;
    margin-bottom: 7px;
    color: #334155;
    font-size: .8rem;
    font-weight: 750;
  }

  .field-wrap {
    position: relative;
  }

  .field-input,
  .search-input,
  .credit-select {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #cbd5e1;
    outline: none;
    background: #fff;
    color: #0f172a;
    transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
  }

  .field-input {
    height: 46px;
    padding: 0 13px;
    border-radius: 11px;
    font-size: .9rem;
  }

  .field-input:focus,
  .search-input:focus,
  .credit-select:focus {
    border-color: #60a5fa;
    box-shadow: 0 0 0 4px rgba(37,99,235,.10);
  }

  .field-input:disabled { background: #f8fafc; cursor: not-allowed; }

  .form-actions {
    display: flex;
    align-items: center;
    gap: 9px;
    flex-wrap: wrap;
    margin-top: 18px;
  }

  .secondary-action,
  .danger-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 40px;
    padding: 0 13px;
    border-radius: 10px;
    font-size: .82rem;
    font-weight: 750;
  }

  .secondary-action {
    border: 1px solid #cbd5e1;
    background: white;
    color: #334155;
  }

  .secondary-action:hover { background: #f8fafc; border-color: #94a3b8; }

  .danger-action {
    border: 1px solid #fecaca;
    background: #fff5f5;
    color: var(--danger);
  }

  .danger-action:hover { background: #fee2e2; }

  .section-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
  }

  .section-title {
    margin: 0;
    font-size: 1.18rem;
    letter-spacing: -.02em;
  }

  .section-subtitle {
    display: block;
    margin-top: 4px;
    color: var(--muted);
    font-size: .8rem;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    width: min(100%, 460px);
  }

  .search-box {
    position: relative;
    flex: 1;
    min-width: 150px;
  }

  .search-icon {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
  }

  .search-input {
    height: 40px;
    padding: 0 12px 0 35px;
    border-radius: 10px;
    font-size: .82rem;
  }

  .credit-select {
    width: 135px;
    height: 40px;
    padding: 0 10px;
    border-radius: 10px;
    font-size: .82rem;
    cursor: pointer;
  }

  .course-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 14px;
  }

  .course-card {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 170px;
    padding: 18px;
    border: 1px solid var(--border);
    border-radius: 18px;
    background: white;
    box-shadow: 0 5px 18px rgba(15,23,42,.035);
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  }

  .course-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(15,23,42,.08);
    border-color: #cbd5e1;
  }

  .course-card.is-editing {
    border-color: #60a5fa;
    box-shadow: 0 10px 28px rgba(37,99,235,.10);
  }

  .course-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .course-icon {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 11px;
    background: var(--primary-soft);
    color: var(--primary);
    flex: 0 0 38px;
  }

  .course-menu {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
    border: 1px solid #dbeafe;
    border-radius: 999px;
    background: #f8fbff;
    color: #1d4ed8;
    font-size: .7rem;
    font-weight: 800;
    white-space: nowrap;
  }

  .course-name {
    margin: 15px 0 6px;
    font-size: 1rem;
    line-height: 1.4;
    font-weight: 800;
    word-break: break-word;
  }

  .course-meta {
    color: var(--muted);
    font-size: .78rem;
  }

  .course-actions {
    display: flex;
    gap: 7px;
    margin-top: auto;
    padding-top: 15px;
  }

  .course-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex: 1;
    min-height: 36px;
    padding: 0 9px;
    border-radius: 9px;
    font-size: .76rem;
    font-weight: 750;
    cursor: pointer;
  }

  .edit-action {
    border: 1px solid #dbeafe;
    background: #eff6ff;
    color: #1d4ed8;
  }

  .edit-action:hover { background: #dbeafe; }

  .delete-action {
    border: 1px solid #fee2e2;
    background: #fff7f7;
    color: #dc2626;
  }

  .delete-action:hover { background: #fee2e2; }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 250px;
    padding: 30px;
    text-align: center;
    border: 1px dashed #cbd5e1;
    border-radius: 20px;
    background: rgba(255,255,255,.8);
  }

  .empty-icon {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    margin-bottom: 14px;
    border-radius: 17px;
    background: #eff6ff;
    color: #3b82f6;
  }

  .empty-title {
    margin: 0 0 6px;
    font-size: 1rem;
  }

  .empty-text {
    max-width: 420px;
    margin: 0;
    color: var(--muted);
    font-size: .84rem;
    line-height: 1.55;
  }

  .loading-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 14px;
  }

  .skeleton {
    height: 170px;
    border-radius: 18px;
    background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 50%, #eef2f7 75%);
    background-size: 200% 100%;
    animation: shimmer 1.3s infinite;
  }

  @keyframes shimmer {
    from { background-position: 200% 0; }
    to { background-position: -200% 0; }
  }

  .confirm-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: grid;
    place-items: center;
    padding: 18px;
    background: rgba(15,23,42,.48);
    backdrop-filter: blur(5px);
  }

  .confirm-modal {
    width: min(100%, 430px);
    padding: 24px;
    border-radius: 20px;
    background: white;
    box-shadow: 0 25px 70px rgba(15,23,42,.25);
    animation: modalIn .18s ease-out;
  }

  @keyframes modalIn {
    from { opacity: 0; transform: translateY(8px) scale(.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .confirm-icon {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    margin-bottom: 14px;
    border-radius: 14px;
    background: #fef2f2;
    color: #dc2626;
  }

  .confirm-title { margin: 0 0 7px; font-size: 1.1rem; }
  .confirm-text { margin: 0; color: #64748b; font-size: .86rem; line-height: 1.55; }

  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 22px;
  }

  @media (max-width: 800px) {
    .subjects-hero { flex-direction: column; align-items: flex-start; }
    .primary-action { width: 100%; }
    .stats-grid { grid-template-columns: 1fr; }
    .form-grid { grid-template-columns: 1fr; }
    .section-head { align-items: stretch; flex-direction: column; }
    .toolbar { width: 100%; }
  }

  @media (max-width: 520px) {
    .subjects-page { padding: 12px; }
    .subjects-hero { border-radius: 18px; }
    .form-card { border-radius: 17px; }
    .toolbar { flex-direction: column; }
    .search-box, .credit-select { width: 100%; }
    .credit-select { width: 100%; }
    .course-grid { grid-template-columns: 1fr; }
    .course-actions { flex-direction: column; }
    .confirm-actions { flex-direction: column-reverse; }
    .confirm-actions button { width: 100%; }
  }
`;

export default function Subjects() {
  const { currentUser } = useAuth();
  const formRef = useRef(null);

  const [name, setName] = useState("");
  const [credits, setCredits] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCreditFilter, setSelectedCreditFilter] = useState("all");

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setSubjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "subjects"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        setSubjects(data);
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

  const totalCredits = useMemo(
    () => subjects.reduce((sum, subject) => sum + (Number(subject.credits) || 0), 0),
    [subjects]
  );

  const gradedSubjectsCount = useMemo(
    () =>
      subjects.filter(
        (subject) =>
          subject.grade &&
          subject.gradePoint !== null &&
          subject.gradePoint !== undefined
      ).length,
    [subjects]
  );

  const filteredSubjects = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return subjects.filter((subject) => {
      const matchesSearch = (subject.name || "").toLowerCase().includes(search);
      const matchesCredits =
        selectedCreditFilter === "all" ||
        String(subject.credits) === String(selectedCreditFilter);

      return matchesSearch && matchesCredits;
    });
  }, [subjects, searchTerm, selectedCreditFilter]);

  const handleStartEdit = (subject) => {
    setError("");
    setSuccess("");
    setEditingId(subject.id);
    setName(subject.name || "");
    setCredits(
      subject.credits !== undefined && subject.credits !== null
        ? String(subject.credits)
        : ""
    );

    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setCredits("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentUser) {
      setError("You must be logged in to manage subjects.");
      return;
    }

    const validation = validateSubject({ name, credits });

    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setSubmitting(true);

    try {
      if (editingId) {
        await updateDoc(doc(db, "subjects", editingId), {
          name: validation.sanitized.name,
          credits: validation.sanitized.credits,
          userId: currentUser.uid,
          updatedAt: serverTimestamp(),
        });

        setSuccess(`"${validation.sanitized.name}" updated successfully.`);
        handleCancelEdit();
      } else {
        await addDoc(collection(db, "subjects"), {
          name: validation.sanitized.name,
          credits: validation.sanitized.credits,
          grade: null,
          gradePoint: null,
          ia1: null,
          ia2: null,
          iaUpdatedAt: null,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setSuccess(`"${validation.sanitized.name}" added to your curriculum.`);
        setName("");
        setCredits("");
      }
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !currentUser) return;

    const subject = deleteTarget;

    if (subject.userId !== currentUser.uid) {
      setError("Unauthorized action: You can only delete your own subjects.");
      setDeleteTarget(null);
      return;
    }

    setDeletingId(subject.id);

    try {
      await deleteDoc(doc(db, "subjects", subject.id));

      if (editingId === subject.id) {
        handleCancelEdit();
      }

      setSuccess(`"${subject.name}" was removed.`);
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <style>{styles}</style>

      <main className="subjects-page">
        <div className="subjects-shell">
          <section className="subjects-hero">
            <div className="hero-copy">
              <div className="eyebrow">
                <BookMarked size={13} />
                Academic Hub
              </div>

              <h1 className="hero-title">Your Subjects</h1>

              <p className="hero-description">
                Manage your semester courses, credits, and grading progress
                from one clean workspace.
              </p>
            </div>

            <Link to="/sgpa" className="primary-action">
              <Calculator size={17} />
              Calculate SGPA
              <ArrowRight size={15} />
            </Link>
          </section>

          <section className="stats-grid" aria-label="Subject statistics">
            <div className="stat-card">
              <div
                className="stat-icon"
                style={{ background: "#f1f5f9", color: "#334155" }}
              >
                <Layers size={21} />
              </div>
              <div>
                <span className="stat-label">Total Courses</span>
                <div className="stat-value">{subjects.length}</div>
              </div>
            </div>

            <div className="stat-card">
              <div
                className="stat-icon"
                style={{ background: "#eff6ff", color: "#2563eb" }}
              >
                <GraduationCap size={21} />
              </div>
              <div>
                <span className="stat-label">Total Credits</span>
                <div className="stat-value">
                  {totalCredits}
                  <span
                    style={{
                      marginLeft: 5,
                      color: "#64748b",
                      fontSize: ".78rem",
                      fontWeight: 650,
                    }}
                  >
                    credits
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div
                className="stat-icon"
                style={{ background: "#f0fdf4", color: "#16a34a" }}
              >
                <Award size={21} />
              </div>
              <div>
                <span className="stat-label">Grading Progress</span>
                <div className="stat-value">
                  {gradedSubjectsCount}
                  <span
                    style={{
                      marginLeft: 5,
                      color: "#64748b",
                      fontSize: ".78rem",
                      fontWeight: 650,
                    }}
                  >
                    / {subjects.length} graded
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
                aria-label="Dismiss success message"
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

          <section
            ref={formRef}
            className={`form-card ${editingId ? "editing" : ""}`}
          >
            <div className="form-heading">
              <h2 className="form-title">
                {editingId ? (
                  <Edit3 size={18} color="#2563eb" />
                ) : (
                  <PlusCircle size={18} color="#2563eb" />
                )}
                {editingId ? "Edit Course" : "Add New Course"}
              </h2>

              {editingId && (
                <span className="editing-badge">
                  <Edit3 size={12} />
                  Editing
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div>
                  <label className="field-label" htmlFor="subject-name">
                    Course / Subject Name
                  </label>

                  <input
                    id="subject-name"
                    type="text"
                    value={name}
                    disabled={submitting}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Data Structures"
                    className="field-input"
                    autoComplete="off"
                    required
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="subject-credits">
                    Credits
                  </label>

                  <input
                    id="subject-credits"
                    type="number"
                    min="0"
                    max="10"
                    step="1"
                    value={credits}
                    disabled={submitting}
                    onChange={(e) => setCredits(e.target.value)}
                    placeholder="e.g. 4"
                    className="field-input"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={submitting}
                  className="primary-action"
                  style={{
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  <Sparkles size={16} />
                  {submitting
                    ? editingId
                      ? "Updating..."
                      : "Adding..."
                    : editingId
                      ? "Update Course"
                      : "Add Course"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleCancelEdit}
                    className="secondary-action"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section>
            <div className="section-head">
              <div>
                <h2 className="section-title">Enrolled Courses</h2>
                <span className="section-subtitle">
                  Showing {filteredSubjects.length} of {subjects.length} courses
                </span>
              </div>

              <div className="toolbar">
                <div className="search-box">
                  <Search className="search-icon" size={16} />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search courses..."
                    className="search-input"
                    aria-label="Search courses"
                  />
                </div>

                <select
                  value={selectedCreditFilter}
                  onChange={(e) => setSelectedCreditFilter(e.target.value)}
                  className="credit-select"
                  aria-label="Filter by credits"
                >
                  <option value="all">All Credits</option>
                  <option value="1">1 Credit</option>
                  <option value="2">2 Credits</option>
                  <option value="3">3 Credits</option>
                  <option value="4">4 Credits</option>
                  <option value="5">5 Credits</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div className="skeleton" key={index} />
                ))}
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <BookOpen size={25} />
                </div>

                <h3 className="empty-title">
                  {searchTerm || selectedCreditFilter !== "all"
                    ? "No courses found"
                    : "No courses enrolled yet"}
                </h3>

                <p className="empty-text">
                  {searchTerm || selectedCreditFilter !== "all"
                    ? "Try a different search term or clear the credit filter."
                    : "Add your semester subjects above to start tracking your academic progress."}
                </p>

                {(searchTerm || selectedCreditFilter !== "all") && (
                  <button
                    type="button"
                    className="secondary-action"
                    style={{ marginTop: 16 }}
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCreditFilter("all");
                    }}
                  >
                    <X size={15} />
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="course-grid">
                {filteredSubjects.map((subject) => {
                  const isDeleting = deletingId === subject.id;
                  const isEditing = editingId === subject.id;
                  const hasGrade =
                    subject.grade &&
                    subject.gradePoint !== null &&
                    subject.gradePoint !== undefined;

                  return (
                    <article
                      key={subject.id}
                      className={`course-card ${isEditing ? "is-editing" : ""}`}
                      style={{ opacity: isDeleting ? 0.55 : 1 }}
                    >
                      <div className="course-top">
                        <div className="course-icon">
                          <BookOpen size={19} />
                        </div>

                        <span className="course-menu">
                          {hasGrade ? (
                            <>
                              <Check size={12} />
                              Graded
                            </>
                          ) : (
                            <>
                              <MoreVertical size={12} />
                              {subject.credits}{" "}
                              {Number(subject.credits) === 1
                                ? "Credit"
                                : "Credits"}
                            </>
                          )}
                        </span>
                      </div>

                      <h3 className="course-name">{subject.name}</h3>

                      <div className="course-meta">
                        {subject.credits}{" "}
                        {Number(subject.credits) === 1 ? "credit" : "credits"}
                        {hasGrade ? ` • Grade ${subject.grade}` : " • Grade pending"}
                      </div>

                      <div className="course-actions">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(subject)}
                          disabled={isDeleting || submitting}
                          className="course-action edit-action"
                        >
                          <Edit3 size={14} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(subject)}
                          disabled={isDeleting || submitting}
                          className="course-action delete-action"
                        >
                          <Trash2 size={14} />
                          {isDeleting ? "Removing..." : "Delete"}
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
          className="confirm-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
        >
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <div className="confirm-icon">
              <Trash2 size={22} />
            </div>

            <h2 id="delete-title" className="confirm-title">
              Remove this course?
            </h2>

            <p className="confirm-text">
              <strong>{deleteTarget.name}</strong> will be permanently removed.
              This can affect your SGPA calculations.
            </p>

            <div className="confirm-actions">
              <button
                type="button"
                className="secondary-action"
                onClick={() => setDeleteTarget(null)}
                disabled={Boolean(deletingId)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger-action"
                onClick={confirmDelete}
                disabled={Boolean(deletingId)}
              >
                <Trash2 size={15} />
                {deletingId ? "Removing..." : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}