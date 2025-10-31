// src/utils/exclusiveAccess.jsx
import { doc, updateDoc, getDoc } from "firebase/firestore";

/**
 * Update the user's exclusiveAccessStarted status (true/false)
 * @param {Firestore} db Firestore instance
 * @param {string} userId UID of the user
 * @param {boolean} started true = timer running, false = paused
 */
export const setExclusiveAccessStarted = async (db, userId, started) => {
  if (!userId) return;
  const userRef = doc(db, "users", userId);
  try {
    await updateDoc(userRef, { exclusiveAccessStarted: started });
  } catch (err) {
    console.error("Failed to update exclusiveAccessStarted:", err);
  }
};

/**
 * Update the user's exclusiveAccessRemaining in ms
 * @param {Firestore} db Firestore instance
 * @param {string} userId UID of the user
 * @param {number} remaining Time remaining in milliseconds
 */
export const updateExclusiveAccessRemaining = async (db, userId, remaining) => {
  if (!userId) return;
  const userRef = doc(db, "users", userId);
  try {
    await updateDoc(userRef, { exclusiveAccessRemaining: remaining });
  } catch (err) {
    console.error("Failed to update exclusiveAccessRemaining:", err);
  }
};

/**
 * Fetch user's exclusive access data
 * @param {Firestore} db Firestore instance
 * @param {string} userId UID of the user
 * @returns {Promise<{exclusiveAccessExpiry: string, exclusiveAccessRemaining: number, exclusiveAccessStarted: boolean}>}
 */
export const getExclusiveAccessData = async (db, userId) => {
  if (!userId) return null;
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      exclusiveAccessExpiry: data.exclusiveAccessExpiry || null,
      exclusiveAccessRemaining: data.exclusiveAccessRemaining ?? null,
      exclusiveAccessStarted: data.exclusiveAccessStarted ?? false,
    };
  } catch (err) {
    console.error("Failed to fetch exclusive access data:", err);
    return null;
  }
};

/**
 * Auto pause/resume hook for exclusive access based on page visibility
 * @param {Firestore} db Firestore instance
 * @param {string} userId UID of the user
 */
export const initExclusiveVisibilityHandler = (db, userId) => {
  if (!userId) return;

  const handleVisibilityChange = async () => {
    if (document.visibilityState === "hidden") {
      await setExclusiveAccessStarted(db, userId, false);
    } else if (document.visibilityState === "visible") {
      const data = await getExclusiveAccessData(db, userId);
      const now = Date.now();
      if (data?.exclusiveAccessRemaining > 0 && Date.parse(data?.exclusiveAccessExpiry) > now) {
        await setExclusiveAccessStarted(db, userId, true);
      }
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Return cleanup function
  return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
};
