// src/services/notifications.js

import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  deleteToken,
} from "firebase/messaging";

import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

import { app, db } from "../firebase";

export const VAPID_KEY =
  "BEpLvD1ldCtWV78yYf7w-Y_xD8EG1YEG1VkSZpUl5-U_7RMLJ6QGbZ4jhIGF5-dwuvq1YAidAmgPAbnw628tNt4";

let messaging = null;

/* ---------------------------------------
   Get Firebase Messaging instance
--------------------------------------- */
export async function getMessagingInstance() {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const supported = await isSupported();

    if (!supported) {
      console.warn("Firebase Messaging is not supported in this browser environment.");
      return null;
    }

    if (!messaging) {
      messaging = getMessaging(app);
    }

    return messaging;
  } catch (error) {
    console.error("Firebase Messaging initialization failed:", error);
    return null;
  }
}

/* ---------------------------------------
   Request permission + register FCM token
--------------------------------------- */
export async function requestNotificationPermission(user) {
  try {
    if (!user) {
      return {
        success: false,
        message: "You must be logged in first.",
      };
    }

    if (typeof window === "undefined" || !("Notification" in window)) {
      return {
        success: false,
        message: "This browser does not support notifications.",
      };
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      return {
        success: false,
        permission,
        message: "Notification permission was not granted.",
      };
    }

    return await registerTokenWithFirestore(user);
  } catch (error) {
    console.error("Notification setup failed:", error);
    return {
      success: false,
      message: error.message || "Notification setup failed.",
    };
  }
}

/* ---------------------------------------
   Register FCM token with Firestore
--------------------------------------- */
export async function registerTokenWithFirestore(user) {
  if (!user?.uid) return { success: false, message: "No active user" };

  try {
    const messagingInstance = await getMessagingInstance();
    if (!messagingInstance) {
      return {
        success: false,
        message: "Firebase Messaging is not supported.",
      };
    }

    // Register service worker if not already registered
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" }
    );
    await navigator.serviceWorker.ready;

    const token = await getToken(messagingInstance, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      return {
        success: false,
        message: "Could not generate FCM token.",
      };
    }

    console.log("FCM registration token acquired:", token);

    // Save token under users/{userId}/devices/{token}
    const tokenRef = doc(db, "users", user.uid, "devices", token);

    await setDoc(
      tokenRef,
      {
        token,
        userId: user.uid,
        email: user.email || "",
        platform: "web",
        userAgent: navigator.userAgent || "web",
        notificationPermission: "granted",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    localStorage.setItem("cf_fcm_token", token);

    return {
      success: true,
      permission: "granted",
      token,
    };
  } catch (error) {
    console.error("Failed to register FCM token with Firestore:", error);
    return {
      success: false,
      message: error.message || "Failed to register FCM token.",
    };
  }
}

/* ---------------------------------------
   Listen for foreground notifications
--------------------------------------- */
export async function listenForNotifications(callback) {
  try {
    const messagingInstance = await getMessagingInstance();

    if (!messagingInstance) {
      return () => {};
    }

    return onMessage(messagingInstance, (payload) => {
      console.log("[FCM Foreground Message Received]:", payload);

      if (callback) {
        callback(payload);
      }
    });
  } catch (error) {
    console.error("Notification listener subscription failed:", error);
    return () => {};
  }
}

/* ---------------------------------------
   Remove FCM notification token
--------------------------------------- */
export async function removeNotificationToken(user) {
  try {
    if (!user) return;

    const messagingInstance = await getMessagingInstance();
    if (!messagingInstance) return;

    const currentToken = localStorage.getItem("cf_fcm_token");
    if (currentToken) {
      const tokenRef = doc(db, "users", user.uid, "devices", currentToken);
      await deleteDoc(tokenRef).catch(() => {});
    }

    await deleteToken(messagingInstance).catch(() => {});
    localStorage.removeItem("cf_fcm_token");
    console.log("FCM token removed.");
  } catch (error) {
    console.error("Failed to remove FCM token:", error);
  }
}

/* ---------------------------------------
   Send / Trigger local test notification
--------------------------------------- */
export async function triggerLocalNotification(title, options = {}) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission !== "granted") {
    return false;
  }

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, {
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        ...options,
      });
      return true;
    }

    new Notification(title, {
      icon: "/favicon.svg",
      ...options,
    });
    return true;
  } catch (err) {
    console.error("Local notification trigger failed:", err);
    return false;
  }
}