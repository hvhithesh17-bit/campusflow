// src/pages/Login.jsx
import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
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
  CheckCircle2,
} from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

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
          setError("Invalid email or password.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/too-many-requests":
          setError("Too many attempts. Please try again later.");
          break;
        case "auth/network-request-failed":
          setError("Network error. Please check your connection.");
          break;
        default:
          setError("Failed to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setSuccessMsg("");

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your email address above to reset your password.");
      return;
    }

    setResetting(true);

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setSuccessMsg("Password reset link has been sent to your email.");
    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":
          setError("No account found with this email address.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/too-many-requests":
          setError("Too many reset attempts. Please try again later.");
          break;
        default:
          setError("Failed to send reset link. Please verify your email.");
      }
    } finally {
      setResetting(false);
    }
  };

  const loginStyles = `
    .cf-login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f8fafc;
      padding: 20px;
      box-sizing: border-box;
      font-family: inherit;
    }

    .cf-login-box {
      width: 100%;
      max-width: 420px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 36px 32px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      box-sizing: border-box;
    }

    .cf-login-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 24px;
    }

    .cf-login-logo-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #2563eb;
      color: #ffffff;
      display: grid;
      place-items: center;
    }

    .cf-login-logo-text {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .cf-login-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .cf-login-header h1 {
      margin: 0 0 6px 0;
      font-size: 1.35rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .cf-login-header p {
      margin: 0;
      color: #64748b;
      font-size: 0.85rem;
    }

    .cf-login-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 0.82rem;
      margin-bottom: 18px;
      line-height: 1.4;
    }

    .cf-login-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .cf-login-success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
    }

    .cf-form-group {
      margin-bottom: 16px;
    }

    .cf-form-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .cf-form-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #334155;
    }

    .cf-forgot-btn {
      background: none;
      border: none;
      padding: 0;
      font-size: 0.78rem;
      font-weight: 600;
      color: #2563eb;
      cursor: pointer;
      font-family: inherit;
    }

    .cf-forgot-btn:hover:not(:disabled) {
      text-decoration: underline;
    }

    .cf-forgot-btn:disabled {
      color: #94a3b8;
      cursor: not-allowed;
    }

    .cf-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .cf-input-icon {
      position: absolute;
      left: 12px;
      color: #94a3b8;
      pointer-events: none;
    }

    .cf-input {
      width: 100%;
      height: 42px;
      padding: 0 12px 0 38px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      font-family: inherit;
      color: #0f172a;
      background: #ffffff;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .cf-input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .cf-input:disabled {
      background: #f8fafc;
      color: #94a3b8;
      cursor: not-allowed;
    }

    .cf-toggle-btn {
      position: absolute;
      right: 10px;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cf-toggle-btn:hover {
      color: #475569;
    }

    .cf-submit-btn {
      width: 100%;
      height: 42px;
      margin-top: 8px;
      margin-bottom: 20px;
      border: none;
      border-radius: 8px;
      background: #2563eb;
      color: #ffffff;
      font-size: 0.88rem;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background 0.15s;
    }

    .cf-submit-btn:hover:not(:disabled) {
      background: #1d4ed8;
    }

    .cf-submit-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .cf-login-footer {
      text-align: center;
      font-size: 0.82rem;
      color: #64748b;
      margin: 0;
    }

    .cf-login-link {
      color: #2563eb;
      font-weight: 600;
      text-decoration: none;
    }

    .cf-login-link:hover {
      text-decoration: underline;
    }
  `;

  return (
    <div className="cf-login-container">
      <style>{loginStyles}</style>
      <div className="cf-login-box">
        {/* Brand Logo */}
        <div className="cf-login-logo">
          <div className="cf-login-logo-icon">
            <GraduationCap size={22} />
          </div>
          <span className="cf-login-logo-text">CampusFlow</span>
        </div>

        {/* Heading */}
        <div className="cf-login-header">
          <h1>Sign in</h1>
          <p>Access your student portal</p>
        </div>

        {/* Status Notices */}
        {error && (
          <div className="cf-login-alert cf-login-error" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="cf-login-alert cf-login-success" role="status">
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div className="cf-form-group">
            <label className="cf-form-label" style={{ display: "block", marginBottom: "6px" }}>
              Email address
            </label>
            <div className="cf-input-wrapper">
              <Mail size={16} className="cf-input-icon" />
              <input
                type="email"
                required
                disabled={loading || resetting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="cf-input"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="cf-form-group">
            <div className="cf-form-label-row">
              <label className="cf-form-label">Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading || resetting}
                className="cf-forgot-btn"
              >
                {resetting ? "Sending link..." : "Forgot password?"}
              </button>
            </div>
            <div className="cf-input-wrapper">
              <Lock size={16} className="cf-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={loading || resetting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="cf-input"
                style={{ paddingRight: "36px" }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cf-toggle-btn"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || resetting}
            className="cf-submit-btn"
          >
            {loading ? "Signing in..." : "Sign in"}
            {!loading && <ArrowRight size={15} />}
          </button>

          <p className="cf-login-footer">
            Don't have an account?{" "}
            <Link to="/register" className="cf-login-link">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}