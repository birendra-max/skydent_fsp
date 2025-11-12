import { useState, useEffect, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { DesignerContext } from '../../Context/DesignerContext';
import { useNavigate } from "react-router-dom";
import config from '../../config';

export default function Login() {
    const { setDesigner } = useContext(DesignerContext);
    const [activeIndex, setActiveIndex] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" }); // success / error
    const navigate = useNavigate();

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

    const handleForm = async (e) => {
        e.preventDefault();
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
                return;
            }

            const data = await res.json();

            if (data.status === "success" && data.message === "Login successfully" && data.designer?.desiid) {
                setStatus({ type: "success", message: data.message });
                localStorage.setItem('token', data.token);
                localStorage.setItem('base_url', data.base_url);
                setDesigner(data.designer);
                setStatus({ type: 'success', message: data.message })
                navigate('/designer/home');
            } else {
                setStatus({ type: "error", message: data.message || "Invalid login" });
            }
        } catch (err) {
            setStatus({ type: "error", message: "Something went wrong!" });
        }
    }

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

    // Auto-scroll effect
    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 4000);

        return () => clearInterval(interval);
    }, []);


    return (
        <section className="min-h-screen flex flex-col items-center justify-center bg-[#FFB88C] px-4 py-10">
            <div className="w-full max-w-6xl">
                {/* Logo */}
                <img
                    src="/img/logo.png"
                    alt="skydent Logo"
                    className="h-20 w-40 object-contain mb-6"
                />
            </div>

            <div className="w-full max-w-6xl bg-white shadow-2xl rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-3">
                {/* Left: Login Form */}
                <div className="p-8 md:col-span-1 flex flex-col justify-center bg-gradient-to-b from-gray-50 to-gray-100">
                    <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                        Designer Login
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
                    <form onSubmit={handleForm} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold uppercase text-gray-700 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                name="email"
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-semibold uppercase text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                            />
                            {/* Eye toggle button */}
                            <button
                                type="button"
                                className="absolute right-3 top-9 text-gray-500 hover:text-gray-800"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <FontAwesomeIcon
                                    icon={showPassword ? faEyeSlash : faEye}
                                    size="lg"
                                />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="flex items-center text-sm text-gray-600">
                                <input type="checkbox" name="remember" className="mr-2" onChange={handleChange} /> Remember Me
                            </label>
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer"
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                    <p className="text-xs text-gray-500 mt-8 text-center">
                        Created with <span className="text-red-500">♥</span> skydent
                    </p>
                </div>

                {/* Right: Carousel */}
                <div className="md:col-span-2 relative">
                    <div className="relative w-full h-96 md:h-full overflow-hidden">
                        {images.map((img, idx) => (
                            <img
                                key={idx}
                                src={img}
                                alt={`slide-${idx}`}
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${idx === activeIndex ? "opacity-100" : "opacity-0"
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Carousel Controls */}
                    <button
                        onClick={prevSlide}
                        className="absolute top-1/2 left-4 -translate-y-1/2 bg-black bg-opacity-40 text-white px-3 py-2 rounded-full hover:bg-opacity-70"
                    >
                        ❮
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute top-1/2 right-4 -translate-y-1/2 bg-black bg-opacity-40 text-white px-3 py-2 rounded-full hover:bg-opacity-70"
                    >
                        ❯
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveIndex(idx)}
                                className={`w-3 h-3 rounded-full ${idx === activeIndex ? "bg-blue-600" : "bg-gray-400"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
