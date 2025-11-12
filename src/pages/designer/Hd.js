import { useState, useEffect, useContext } from "react";
import { DesignerContext } from "../../Context/DesignerContext";
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
        const data = localStorage.getItem('designer') ? localStorage.getItem('designer') : "";
        const token = localStorage.getItem('token') ? localStorage.getItem('token') : "";

        if (data === '' && token === '') {
            navigate('/designer');
        }
    })

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
        { href: "/designer/home", label: "Home", key: "index", icon: faHome },
        { href: "/designer/new_request", label: "File Upload", key: "new_request", icon: faUpload },
        { href: "/designer/multisearch", label: "Advance Search", key: "multisearch", icon: faSearch },
        { href: "/designer/reports", label: "Reports", key: "reports", icon: faChartBar }
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
        <header className="fixed z-50 top-0 left-0 w-full h-[9vh] bg-gray-800 text-white flex items-center">
            <nav className={`w-full transition-all duration-300 ${scrolled ? "bg-gray-900 shadow-2xl" : "bg-gray-900"
                }`}>
                <div className="w-full mx-auto px-3 sm:px-4 lg:px-6">
                    {/* Main Navigation Bar */}
                    <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
                        {/* Logo - Left Side */}
                        <div className="flex-shrink-0">
                            <Link
                                to="/designer/home"
                                className="flex items-center"
                                onClick={() => {
                                    setIsOpen(false);
                                    setMobileSearchOpen(false);
                                }}
                            >
                                <img
                                    src="/img/logo.png"
                                    alt="Logo"
                                    className="h-6 w-auto sm:h-8 lg:h-10 transition-all duration-300 hover:scale-105"
                                    onError={(e) => {
                                        e.target.src = '/img/placeholder-logo.png';
                                    }}
                                />
                            </Link>
                        </div>

                        {/* Center Menu - Desktop */}
                        <div className="hidden xl:flex xl:items-center xl:flex-1 xl:justify-center">
                            <div className="flex items-center space-x-1 bg-gray-800/70 backdrop-blur-sm rounded-xl p-1.5 border border-gray-700">
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

                        {/* Right Side - Search & Profile */}
                        <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                            {/* Search Form - Desktop */}
                            <div className="hidden lg:block search-container">
                                <form className="flex items-center" onSubmit={handleSearchSubmit}>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            name="orderid"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search Order ID..."
                                            className="pl-4 pr-10 py-2.5 w-64 xl:w-80 bg-gray-800 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-gray-700 transition-all duration-300 border border-gray-600 text-sm hover:border-gray-500 group-hover:shadow-lg"
                                        />
                                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                                            {searchQuery && (
                                                <button
                                                    type="button"
                                                    onClick={clearSearch}
                                                    className="text-gray-400 hover:text-red-400 transition-colors p-1"
                                                >
                                                    <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                                                </button>
                                            )}
                                            <button
                                                type="submit"
                                                className="text-gray-400 hover:text-orange-400 transition-colors p-1"
                                            >
                                                <FontAwesomeIcon icon={faSearch} className="w-4 h-4" />
                                            </button>
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
                                className="lg:hidden text-white hover:text-orange-300 p-2 transition-colors duration-200 rounded-lg hover:bg-gray-800"
                            >
                                <FontAwesomeIcon
                                    icon={mobileSearchOpen ? faTimes : faSearch}
                                    className="w-5 h-5 sm:w-6 sm:h-6"
                                />
                            </button>

                            {/* Theme Toggle */}
                            <button
                                onClick={changeIcon}
                                className="cursor-pointer transition-all duration-300 rounded-full border-2 border-orange-400 shadow-lg hover:shadow-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 hover:scale-105"
                                aria-label="Toggle theme"
                            >
                                {mode === 'light' ? (
                                    <FontAwesomeIcon icon={faMoon} className="w-6 h-6 sm:w-5 sm:h-5 text-white" />
                                ) : (
                                    <FontAwesomeIcon icon={faSun} className="w-6 h-6 sm:w-5 sm:h-5 text-yellow-400" />
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
                                            src={designer?.pic && designer.pic !== '' ? designer.pic : '/img/user.webp'}
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
                                                {designer?.name || 'User'}
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
                                className="xl:hidden text-white hover:text-orange-300 p-2 transition-colors duration-200 rounded-lg hover:bg-gray-800"
                                aria-label="Toggle menu"
                            >
                                <FontAwesomeIcon
                                    icon={isOpen ? faTimes : faBars}
                                    className="w-5 h-5 sm:w-6 sm:h-6"
                                />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Search Bar */}
                    {mobileSearchOpen && (
                        <div className="lg:hidden bg-gray-800 px-3 sm:px-4 py-3 border-t border-gray-700 animate-slideDown">
                            <form onSubmit={handleSearchSubmit} className="flex space-x-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        name="orderid"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search Order ID..."
                                        className="w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-600 text-sm"
                                        autoFocus
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={clearSearch}
                                            className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-400 p-1"
                                        >
                                            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    <FontAwesomeIcon icon={faSearch} className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Mobile Menu */}
                    {isOpen && (
                        <div className="xl:hidden bg-gray-800 border-t border-gray-700 animate-slideDown">
                            <div className="px-2 py-3 space-y-1">
                                {navItems.map((item) => (
                                    <Link
                                        to={item.href}
                                        key={item.key}
                                        className={`block px-4 py-4 rounded-xl font-medium transition-all duration-300 flex items-center space-x-4 text-base sm:text-lg ${activePage === item.key
                                            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                                            }`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <FontAwesomeIcon
                                            icon={item.icon}
                                            className={`w-5 h-5 ${activePage === item.key ? 'text-white' : 'text-orange-400'
                                                }`}
                                        />
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <style jsx='true'>{`
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
            `}</style>
            </nav>
        </header>
    );
}