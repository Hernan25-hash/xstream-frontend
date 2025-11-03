// src/utils/exclusiveAccess.jsx
import { doc, updateDoc, getDoc, increment } from "firebase/firestore";

/**
 * ✅ Update user's exclusiveAccessStarted (true = timer running, false = paused)
 */
export const setExclusiveAccessStarted = async (db, userId, started) => {
  if (!userId) return;
  const userRef = doc(db, "users", userId);
  try {
    await updateDoc(userRef, {
      exclusiveAccessStarted: started,
      lastUpdated: Date.now(), // track last state change
    });
    console.log(`[ExclusiveAccess] ${started ? "▶️ Started" : "⏸ Paused"}`);
  } catch (err) {
    console.error("❌ Failed to update exclusiveAccessStarted:", err);
  }
};

/**
 * ✅ Save remaining access time (in ms)
 */
export const updateExclusiveAccessRemaining = async (db, userId, remaining) => {
  if (!userId) return;
  const userRef = doc(db, "users", userId);
  try {
    await updateDoc(userRef, {
      exclusiveAccessRemaining: Math.max(remaining, 0),
      lastUpdated: Date.now(),
    });
    console.log(`[ExclusiveAccess] 💾 Remaining saved: ${Math.floor(remaining / 1000)}s`);
  } catch (err) {
    console.error("❌ Failed to update exclusiveAccessRemaining:", err);
  }
};

/**
 * ✅ Fetch user’s current exclusive access data
 */
export const getExclusiveAccessData = async (db, userId) => {
  if (!userId) return null;
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      exclusiveAccessExpiry: data.exclusiveAccessExpiry || null,
      exclusiveAccessRemaining: data.exclusiveAccessRemaining ?? 0,
      exclusiveAccessStarted: data.exclusiveAccessStarted ?? false,
      lastUpdated: data.lastUpdated ?? null,
    };
  } catch (err) {
    console.error("❌ Failed to fetch exclusive access data:", err);
    return null;
  }
};

/**
 * ✅ Auto pause/resume timer when user leaves or returns to the tab
 */
export const initExclusiveVisibilityHandler = (db, userId) => {
  if (!userId) return;

  const handleVisibilityChange = async () => {
    const now = Date.now();

    if (document.visibilityState === "hidden") {
      console.log("[ExclusiveAccess] ⏸ Tab hidden → paused timer");
      await setExclusiveAccessStarted(db, userId, false);
    } else if (document.visibilityState === "visible") {
      const data = await getExclusiveAccessData(db, userId);
      if (!data) return;

      const expiryMs = Date.parse(data.exclusiveAccessExpiry);
      const stillValid = expiryMs > now && data.exclusiveAccessRemaining > 0;

      if (stillValid) {
        console.log("[ExclusiveAccess] ▶️ Tab visible → resumed timer");
        await setExclusiveAccessStarted(db, userId, true);
      } else {
        console.log("[ExclusiveAccess] ❌ Access expired — staying paused");
        await setExclusiveAccessStarted(db, userId, false);
      }
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
};

/**
 * 🧠 Optional utility (for debugging)
 */
export const formatRemainingTime = (ms) => {
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms / (1000 * 60)) % 60);
  const s = Math.floor((ms / 1000) % 60);
  return `${h}h ${m}m ${s}s`;
};

/**
 * 🔥 Decrement exclusiveAccessRemaining every second
 */
export const runExclusiveCountdown = (db, userId) => {
  const userRef = doc(db, "users", userId);
  let active = true;

  const interval = setInterval(async () => {
    if (!active) return;

    try {
      // ⚠️ Extra safety: only decrement if user still has time left
      const snap = await getDoc(userRef);
      if (!snap.exists()) return;
      const data = snap.data();

      if (!data.exclusiveAccessStarted || data.exclusiveAccessRemaining <= 0) {
        console.log("[ExclusiveAccess] 🛑 Countdown paused or finished");
        return;
      }

      await updateDoc(userRef, {
        exclusiveAccessRemaining: increment(-1000),
        lastUpdated: Date.now(),
      });
    } catch (err) {
      console.warn("⚠️ Failed to decrement exclusive time:", err);
    }
  }, 1000);

  // ✅ Cleanup function
  return () => {
    active = false;
    clearInterval(interval);
  };
};
