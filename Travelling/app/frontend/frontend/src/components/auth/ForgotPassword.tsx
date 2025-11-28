import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI } from "../../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [responseMessage, setResponseMessage] = useState("");
  const genericMessage =
    "If an account exists for that email, you will receive a password reset link shortly.";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setResponseMessage("");

    try {
      const data = await authAPI.requestPasswordReset(email);
      setStatus("success");
      setResponseMessage(data?.message ?? genericMessage);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to process your request.";
      setStatus("error");
      setResponseMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop"
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
          <h1 className="text-3xl font-bold text-white mb-2">Forgot your password?</h1>
          <p className="text-white/70">
            Enter your registered email and we'll send you a secure reset link.
          </p>
        </div>

        <motion.div   
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass rounded-2xl border border-white/20 p-8 backdrop-blur-md bg-white/10 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {status !== "idle" && responseMessage && (
              <div
                className={`p-3 text-sm rounded-lg border ${
                  status === "success"
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                {responseMessage}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white/90 mb-2"
              >
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            <motion.button
              type="submit"
              disabled={!email || isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? "Sending..." : "Send reset link"}
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
