// public/firebase-messaging-sw.js
importScripts(
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyCTFyL5m6TN0hsVOqlcBGCOgyJYjbvqBpc",
  authDomain: "campusflowco.firebaseapp.com",
  projectId: "campusflowco",
  storageBucket: "campusflowco.firebasestorage.app",
  messagingSenderId: "1035025180595",
  appId: "1:1035025180595:web:6a21f4b769fb26b86f8dc6",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[FCM SW] Background push notification received:", payload);

  const title =
    payload.notification?.title ||
    payload.data?.title ||
    "CampusFlow Academic Update";

  const body =
    payload.notification?.body ||
    payload.data?.body ||
    payload.data?.message ||
    "You have a new campus notification.";

  const targetUrl =
    payload.data?.url ||
    payload.data?.targetRoute ||
    payload.fcmOptions?.link ||
    "/dashboard";

  const options = {
    body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: payload.data?.tag || "campusflow-push",
    renotify: true,
    data: {
      url: targetUrl,
    },
  };

  self.registration.showNotification(title, options);
});

// Handle clicking on background notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If an open window exists, focus it and navigate
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});