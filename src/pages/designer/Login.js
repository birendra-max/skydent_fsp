import { useState, useEffect, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faUser, faLock } from "@fortawesome/free-solid-svg-icons";
import { DesignerContext } from '../../Context/DesignerContext';
import { useNavigate } from "react-router-dom";
import config from '../../config';

export default function Login() {
    const { setDesigner } = useContext(DesignerContext);
    const [activeIndex, setActiveIndex] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const data = localStorage.getItem('designer') ? localStorage.getItem('designer') : "";
        const token = localStorage.getItem('token') ? localStorage.getItem('token') : "";

        if (data !== '' && token !== '') {
            navigate('/designer/home');
        }
    })

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
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`${config.API_BASE_URL}/designer/validate-designer`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'X-Tenant': 'skydent'
                },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                setStatus({ type: "error", message: "Server error. Try again later." });
                setIsSubmitting(false);
                return;
            }

            const data = await res.json();

            if (data.status === "success" && data.message === "Login successfully" && data.designer?.desiid) {
                setStatus({ type: "success", message: data.message });
                localStorage.setItem('token', data.token);
                localStorage.setItem('base_url', data.base_url);
                setDesigner(data.designer);
                navigate('/designer/home');
            } else {
                setStatus({ type: "error", message: data.message || "Invalid login" });
                setIsSubmitting(false);
            }
        } catch (err) {
            setStatus({ type: "error", message: "Something went wrong!" });
            setIsSubmitting(false);
        }
    };


    const images = [
        "/img/bg0.png",
        "/img/bg1.png",
        "/img/bg2.jpg",
    ];

    const nextSlide = () => {
        setActiveIndex((prev) => (prev + 1) % images.length);
    };

    const prevSlide = () => {
        setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    useEffect(() => {
        const interval = setInterval(nextSlide, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="min-h-screen flex items-center justify-center bg-[#87CEEB] px-4 py-8">
            <div className="w-full max-w-8xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
                {/* Carousel - Now on Right */}
                <div className="w-full lg:w-3/5 max-w-7xl order-1 lg:order-1">
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                        <div className="relative w-full h-72 md:h-96 lg:h-[550px] overflow-hidden">
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${idx === activeIndex
                                        ? "opacity-100 scale-100"
                                        : "opacity-0 scale-110"
                                        }`}
                                >
                                    <img
                                        src={img}
                                        alt={`slide-${idx}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30"></div>
                                </div>
                            ))}
                        </div>

                        {/* Carousel Controls */}
                        <button
                            onClick={prevSlide}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-black/60 transition-all duration-300 border border-white/20"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-black/60 transition-all duration-300 border border-white/20"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {/* Indicators */}
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
                            {images.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveIndex(idx)}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === activeIndex ? "bg-white scale-125" : "bg-white/40"
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Text Content */}
                        <div className="absolute bottom-20 left-8 right-8 text-white">
                            <h2 className="text-2xl md:text-3xl font-bold mb-3">Design Dental Excellence</h2>
                            <p className="text-sm md:text-base text-gray-200 leading-relaxed">
                                Where creativity meets precision in dental design.
                                Transform visions into beautiful, functional dental solutions.
                            </p>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute top-6 right-6">
                            <div className="bg-blue-500/20 backdrop-blur-sm rounded-full p-3 border border-blue-400/30">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Login Container */}
                <div className="w-full lg:w-2/4 max-w-md order-2 lg:order-2">
                    {/* Login Form */}
                    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                        {/* Logo Above Form */}
                        <div className="flex justify-start mb-4">
                            <div>
                                <img
                                    src="/img/logo.png"
                                    alt="Skydent Logo"
                                    className="h-10 w-auto object-contain"
                                />
                            </div>
                        </div>

                        {/* Header Section */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">
                                Designer Portal
                            </h1>
                            <p className="text-gray-600 font-light tracking-wide text-sm">
                                Sign in to access design dashboard
                            </p>
                        </div>

                        {/* Status Alert */}
                        {status.message && (
                            <div
                                className={`flex items-center p-4 mb-6 rounded-xl border ${status.type === "success"
                                    ? "bg-green-50 border-green-200 text-green-800"
                                    : "bg-red-50 border-red-200 text-red-800"
                                    }`}
                                role="alert"
                            >
                                <div className="flex-1">
                                    <p className="text-sm font-medium tracking-wide">{status.message}</p>
                                </div>
                            </div>
                        )}

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {/* Username Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-3 tracking-wide">
                                    Username
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FontAwesomeIcon
                                            icon={faUser}
                                            className="text-gray-500"
                                            size="sm"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        name="email"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none text-gray-900 placeholder-gray-500 transition-all duration-200 font-medium tracking-wide"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="Enter your username"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-3 tracking-wide">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FontAwesomeIcon
                                            icon={faLock}
                                            className="text-gray-500"
                                            size="sm"
                                        />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required
                                        className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none text-gray-900 placeholder-gray-500 transition-all duration-200 font-medium tracking-wide"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <FontAwesomeIcon
                                            icon={showPassword ? faEyeSlash : faEye}
                                            size="sm"
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me & Submit */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center text-sm text-gray-700 hover:text-gray-900 cursor-pointer transition-colors duration-200 font-medium">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-400 bg-gray-100 border-gray-300 rounded focus:ring-blue-400"
                                    />
                                    <span className="ml-2 tracking-wide">Remember me</span>
                                </label>
                                <button
                                    id="signin"
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-8 py-3 rounded-xl font-semibold tracking-wide text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg transition-all duration-200${isSubmitting
                                        ? "opacity-50 cursor-not-allowed hover:scale-100 hover:from-blue-500 hover:to-purple-600"
                                        : "hover:from-blue-600 hover:to-purple-700 hover:scale-105 hover:shadow-blue-500/25"
                                        }`}
                                >
                                    {isSubmitting ? "Please wait..." : "Sign In"}
                                </button>

                            </div>
                        </form>

                        {/* Footer */}
                        <div className="mt-8 pt-6 border-t border-gray-300">
                            <p className="text-center text-xs text-gray-600 tracking-wide font-bold">
                                © 2024 Skydent Pvt Ltd. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}