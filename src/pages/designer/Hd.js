import { useState, useEffect, useContext } from "react";
import { DesignerContext } from "../../Context/DesignerContext";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ThemeContext } from "../../Context/ThemeContext";
import {
    faHome,
    faUpload,
    faSearch,
    faUser,
    faSignOutAlt,
    faMoon,
    faSun,
    faTimes,
    faBars,
    faChartLine
} from '@fortawesome/free-solid-svg-icons';

export default function Hd() {
    const { setTheme } = useContext(ThemeContext);
    const [mode, setMode] = useState('light');
    const navigate = useNavigate();
    const location = useLocation();
    const { designer, logout } = useContext(DesignerContext);
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activePage, setActivePage] = useState("index");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Authentication check
    useEffect(() => {
        const data = localStorage.getItem('designer');
        const token = localStorage.getItem('token');

        if (!data || !token) {
            navigate('/designer');
        }
    }, [navigate]);

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const savedMode = localStorage.getItem('theme') || 'light';
        setMode(savedMode);
        applyTheme(savedMode);
    }, []);

    // Handle scroll effect for subtle header transformation
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Determine active page based on current route
    useEffect(() => {
        const pathname = location.pathname;
        if (pathname.includes("new_request")) setActivePage("new_request");
        else if (pathname.includes("multisearch")) setActivePage("multisearch");
        else if (pathname.includes("reports")) setActivePage("reports");
        else if (pathname.includes("profile")) setActivePage("profile");
        else setActivePage("index");
    }, [location]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownOpen && !event.target.closest('.dropdown-container')) {
                setDropdownOpen(false);
            }
            if (isOpen && !event.target.closest('.mobile-menu-container')) {
                setIsOpen(false);
            }
            if (mobileSearchOpen && !event.target.closest('.search-container')) {
                setMobileSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [dropdownOpen, isOpen, mobileSearchOpen]);

    const navItems = [
        { href: "/designer/home", label: "Dashboard", key: "index", icon: faHome },
        { href: "/designer/new_request", label: "Upload Finish & Stl", key: "new_request", icon: faUpload },
        { href: "/designer/multisearch", label: "Multi-Search", key: "multisearch", icon: faSearch },
        { href: "/designer/reports", label: "Reports", key: "reports", icon: faChartLine }
    ];

    const applyTheme = (newTheme) => {
        localStorage.setItem('theme', newTheme);
        setTheme(newTheme);
    };

    const changeIcon = () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        applyTheme(newMode);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setMobileSearchOpen(false);
            navigate(`/designer/search-order/${searchQuery}`)
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    return (
        <header className="fixed z-50 top-0 left-0 w-full h-16 bg-gray-900 border-b border-gray-700">
            <nav className="w-full h-full">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 h-full">
                    {/* Main Navigation Bar */}
                    <div className="flex items-center justify-between h-full">
                        {/* Left Side - Logo */}
                        <div className="flex items-center">
                            <Link
                                to="/designer/home"
                                className="flex items-center"
                                onClick={() => {
                                    setIsOpen(false);
                                    setMobileSearchOpen(false);
                                }}
                            >
                                <div className="h-full w-full rounded-lg flex items-center justify-center">
                                    <img 
                                        src="/img/logo.png" 
                                        alt="Logo" 
                                        className="h-10 w-auto" 
                                        onError={(e) => { e.target.src = '/img/placeholder-logo.png'; }} 
                                    />
                                </div>
                            </Link>
                        </div>

                        {/* Center - Desktop Navigation */}
                        <div className="hidden lg:flex items-center justify-center flex-1 max-w-2xl mx-8">
                            <div className="flex items-center space-x-4">
                                {navItems.map((item) => (
                                    <Link
                                        to={item.href}
                                        key={item.key}
                                        className={`px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center space-x-2 text-sm ${activePage === item.key
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-300 hover:text-white hover:bg-gray-800"
                                            }`}
                                    >
                                        <FontAwesomeIcon
                                            icon={item.icon}
                                            className="w-4 h-4"
                                        />
                                        <span className="whitespace-nowrap font-bold">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Right Side - Search, Theme, and Profile */}
                        <div className="flex items-center space-x-4">
                            {/* Search - Desktop */}
                            <div className="hidden lg:block search-container">
                                <form className="flex items-center" onSubmit={handleSearchSubmit}>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search orders..."
                                            className="pl-10 pr-10 py-2 w-74 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 text-sm"
                                        />
                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                            <FontAwesomeIcon icon={faSearch} className="w-4 h-4" />
                                        </div>
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                onClick={clearSearch}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                            >
                                                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Theme Toggle */}
                            <button
                                onClick={changeIcon}
                                className="p-2 text-gray-300 hover:text-white transition-all duration-200 rounded-lg hover:bg-gray-800"
                                aria-label="Toggle theme"
                            >
                                {mode === 'light' ? (
                                    <FontAwesomeIcon icon={faMoon} className="w-5 h-5" />
                                ) : (
                                    <FontAwesomeIcon icon={faSun} className="w-5 h-5 text-yellow-400" />
                                )}
                            </button>

                            {/* Mobile Search Button */}
                            <button
                                onClick={() => {
                                    setMobileSearchOpen(!mobileSearchOpen);
                                    setIsOpen(false);
                                }}
                                className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors duration-200 rounded-lg hover:bg-gray-800"
                            >
                                <FontAwesomeIcon
                                    icon={mobileSearchOpen ? faTimes : faSearch}
                                    className="w-5 h-5"
                                />
                            </button>

                            {/* Profile Dropdown */}
                            <div className="relative dropdown-container">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center space-x-3 p-2 cursor-pointer rounded-lg hover:bg-gray-800 transition-colors duration-200"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="text-white font-semibold truncate text-sm sm:text-base">
                                            {designer?.name || 'Designer'}
                                        </div>
                                        <div className="relative">
                                            <img
                                                src={designer?.pic && designer.pic !== '' ? designer.pic : '/img/user.webp'}
                                                alt="Designer profile"
                                                className="h-8 w-8 rounded-full border-2 border-gray-600 object-cover"
                                                onError={(e) => {
                                                    e.target.src = '/img/user.webp';
                                                }}
                                            />
                                            <div className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border-2 border-gray-900"></div>
                                        </div>
                                    </div>
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-gray-800 rounded-xl shadow-2xl py-2 border border-gray-700 z-50 cursor-pointer backdrop-blur-sm">
                                        <div className="px-4 py-3 border-b border-gray-700">
                                            <div className="text-white font-semibold truncate text-sm sm:text-base">
                                                {designer?.name || 'Designer'}
                                            </div>
                                            <div className="text-gray-400 text-xs sm:text-sm truncate mt-1">
                                                {designer?.email || ''}
                                            </div>
                                        </div>
                                        <div className="py-1">
                                            <Link
                                                to="/designer/profile"
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

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => {
                                    setIsOpen(!isOpen);
                                    setMobileSearchOpen(false);
                                }}
                                className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors duration-200 rounded-lg hover:bg-gray-800"
                                aria-label="Toggle menu"
                            >
                                <FontAwesomeIcon
                                    icon={isOpen ? faTimes : faBars}
                                    className="w-5 h-5"
                                />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Search Bar */}
                    {mobileSearchOpen && (
                        <div className="lg:hidden bg-gray-800 px-4 py-3 border-t border-gray-700">
                            <form onSubmit={handleSearchSubmit} className="flex space-x-3">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search orders..."
                                        className="w-full px-4 py-2 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 text-sm"
                                        autoFocus
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={clearSearch}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                        >
                                            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                >
                                    <FontAwesomeIcon icon={faSearch} className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Mobile Navigation Menu */}
                    {isOpen && (
                        <div className="lg:hidden bg-gray-800 border-t border-gray-700">
                            <div className="px-3 py-2 space-y-1">
                                {navItems.map((item) => (
                                    <Link
                                        to={item.href}
                                        key={item.key}
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors duration-200 text-sm ${activePage === item.key
                                            ? "bg-blue-600 text-white border border-blue-500"
                                            : "text-gray-300 hover:text-white hover:bg-gray-700"
                                            }`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <FontAwesomeIcon
                                            icon={item.icon}
                                            className="w-4 h-4"
                                        />
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
}