import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { useContext } from "react";
import { AdminContext } from "../../Context/AdminContext";
import { useNavigate } from "react-router-dom";
import config from '../../config';

export default function Login() {
  useEffect(() => {
    const data = localStorage.getItem('admin') ? localStorage.getItem('admin') : "";
    const token = localStorage.getItem('token') ? localStorage.getItem('token') : "";

    if (data !== '' && token !== '') {
      navigate("/admin/dashboard");
    }
  })

  const { setAdmin } = useContext(AdminContext);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: "false"
  })

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${config.API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'X-Tenant': 'skydent'
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        setStatus({ type: "error", message: "Server error. Try again later." });
        return;
      }

      const data = await res.json();
      if (data.status === "success" && data.message === "Login successfully" && data.admin?.id) {
        setAdmin(data.admin);
        localStorage.setItem('token', data.token);
        localStorage.setItem('base_url', data.base_url);
        setStatus({ type: "success", message: data.message });
        navigate('/admin/dashboard');
      } else {
        setStatus({ type: "error", message: data.message || "Invalid login" });
      }
    } catch (err) {
      setStatus({ type: "error", message: "Something went wrong!" });
    }

  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-blue-900 to-gray-950 text-white">
      {/* Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-4xl backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left - Branding Section */}
        <div className="md:w-1/2 relative p-10 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex flex-col justify-center items-center text-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative z-10 mb-8"
          >
            <div className="w-40 h-40 rounded-2xl bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10">
              <img
                src="/img/logo.png"
                alt="Admin Logo"
                className="w-32 h-32 object-contain"
              />
            </div>
          </motion.div>

          {/* Welcome Text */}
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text mb-3">
            Welcome Back, Admin
          </h2>
          <p className="text-gray-300 text-sm max-w-sm leading-relaxed">
            Your next-generation admin panel for performance, analytics, and
            control — all in one place.
          </p>

          <p className="text-xs text-gray-500 mt-8">
            © 2025 Sdkydent Admin Panel
          </p>
        </div>

        {/* Right - Login Form */}
        <div className="md:w-1/2 p-10 flex flex-col justify-center relative bg-black/60">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
          <h2 className="text-2xl font-semibold mb-8 text-center text-gray-100 tracking-widest uppercase">
            Secure Login
          </h2>

          {/* Status Alert */}
          {status.message && (
            <div
              className={`flex items-center p-4 mb-4 text-sm rounded-lg ${status.type === "success"
                ? "text-green-800 bg-green-50 dark:bg-gray-800 dark:text-green-400"
                : "text-red-800 bg-red-50 dark:bg-gray-800 dark:text-red-400"
                }`}
              role="alert"
            >
              {status.message}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Username</label>
              <input
                type="text"
                name="email"
                onChange={handleChange}
                required
                className="w-full bg-white/10 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-gray-400 transition-all"
                placeholder="Enter your username"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label className="block text-sm text-gray-300 mb-2">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                onChange={handleChange}
                required
                className="w-full bg-white/10 border border-gray-700 rounded-lg px-4 py-2 pr-10 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none placeholder-gray-400 transition-all"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-200 transition"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-gray-400">
                <input
                  type="checkbox"
                  name="remember"
                  onChange={handleChange}
                  className="accent-blue-500 mr-2 rounded focus:ring-2 focus:ring-blue-400"
                />
                Remember Me
              </label>
              <a href="#" className="text-blue-400 hover:text-blue-300">
                Forgot Password?
              </a>
            </div>

            {/* Login Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all"
            >
              Login
            </motion.button>
          </form>

          <p className="text-xs text-gray-500 mt-10 text-center">
            Powered by Skydent • AES 256-bit Encrypted Login
          </p>
        </div>
      </motion.div>
    </div>
  );
}
