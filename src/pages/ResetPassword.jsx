import React, { useState, useEffect } from "react";
import { getAuth, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [oobCode, setOobCode] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auth = getAuth();

  useEffect(() => {
    // Extract oobCode from URL
    const code = searchParams.get("oobCode");
    const mode = searchParams.get("mode");

    if (!code || mode !== "resetPassword") {
      setMessage({ type: "error", text: "❌ Invalid or expired link." });
      setLoading(false);
      return;
    }

    setOobCode(code);

    // Verify code is valid
    verifyPasswordResetCode(auth, code)
      .then(() => setLoading(false))
      .catch((err) => {
        console.error("Invalid reset code:", err);
        setMessage({ type: "error", text: "❌ Invalid or expired link." });
        setLoading(false);
      });
  }, [auth, searchParams]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPassword) return;

    setActionLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setMessage({ type: "success", text: "✅ Password updated successfully! Redirecting..." });

      // Redirect after 2 seconds
      setTimeout(() => navigate("/signin"), 2000);
    } catch (err) {
      console.error("Password reset failed:", err);
      setMessage({ type: "error", text: "❌ Failed to reset password. Try again." });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p className="mt-10 text-center text-white">Loading...</p>;

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
            disabled={actionLoading}
            className="w-full py-3 text-sm font-semibold text-white transition shadow-lg bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl hover:scale-105 disabled:opacity-50"
          >
            {actionLoading ? "Updating..." : "Set Password"}
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
