// src/utils/errorHandler.js

/**
 * Maps Firebase error codes to safe, actionable user alerts.
 */
export function formatFirebaseError(error) {
  if (import.meta.env?.DEV) {
    console.error("[Firebase Operation Error]:", error);
  }

  if (!error) return "An unexpected error occurred.";

  const code = error.code || "";

  switch (code) {
    case "permission-denied":
      return "You do not have permission to perform this action.";
    case "unavailable":
    case "network-request-failed":
      return "Network connection issue. Please verify your internet connection and retry.";
    case "not-found":
      return "The requested record could not be found.";
    case "already-exists":
      return "A record with this identifier already exists.";
    case "resource-exhausted":
      return "Quota limit reached. Please wait a moment and try again.";
    case "unauthenticated":
      return "Your session has expired. Please sign in again.";
    default:
      return error.message && !error.message.includes("Firebase")
        ? error.message
        : "Something went wrong. Please try again.";
  }
}