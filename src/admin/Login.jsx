import React, { useState } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { app } from "../firebase";

// 👁 Simple icons
const EyeOpen = ({ style = {} }) => (
  <svg style={style} width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
      stroke="#888"
      strokeWidth="2"
      fill="none"
    />
    <circle cx="12" cy="12" r="3" stroke="#888" strokeWidth="2" fill="none" />
  </svg>
);

const EyeClosed = ({ style = {} }) => (
  <svg style={style} width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M17.94 17.94C16.13 19.24 14.13 20 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.06M22.54 6.42A21.77 21.77 0 0 1 23 12s-4 8-11 8a10.94 10.94 0 0 1-4.06-.81M1 1l22 22"
      stroke="#888"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

// 🔥 Firebase
const auth = getAuth(app);
const db = getFirestore(app);

const Login = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  // 🧾 Register new user (you can manually change role in Firestore)
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "user", // default non-admin
        status: "active",
        createdAt: new Date().toISOString(),
      });

      setSuccess("Registration successful! You can now log in.");
      setIsRegister(false);
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message);
    }
  };

  // 🔐 Login (Admin only)
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        setError("User not found in database.");
        await signOut(auth);
        return;
      }

      const data = userDoc.data();
      if (data.role !== "admin") {
        setError("Access denied. Only admin users can log in.");
        await signOut(auth);
        return;
      }

      // ✅ Save login state
      localStorage.setItem("xstream-admin-loggedin", "true");

      setSuccess("Login successful! Redirecting...");
      if (onSuccess) onSuccess();
      navigate("/2admin");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        background: "#111",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <form
        onSubmit={isRegister ? handleRegister : handleLogin}
        className="login-form"
        style={{
          background: "#222",
          padding: 32,
          borderRadius: 16,
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 4px 24px 0 #0006",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2
          style={{
            marginBottom: 24,
            fontSize: 28,
            fontWeight: 700,
            textAlign: "center",
            color: "#e60073",
          }}
        >
          {isRegister ? "Register" : "Admin Login"}
        </h2>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 8,
            border: "none",
            fontSize: 17,
            marginBottom: 12,
            background: "#333",
            color: "#fff",
          }}
        />

        {/* Password with toggle */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "14px 44px 14px 14px",
              borderRadius: 8,
              border: "none",
              fontSize: 17,
              background: "#333",
              color: "#fff",
            }}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {showPassword ? <EyeOpen /> : <EyeClosed />}
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          style={{
            width: "100%",
            padding: 16,
            background: "#e60073",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 18,
            cursor: "pointer",
            transition: "background 0.3s",
          }}
        >
          {isRegister ? "Register" : "Login"}
        </button>

     

        {/* Messages */}
        {error && (
          <div
            style={{ color: "#ff4d4f", marginTop: 18, textAlign: "center" }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{ color: "#4caf50", marginTop: 18, textAlign: "center" }}
          >
            {success}
          </div>
        )}
      </form>
    </div>
  );
};

export default Login;
