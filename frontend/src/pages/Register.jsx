// src/pages/Register.jsx
import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
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

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }
    if (cleanName.length < 2) {
      setError("Name must be at least 2 characters long.");
      return;
    }
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );
      const user = userCredential.user;

      // Update Auth Profile Display Name
      await updateProfile(user, {
        displayName: cleanName,
      });

      // 2. Initialize Firestore User Document
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
          setError("Password is too weak. Please use a stronger password.");
          break;
        case "auth/network-request-failed":
          setError("Network error. Please check your internet connection.");
          break;
        default:
          setError("Failed to create account. Please verify your details and retry.");
      }
    } finally {
      setLoading(false);
    }
  };

  const registerStyles = `
    .cf-auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f8fafc;
      padding: 24px 20px;
      box-sizing: border-box;
      font-family: inherit;
    }

    .cf-auth-box {
      width: 100%;
      max-width: 440px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 36px 32px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      box-sizing: border-box;
    }

    .cf-auth-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 24px;
    }

    .cf-auth-logo-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #2563eb;
      color: #ffffff;
      display: grid;
      place-items: center;
    }

    .cf-auth-logo-text {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .cf-auth-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .cf-auth-header h1 {
      margin: 0 0 6px 0;
      font-size: 1.35rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .cf-auth-header p {
      margin: 0;
      color: #64748b;
      font-size: 0.85rem;
    }

    .cf-auth-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      border-radius: 8px;
      font-size: 0.82rem;
      margin-bottom: 18px;
    }

    .cf-form-group {
      margin-bottom: 16px;
    }

    .cf-form-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 6px;
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

    .cf-auth-footer {
      text-align: center;
      font-size: 0.82rem;
      color: #64748b;
      margin: 0;
    }

    .cf-auth-link {
      color: #2563eb;
      font-weight: 600;
      text-decoration: none;
    }

    .cf-auth-link:hover {
      text-decoration: underline;
    }
  `;

  return (
    <div className="cf-auth-container">
      <style>{registerStyles}</style>
      <div className="cf-auth-box">

        {/* Brand Logo */}
        <div className="cf-auth-logo">
          <div className="cf-auth-logo-icon">
            <GraduationCap size={22} />
          </div>
          <span className="cf-auth-logo-text">CampusFlow</span>
        </div>

        {/* Heading */}
        <div className="cf-auth-header">
          <h1>Create account</h1>
          <p>Start tracking your academic progress</p>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="cf-auth-error" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister}>
          {/* Full Name */}
          <div className="cf-form-group">
            <label className="cf-form-label">Full name</label>
            <div className="cf-input-wrapper">
              <User size={16} className="cf-input-icon" />
              <input
                type="text"
                required
                disabled={loading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Johnson"
                className="cf-input"
                autoComplete="name"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="cf-form-group">
            <label className="cf-form-label">Email address</label>
            <div className="cf-input-wrapper">
              <Mail size={16} className="cf-input-icon" />
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="cf-input"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="cf-form-group">
            <label className="cf-form-label">Password</label>
            <div className="cf-input-wrapper">
              <Lock size={16} className="cf-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="cf-input"
                style={{ paddingRight: "36px" }}
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <div className="cf-form-group">
            <label className="cf-form-label">Confirm password</label>
            <div className="cf-input-wrapper">
              <Lock size={16} className="cf-input-icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                disabled={loading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="cf-input"
                style={{ paddingRight: "36px" }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="cf-toggle-btn"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="cf-submit-btn">
            {loading ? "Creating account..." : "Create account"}
            {!loading && <ArrowRight size={15} />}
          </button>

          {/* Footer Link */}
          <p className="cf-auth-footer">
            Already have an account?{" "}
            <Link to="/login" className="cf-auth-link">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}