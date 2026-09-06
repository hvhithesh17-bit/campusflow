// backend/sendPushNotification.js
/**
 * CampusFlow - FCM Push Notification Dispatcher
 * 
 * Usage options:
 * 1. Firebase Admin SDK (Recommended for Node.js backends / Cloud Functions)
 * 2. Firebase Cloud Messaging HTTP v1 API
 */

/*
// Example: Sending notification using Firebase Admin SDK in Node.js
// -----------------------------------------------------------------
// npm install firebase-admin

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Download from Firebase Console -> Project Settings -> Service Accounts

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function sendNotificationToUserDevices(userId, payload) {
  const db = admin.firestore();
  
  // 1. Fetch all registered FCM device tokens for the user
  const devicesSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('devices')
    .get();

  if (devicesSnapshot.empty) {
    console.log(`No registered devices found for user ${userId}`);
    return;
  }

  const tokens = devicesSnapshot.docs.map(doc => doc.id);

  // 2. Build FCM Message
  const message = {
    notification: {
      title: payload.title || 'CampusFlow Alert',
      body: payload.body || 'You have an academic notification.'
    },
    data: {
      targetRoute: payload.targetRoute || '/dashboard',
      tag: payload.tag || 'campusflow-alert',
      type: payload.type || 'general'
    },
    tokens: tokens
  };

  // 3. Send multicast message
  const response = await admin.messaging().sendEachForMulticast(message);
  console.log(`Successfully sent ${response.successCount} messages; ${response.failureCount} failed.`);
}

module.exports = { sendNotificationToUserDevices };
*/

console.log("CampusFlow FCM Notification Module loaded.");
