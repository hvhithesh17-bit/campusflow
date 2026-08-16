// src/pages/Login.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
      navigate("/dashboard");
    } catch (err) {
      switch (err.code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
          setError("Invalid email or password. Please try again.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/too-many-requests":
          setError("Too many failed attempts. Please try again later.");
          break;
        case "auth/network-request-failed":
          setError("Network error. Please check your internet connection.");
          break;
        default:
          setError("Failed to sign in. Please verify your credentials.");
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
        {/* Left Side: Brand Showcase */}
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
              Your Complete Student Productivity Suite.
            </h1>
            <p
              style={{
                fontSize: "0.95rem",
                color: "rgba(255, 255, 255, 0.85)",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              Track courses, maintain attendance requirements, plan assignment deadlines, and analyze your SGPA with AI assistance.
            </p>
          </div>

          {/* Highlights List */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              marginTop: "2.5rem",
            }}
          >
            {[
              "Real-time 75% attendance threshold monitoring",
              "Smart study recommendations & schedule planner",
              "Interactive credit-weighted SGPA calculator",
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
            <Sparkles size={14} color="#fde047" />
            <span>Built for engineering & semester excellence</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div
          style={{
            padding: "3rem 2.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            backgroundColor: "#ffffff",
          }}
        >
          <div style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: "1.75rem",
                fontWeight: "800",
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              Welcome back
            </h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
              Sign in with your academic credentials to continue.
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

          <form onSubmit={handleLogin}>
            {/* Email Field */}
            <div style={{ marginBottom: "1.25rem" }}>
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
                College / Personal Email
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
            <div style={{ marginBottom: "1.75rem" }}>
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
                Password
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
              {loading ? "Signing in..." : "Sign In to Dashboard"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Registration Link */}
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
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{
                color: "#2563eb",
                textDecoration: "none",
                fontWeight: "700",
              }}
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}