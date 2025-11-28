import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI } from "../../lib/api";

const passwordRules = [
  { label: "At least 8 characters", pattern: /.{8,}/ },
  { label: "One uppercase letter", pattern: /[A-Z]/ },
  { label: "One lowercase letter", pattern: /[a-z]/ },
  { label: "One number", pattern: /\d/ },
  { label: "One special character", pattern: /[^A-Za-z0-9]/ },
];

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = (searchParams.get("token") ?? "").trim();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checklist = useMemo(
    () => passwordRules.map((rule) => ({ label: rule.label, met: rule.pattern.test(password) })),
    [password],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is invalid or has expired. Please request a new one.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const allSatisfied = checklist.every((rule) => rule.met);
    if (!allSatisfied) {
      setError("Please choose a stronger password that meets all requirements.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.resetPassword({ token, password, confirmPassword });
      toast.success("Password changed successfully, please login.");
      navigate("/login", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to reset password.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1974&q=80"
          alt="Reset password"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0e1512]/90 via-[#0e1512]/80 to-[#0e1512]/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1512]/60 via-transparent to-[#0e1512]/40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <span className="w-8 h-8 rounded-full bg-white/10 grid place-items-center">✳</span>
            <span className="font-semibold text-white text-xl">SuiteSavvy</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Choose a new password</h1>
          <p className="text-white/70">
            Your password must be strong to keep your account secure.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass rounded-2xl border border-white/20 p-8 backdrop-blur-md bg-white/10 shadow-2xl"
        >
          {!token && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
              This reset link is invalid or missing. Please request a new link.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white/90 mb-2"
              >
                New password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                placeholder="Create a strong password"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-white/90 mb-2"
              >
                Confirm password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                placeholder="Repeat your password"
              />
            </div>

            <div className="space-y-2">
              {checklist.map((rule) => (
                <div
                  key={rule.label}
                  className={`text-sm flex items-center gap-2 ${
                    rule.met ? "text-green-400" : "text-white/60"
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      rule.met ? "bg-green-400" : "bg-white/30"
                    }`}
                  />
                  {rule.label}
                </div>
              ))}
            </div>

            <motion.button
              type="submit"
              disabled={!token || isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? "Updating..." : "Update password"}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-white/70 hover:text-white text-sm font-medium"
            >
              Back to login
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
