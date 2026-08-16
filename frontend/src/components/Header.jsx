// src/components/Header.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { generateAcademicAlerts } from "../utils/dashboardUtils";
import {
  Menu,
  Calculator,
  Brain,
  LogOut,
  Bell,
  X,
  AlertCircle,
  AlertTriangle,
  Info,
  CalendarCheck,
  CheckSquare,
} from "lucide-react";

export default function Header({ pageTitle, onMenuClick }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Notification State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [studyGoals, setStudyGoals] = useState([]);
  const notificationRef = useRef(null);

  // Close notification popover on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen to collections in real time to generate active alerts
  useEffect(() => {
    if (!currentUser) return;

    const qSub = query(collection(db, "subjects"), where("userId", "==", currentUser.uid));
    const qAtt = query(collection(db, "attendance"), where("userId", "==", currentUser.uid));
    const qAsg = query(collection(db, "assignments"), where("userId", "==", currentUser.uid));
    const qStd = query(collection(db, "studySessions"), where("userId", "==", currentUser.uid));
    const qGol = query(collection(db, "studyGoals"), where("userId", "==", currentUser.uid));

    const unsubSub = onSnapshot(qSub, (s) => setSubjects(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubAtt = onSnapshot(qAtt, (s) => setAttendance(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubAsg = onSnapshot(qAsg, (s) => setAssignments(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubStd = onSnapshot(qStd, (s) => setStudySessions(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubGol = onSnapshot(qGol, (s) => setStudyGoals(s.docs.map((d) => ({ id: d.id, ...d.data() }))));

    return () => {
      unsubSub();
      unsubAtt();
      unsubAsg();
      unsubStd();
      unsubGol();
    };
  }, [currentUser]);

  // Compute live academic alerts
  const alerts = generateAcademicAlerts({
    subjects,
    attendance,
    assignments,
    studySessions,
    studyGoals,
  });

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      navigate("/login");
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  const formattedTitle = pageTitle
    ? pageTitle
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Dashboard";

  const userInitials = (
    currentUser?.displayName ||
    currentUser?.email?.split("@")[0] ||
    "ST"
  )
    .substring(0, 2)
    .toUpperCase();

  return (
    <header
      style={{
        height: "64px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        position: "sticky",
        top: 0,
        zIndex: 30,
        boxSizing: "border-box",
      }}
    >
      {/* Left: Mobile Toggle & Page Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          type="button"
          onClick={onMenuClick}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            color: "#475569",
            cursor: "pointer",
            padding: "6px",
            borderRadius: "6px",
          }}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "1.1rem",
              fontWeight: "700",
              color: "#0f172a",
              letterSpacing: "-0.01em",
            }}
          >
            {formattedTitle}
          </span>
        </div>
      </div>

      {/* Right: Quick Action Launchers & Notification Hub */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Quick SGPA */}
        <Link
          to="/sgpa"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "8px",
            backgroundColor: "#eff6ff",
            color: "#2563eb",
            border: "1px solid #bfdbfe",
            fontSize: "0.8rem",
            fontWeight: "600",
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
        >
          <Calculator size={14} />
          <span>SGPA</span>
        </Link>

        {/* Quick AI Action */}
        <Link
          to="/ai-assistant"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "8px",
            backgroundColor: "#faf5ff",
            color: "#9333ea",
            border: "1px solid #e9d5ff",
            fontSize: "0.8rem",
            fontWeight: "600",
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
        >
          <Brain size={14} />
          <span>Ask AI</span>
        </Link>

        {/* ========================================================= */}
        {/* NOTIFICATION BELL & DROPDOWN CENTER */}
        {/* ========================================================= */}
        <div ref={notificationRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              padding: "8px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              backgroundColor: isNotificationsOpen ? "#f1f5f9" : "#ffffff",
              color: alerts.length > 0 ? "#2563eb" : "#64748b",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Academic Notifications"
          >
            <Bell size={18} />
            {alerts.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  fontSize: "0.65rem",
                  fontWeight: "800",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #ffffff",
                }}
              >
                {alerts.length}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {isNotificationsOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: "340px",
                maxHeight: "420px",
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 12px 28px -4px rgba(15, 23, 42, 0.15)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                zIndex: 60,
              }}
            >
              {/* Dropdown Header */}
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "#f8fafc",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Bell size={16} color="#2563eb" />
                  <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#0f172a" }}>
                    Academic Alerts
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    backgroundColor: alerts.length > 0 ? "#eff6ff" : "#f1f5f9",
                    color: alerts.length > 0 ? "#2563eb" : "#64748b",
                    fontWeight: "700",
                  }}
                >
                  {alerts.length} {alerts.length === 1 ? "Alert" : "Alerts"}
                </span>
              </div>

              {/* Alerts List */}
              <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
                {alerts.length === 0 ? (
                  <div
                    style={{
                      padding: "2rem 1rem",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "0.85rem",
                    }}
                  >
                    ✨ All clear! No urgent academic alerts right now.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {alerts.map((alt) => {
                      const isCrit = alt.severity === "critical";
                      const isWarn = alt.severity === "warning";

                      return (
                        <div
                          key={alt.id}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "8px",
                            backgroundColor: isCrit
                              ? "#fef2f2"
                              : isWarn
                              ? "#fffbeb"
                              : "#eff6ff",
                            border: `1px solid ${
                              isCrit
                                ? "#fecaca"
                                : isWarn
                                ? "#fde68a"
                                : "#bfdbfe"
                            }`,
                            display: "flex",
                            flexDirection: "column",
                            gap: "3px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "0.8rem",
                              fontWeight: "700",
                              color: isCrit
                                ? "#991b1b"
                                : isWarn
                                ? "#92400e"
                                : "#1e40af",
                            }}
                          >
                            {isCrit && <AlertCircle size={14} />}
                            {isWarn && <AlertTriangle size={14} />}
                            {!isCrit && !isWarn && <Info size={14} />}
                            <span>{alt.title}</span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#334155", lineHeight: 1.4 }}>
                            {alt.message}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Direct Quick Links Footer */}
              <div
                style={{
                  padding: "8px 12px",
                  borderTop: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Link
                  to="/attendance"
                  onClick={() => setIsNotificationsOpen(false)}
                  style={{
                    fontSize: "0.75rem",
                    color: "#2563eb",
                    textDecoration: "none",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <CalendarCheck size={12} /> Attendance
                </Link>
                <Link
                  to="/assignments"
                  onClick={() => setIsNotificationsOpen(false)}
                  style={{
                    fontSize: "0.75rem",
                    color: "#2563eb",
                    textDecoration: "none",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <CheckSquare size={12} /> Assignments
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Badge */}
        <Link
          to="/profile"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 8px 4px 4px",
            borderRadius: "9999px",
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: "700",
            }}
          >
            {userInitials}
          </div>
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: "600",
              color: "#334155",
              paddingRight: "4px",
            }}
          >
            {currentUser?.displayName?.split(" ")[0] || "Profile"}
          </span>
        </Link>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "7px 10px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            backgroundColor: "#ffffff",
            color: "#64748b",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}