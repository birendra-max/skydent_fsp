import { useState, useEffect, useContext } from "react";
import { AdminContext } from "../../Context/AdminContext";
import { ThemeContext } from "../../Context/ThemeContext";
import { Link, useNavigate, useLocation } from "react-router-dom"; // ADD useLocation
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSearch,
    faGaugeHigh,
    faUpload,
    faChartBar,
    faUser,
    faSignOutAlt,
    faMoon,
    faSun,
    faTimes,
} from "@fortawesome/free-solid-svg-icons";

export default function Hd() {
    const { admin, logout } = useContext(AdminContext);
    const { setTheme } = useContext(ThemeContext);
    const [mode, setMode] = useState("light");
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activePage, setActivePage] = useState(null); // Change to null initially
    const navigate = useNavigate();
    const location = useLocation(); // ADD this

    // Redirect if not logged in
    useEffect(() => {
        const data = localStorage.getItem("bravo_admin");
        const token = localStorage.getItem("bravo_admin_token");
        if (!data || !token) navigate("/admin");
    }, [navigate]);

    // Theme setup
    useEffect(() => {
        const savedMode = localStorage.getItem("theme") || "light";
        setMode(savedMode);
        applyTheme(savedMode);
    }, []);

    // Scroll shadow
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // DETERMINE IF CURRENT PAGE IS IN MENU ITEMS
    useEffect(() => {
        const currentPath = location.pathname;
        const menuPaths = [
            "/admin/dashboard",
            "/admin/new_request", 
            "/admin/multisearch",
            "/admin/cases-reports"
        ];
        
        // Check if current path matches any menu item
        const isMenuPage = menuPaths.some(path => currentPath.includes(path));
        
        if (isMenuPage) {
            if (currentPath.includes("dashboard")) setActivePage("index");
            else if (currentPath.includes("new_request")) setActivePage("new_request");
            else if (currentPath.includes("multisearch")) setActivePage("multisearch");
            else if (currentPath.includes("cases-reports")) setActivePage("reports");
            else setActivePage("index");
        } else {
            setActivePage(null);
        }
    }, [location.pathname]);

    // Click outside dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest(".dropdown-container")) setDropdownOpen(false);
            if (!e.target.closest(".search-container")) setMobileSearchOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

    const applyTheme = (newTheme) => {
        localStorage.setItem("theme", newTheme);
        setTheme(newTheme);
    };

    const toggleTheme = () => {
        const newMode = mode === "light" ? "dark" : "light";
        setMode(newMode);
        applyTheme(newMode);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        showNotification(`Searching for "${searchQuery}"`, "info");
    };

    const clearSearch = () => setSearchQuery("");

    const showNotification = (message, type = "info") => {
        const notification = document.createElement("div");
        notification.className = `fixed top-20 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white font-medium transform transition-all duration-300 ${type === "warning" ? "bg-orange-500" : "bg-blue-500"
            }`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.transform = "translateX(100%)";
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    };

    const navItems = [
        { href: "/admin/dashboard", label: "Dashboard", key: "index", icon: faGaugeHigh },
        { href: "/admin/new_request", label: "File Upload", key: "new_request", icon: faUpload },
        { href: "/admin/multisearch", label: "Multi Search", key: "multisearch", icon: faSearch },
        { href: "/admin/cases-reports", label: "Reports", key: "reports", icon: faChartBar }
    ];
    
    return (
        <header
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? "shadow-xl bg-gray-900/95 backdrop-blur-lg" : "bg-gray-900"
                }`}
        >
            <div className="flex justify-between items-center h-[9vh] px-4 sm:px-6 lg:px-10 text-white">
                {/* --- Logo --- */}
                <Link to="/admin/dashboard" className="flex items-center space-x-3">
                    <img
                        src="/img/logo.png"
                        alt="Logo"
                        className="h-10 sm:h-16 w-auto rounded-lg hover:scale-105 transition-transform"
                        onError={(e) => (e.target.src = "/img/placeholder-logo.png")}
                    />
                    {/* --- Center Welcome Text --- */}
                    <div className="hidden md:flex items-center space-x-2 text-sm lg:text-base font-bold">
                        <span className="text-gray-300">Welcome,</span>
                        <span className="text-orange-400 font-bold">
                            {admin?.name || "Admin"}
                        </span>
                    </div>
                </Link>

                {/* Center Menu - Desktop */}
                <div className="hidden xl:flex xl:items-center xl:flex-1 xl:justify-center">
                    <div className="flex items-center space-x-6 bg-gray-800/70 backdrop-blur-sm rounded-xl p-1.5 border border-gray-700">
                        {navItems.map((item) => (
                            <Link
                                to={item.href}
                                key={item.key}
                                className={`text-xs lg:text-sm px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${activePage === item.key
                                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-105"
                                    : "text-gray-300 hover:bg-gray-700 hover:text-white hover:shadow-md"
                                    }`}
                            >
                                <FontAwesomeIcon
                                    icon={item.icon}
                                    className="w-3 h-3 lg:w-4 lg:h-4"
                                />
                                <span className="whitespace-nowrap">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* --- Right Side --- */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                    {/* Search - Desktop */}
                    <form
                        onSubmit={handleSearchSubmit}
                        className="hidden sm:flex items-center relative search-container"
                    >
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Order ID..."
                            className="pl-4 pr-10 py-2 bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all w-64"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="absolute right-9 text-gray-400 hover:text-red-400 transition-colors"
                            >
                                <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                            </button>
                        )}
                        <button
                            type="submit"
                            className="absolute right-2 text-gray-400 hover:text-orange-400 transition-colors"
                        >
                            <FontAwesomeIcon icon={faSearch} className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Mobile Search Icon */}
                    <button
                        onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                        className="sm:hidden text-gray-300 hover:text-orange-400 transition-colors"
                    >
                        <FontAwesomeIcon
                            icon={mobileSearchOpen ? faTimes : faSearch}
                            className="w-5 h-5"
                        />
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="flex items-center justify-center h-9 w-9 rounded-full border border-orange-400 bg-gray-800 hover:bg-gray-700 transition-all hover:scale-105"
                        aria-label="Toggle theme"
                    >
                        {mode === "light" ? (
                            <FontAwesomeIcon icon={faMoon} className="text-white w-5 h-5" />
                        ) : (
                            <FontAwesomeIcon
                                icon={faSun}
                                className="text-yellow-400 w-5 h-5"
                            />
                        )}
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative dropdown-container">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center text-white hover:text-orange-300 transition-all duration-300 p-1 cursor-pointer rounded-lg hover:bg-gray-800"
                        >
                            <div className="relative">
                                <img
                                    src={admin?.pic && admin.pic !== '' ? admin.pic : '/img/user.webp'}
                                    alt="User profile"
                                    className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 rounded-full border-2 border-orange-400 object-cover hover:border-orange-300 transition-colors"
                                    onError={(e) => {
                                        e.target.src = '/img/user.webp';
                                    }}
                                />
                                <div className="absolute bottom-0 right-0 h-2 w-2 sm:h-2.5 sm:w-2.5 bg-green-500 rounded-full border-2 border-gray-900"></div>
                            </div>
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-gray-800 rounded-xl shadow-2xl py-2 border border-gray-700 z-50 cursor-pointer backdrop-blur-sm">
                                <div className="px-4 py-3 border-b border-gray-700">
                                    <div className="text-white font-semibold truncate text-sm sm:text-base">
                                        {admin?.name || 'User'}
                                    </div>
                                    <div className="text-gray-400 text-xs sm:text-sm truncate mt-1">
                                        {admin?.email || ''}
                                    </div>
                                </div>
                                <div className="py-1">
                                    <Link
                                        to="/admin/profile"
                                        className="block px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200 flex items-center text-sm sm:text-base"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-3" />
                                        Profile
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="block w-full text-left px-4 py-3 text-red-400 hover:bg-red-600 hover:text-white transition-all duration-200 flex items-center text-sm sm:text-base"
                                    >
                                        <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4 mr-3" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Search Bar */}
            {mobileSearchOpen && (
                <div className="sm:hidden px-4 py-3 bg-gray-800 border-t border-gray-700 animate-slideDown">
                    <form onSubmit={handleSearchSubmit} className="flex space-x-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Order ID..."
                            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-xl border border-gray-600 focus:ring-2 focus:ring-orange-500 text-sm"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-orange-500 rounded-xl text-white hover:bg-orange-600 transition"
                        >
                            <FontAwesomeIcon icon={faSearch} />
                        </button>
                    </form>
                </div>
            )}

            <style jsx="true">{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
        </header>
    );
}