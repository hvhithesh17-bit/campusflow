// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { User, Mail, GraduationCap, Calendar, Shield, Save, CheckCircle, AlertCircle } from "lucide-react";

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
          // If no doc exists yet, seed basic details
          setName(currentUser.displayName || "");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile details.");
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [currentUser]);

  // 2. Save/Update Profile details
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const userDocRef = doc(db, "users", currentUser.uid);

      await setDoc(
        userDocRef,
        {
          name: name.trim(),
          email: currentUser.email,
          department: department.trim(),
          semester: semester,
          studentId: studentId.trim(),
          role: role,
          updatedAt: serverTimestamp(),
        },
        { merge: true } // Preserves other fields like createdAt
      );

      setMessage("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "1rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>Student Profile</h1>
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>
          Manage your account information and academic details.
        </p>
      </div>

      {/* Success Alert */}
      {message && (
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
          <CheckCircle size={18} />
          <span>{message}</span>
        </div>
      )}

      {/* Error Alert */}
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

      <form onSubmit={handleUpdateProfile}>
        {/* Account Details Card */}
        <div
          style={{
            backgroundColor: "var(--bg-secondary, #ffffff)",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "1.25rem", color: "var(--text-primary)" }}>
            Account Credentials
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {/* Email (Read-only) */}
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: 500 }}>
                <Mail size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ""}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color, #e2e8f0)",
                  backgroundColor: "#f8fafc",
                  color: "#64748b",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Account Role (Read-only) */}
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: 500 }}>
                <Shield size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                Role
              </label>
              <input
                type="text"
                disabled
                value={role.toUpperCase()}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color, #e2e8f0)",
                  backgroundColor: "#f8fafc",
                  color: "#64748b",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </div>

        {/* Academic Details Card */}
        <div
          style={{
            backgroundColor: "var(--bg-secondary, #ffffff)",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "1.25rem", color: "var(--text-primary)" }}>
            Academic Information
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Full Name */}
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: 500 }}>
                <User size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color, #cbd5e1)",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Student ID */}
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: 500 }}>
                Student ID / Roll Number
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g., CS-2026-042"
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color, #cbd5e1)",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
              {/* Department / Major */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: 500 }}>
                  <GraduationCap size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                  Department / Major
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g., Computer Science"
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.8rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color, #cbd5e1)",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Semester */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "14px", fontWeight: 500 }}>
                  <Calendar size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.8rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color, #cbd5e1)",
                    backgroundColor: "#fff",
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            backgroundColor: saving ? "#94a3b8" : "var(--accent-color, #2563eb)",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            transition: "background-color 0.2s ease",
          }}
        >
          <Save size={18} />
          {saving ? "Saving Changes..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}