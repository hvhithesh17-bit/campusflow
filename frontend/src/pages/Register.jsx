// src/pages/Register.jsx
import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create account in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Store additional profile info in Firestore under the 'users' collection
      // Document ID matches user.uid for direct mapping
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name.trim(),
        email: user.email,
        role: "student",
        createdAt: serverTimestamp()
      });

      // 3. Redirect user to Dashboard upon completion
      navigate("/dashboard");
    } catch (err) {
      // Handle standard Firebase Auth error codes
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("This email address is already registered. Try logging in.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/weak-password":
          setError("Password is too weak. Please use a stronger password.");
          break;
        case "auth/network-request-failed":
          setError("Network error. Please check your internet connection.");
          break;
        default:
          setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px" }}>
      <h2>CampusFlow Registration</h2>

      {/* Error Display */}
      {error && (
        <div
          style={{
            backgroundColor: "#ffebee",
            color: "#c62828",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "15px",
            fontSize: "14px"
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleRegister}>
        {/* Name Field */}
        <div style={{ marginBottom: "12px" }}>
          <label htmlFor="name" style={{ display: "block", marginBottom: "4px" }}>
            Full Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>

        {/* Email Field */}
        <div style={{ marginBottom: "12px" }}>
          <label htmlFor="email" style={{ display: "block", marginBottom: "4px" }}>
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@campus.edu"
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>

        {/* Password Field */}
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="password" style={{ display: "block", marginBottom: "4px" }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: loading ? "#ccc" : "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Creating Account..." : "Register"}
        </button>
      </form>

      <p style={{ marginTop: "15px", fontSize: "14px", textAlign: "center" }}>
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
}