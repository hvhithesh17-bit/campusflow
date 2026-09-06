import React, { useState, useEffect } from "react";
import {
  Bell,
  Shield,
  Moon,
  Sun,
  Smartphone,
  Send,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  requestNotificationPermission,
  triggerLocalNotification,
  registerTokenWithFirestore,
} from "../services/notifications";
import "./Settings.css";

export default function Settings() {
  const { currentUser } = useAuth();

  const [notifications, setNotifications] = useState({
    assignmentReminders: true,
    attendanceAlerts: true,
    studyReminders: true,
    examReminders: true,
  });

  const [permissionStatus, setPermissionStatus] = useState(
    typeof Notification !== "undefined"
      ? Notification.permission
      : "default"
  );

  const [fcmToken, setFcmToken] = useState(
    localStorage.getItem("cf_fcm_token") || ""
  );
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);

  // Auto-sync token if permission is already granted
  useEffect(() => {
    if (
      currentUser &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      registerTokenWithFirestore(currentUser).then((res) => {
        if (res?.token) {
          setFcmToken(res.token);
        }
      });
    }
  }, [currentUser]);

  const handleNotificationToggle = async (key) => {
    const newValue = !notifications[key];

    setNotifications((prev) => ({
      ...prev,
      [key]: newValue,
    }));

    if (newValue && permissionStatus !== "granted") {
      if (!currentUser) {
        setMessage("Please log in first.");
        return;
      }

      setLoadingAction(true);
      const result = await requestNotificationPermission(currentUser);
      setLoadingAction(false);

      if (result.success) {
        setPermissionStatus("granted");
        if (result.token) setFcmToken(result.token);
        setMessage("Push notifications enabled successfully!");
      } else {
        setPermissionStatus(result.permission || "denied");
        setNotifications((prev) => ({
          ...prev,
          [key]: false,
        }));
        setMessage(result.message || "Could not enable push notifications.");
      }

      setTimeout(() => setMessage(""), 4000);
    }
  };

  const handleEnablePush = async () => {
    if (!currentUser) {
      setMessage("Please log in first.");
      return;
    }

    setLoadingAction(true);
    const result = await requestNotificationPermission(currentUser);
    setLoadingAction(false);

    if (result.success) {
      setPermissionStatus("granted");
      if (result.token) setFcmToken(result.token);
      setMessage("Push notifications enabled and FCM token registered!");
    } else {
      setPermissionStatus(result.permission || "denied");
      setMessage(result.message || "Could not enable push notifications.");
    }

    setTimeout(() => setMessage(""), 4000);
  };

  const handleSendTestNotification = async () => {
    if (permissionStatus !== "granted") {
      setMessage("Please enable notifications first.");
      setTimeout(() => setMessage(""), 4000);
      return;
    }

    const success = await triggerLocalNotification(
      "🚀 CampusFlow FCM Test",
      {
        body: "Firebase Cloud Messaging is active and operational for your account!",
        tag: "cf-test-notification",
      }
    );

    if (success) {
      setMessage("Test notification dispatched to your browser!");
    } else {
      setMessage("Could not display notification. Check browser settings.");
    }

    setTimeout(() => setMessage(""), 4000);
  };

  const handleCopyToken = () => {
    if (!fcmToken) return;
    navigator.clipboard.writeText(fcmToken);
    setCopied(true);
    setMessage("FCM Registration Token copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
    setTimeout(() => setMessage(""), 4000);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your CampusFlow preferences and cloud messaging</p>
        </div>
      </div>

      {message && <div className="settings-message">{message}</div>}

      {/* FCM Push Notifications */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div className="settings-icon">
            <Bell size={22} />
          </div>

          <div>
            <h2>Firebase Cloud Messaging (FCM)</h2>
            <p>Receive real-time push alerts for assignments, attendance, and study plans.</p>
          </div>
        </div>

        <div className="notification-status">
          <div className="notification-status-info">
            <strong>FCM Push Status</strong>
            <span
              className={`status-pill ${
                permissionStatus === "granted"
                  ? "is-active"
                  : permissionStatus === "denied"
                  ? "is-blocked"
                  : "is-inactive"
              }`}
            >
              {permissionStatus === "granted"
                ? "● Active & Registered"
                : permissionStatus === "denied"
                ? "● Blocked in Browser"
                : "○ Not Enabled"}
            </span>
          </div>

          <div className="notification-status-actions">
            {permissionStatus !== "granted" ? (
              <button
                type="button"
                className="enable-button"
                onClick={handleEnablePush}
                disabled={loadingAction}
              >
                <Smartphone size={16} />
                <span>{loadingAction ? "Connecting..." : "Enable Push Notifications"}</span>
              </button>
            ) : (
              <button
                type="button"
                className="test-btn"
                onClick={handleSendTestNotification}
                title="Send test notification"
              >
                <Send size={15} />
                <span>Send Test Alert</span>
              </button>
            )}
          </div>
        </div>

        {/* Token Info Box when active */}
        {fcmToken && (
          <div className="fcm-token-box">
            <div className="fcm-token-label">
              <Zap size={14} color="#3b82f6" />
              <span>Device Registration Token:</span>
            </div>
            <div className="fcm-token-content">
              <code>{fcmToken.substring(0, 32)}...{fcmToken.slice(-12)}</code>
              <button
                type="button"
                className="token-copy-btn"
                onClick={handleCopyToken}
                title="Copy FCM Registration Token"
              >
                {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                <span>{copied ? "Copied" : "Copy Token"}</span>
              </button>
            </div>
          </div>
        )}

        <div className="settings-options">
          <NotificationRow
            title="Assignment Reminders"
            description="Get alerts before assignments and submissions are due."
            checked={notifications.assignmentReminders}
            onChange={() => handleNotificationToggle("assignmentReminders")}
          />

          <NotificationRow
            title="Attendance Alerts"
            description="Get immediate warnings if attendance drops near the 75% threshold."
            checked={notifications.attendanceAlerts}
            onChange={() => handleNotificationToggle("attendanceAlerts")}
          />

          <NotificationRow
            title="Study Reminders"
            description="Receive scheduled study session reminders and daily targets."
            checked={notifications.studyReminders}
            onChange={() => handleNotificationToggle("studyReminders")}
          />

          <NotificationRow
            title="Exam & IA Reminders"
            description="Get countdowns and notifications for upcoming internal assessments."
            checked={notifications.examReminders}
            onChange={() => handleNotificationToggle("examReminders")}
          />
        </div>
      </section>

      {/* Appearance */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div className="settings-icon">
            <Moon size={22} />
          </div>

          <div>
            <h2>Appearance</h2>
            <p>Customize how CampusFlow looks on your device.</p>
          </div>
        </div>

        <div className="appearance-options">
          <button type="button" className="appearance-option active">
            <Sun size={20} />
            <span>Light</span>
          </button>

          <button type="button" className="appearance-option">
            <Moon size={20} />
            <span>Dark</span>
          </button>
        </div>
      </section>

      {/* Account Info */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div className="settings-icon">
            <Shield size={22} />
          </div>

          <div>
            <h2>Account Security</h2>
            <p>Manage your authenticated CampusFlow account.</p>
          </div>
        </div>

        <div className="account-info">
          <div>
            <span>Email</span>
            <strong>{currentUser?.email || "Not available"}</strong>
          </div>

          <div>
            <span>Account UID</span>
            <strong>
              {currentUser?.uid
                ? `${currentUser.uid.substring(0, 14)}...`
                : "Not available"}
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
}

function NotificationRow({ title, description, checked, onChange }) {
  return (
    <div className="notification-row">
      <div className="notification-text">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <label className="switch">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="slider"></span>
      </label>
    </div>
  );
}