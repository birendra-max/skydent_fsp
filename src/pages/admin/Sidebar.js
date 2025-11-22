import { useState, useContext, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faGaugeHigh,
    faUserShield,
    faUsers,
    faPalette,
    faCircleInfo,
    faFileLines,
    faChevronDown,
    faChevronUp,
    faFolderOpen,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useLocation } from "react-router-dom";
import { ThemeContext } from "../../Context/ThemeContext";

export default function Sidebar() {
    const { theme } = useContext(ThemeContext);
    const [collapsed, setCollapsed] = useState(false);
    const [openMenu, setOpenMenu] = useState(null);
    const [animatingMenu, setAnimatingMenu] = useState(null);
    const location = useLocation();
    const currentPath = location.pathname;

    const dropdownIconColors = {
        admin: "text-purple-500",
        client: "text-blue-500",
        design: "text-orange-500",
        cases: "text-green-500",
        reports: "text-red-500",
        files: "text-indigo-500",
    };

    const navItems = [
        {
            name: "Dashboard",
            icon: faGaugeHigh,
            id: "dashboard",
            link: "/admin/dashboard",
            type: "single",
        },
        {
            name: "Admin",
            icon: faUserShield,
            id: "admin",
            type: "dropdown",
            submenus: [
                { name: "Add Admin", link: "/admin/add-admin" },
                { name: "Reset Password", link: "/admin/reset-password-admin" },
            ],
        },
        {
            name: "Clients",
            icon: faUsers,
            id: "client",
            type: "dropdown",
            submenus: [
                { name: "Add Clients", link: "/admin/add-client" },
                { name: "Reset Password", link: "/admin/reset-password-client" },
            ],
        },
        {
            name: "Designers",
            icon: faPalette,
            id: "design",
            type: "dropdown",
            submenus: [
                { name: "Add Designers", link: "/admin/add-designer" },
                { name: "Reset Password", link: "/admin/reset-password-designer" },
            ],
        },
        {
            name: "Cases",
            icon: faCircleInfo,
            id: "cases",
            type: "dropdown",
            submenus: [
                { name: "All Cases", link: "/admin/all-cases" },
                { name: "New Cases", link: "/admin/new-cases" },
                { name: "Completed Cases", link: "/admin/completed-cases" },
                { name: "Pending Cases", link: "/admin/pending-cases" },
                { name: "Cancelled Cases", link: "/admin/cancelled-cases" },
                { name: "Redesign Cases", link: "/admin/redesign-cases" },
                { name: "QC Cases", link: "/admin/qc-cases" },
                { name: "Rush Cases", link: "/admin/rush-cases" },
                { name: "Hold Cases", link: "/admin/hold-cases" },
                { name: "Today Cases", link: "/admin/today-cases" },
                { name: "Yesterday Cases", link: "/admin/yesterday-cases" },
                { name: "Weekly Cases", link: "/admin/weekly-cases" },
            ],
        },
        {
            name: "Reports",
            icon: faFileLines,
            id: "reports",
            type: "dropdown",
            submenus: [
                { name: "Client Reports", link: "/admin/clients-reports" },
                // { name: "Designer Reports", link: "/admin/designer-reports" },
                { name: "Date-wise Reports", link: "/admin/cases-reports" },
            ],
        },
        {
            name: "Files",
            icon: faFolderOpen,
            id: "files",
            type: "dropdown",
            submenus: [
                { name: "Initial Files", link: "/admin/initial-files" },
                { name: "STL Files", link: "/admin/stl-files" },
                { name: "Finished Files", link: "/admin/finished-files" },
            ],
        },
    ];

    const toggleDropdown = (id) => {
        if (openMenu === id) {
            setAnimatingMenu(id);
            setTimeout(() => {
                setOpenMenu(null);
                setAnimatingMenu(null);
            }, 300);
        } else {
            setOpenMenu(id);
        }
    };

    useEffect(() => {
        const foundMenu = navItems.find(
            (item) => item.submenus && item.submenus.some((sub) => currentPath.includes(sub.link))
        );
        if (foundMenu) setOpenMenu(foundMenu.id);
    }, [currentPath]);

    const sidebarClasses = `w-64
        ${theme === "dark" ? "bg-gray-900 text-gray-200" : "bg-gray-100 text-gray-800"} 
        fixed top-16 left-0 h-[calc(100vh-4rem)] flex flex-col transition-all duration-300 shadow-lg border-r overflow-y-auto
        ${theme === "dark" ? "border-gray-800" : "border-gray-200"}
    `;

    const navLinkClasses = (isActive) =>
        `flex items-center w-full gap-3 px-4 py-2 rounded-sm transition-all duration-200 font-bold cursor-pointer
        ${isActive
            ? "bg-gray-600 text-white shadow-md"
            : theme === "dark"
                ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
        }`;

    const dropdownHeaderClasses = (isOpen) =>
        `flex items-center justify-between w-full px-4 py-2 rounded-sm transition-all duration-200 cursor-pointer
        ${isOpen
            ? "bg-gray-600 text-white shadow-md"
            : theme === "dark"
                ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`;

    const submenuClasses = `
        ml-8 mt-2 space-y-1 border-l pl-3 
        ${theme === "dark" ? "border-gray-700" : "border-gray-300"}
    `;

    return (
        <aside className={sidebarClasses}>
            <div
                className={`flex items-center justify-between p-5 border-b ${
                    theme === "dark" ? "border-gray-800" : "border-gray-200"
                }`}
            >
                {!collapsed && <span className="font-bold text-xl">Admin Dashboard</span>}
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3">
                <ul className="space-y-2">
                    {navItems.map((item) => {
                        if (item.type === "single") {
                            return (
                                <li key={item.id}>
                                    <Link
                                        to={item.link}
                                        className={navLinkClasses(currentPath === item.link)}
                                    >
                                        <FontAwesomeIcon icon={item.icon} className="text-lg text-blue-500" />
                                        {!collapsed && <span>{item.name}</span>}
                                    </Link>
                                </li>
                            );
                        }

                        const isMenuOpen = openMenu === item.id;
                        const isClosing = animatingMenu === item.id;
                        const isSubmenuActive = item.submenus?.some(
                            (sub) => currentPath === sub.link
                        );

                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => toggleDropdown(item.id)}
                                    className={dropdownHeaderClasses(isMenuOpen || isSubmenuActive)}
                                >
                                    <div className="flex items-center gap-3 font-bold">
                                        <FontAwesomeIcon
                                            icon={item.icon}
                                            className={`text-lg ${dropdownIconColors[item.id]}`}
                                        />
                                        {!collapsed && <span>{item.name}</span>}
                                    </div>

                                    {!collapsed && (
                                        <FontAwesomeIcon
                                            icon={isMenuOpen ? faChevronUp : faChevronDown}
                                        />
                                    )}
                                </button>

                                {/* FIXED → Unlimited height */}
                                <div
                                    className={`overflow-hidden transition-[max-height,opacity,margin] duration-300 ease-in-out ${
                                        (isMenuOpen && !collapsed) || isClosing
                                            ? "max-h-[9999px] opacity-100 mt-2"
                                            : "max-h-0 opacity-0"
                                    }`}
                                >
                                    <ul className={submenuClasses}>
                                        {item.submenus.map((sub, index) => (
                                            <li key={index}>
                                                <Link
                                                    to={sub.link}
                                                    className={`block px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                                                        currentPath === sub.link
                                                            ? "bg-blue-600 text-white"
                                                            : theme === "dark"
                                                                ? "text-gray-400 hover:text-white hover:bg-gray-800"
                                                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                    }`}
                                                >
                                                    {sub.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
}
