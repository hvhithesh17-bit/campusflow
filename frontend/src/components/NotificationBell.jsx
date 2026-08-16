// src/components/NotificationBell.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { generateNotifications } from "../utils/notificationEngine";
import {
  getUserNotifications,
  syncNotificationsToFirestore,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "../utils/notificationService";

export default function NotificationBell({
  userId,
  subjects = [],
  attendance = [],
  assignments = [],
  studySessions = [],
  studyGoals = [],
  onNavigate // Optional navigation callback if not using react-router-dom
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'unread' | 'critical' | 'warnings'
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  let navigate;
  try {
    navigate = useNavigate();
  } catch {
    navigate = null;
  }

  // 1. Calculate active reminder states
  const derivedAlerts = useMemo(() => {
    return generateNotifications({
      subjects,
      attendance,
      assignments,
      studySessions,
      studyGoals
    });
  }, [subjects, attendance, assignments, studySessions, studyGoals]);

  // 2. Fetch and sync with Firestore
  const syncData = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      if (derivedAlerts.length > 0) {
        const synced = await syncNotificationsToFirestore(userId, derivedAlerts);
        setNotifications(synced);
      } else {
        const existing = await getUserNotifications(userId);
        setNotifications(existing);
      }
    } catch (err) {
      console.error("Failed to sync notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, derivedAlerts]);

  useEffect(() => {
    syncData();
  }, [syncData]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // 3. Tab Filter Logic
  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((n) => !n.read);
      case "critical":
        return notifications.filter((n) => n.severity === "critical");
      case "warnings":
        return notifications.filter((n) => n.severity === "warning");
      case "all":
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  // 4. Mark as Read Actions (Optimistic Updates)
  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );

    try {
      await markNotificationAsRead(id);
    } catch (error) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: false } : item))
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const prev = [...notifications];
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));

    try {
      await markAllNotificationsAsRead(notifications);
    } catch (error) {
      setNotifications(prev);
    }
  };

  // 5. Item Click / Navigation
  const handleNotificationClick = (item) => {
    if (!item.read) {
      handleMarkAsRead({ stopPropagation: () => {} }, item.id);
    }
    if (item.targetRoute) {
      if (onNavigate) {
        onNavigate(item.targetRoute);
      } else if (navigate) {
        navigate(item.targetRoute);
      }
      setIsOpen(false);
    }
  };

  const getIcon = (severity, type) => {
    if (severity === "critical") return "🔴";
    if (severity === "warning") return "⚠️";
    if (severity === "success") return "✅";
    if (type?.includes("session")) return "📅";
    return "📘";
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "transparent",
          border: "none",
          fontSize: "1.25rem",
          cursor: "pointer",
          position: "relative",
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        aria-label="Open notification center"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              backgroundColor: "#ef4444",
              color: "#ffffff",
              borderRadius: "9999px",
              padding: "2px 6px",
              fontSize: "0.72rem",
              fontWeight: "700",
              lineHeight: 1
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Center Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "44px",
            width: "360px",
            maxWidth: "90vw",
            maxHeight: "480px",
            backgroundColor: "#ffffff",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              borderBottom: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>Notifications</strong>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: "#e0e7ff",
                    color: "#3730a3",
                    fontSize: "0.7rem",
                    fontWeight: "600",
                    padding: "1px 6px",
                    borderRadius: "4px"
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
              padding: "4px 8px"
            }}
          >
            {[
              { id: "all", label: "All" },
              { id: "unread", label: "Unread" },
              { id: "critical", label: "Critical" },
              { id: "warnings", label: "Warnings" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  border: "none",
                  background: activeTab === tab.id ? "#eff6ff" : "transparent",
                  color: activeTab === tab.id ? "#1d4ed8" : "#64748b",
                  fontWeight: activeTab === tab.id ? "600" : "500",
                  fontSize: "0.75rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
                Checking smart reminders...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
                No {activeTab !== "all" ? activeTab : ""} notifications.
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f1f5f9",
                    backgroundColor: item.read ? "#ffffff" : "#f0fdf4",
                    cursor: "pointer",
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                    transition: "background-color 0.15s ease"
                  }}
                >
                  <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>
                    {getIcon(item.severity, item.type)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span
                        style={{
                          fontWeight: item.read ? "600" : "700",
                          fontSize: "0.85rem",
                          color: "#1e293b"
                        }}
                      >
                        {item.title}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                        {formatTime(item.createdAt)}
                      </span>
                    </div>
                    <p style={{ margin: "3px 0 6px 0", fontSize: "0.8rem", color: "#475569", lineHeight: 1.35 }}>
                      {item.message}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "#3b82f6",
                          fontWeight: "500"
                        }}
                      >
                        {item.targetRoute === "/assignments" && "View Assignment →"}
                        {item.targetRoute === "/attendance" && "View Attendance →"}
                        {item.targetRoute === "/planner" && "View Planner →"}
                      </span>
                      {!item.read && (
                        <button
                          onClick={(e) => handleMarkAsRead(e, item.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#64748b",
                            fontSize: "0.7rem",
                            cursor: "pointer",
                            padding: "0"
                          }}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}