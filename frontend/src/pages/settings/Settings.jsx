import { useEffect, useState } from "react";

import {
  Settings as SettingsIcon,
  Bell,
  CalendarDays,
  BookOpen,
  GraduationCap,
  Moon,
  Sun,
  Monitor,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

import { authAPI } from "../../services/api";

import "./Settings.css";

/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const DEFAULT_SETTINGS = {
  notifications: {
    assignmentReminders: true,
    attendanceAlerts: true,
    studyReminders: true,
    examReminders: true,
  },

  appearance: "system",
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Settings() {
  const [settings, setSettings] =
    useState(DEFAULT_SETTINGS);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwords, setPasswords] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  /* =======================================================
     LOAD SETTINGS
  ======================================================= */

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      /*
        Try loading user data from backend.
        The User model contains notifications
        and appearance.
      */

      const response =
        await authAPI.me();

      const user =
        response?.user ||
        response?.data ||
        response;

      if (user) {
        setSettings({
          notifications: {
            assignmentReminders:
              user?.notifications
                ?.assignmentReminders ??
              true,

            attendanceAlerts:
              user?.notifications
                ?.attendanceAlerts ??
              true,

            studyReminders:
              user?.notifications
                ?.studyReminders ??
              true,

            examReminders:
              user?.notifications
                ?.examReminders ??
              true,
          },

          appearance:
            user?.appearance ||
            "system",
        });
      }
    } catch (err) {
      console.error(
        "Settings loading error:",
        err
      );

      setError(
        "Unable to load settings."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     TOGGLE NOTIFICATION
  ======================================================= */

  function toggleNotification(key) {
    setSettings((current) => ({
      ...current,

      notifications: {
        ...current.notifications,

        [key]:
          !current.notifications[key],
      },
    }));

    setSuccess("");
    setError("");
  }

  /* =======================================================
     CHANGE APPEARANCE
  ======================================================= */

  function changeAppearance(value) {
    setSettings((current) => ({
      ...current,
      appearance: value,
    }));

    setSuccess("");
    setError("");
  }

  /* =======================================================
     SAVE SETTINGS
  ======================================================= */

  async function saveSettings() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      /*
        Requires:
        PUT /api/auth/settings
      */

      const response =
        await authAPI.updateSettings(
          settings
        );

      console.log(
        "Settings update:",
        response
      );

      setSuccess(
        response?.message ||
          "Settings saved successfully."
      );
    } catch (err) {
      console.error(
        "Settings save error:",
        err
      );

      setError(
        err?.response?.data
          ?.message ||
          err?.message ||
          "Unable to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     PASSWORD INPUT
  ======================================================= */

  function handlePasswordChange(event) {
    const {
      name,
      value,
    } = event.target;

    setPasswords((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  /* =======================================================
     CHANGE PASSWORD
  ======================================================= */

  async function handleChangePassword(
    event
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !passwords.currentPassword ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      setError(
        "Please fill in all password fields."
      );

      return;
    }

    if (
      passwords.newPassword.length < 6
    ) {
      setError(
        "New password must be at least 6 characters."
      );

      return;
    }

    if (
      passwords.newPassword !==
      passwords.confirmPassword
    ) {
      setError(
        "New passwords do not match."
      );

      return;
    }

    try {
      setChangingPassword(true);

      /*
        Requires:
        PUT /api/auth/change-password
      */

      const response =
        await authAPI.changePassword({
          currentPassword:
            passwords.currentPassword,

          newPassword:
            passwords.newPassword,
        });

      console.log(
        "Password update:",
        response
      );

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSuccess(
        response?.message ||
          "Password changed successfully."
      );
    } catch (err) {
      console.error(
        "Password change error:",
        err
      );

      setError(
        err?.response?.data
          ?.message ||
          err?.message ||
          "Unable to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">
          <RefreshCw
            size={25}
            className="settings-spin"
          />

          <span>
            Loading settings...
          </span>
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="settings-page">

      {/* ===============================================
          HEADER
      =============================================== */}

      <section className="settings-header">

        <div>
          <div className="settings-eyebrow">
            <SettingsIcon size={16} />

            Preferences
          </div>

          <h1>
            Settings
          </h1>

          <p>
            Manage your notifications,
            appearance and account security.
          </p>
        </div>

        <button
          type="button"
          className="settings-save-button"
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <>
              <RefreshCw
                size={17}
                className="settings-spin"
              />

              Saving...
            </>
          ) : (
            <>
              <Save size={17} />

              Save Settings
            </>
          )}
        </button>

      </section>

      {/* ===============================================
          ALERTS
      =============================================== */}

      {error && (
        <div className="settings-alert error">

          <AlertCircle size={18} />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            ×
          </button>

        </div>
      )}

      {success && (
        <div className="settings-alert success">

          <CheckCircle2 size={18} />

          <span>
            {success}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >
            ×
          </button>

        </div>
      )}

      {/* ===============================================
          NOTIFICATIONS
      =============================================== */}

      <section className="settings-card">

        <div className="settings-card-header">

          <div className="settings-card-icon blue">
            <Bell size={20} />
          </div>

          <div>
            <h2>
              Notifications
            </h2>

            <p>
              Choose which academic
              reminders you want to receive.
            </p>
          </div>

        </div>

        <div className="settings-options">

          <NotificationItem
            icon={BookOpen}
            title="Assignment Reminders"
            description="Get reminded before assignment deadlines."
            enabled={
              settings.notifications
                .assignmentReminders
            }
            onChange={() =>
              toggleNotification(
                "assignmentReminders"
              )
            }
          />

          <NotificationItem
            icon={GraduationCap}
            title="Attendance Alerts"
            description="Get notified when attendance needs attention."
            enabled={
              settings.notifications
                .attendanceAlerts
            }
            onChange={() =>
              toggleNotification(
                "attendanceAlerts"
              )
            }
          />

          <NotificationItem
            icon={CalendarDays}
            title="Study Reminders"
            description="Receive reminders for your study tasks."
            enabled={
              settings.notifications
                .studyReminders
            }
            onChange={() =>
              toggleNotification(
                "studyReminders"
              )
            }
          />

          <NotificationItem
            icon={Bell}
            title="Exam Reminders"
            description="Stay updated about upcoming examinations."
            enabled={
              settings.notifications
                .examReminders
            }
            onChange={() =>
              toggleNotification(
                "examReminders"
              )
            }
          />

        </div>

      </section>

      {/* ===============================================
          APPEARANCE
      =============================================== */}

      <section className="settings-card">

        <div className="settings-card-header">

          <div className="settings-card-icon purple">
            <Sun size={20} />
          </div>

          <div>
            <h2>
              Appearance
            </h2>

            <p>
              Choose how CampusFlow looks.
            </p>
          </div>

        </div>

        <div className="appearance-options">

          <AppearanceOption
            icon={Sun}
            title="Light"
            value="light"
            current={
              settings.appearance
            }
            onChange={
              changeAppearance
            }
          />

          <AppearanceOption
            icon={Moon}
            title="Dark"
            value="dark"
            current={
              settings.appearance
            }
            onChange={
              changeAppearance
            }
          />

          <AppearanceOption
            icon={Monitor}
            title="System"
            value="system"
            current={
              settings.appearance
            }
            onChange={
              changeAppearance
            }
          />

        </div>

      </section>

      {/* ===============================================
          SECURITY
      =============================================== */}

      <section className="settings-card">

        <div className="settings-card-header">

          <div className="settings-card-icon orange">
            <Lock size={20} />
          </div>

          <div>
            <h2>
              Security
            </h2>

            <p>
              Update your account password.
            </p>
          </div>

        </div>

        <form
          className="settings-password-form"
          onSubmit={
            handleChangePassword
          }
        >

          {/* CURRENT PASSWORD */}

          <div className="settings-form-group">

            <label>
              Current Password
            </label>

            <div className="password-input">

              <input
                type={
                  showCurrentPassword
                    ? "text"
                    : "password"
                }
                name="currentPassword"
                value={
                  passwords.currentPassword
                }
                onChange={
                  handlePasswordChange
                }
                placeholder="Enter current password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowCurrentPassword(
                    (value) => !value
                  )
                }
              >
                {showCurrentPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>

            </div>

          </div>

          {/* NEW PASSWORD */}

          <div className="settings-form-group">

            <label>
              New Password
            </label>

            <div className="password-input">

              <input
                type={
                  showNewPassword
                    ? "text"
                    : "password"
                }
                name="newPassword"
                value={
                  passwords.newPassword
                }
                onChange={
                  handlePasswordChange
                }
                placeholder="Enter new password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowNewPassword(
                    (value) => !value
                  )
                }
              >
                {showNewPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>

            </div>

          </div>

          {/* CONFIRM PASSWORD */}

          <div className="settings-form-group">

            <label>
              Confirm New Password
            </label>

            <div className="password-input">

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                name="confirmPassword"
                value={
                  passwords.confirmPassword
                }
                onChange={
                  handlePasswordChange
                }
                placeholder="Confirm new password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (value) => !value
                  )
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>

            </div>

          </div>

          <div className="settings-password-footer">

            <p>
              Use at least 6 characters for
              your new password.
            </p>

            <button
              type="submit"
              className="settings-password-button"
              disabled={
                changingPassword
              }
            >
              {changingPassword ? (
                <>
                  <RefreshCw
                    size={16}
                    className="settings-spin"
                  />

                  Updating...
                </>
              ) : (
                <>
                  <Lock size={16} />

                  Change Password
                </>
              )}
            </button>

          </div>

        </form>

      </section>

      {/* ===============================================
          FOOTER
      =============================================== */}

      <div className="settings-footer-note">

        <SettingsIcon size={15} />

        Your settings are securely connected
        to your CampusFlow account.

        <ChevronRight size={15} />

      </div>

    </div>
  );
}

/* =========================================================
   NOTIFICATION ITEM
========================================================= */

function NotificationItem({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
}) {
  return (
    <div className="notification-item">

      <div className="notification-icon">
        <Icon size={18} />
      </div>

      <div className="notification-content">

        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>

      </div>

      <button
        type="button"
        className={
          enabled
            ? "settings-toggle active"
            : "settings-toggle"
        }
        onClick={onChange}
        aria-label={`Toggle ${title}`}
      >
        <span />
      </button>

    </div>
  );
}

/* =========================================================
   APPEARANCE OPTION
========================================================= */

function AppearanceOption({
  icon: Icon,
  title,
  value,
  current,
  onChange,
}) {
  const selected =
    current === value;

  return (
    <button
      type="button"
      className={
        selected
          ? "appearance-option selected"
          : "appearance-option"
      }
      onClick={() =>
        onChange(value)
      }
    >

      <Icon size={22} />

      <span>
        {title}
      </span>

      {selected && (
        <CheckCircle2
          size={17}
        />
      )}

    </button>
  );
}