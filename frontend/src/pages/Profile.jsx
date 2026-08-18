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
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  IdCard,
  Building2,
  BookOpen,
  Calendar,
  Sparkles,
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

  const profileStyles = `
    .cf-profile-root {
      min-height: 100%;
      padding: 24px clamp(14px, 3vw, 32px) 44px;
      background: #f8fafc;
      color: #0f172a;
      box-sizing: border-box;
      font-family: inherit;
    }
    .cf-profile-container {
      max-width: 1100px;
      margin: 0 auto;
    }
    .cf-profile-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 24px 28px;
      margin-bottom: 24px;
      border: 1px solid #dbeafe;
      border-radius: 20px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fbff 60%, #eff6ff 100%);
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
    }
    .cf-profile-kicker {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      background: #dbeafe;
      color: #1d4ed8;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      width: fit-content;
    }
    .cf-profile-header h1 {
      margin: 4px 0 0;
      font-size: clamp(1.4rem, 2.5vw, 1.85rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #0f172a;
    }
    .cf-profile-header p {
      margin: 0;
      color: #64748b;
      font-size: 0.86rem;
      line-height: 1.5;
    }

    /* Hero Overview Card */
    .cf-profile-hero-card {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
      margin-bottom: 24px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      box-shadow: 0 2px 12px rgba(15, 23, 42, 0.03);
      flex-wrap: wrap;
    }
    .cf-profile-avatar {
      width: 68px;
      height: 68px;
      border-radius: 20px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      font-weight: 800;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
      flex-shrink: 0;
    }
    .cf-profile-hero-meta {
      flex: 1;
      min-width: 220px;
    }
    .cf-profile-hero-top {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 4px;
    }
    .cf-profile-hero-top h2 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .cf-profile-role-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 6px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .cf-profile-hero-details {
      display: flex;
      align-items: center;
      gap: 14px;
      color: #64748b;
      font-size: 0.82rem;
      flex-wrap: wrap;
      margin-top: 4px;
    }
    .cf-profile-hero-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    /* Alerts */
    .cf-profile-alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 12px;
      margin-bottom: 20px;
      font-size: 0.825rem;
    }
    .cf-profile-alert-success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
    }
    .cf-profile-alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    /* Grid Sections */
    .cf-profile-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    .cf-profile-section-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 22px;
      box-shadow: 0 2px 12px rgba(15, 23, 42, 0.03);
    }
    .cf-profile-section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 18px 0;
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
    }
    .cf-profile-form-stack {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .cf-profile-field label {
      display: block;
      margin-bottom: 6px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #334155;
    }
    .cf-profile-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .cf-profile-input-icon {
      position: absolute;
      left: 12px;
      color: #94a3b8;
      pointer-events: none;
    }
    .cf-profile-input {
      width: 100%;
      height: 42px;
      padding: 0 12px 0 38px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.88rem;
      font-family: inherit;
      color: #0f172a;
      background: #ffffff;
      box-sizing: border-box;
      outline: none;
      transition: all 0.15s ease;
    }
    .cf-profile-input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .cf-profile-input:disabled {
      background: #f8fafc;
      border-color: #e2e8f0;
      color: #64748b;
      cursor: not-allowed;
    }
    .cf-profile-select {
      width: 100%;
      height: 42px;
      padding: 0 12px 0 38px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.88rem;
      font-family: inherit;
      color: #0f172a;
      background: #ffffff;
      box-sizing: border-box;
      outline: none;
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .cf-profile-select:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .cf-profile-submit-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 42px;
      padding: 0 20px;
      border-radius: 10px;
      border: none;
      background: #2563eb;
      color: #ffffff;
      font-size: 0.82rem;
      font-weight: 800;
      font-family: inherit;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.2);
      transition: all 0.15s ease;
    }
    .cf-profile-submit-btn:hover:not(:disabled) {
      background: #1d4ed8;
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.28);
    }
    .cf-profile-submit-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    /* Skeletons */
    .cf-profile-skeleton {
      height: 200px;
      border-radius: 20px;
      background: linear-gradient(90deg, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: cfProfileShimmer 1.3s infinite;
      border: 1px solid #e2e8f0;
    }
    @keyframes cfProfileShimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @media (max-width: 640px) {
      .cf-profile-header {
        flex-direction: column;
        align-items: flex-start;
        padding: 20px;
      }
      .cf-profile-hero-card {
        flex-direction: column;
        align-items: flex-start;
      }
      .cf-profile-hero-details {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }
    }
  `;

  return (
    <main className="cf-profile-root">
      <style>{profileStyles}</style>
      <div className="cf-profile-container">
        {/* Header Banner */}
        <header className="cf-profile-header">
          <div>
            <span className="cf-profile-kicker">
              <Sparkles size={12} /> Account & Records
            </span>
            <h1>Student Profile</h1>
            <p>
              Manage your personal credentials, departmental affiliation, and semester standing.
            </p>
          </div>
        </header>

        {/* Profile Overview Hero Card */}
        <section className="cf-profile-hero-card">
          <div className="cf-profile-avatar">
            {name ? name.charAt(0).toUpperCase() : "S"}
          </div>

          <div className="cf-profile-hero-meta">
            <div className="cf-profile-hero-top">
              <h2>{name || "Student Name"}</h2>
              <span className="cf-profile-role-tag">
                <Shield size={12} /> {role}
              </span>
            </div>
            <div className="cf-profile-hero-details">
              <span className="cf-profile-hero-item">
                <Mail size={13} /> {currentUser?.email || "No email"}
              </span>
              <span className="cf-profile-hero-item">
                <Building2 size={13} /> {department || "Department Not Set"}
              </span>
              <span className="cf-profile-hero-item">
                <GraduationCap size={13} /> Semester {semester}
              </span>
              {studentId && (
                <span className="cf-profile-hero-item">
                  <IdCard size={13} /> {studentId}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Success / Error Alerts */}
        {message && (
          <div className="cf-profile-alert cf-profile-alert-success" role="alert">
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="cf-profile-alert cf-profile-alert-error" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="cf-profile-grid">
            <div className="cf-profile-skeleton" />
            <div className="cf-profile-skeleton" />
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile}>
            <div className="cf-profile-grid">
              {/* Account Credentials Card */}
              <section className="cf-profile-section-card">
                <h3 className="cf-profile-section-title">
                  <Shield size={18} color="#2563eb" />
                  Account Credentials
                </h3>

                <div className="cf-profile-form-stack">
                  {/* Email Address (Read-only) */}
                  <div className="cf-profile-field">
                    <label>Email Address (Linked Account)</label>
                    <div className="cf-profile-input-wrap">
                      <Mail size={16} className="cf-profile-input-icon" />
                      <input
                        type="email"
                        disabled
                        value={currentUser?.email || ""}
                        className="cf-profile-input"
                        aria-label="Email Address"
                      />
                    </div>
                  </div>

                  {/* System Role (Read-only) */}
                  <div className="cf-profile-field">
                    <label>System Access Role</label>
                    <div className="cf-profile-input-wrap">
                      <Shield size={16} className="cf-profile-input-icon" />
                      <input
                        type="text"
                        disabled
                        value={role.toUpperCase()}
                        className="cf-profile-input"
                        aria-label="Access Role"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Academic Information Card */}
              <section className="cf-profile-section-card">
                <h3 className="cf-profile-section-title">
                  <GraduationCap size={18} color="#2563eb" />
                  Academic Information
                </h3>

                <div className="cf-profile-form-stack">
                  {/* Full Name */}
                  <div className="cf-profile-field">
                    <label>Full Name *</label>
                    <div className="cf-profile-input-wrap">
                      <User size={16} className="cf-profile-input-icon" />
                      <input
                        type="text"
                        disabled={saving}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Jane Doe"
                        className="cf-profile-input"
                        required
                        aria-label="Full Name"
                      />
                    </div>
                  </div>

                  {/* Student ID / USN */}
                  <div className="cf-profile-field">
                    <label>University Seat Number (USN) / Student ID</label>
                    <div className="cf-profile-input-wrap">
                      <IdCard size={16} className="cf-profile-input-icon" />
                      <input
                        type="text"
                        disabled={saving}
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="e.g., 1MS21CS042"
                        className="cf-profile-input"
                        aria-label="University Seat Number or Student ID"
                      />
                    </div>
                  </div>

                  {/* Department / Branch */}
                  <div className="cf-profile-field">
                    <label>Department / Branch</label>
                    <div className="cf-profile-input-wrap">
                      <Building2 size={16} className="cf-profile-input-icon" />
                      <input
                        type="text"
                        disabled={saving}
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g., Computer Science & Engineering"
                        className="cf-profile-input"
                        aria-label="Department or Branch"
                      />
                    </div>
                  </div>

                  {/* Semester Standing */}
                  <div className="cf-profile-field">
                    <label>Current Semester</label>
                    <div className="cf-profile-input-wrap">
                      <Calendar size={16} className="cf-profile-input-icon" />
                      <select
                        disabled={saving}
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="cf-profile-select"
                        aria-label="Current Semester"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <option key={sem} value={String(sem)}>
                            Semester {sem}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="cf-profile-submit-btn"
            >
              <Save size={15} />
              {saving ? "Saving Changes..." : "Save Profile Details"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}