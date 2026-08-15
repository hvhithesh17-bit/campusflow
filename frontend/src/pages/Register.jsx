// src/pages/Register.jsx
import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    // Client-side validation
    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }
    if (cleanName.length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create account in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // 2. Initialize student profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        userId: user.uid,
        name: cleanName,
        email: user.email,
        role: "student",
        semester: "1",
        department: "",
        studentId: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 3. Navigate to Dashboard
      navigate("/dashboard");
    } catch (err) {
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("This email address is already registered. Try logging in.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address format.");
          break;
        case "auth/weak-password":
          setError("Password is too weak. Please use a stronger password with numbers or symbols.");
          break;
        case "auth/network-request-failed":
          setError("Network error. Please check your internet connection and try again.");
          break;
        default:
          setError("Failed to create account. Please verify your details and retry.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
        padding: "1.5rem",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1080px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          boxShadow:
            "0 20px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.03)",
          overflow: "hidden",
        }}
      >
        {/* Left Side: Visual Feature Showcase */}
        <div
          style={{
            background: "linear-gradient(145deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)",
            color: "#ffffff",
            padding: "3rem 2.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <div>
            {/* Logo Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(8px)",
                padding: "8px 16px",
                borderRadius: "12px",
                marginBottom: "2rem",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <GraduationCap size={22} color="#ffffff" />
              <span style={{ fontSize: "1.05rem", fontWeight: "800", letterSpacing: "0.02em" }}>
                CampusFlow
              </span>
            </div>

            <h1
              style={{
                fontSize: "2rem",
                fontWeight: "800",
                lineHeight: "1.25",
                margin: "0 0 1rem 0",
                letterSpacing: "-0.02em",
              }}
            >
              Begin Your Smart Academic Journey.
            </h1>
            <p
              style={{
                fontSize: "0.95rem",
                color: "rgba(255, 255, 255, 0.85)",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              Join CampusFlow to automate attendance alerts, organize coursework priorities, and optimize your semester SGPA.
            </p>
          </div>

          {/* Value Highlights */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              marginTop: "2.5rem",
            }}
          >
            {[
              "Automated low-attendance risk alerts (< 75%)",
              "Dynamic study planner with smart suggestions",
              "Personalized SGPA calculator & course organizer",
              "Private, user-isolated Firestore cloud storage",
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "0.875rem",
                  color: "rgba(255, 255, 255, 0.95)",
                }}
              >
                <CheckCircle2 size={18} color="#93c5fd" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Footer Badge */}
          <div
            style={{
              marginTop: "2.5rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.8rem",
              color: "rgba(255, 255, 255, 0.75)",
            }}
          >
            <ShieldCheck size={16} color="#86efac" />
            <span>Secure Firebase Authentication & Encrypted Storage</span>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div
          style={{
            padding: "3rem 2.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            backgroundColor: "#ffffff",
          }}
        >
          <div style={{ marginBottom: "1.75rem" }}>
            <h2
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: "1.75rem",
                fontWeight: "800",
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              Create Account
            </h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
              Fill in your details below to set up your student workspace.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "0.875rem 1rem",
                backgroundColor: "#fef2f2",
                color: "#991b1b",
                borderRadius: "10px",
                marginBottom: "1.5rem",
                border: "1px solid #fecaca",
                fontSize: "0.875rem",
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister}>
            {/* Full Name */}
            <div style={{ marginBottom: "1.1rem" }}>
              <label
                htmlFor="name"
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "#334155",
                }}
              >
                Full Name *
              </label>
              <div style={{ position: "relative" }}>
                <User
                  size={18}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  id="name"
                  type="text"
                  required
                  disabled={loading}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Hithesh"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem 0.75rem 2.6rem",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "all 0.15s ease",
                  }}
                />
              </div>
            </div>

            {/* Email Field */}
            <div style={{ marginBottom: "1.1rem" }}>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "#334155",
                }}
              >
                Email Address *
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={18}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  id="email"
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@campus.edu"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem 0.75rem 2.6rem",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "all 0.15s ease",
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: "1.1rem" }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "#334155",
                }}
              >
                Password * (min 6 characters)
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={18}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "0.75rem 2.75rem 0.75rem 2.6rem",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "all 0.15s ease",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div style={{ marginBottom: "1.75rem" }}>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "#334155",
                }}
              >
                Confirm Password *
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={18}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "0.75rem 2.75rem 0.75rem 2.6rem",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "all 0.15s ease",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.85rem 1.5rem",
                backgroundColor: loading ? "#94a3b8" : "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "0.95rem",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                transition: "all 0.15s ease",
              }}
            >
              {loading ? "Creating Account..." : "Create Account"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Login Link */}
          <div
            style={{
              marginTop: "2rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid #f1f5f9",
              textAlign: "center",
              fontSize: "0.875rem",
              color: "#64748b",
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "#2563eb",
                textDecoration: "none",
                fontWeight: "700",
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}