import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { auth, googleProvider, db } from "../firebase";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import googleLogo from "/social/google.png";

const SignUp = () => {
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // ✨ Toast message
  const [toast, setToast] = useState({ message: "", type: "" });

  // Helper: show toast
  const showToast = (message, type = "info", duration = 3000) => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), duration);
  };

  // ✨ Handle Google Auth
  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          avatar: user.photoURL,
          provider: "google",
          createdAt: new Date().toISOString(),
        });

        // ✅ Create welcome notification
        const notifRef = collection(db, "users", user.uid, "notifications");
        await addDoc(notifRef, {
          message: "Welcome to XStream!",
          type: "system",
          createdAt: new Date().toISOString(),
          read: false,
        });
      }

      showToast(`Welcome back, ${user.displayName || "user"}!`, "success");
      navigate("/");
    } catch (error) {
      console.error("Google sign-in error:", error);
      showToast("Google Sign-In failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✉️ Email/Password Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { user } = await createUserWithEmailAndPassword(
        auth,
        signUpData.email,
        signUpData.password
      );

      await updateProfile(user, { displayName: signUpData.username });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: signUpData.username,
        displayName: signUpData.username,
        email: signUpData.email,
        provider: "email",
        createdAt: new Date().toISOString(),
      });

      const notifRef = collection(db, "users", user.uid, "notifications");
      await addDoc(notifRef, {
        message: "Welcome to XStream!",
        type: "system",
        createdAt: new Date().toISOString(),
        read: false,
      });

      showToast("Account created successfully! 🎉", "success");
      navigate("/");
    } catch (error) {
      console.error("Signup error:", error);
      let msg = "Something went wrong.";
      if (error.code === "auth/email-already-in-use")
        msg = "Email already in use. Try signing in instead.";
      else if (error.code === "auth/invalid-email")
        msg = "Please enter a valid email.";
      else if (error.code === "auth/weak-password")
        msg = "Password should be at least 6 characters.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // 🔐 Email/Password Sign In
  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await signInWithEmailAndPassword(
        auth,
        signInData.email,
        signInData.password
      );
      showToast("Signed in successfully! 👋", "success");
      navigate("/");
    } catch (error) {
      console.error("Signin error:", error);
      let msg = "Login failed.";
      if (error.code === "auth/user-not-found")
        msg = "No account found with that email.";
      else if (error.code === "auth/wrong-password")
        msg = "Incorrect password. Try again.";
      else if (error.code === "auth/invalid-email")
        msg = "Invalid email format.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // 🔑 Forgot Password Handler
  const handlePasswordReset = async () => {
    if (!signInData.email) {
      showToast("Please enter your email first.", "info");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, signInData.email);
      showToast(
        "Password reset email sent! Please check your inbox or spam.",
        "success"
      );
    } catch (error) {
      console.error("Password reset error:", error);
      let msg = "Failed to send reset email.";
      if (error.code === "auth/user-not-found")
        msg = "No user found with that email.";
      showToast(msg, "error");
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* 🔔 Toast Notification */}
      {toast.message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-5 px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : toast.type === "error"
              ? "bg-red-600 text-white"
              : "bg-gray-700 text-white"
          }`}
        >
          {toast.message}
        </motion.div>
      )}

      {/* 3D Flip Card */}
      <motion.div
        className="relative w-[90%] sm:w-[360px] h-[460px]"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
        style={{
          transformStyle: "preserve-3d",
          perspective: "1000px",
        }}
      >
        {/* === FRONT CARD - SIGN IN === */}
        <div
          className="absolute w-full h-full"
          style={{
            transform: "rotateY(0deg)",
            backfaceVisibility: "hidden",
          }}
        >
          <div className="flex flex-col justify-center w-full h-full p-6 bg-gray-900 border border-gray-800 shadow-2xl sm:p-8 rounded-2xl">
            <h2 className="mb-6 text-2xl font-bold text-center text-pink-500">
              Sign In
            </h2>
            <form onSubmit={handleSignIn} className="space-y-4">
              <input
                type="email"
                required
                placeholder="Email"
                value={signInData.email}
                onChange={(e) =>
                  setSignInData({ ...signInData, email: e.target.value })
                }
                className="w-full px-3 py-2 text-sm text-white placeholder-gray-400 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Password"
                  value={signInData.password}
                  onChange={(e) =>
                    setSignInData({ ...signInData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm text-white placeholder-gray-400 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                />
                <button
                  type="button"
                  className="absolute text-gray-400 right-3 top-2 hover:text-pink-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 mt-2 text-sm font-semibold text-white transition rounded-lg bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="mt-3 text-sm text-center text-gray-400">
              Forgot your password?{" "}
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-blue-400 hover:underline"
              >
                Reset Password
              </button>
            </p>

            <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-gray-700"></div>
              <span className="px-2 text-xs text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-700"></div>
            </div>

            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="flex items-center justify-center w-full py-2 text-sm font-medium text-gray-900 transition bg-white rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <img src={googleLogo} alt="Google" className="w-5 h-5 mr-2" />
              Continue with Google
            </button>

            <p className="mt-4 text-sm text-center text-gray-400">
              Don’t have an account?{" "}
              <button
                type="button"
                onClick={() => setIsFlipped(true)}
                className="text-pink-500 cursor-pointer hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>

        {/* === BACK CARD - SIGN UP === */}
        <div
          className="absolute w-full h-full"
          style={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
          }}
        >
          <div className="flex flex-col justify-center w-full h-full p-6 bg-gray-900 border border-gray-800 shadow-2xl sm:p-8 rounded-2xl">
            <h2 className="mb-6 text-2xl font-bold text-center text-pink-500">
              Create Account
            </h2>
            <form onSubmit={handleSignUp} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Username"
                value={signUpData.username}
                onChange={(e) =>
                  setSignUpData({ ...signUpData, username: e.target.value })
                }
                className="w-full px-3 py-2 text-sm text-white placeholder-gray-400 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              />

              <input
                type="email"
                required
                placeholder="Email"
                value={signUpData.email}
                onChange={(e) =>
                  setSignUpData({ ...signUpData, email: e.target.value })
                }
                className="w-full px-3 py-2 text-sm text-white placeholder-gray-400 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Password"
                  value={signUpData.password}
                  onChange={(e) =>
                    setSignUpData({ ...signUpData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm text-white placeholder-gray-400 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                />
                <button
                  type="button"
                  className="absolute text-gray-400 right-3 top-2 hover:text-pink-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 mt-2 text-sm font-semibold text-white transition rounded-lg bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Sign Up"}
              </button>
            </form>

            <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-gray-700"></div>
              <span className="px-2 text-xs text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-700"></div>
            </div>

            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="flex items-center justify-center w-full py-2 text-sm font-medium text-gray-900 transition bg-white rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <img src={googleLogo} alt="Google" className="w-5 h-5 mr-2" />
              Continue with Google
            </button>

            <p className="mt-4 text-sm text-center text-gray-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setIsFlipped(false)}
                className="text-pink-500 cursor-pointer hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUp;
