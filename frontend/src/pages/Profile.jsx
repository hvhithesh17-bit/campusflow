// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { formatFirebaseError } from "../utils/errorHandler";
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  Hash,
  Sparkles,
  BookOpen,
  IdCard,
} from "lucide-react";

export default function Profile() {
  const { currentUser } = useAuth();

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("1");
  const [studentId, setStudentId] = useState("");
  const [role, setRole] = useState("student");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 1. Fetch user data from Firestore on load
  useEffect(() => {
    async function fetchUserProfile() {
      if (!currentUser) return;

      try {
        setLoading(true);
        const userDocRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || "");
          setDepartment(data.department || "");
          setSemester(data.semester || "1");
          setStudentId(data.studentId || "");
          setRole(data.role || "student");
        } else {
          setName(currentUser.displayName || "");
        }
      } catch (err) {
        setError(formatFirebaseError(err));
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [currentUser]);

  // 2. Save/Update Profile details with validation
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!currentUser) {
      setError("You must be logged in to update your profile.");
      return;
    }

    const cleanName = name.trim();
    if (!cleanName) {
      setError("Full name is required.");
      return;
    }
    if (cleanName.length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }

    setSaving(true);

    try {
      const userDocRef = doc(db, "users", currentUser.uid);

      await setDoc(
        userDocRef,
        {
          name: cleanName,
          email: currentUser.email,
          department: department.trim(),
          semester: String(semester),
          studentId: studentId.trim(),
          role: role,
          userId: currentUser.uid,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMessage("Student profile updated successfully!");
      setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      setError(formatFirebaseError(err));
    } finally {
      setSaving(false);
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
              <User size={22} />
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
              Student Profile
            </h1>
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
            Manage your personal credentials, departmental affiliation, and semester standing.
          </p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "1.5rem 2rem",
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          flexWrap: "wrap",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "#eff6ff",
            border: "2px solid #bfdbfe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#2563eb",
            fontSize: "1.5rem",
            fontWeight: 800,
          }}
        >
          {name ? name.charAt(0).toUpperCase() : "S"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "#0f172a" }}>
              {name || "Student Name"}
            </h2>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "3px 10px",
                borderRadius: "9999px",
                backgroundColor: "#eff6ff",
                color: "#2563eb",
                fontWeight: 700,
                border: "1px solid #bfdbfe",
                textTransform: "uppercase",
              }}
            >
              {role}
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.85rem" }}>
            {currentUser?.email} • {department || "Department Not Set"} • Semester {semester}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {message && (
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
          <CheckCircle size={20} />
          <span>{message}</span>
        </div>
      )}

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

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>Loading profile information...</div>
        </div>
      ) : (
        <form onSubmit={handleUpdateProfile}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            {/* Account Credentials Card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "1.75rem 2rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 1.25rem 0",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Shield size={18} color="#2563eb" />
                Account Credentials
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Email Address (Read-only) */}
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
                    Email Address (Linked Account)
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8",
                      }}
                    />
                    <input
                      type="email"
                      disabled
                      value={currentUser?.email || ""}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem 0.75rem 2.25rem",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: "#f8fafc",
                        color: "#64748b",
                        fontSize: "0.95rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {/* Account Role (Read-only) */}
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
                    System Role
                  </label>
                  <div style={{ position: "relative" }}>
                    <Shield
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8",
                      }}
                    />
                    <input
                      type="text"
                      disabled
                      value={role.toUpperCase()}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem 0.75rem 2.25rem",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: "#f8fafc",
                        color: "#64748b",
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information Card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "1.75rem 2rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 1.25rem 0",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <GraduationCap size={18} color="#2563eb" />
                Academic Information
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Full Name */}
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
                    Full Name *
                  </label>
                  <div style={{ position: "relative" }}>
                    <User
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8",
                      }}
                    />
                    <input
                      type="text"
                      disabled={saving}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Hithesh"
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem 0.75rem 2.25rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.95rem",
                        color: "#0f172a",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {/* Student ID */}
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
                    Student ID / Roll Number
                  </label>
                  <div style={{ position: "relative" }}>
                    <IdCard
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8",
                      }}
                    />
                    <input
                      type="text"
                      disabled={saving}
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g., 1MS25CS042"
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem 0.75rem 2.25rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.95rem",
                        color: "#0f172a",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1rem" }}>
                  {/* Department */}
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
                      Department / Major
                    </label>
                    <input
                      type="text"
                      disabled={saving}
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g., Computer Science"
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.95rem",
                        color: "#0f172a",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Semester */}
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
                      Semester
                    </label>
                    <select
                      value={semester}
                      disabled={saving}
                      onChange={(e) => setSemester(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                        fontSize: "0.95rem",
                        color: "#0f172a",
                        boxSizing: "border-box",
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action Toolbar */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.85rem 2rem",
                borderRadius: "10px",
                border: "none",
                backgroundColor: saving ? "#94a3b8" : "#2563eb",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                transition: "all 0.15s ease",
              }}
            >
              <Save size={18} />
              {saving ? "Saving Profile..." : "Save Profile Details"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}