// src/pages/Subjects.jsx
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
} from "lucide-react";

export default function Subjects() {
  const { currentUser } = useAuth();
  const formRef = useRef(null);

  // Form State
  const [name, setName] = useState("");
  const [credits, setCredits] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCreditFilter, setSelectedCreditFilter] = useState("all");

  // Data & Status State
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 1. Real-time Firestore Query for Logged-In User
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const q = query(
      collection(db, "subjects"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
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

  // 2. Populate Form to Edit
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

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 3. Cancel Edit Mode
  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setCredits("");
    setError("");
  };

  // 4. Save (Create or Update) Subject
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
        const subjectRef = doc(db, "subjects", editingId);
        await updateDoc(subjectRef, {
          name: validation.sanitized.name,
          credits: validation.sanitized.credits,
          userId: currentUser.uid,
          updatedAt: serverTimestamp(),
        });

        setSuccess(`Subject "${validation.sanitized.name}" updated successfully!`);
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

        setSuccess(`Subject "${validation.sanitized.name}" enrolled successfully!`);
        setName("");
        setCredits("");
      }
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Delete Subject with Confirmation
  const handleDelete = async (subject) => {
    setError("");
    setSuccess("");

    if (!currentUser || subject.userId !== currentUser.uid) {
      setError("Unauthorized action: You can only delete your own subjects.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove "${subject.name}"? This will also affect SGPA calculations.`
    );
    if (!confirmed) return;

    setDeletingId(subject.id);

    try {
      await deleteDoc(doc(db, "subjects", subject.id));

      if (editingId === subject.id) {
        handleCancelEdit();
      }
      setSuccess(`Subject "${subject.name}" removed.`);
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setDeletingId(null);
    }
  };

  // Metrics Calculations
  const totalCredits = useMemo(
    () => subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0),
    [subjects]
  );

  const gradedSubjectsCount = useMemo(
    () =>
      subjects.filter(
        (s) => s.grade && s.gradePoint !== null && s.gradePoint !== undefined
      ).length,
    [subjects]
  );

  // Filtered List
  const filteredSubjects = useMemo(() => {
    return subjects.filter((item) => {
      const matchesSearch = item.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase().trim());
      const matchesCredits =
        selectedCreditFilter === "all" ||
        String(item.credits) === String(selectedCreditFilter);
      return matchesSearch && matchesCredits;
    });
  }, [subjects, searchTerm, selectedCreditFilter]);


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
              <BookOpen size={22} />
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
              Course Curriculum
            </h1>
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
            Register your active courses, assign semester credits, and monitor grading readiness.
          </p>
        </div>

        {/* Action Link to SGPA */}
        <Link
          to="/sgpa"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            borderRadius: "10px",
            fontSize: "0.875rem",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
            transition: "all 0.2s ease",
          }}
        >
          <Calculator size={16} />
          Calculate SGPA <ArrowRight size={14} />
        </Link>
      </div>

      {/* Analytics Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {/* Total Courses */}
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
            <Layers size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Total Courses
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>
              {subjects.length}
            </div>
          </div>
        </div>

        {/* Total Credits */}
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
            <GraduationCap size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Total Credits
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2563eb" }}>
              {totalCredits} <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#64748b" }}>pts</span>
            </div>
          </div>
        </div>

        {/* Graded Progress */}
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
            <Award size={22} />
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Graded Courses
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#16a34a" }}>
              {gradedSubjectsCount} / {subjects.length}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
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
                <Edit3 size={18} color="#2563eb" />
                Edit Course Information
              </>
            ) : (
              <>
                <PlusCircle size={18} color="#2563eb" />
                Add New Course
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
              gridTemplateColumns: "2fr 1fr",
              gap: "1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            {/* Subject Name */}
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
                Course / Subject Title *
              </label>
              <input
                type="text"
                disabled={submitting}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Operating Systems & Architecture"
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
                }}
              />
            </div>

            {/* Credits */}
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
                Credit Weight * (0 to 10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="1"
                disabled={submitting}
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                placeholder="e.g., 4"
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
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: submitting ? "#94a3b8" : "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
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
                ? "Update Course"
                : "Register Course"}
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
              Enrolled Courses
            </h3>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Showing {filteredSubjects.length} of {subjects.length} registered
            </span>
          </div>

          {/* Search & Filter Bar */}
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
                placeholder="Search subject..."
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
              value={selectedCreditFilter}
              onChange={(e) => setSelectedCreditFilter(e.target.value)}
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
              <option value="all">All Credits</option>
              <option value="1">1 Credit</option>
              <option value="2">2 Credits</option>
              <option value="3">3 Credits</option>
              <option value="4">4 Credits</option>
              <option value="5">5 Credits</option>
            </select>
          </div>
        </div>

        {/* Dynamic List */}
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>Loading curriculum...</div>
          </div>
        ) : filteredSubjects.length === 0 ? (
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
              <BookOpen size={24} />
            </div>
            <h4 style={{ margin: "0 0 0.5rem 0", color: "#1e293b", fontSize: "1.1rem" }}>
              {searchTerm || selectedCreditFilter !== "all"
                ? "No matching courses found"
                : "No courses enrolled yet"}
            </h4>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
              {searchTerm || selectedCreditFilter !== "all"
                ? "Try clearing your search query or adjusting your credit filters."
                : "Add your semester subjects using the enrollment form above."}
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
            {filteredSubjects.map((sub) => {
              const hasGrade =
                sub.grade &&
                sub.gradePoint !== null &&
                sub.gradePoint !== undefined;
              const isDeleting = deletingId === sub.id;
              const isBeingEdited = editingId === sub.id;

              return (
                <div
                  key={sub.id}
                  style={{
                    backgroundColor: "#ffffff",
                    border: `1.5px solid ${isBeingEdited ? "#3b82f6" : "#e2e8f0"}`,
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
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "10px",
                        marginBottom: "0.85rem",
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
                        {sub.name}
                      </h4>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          backgroundColor: "#f1f5f9",
                          color: "#334155",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {sub.credits} {sub.credits === 1 ? "Credit" : "Credits"}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "0.5rem",
                      paddingTop: "0.85rem",
                      borderTop: "1px solid #f1f5f9",
                    }}
                  >
                    <button
                      onClick={() => handleStartEdit(sub)}
                      disabled={isDeleting || submitting}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 12px",
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "#334155",
                        cursor: isDeleting || submitting ? "not-allowed" : "pointer",
                      }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>

                    <button
                      onClick={() => handleDelete(sub)}
                      disabled={isDeleting || submitting}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 12px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "#dc2626",
                        cursor: isDeleting || submitting ? "not-allowed" : "pointer",
                      }}
                    >
                      <Trash2 size={13} /> {isDeleting ? "Removing..." : "Delete"}
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