// src/components/NotificationToast.jsx
import React, { useState, useEffect } from "react";
import { Bell, X, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { listenForNotifications } from "../services/notifications";
import { useAuth } from "../context/AuthContext";
import "./NotificationToast.css";

export default function NotificationToast() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeNotification, setActiveNotification] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    let unsubscribe = () => {};

    listenForNotifications((payload) => {
      const title =
        payload.notification?.title ||
        payload.data?.title ||
        "CampusFlow Alert";

      const message =
        payload.notification?.body ||
        payload.data?.body ||
        payload.data?.message ||
        "New academic notification received.";

      const targetRoute =
        payload.data?.targetRoute ||
        payload.data?.url ||
        payload.fcmOptions?.link ||
        null;

      const newNotification = {
        id: Date.now(),
        title,
        message,
        targetRoute,
      };

      setActiveNotification(newNotification);

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setActiveNotification((current) =>
          current?.id === newNotification.id ? null : current
        );
      }, 6000);
    }).then((unsub) => {
      if (typeof unsub === "function") {
        unsubscribe = unsub;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  if (!activeNotification) return null;

  const handleActionClick = () => {
    if (activeNotification.targetRoute) {
      if (activeNotification.targetRoute.startsWith("http")) {
        window.open(activeNotification.targetRoute, "_blank");
      } else {
        navigate(activeNotification.targetRoute);
      }
    }
    setActiveNotification(null);
  };

  return (
    <div className="cf-fcm-toast" role="alert" aria-live="assertive">
      <div className="cf-fcm-toast-icon">
        <Bell size={20} />
      </div>

      <div className="cf-fcm-toast-content">
        <h4 className="cf-fcm-toast-title">{activeNotification.title}</h4>
        <p className="cf-fcm-toast-body">{activeNotification.message}</p>
      </div>

      <div className="cf-fcm-toast-actions">
        {activeNotification.targetRoute && (
          <button
            type="button"
            className="cf-fcm-toast-btn"
            onClick={handleActionClick}
          >
            <span>View</span>
            <ExternalLink size={13} />
          </button>
        )}

        <button
          type="button"
          className="cf-fcm-toast-close"
          onClick={() => setActiveNotification(null)}
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
