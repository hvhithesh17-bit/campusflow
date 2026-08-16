// src/utils/notificationService.js
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase";

const NOTIFICATIONS_COLLECTION = "notifications";

/**
 * Fetch all notifications for an authenticated user, newest first.
 */
export async function getUserNotifications(userId) {
  if (!userId) return [];

  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    return notifications.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

/**
 * Syncs reminders with Firestore using a stable composite key:
 * deduplicationKey = `${type}_${sourceId}_${relevantDate}`
 */
export async function syncNotificationsToFirestore(userId, derivedNotifications = []) {
  if (!userId || !derivedNotifications.length) return [];

  try {
    const existing = await getUserNotifications(userId);
    
    // Set of existing keys for rapid lookups
    const existingKeySet = new Set(
      existing.map((n) => n.dedupKey || `${n.type}_${n.sourceId}_${n.relevantDate || ""}`)
    );

    const newEntries = [];

    for (const item of derivedNotifications) {
      const dedupKey = `${item.type}_${item.sourceId}_${item.relevantDate}`;

      if (!existingKeySet.has(dedupKey)) {
        const payload = {
          userId,
          dedupKey,
          type: item.type,
          sourceId: item.sourceId,
          relevantDate: item.relevantDate,
          targetRoute: item.targetRoute || "/dashboard",
          title: item.title,
          message: item.message,
          severity: item.severity,
          read: false,
          createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), payload);
        newEntries.push({ id: docRef.id, ...payload });
        existingKeySet.add(dedupKey);
      }
    }

    return [...newEntries, ...existing].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error syncing notifications:", error);
    throw error;
  }
}

/**
 * Mark a specific notification document as read.
 */
export async function markNotificationAsRead(notificationId) {
  if (!notificationId) return;

  try {
    const ref = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(ref, { read: true });
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    throw error;
  }
}

/**
 * Mark all unread notifications as read.
 */
export async function markAllNotificationsAsRead(notifications = []) {
  const unreadList = notifications.filter((n) => !n.read && n.id);
  if (!unreadList.length) return;

  try {
    const batch = writeBatch(db);
    unreadList.forEach((item) => {
      const ref = doc(db, NOTIFICATIONS_COLLECTION, item.id);
      batch.update(ref, { read: true });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error batch updating notifications:", error);
    throw error;
  }
}