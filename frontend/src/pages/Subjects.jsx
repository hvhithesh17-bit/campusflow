// src/pages/Subjects.jsx
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
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import {
  BookOpen,
  PlusCircle,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Calculator,
  ArrowRight,
} from "lucide-react";

export default function Subjects() {
  const { currentUser } = useAuth();
  const formRef = useRef(null);

  // Form State
  const [name, setName] = useState("");
  const [credits, setCredits] = useState("");
  const [editingId, setEditingId] = useState(null);

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
        console.error("Error fetching subjects:", err);
        setError("Failed to load subjects.");
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
    setCredits(subject.credits || "");

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

    const creditNum = Number(credits);

    if (!name.trim()) {
      setError("Please provide a valid subject name.");
      return;
    }
    if (isNaN(creditNum) || creditNum <= 0) {
      setError("Credits must be a number greater than 0.");
      return;
    }

    setSubmitting(true);

    try {
      if (editingId) {
        // Update existing subject while preserving existing grade information
        const subjectRef = doc(db, "subjects", editingId);
        await updateDoc(subjectRef, {
          name: name.trim(),
          credits: creditNum,
          updatedAt: serverTimestamp(),
        });

        setSuccess(`Subject "${name.trim()}" updated successfully!`);
        handleCancelEdit();
      } else {
        // Create new subject (grades default to null until entered in SGPA)
        await addDoc(collection(db, "subjects"), {
          name: name.trim(),
          credits: creditNum,
          grade: null,
          gradePoint: null,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
        });

        setSuccess(`Subject "${name.trim()}" added successfully!`);
        setName("");
        setCredits("");
      }
    } catch (err) {
      console.error("Error saving subject:", err);
      setError("Failed to save subject. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Delete Subject with Confirmation & Ownership Check
  const handleDelete = async (subject) => {
    setError("");
    setSuccess("");

    if (subject.userId !== currentUser.uid) {
      setError("Unauthorized action: You can only delete your own subjects.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${subject.name}"?`)) return;

    setDeletingId(subject.id);

    try {
      await deleteDoc(doc(db, "subjects", subject.id));

      if (editingId === subject.id) {
        handleCancelEdit();
      }
      setSuccess(`Subject "${subject.name}" deleted.`);
    } catch (err) {
      console.error("Error deleting subject:", err);
      setError("Failed to delete subject.");
    } finally {
      setDeletingId(null);
    }
  };

  // Total credit summary
  const totalCredits = subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>
            Subject Management
          </h1>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>
            Enroll your semester courses and manage credit allocations.
          </p>
        </div>

        {/* Quick Link to SGPA Calculator */}
        <Link
          to="/sgpa"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            backgroundColor: "#eff6ff",
            color: "#1d4ed8",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <Calculator size={16} />
          Calculate SGPA <ArrowRight size={14} />
        </Link>
      </div>

      {/* Alerts */}
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

      {/* Add / Edit Form */}
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
        <h3 style={{ marginTop: 0, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
          {editingId ? (
            <>
              <Edit2 size={18} color="var(--accent-color, #2563eb)" />
              Edit Course Details
            </>
          ) : (
            <>
              <PlusCircle size={18} color="var(--accent-color, #2563eb)" />
              Add New Course
            </>
          )}
        </h3>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
              marginBottom: "1.25rem",
            }}
          >
            {/* Subject Name */}
            <div style={{ flex: 2 }}>
              <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "14px", fontWeight: 500 }}>
                Course / Subject Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Operating Systems"
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color, #cbd5e1)",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Credits */}
            <div>
              <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "14px", fontWeight: 500 }}>
                Credits *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                placeholder="e.g., 4"
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color, #cbd5e1)",
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
                backgroundColor: submitting ? "#94a3b8" : "var(--accent-color, #2563eb)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Saving..." : editingId ? "Update Course" : "Add Course"}
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

      {/* Enrolled Subjects List */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text-primary)" }}>
            Enrolled Subjects ({subjects.length})
          </h3>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>
            Total Credits: {totalCredits}
          </span>
        </div>

        {loading ? (
          <p style={{ color: "var(--text-secondary)" }}>Loading subjects...</p>
        ) : subjects.length === 0 ? (
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
            No subjects enrolled yet. Add your courses using the form above.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {subjects.map((sub) => {
              const hasGrade = sub.grade && sub.gradePoint !== null && sub.gradePoint !== undefined;
              const isDeleting = deletingId === sub.id;

              return (
                <div
                  key={sub.id}
                  style={{
                    backgroundColor: "var(--bg-secondary, #ffffff)",
                    border: `1px solid ${editingId === sub.id ? "var(--accent-color, #2563eb)" : "var(--border-color, #e2e8f0)"}`,
                    borderRadius: "10px",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    opacity: isDeleting ? 0.6 : 1,
                    transition: "all 0.2s ease",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <h4 style={{ margin: 0, fontSize: "16px", color: "var(--text-primary)" }}>
                        {sub.name}
                      </h4>
                      <span
                        style={{
                          fontSize: "12px",
                          backgroundColor: "#f1f5f9",
                          color: "#475569",
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          fontWeight: 600,
                        }}
                      >
                        {sub.credits} Credits
                      </span>
                    </div>

                    {/* Grade Status Indicator */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", marginTop: "0.5rem" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Grade:</span>
                      {hasGrade ? (
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#1d4ed8",
                            backgroundColor: "#eff6ff",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            border: "1px solid #bfdbfe",
                          }}
                        >
                          {sub.grade} ({sub.gradePoint} GP)
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                          Set in SGPA page
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "0.5rem",
                      marginTop: "1rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px solid #f1f5f9",
                    }}
                  >
                    <button
                      onClick={() => handleStartEdit(sub)}
                      disabled={isDeleting}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 8px",
                        background: "transparent",
                        border: "1px solid #cbd5e1",
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: "#334155",
                        cursor: isDeleting ? "not-allowed" : "pointer",
                      }}
                    >
                      <Edit2 size={13} /> Edit
                    </button>

                    <button
                      onClick={() => handleDelete(sub)}
                      disabled={isDeleting}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 8px",
                        background: "transparent",
                        border: "1px solid #fecaca",
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: "#dc2626",
                        cursor: isDeleting ? "not-allowed" : "pointer",
                      }}
                    >
                      <Trash2 size={13} /> Delete
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