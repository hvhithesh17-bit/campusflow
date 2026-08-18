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
  LogOut,
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  CalendarCheck,
  CheckSquare,
  Sparkles,
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

  const userName = currentUser?.displayName?.split(" ")[0] || "Profile";

  return (
    <header className="cf-app-header">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="cf-header-left">
        <button
          type="button"
          onClick={onMenuClick}
          className="cf-header-menu-btn"
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        {/* Mobile Brand indicator (shown on small screens) */}
        <div className="cf-header-brand-wrap">
          <span className="cf-header-brand-mark">C</span>
        </div>

        <div className="cf-header-title-wrap">
          <span className="cf-header-title">{formattedTitle}</span>
        </div>
      </div>

      {/* Right: Quick Action Launchers, Notifications & Profile */}
      <div className="cf-header-right">
        {/* Quick SGPA link */}
        <Link to="/sgpa" className="cf-header-sgpa-btn">
          <Calculator size={14} />
          <span>SGPA</span>
        </Link>

        {/* Notification Bell Popover */}
        <div ref={notificationRef} className="cf-header-notify-wrap">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`cf-header-icon-btn ${isNotificationsOpen ? "is-open" : ""}`}
            title="Academic Notifications"
            aria-label="Notifications"
            aria-expanded={isNotificationsOpen}
          >
            <Bell size={18} color={alerts.length > 0 ? "#2563eb" : "#64748b"} />
            {alerts.length > 0 && (
              <span className="cf-header-notify-badge">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {isNotificationsOpen && (
            <div className="cf-header-dropdown">
              {/* Dropdown Header */}
              <div className="cf-header-dropdown-top">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Bell size={16} color="#2563eb" />
                  <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#0f172a" }}>
                    Academic Alerts
                  </span>
                </div>
                <span className="cf-header-dropdown-counter">
                  {alerts.length} {alerts.length === 1 ? "Alert" : "Alerts"}
                </span>
              </div>

              {/* Alerts List */}
              <div className="cf-header-dropdown-body">
                {alerts.length === 0 ? (
                  <div className="cf-header-empty-alerts">
                    <Sparkles size={24} color="#3b82f6" style={{ margin: "0 auto 8px" }} />
                    <p style={{ margin: 0, fontWeight: "600", color: "#1e293b" }}>All Clear!</p>
                    <p style={{ margin: "4px 0 0", fontSize: "0.78rem" }}>No urgent academic alerts right now.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {alerts.map((alt) => {
                      const isCrit = alt.severity === "critical";
                      const isWarn = alt.severity === "warning";

                      return (
                        <div
                          key={alt.id}
                          className={`cf-header-alert-item ${
                            isCrit ? "is-critical" : isWarn ? "is-warning" : "is-info"
                          }`}
                        >
                          <div className="cf-header-alert-item-title">
                            {isCrit && <AlertCircle size={14} />}
                            {isWarn && <AlertTriangle size={14} />}
                            {!isCrit && !isWarn && <Info size={14} />}
                            <span>{alt.title}</span>
                          </div>
                          <div className="cf-header-alert-item-msg">
                            {alt.message}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Direct Quick Links Footer */}
              <div className="cf-header-dropdown-footer">
                <Link
                  to="/attendance"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="cf-header-dropdown-footer-link"
                >
                  <CalendarCheck size={13} /> Attendance
                </Link>
                <Link
                  to="/assignments"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="cf-header-dropdown-footer-link"
                >
                  <CheckSquare size={13} /> Assignments
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Link */}
        <Link to="/profile" className="cf-header-profile-link" title="My Profile">
          <div className="cf-header-avatar">
            {userInitials}
          </div>
          <span className="cf-header-username">{userName}</span>
        </Link>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="cf-header-logout-btn"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}