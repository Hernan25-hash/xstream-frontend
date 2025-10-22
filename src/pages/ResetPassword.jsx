import React, { useState, useEffect } from "react";
import { getAuth, updatePassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    // Redirect if no user is logged in (safety)
    if (!auth.currentUser) {
      navigate("/signin");
    }
  }, [auth, navigate]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPassword) return;

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error("User not logged in.");

      await updatePassword(user, newPassword);

      setMessage({ type: "success", text: "✅ Password updated successfully! Redirecting..." });

      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      console.error("Password update error:", error);
      setMessage({ type: "error", text: "❌ Failed to update password. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-900">
      <div className="w-full max-w-md p-8 border border-gray-700 shadow-xl bg-gray-800/80 backdrop-blur-md rounded-3xl">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Logo" className="object-contain w-24 h-24" />
        </div>

        <h2 className="mb-4 text-3xl font-bold text-center text-white">
          Set New Password
        </h2>
        <p className="mb-6 text-sm text-center text-gray-300">
          Enter your new password below to secure your account.
        </p>

        <form onSubmit={handleReset} className="space-y-4">
          {/* New Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm text-white placeholder-gray-400 transition bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
            <button
              type="button"
              className="absolute text-gray-400 right-3 top-3 hover:text-pink-400"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-semibold text-white transition shadow-lg bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl hover:scale-105 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Set Password"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-center text-sm ${
              message.type === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}

        <p className="mt-6 text-sm text-center text-gray-300">
          Remember your password?{" "}
          <button
            onClick={() => navigate("/signin")}
            className="font-semibold text-pink-400 hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
