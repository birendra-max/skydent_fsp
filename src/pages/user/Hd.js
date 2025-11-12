import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../Context/UserContext";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ThemeContext } from "../../Context/ThemeContext";
import {
    faHome,
    faUpload,
    faSearch,
    faChartBar,
    faUser,
    faSignOutAlt,
    faMoon,
    faSun,
    faTimes,
    faBars
} from '@fortawesome/free-solid-svg-icons';

export default function Hd() {

    useEffect(() => {
        const data = localStorage.getItem('user') ? localStorage.getItem('user') : "";
        const token = localStorage.getItem('token') ? localStorage.getItem('token') : "";

        if (data === '' && token === '') {
            navigate('/user');
        }
    })

    const { setTheme } = useContext(ThemeContext);
    const [mode, setMode] = useState('light');
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useContext(UserContext);
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activePage, setActivePage] = useState("index");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const savedMode = localStorage.getItem('theme') || 'light';
        setMode(savedMode);
        applyTheme(savedMode);
    }, []);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
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
        { href: "/user/home", label: "Home", key: "index", icon: faHome },
        { href: "/user/new_request", label: "File Upload", key: "new_request", icon: faUpload },
        { href: "/user/multisearch", label: "Advance Search", key: "multisearch", icon: faSearch },
        { href: "/user/reports", label: "Reports", key: "reports", icon: faChartBar }
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
            // Close mobile search if open
            setMobileSearchOpen(false);

            // Implement search functionality
            const rows = document.querySelectorAll('#datatable tbody tr');
            let found = false;

            rows.forEach((row, index) => {
                const firstCellText = row.cells[0].innerText.trim();
                if (firstCellText === searchQuery.trim()) {
                    row.style.display = "";
                    found = true;
                    // Scroll to the found row
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Highlight the row
                    row.classList.add('bg-yellow-100', 'dark:bg-yellow-900');
                    setTimeout(() => {
                        row.classList.remove('bg-yellow-100', 'dark:bg-yellow-900');
                    }, 2000);
                } else {
                    row.style.display = "none";
                }
            });

            if (!found) {
                // Show notification for no results
                showNotification('No orders found with that ID', 'warning');
            }
        } else {
            // If search is empty — show all rows
            const rows = document.querySelectorAll('#datatable tbody tr');
            rows.forEach(row => {
                row.style.display = "";
                row.classList.remove('bg-yellow-100', 'dark:bg-yellow-900');
            });
        }
    };

    const showNotification = (message, type = 'info') => {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transform transition-all duration-300 ${type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
            }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    };

    const clearSearch = () => {
        setSearchQuery("");
        const rows = document.querySelectorAll('#datatable tbody tr');
        rows.forEach(row => {
            row.style.display = "";
            row.classList.remove('bg-yellow-100', 'dark:bg-yellow-900');
        });
    };

    return (
        <header className="fixed z-50 top-0 left-0 w-full h-16 bg-gradient-to-r from-slate-800 to-gray-900 border-b border-gray-700 shadow-xl">
            <nav className="w-full h-full">
                <div className="w-full mx-auto px-3 sm:px-4 lg:px-6 h-full">
                    {/* Main Navigation Bar */}
                    <div className="flex items-center justify-between h-full">
                        {/* Logo - Left Side */}
                        <div className="flex items-center space-x-4 lg:space-x-8">
                            <Link
                                to="/user/home"
                                className="flex items-center space-x-3"
                                onClick={() => {
                                    setIsOpen(false);
                                    setMobileSearchOpen(false);
                                }}
                            >
                                <div>
                                    <img
                                        src="/img/logo.png"
                                        alt="Logo"
                                        className="h-10 w-auto"
                                        onError={(e) => {
                                            e.target.src = '/img/placeholder-logo.png';
                                        }}
                                    />
                                </div>
                            </Link>

                            {/* Center Menu - Desktop */}
                            <div className="hidden lg:flex items-center space-x-1 lg:ml-10 xl:ml-20">
                                {navItems.map((item) => (
                                    <Link
                                        to={item.href}
                                        key={item.key}
                                        className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-sm ${activePage === item.key
                                            ? "bg-white/20 text-white backdrop-blur-sm border border-white/30 shadow-lg"
                                            : "text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-transparent"
                                            }`}
                                    >
                                        <FontAwesomeIcon
                                            icon={item.icon}
                                            className="w-4 h-4"
                                        />
                                        <span className="whitespace-nowrap">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Right Side - Search & Profile */}
                        <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                            {/* Search Form - Desktop */}
                            <div className="hidden lg:block search-container">
                                <form className="flex items-center" onSubmit={handleSearchSubmit}>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="orderid"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search Order ID..."
                                            className="pl-10 pr-10 py-2.5 w-64 xl:w-80 bg-white/10 text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/15 transition-all duration-200 border border-white/20 text-sm backdrop-blur-sm"
                                        />
                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70">
                                            <FontAwesomeIcon icon={faSearch} className="w-4 h-4" />
                                        </div>
                                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                                            {searchQuery && (
                                                <button
                                                    type="button"
                                                    onClick={clearSearch}
                                                    className="text-white/60 hover:text-white transition-colors p-1"
                                                >
                                                    <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            </div>

                            {/* Mobile Search Button */}
                            <button
                                onClick={() => {
                                    setMobileSearchOpen(!mobileSearchOpen);
                                    setIsOpen(false);
                                }}
                                className="lg:hidden text-white hover:text-white/80 p-2 transition-colors duration-200 rounded-lg hover:bg-white/10"
                            >
                                <FontAwesomeIcon
                                    icon={mobileSearchOpen ? faTimes : faSearch}
                                    className="w-5 h-5"
                                />
                            </button>

                            {/* Theme Toggle */}
                            <button
                                onClick={changeIcon}
                                className="p-2.5 text-white hover:text-white/80 transition-all duration-200 rounded-lg hover:bg-white/10"
                                aria-label="Toggle theme"
                            >
                                {mode === 'light' ? (
                                    <FontAwesomeIcon icon={faMoon} className="w-5 h-5" />
                                ) : (
                                    <FontAwesomeIcon icon={faSun} className="w-5 h-5 text-yellow-300" />
                                )}
                            </button>

                            {/* Profile Dropdown */}
                            <div className="relative dropdown-container">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center space-x-2 sm:space-x-3 p-1 cursor-pointer rounded-lg hover:bg-white/10 transition-colors duration-200"
                                >
                                    <div className="relative">
                                        <img
                                            src={user?.pic && user.pic !== '' ? user.pic : '/img/user.webp'}
                                            alt="User profile"
                                            className="h-8 w-8 rounded-full border-2 border-white/60 object-cover"
                                            onError={(e) => {
                                                e.target.src = '/img/user.webp';
                                            }}
                                        />
                                        <div className="absolute bottom-0 right-0 h-2 w-2 bg-green-400 rounded-full border-2 border-emerald-600"></div>
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <div className="text-sm font-medium text-white">
                                            {user?.name || 'User'}
                                        </div>
                                        <div className="text-xs text-white/70">
                                            {user?.role || 'Admin'}
                                        </div>
                                    </div>
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 cursor-pointer">
                                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {user?.name || 'User'}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {user?.email || ''}
                                            </div>
                                        </div>
                                        <div className="py-1">
                                            <Link
                                                to="/user/profile"
                                                className="block px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center text-sm"
                                                onClick={() => setDropdownOpen(false)}
                                            >
                                                <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-3" />
                                                Profile Settings
                                            </Link>
                                            <button
                                                onClick={logout}
                                                className="block w-full text-left px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 flex items-center text-sm"
                                            >
                                                <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4 mr-3" />
                                                Sign Out
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
                                className="lg:hidden text-white hover:text-white/80 p-2 transition-colors duration-200 rounded-lg hover:bg-white/10"
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
                        <div className="lg:hidden bg-gradient-to-r from-slate-800 to-gray-900 px-4 py-3 border-t border-emerald-500/30">
                            <form onSubmit={handleSearchSubmit} className="flex space-x-3">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        name="orderid"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search Order ID..."
                                        className="w-full px-4 py-3 bg-white/10 text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 border border-white/20 text-sm backdrop-blur-sm"
                                        autoFocus
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={clearSearch}
                                            className="absolute right-12 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white p-1"
                                        >
                                            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="px-4 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors duration-200 backdrop-blur-sm border border-white/20"
                                >
                                    <FontAwesomeIcon icon={faSearch} className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Mobile Menu */}
                    {isOpen && (
                        <div className="lg:hidden bg-gradient-to-r from-slate-800 to-gray-900">
                            <div className="px-3 py-4 space-y-2">
                                {navItems.map((item) => (
                                    <Link
                                        to={item.href}
                                        key={item.key}
                                        className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-3 text-sm ${activePage === item.key
                                            ? "bg-white/20 text-white backdrop-blur-sm border border-white/30"
                                            : "text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-transparent"
                                            }`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <FontAwesomeIcon
                                            icon={item.icon}
                                            className={`w-4 h-4 ${activePage === item.key ? 'text-white' : 'text-white/70'}`}
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