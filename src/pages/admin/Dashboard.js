import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faHardDrive,
    faDatabase,
    faMemory,
    faGauge,
    faUsers,
    faUserCheck,
    faUserSlash,
    faUserPen,
    faUserXmark,
    faUserFriends,
    faArrowRight,
    faShoppingCart,
    faSpinner,
    faTimes,
    faTasks,
    faBolt,
    faBell,
    faPauseCircle,
    faCogs,
    faCalendarDay,
    faCalendarCheck,
    faCalendarWeek,
    faRepeat
} from "@fortawesome/free-solid-svg-icons";
import Sidebar from "./Sidebar";
import Hd from "./Hd";
import Foot from "./Foot";
import { ThemeContext } from "../../Context/ThemeContext";
import Loder from "../../Components/Loder";
import { fetchWithAuth } from '../../utils/adminapi';

export default function Dashboard() {
    const { theme } = useContext(ThemeContext);
    const [filesystems, setFilesystems] = useState([]);
    const [memory, setMemory] = useState(null);
    const [storageLoading, setStorageLoading] = useState(true);
    const [infoLoading, setInfoLoading] = useState(true);
    const [info, setInfo] = useState();

    useEffect(() => {
        const fetchStorageData = async () => {
            try {
                const res1 = await fetchWithAuth('/filesystems');
                setFilesystems(res1.filesystems || []);
                setMemory(res1.memory || null);
            } catch (error) {
                console.error("Storage Error:", error);
            } finally {
                setStorageLoading(false);
            }
        };

        const fetchClientData = async () => {
            try {
                const res2 = await fetchWithAuth('/count-client-designer-data');
                if (res2.status === 'success') {
                    setInfo(res2.res);
                }
            } catch (error) {
                console.error("Client Data Error:", error);
            } finally {
                setInfoLoading(false);
            }
        };

        // Fetch both independently
        fetchStorageData();
        fetchClientData();
    }, []);


    // ✅ Find root drive (C: or /)
    const rootDrive =
        filesystems.find(
            (fs) => fs.mounted === "/" || fs.fs === "C:" || fs.fs === "C:\\"
        ) || filesystems[0];

    // ✅ Show Loader only if both are loading
    if (storageLoading && infoLoading) {
        return (
            <>
                <Hd />
                <main
                    className={`min-h-screen flex ml-64 transition-all duration-300 ${theme === "dark"
                        ? "bg-gray-950 text-gray-100"
                        : "bg-gray-200 text-gray-800"
                        }`}
                >
                    <Sidebar />
                    <div className="flex-1 p-6 mt-16">
                        <Loder status="show" />
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Hd />
            <main
                className={`min-h-screen flex ml-64 transition-all duration-300 ${theme === "dark"
                    ? "bg-gray-950 text-gray-100"
                    : "bg-gray-200 text-gray-800"
                    }`}
            >
                <Sidebar />

                <div className="flex-1 p-6 mt-16">
                    {/* Header */}
                    <div className="mb-6">
                        <h1
                            className={`text-3xl font-semibold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-800"
                                }`}
                        >
                            <FontAwesomeIcon icon={faGauge} className="text-blue-500" />
                            Dashboard
                        </h1>
                        <p
                            className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                }`}
                        >
                            Server Configuration Overview
                        </p>
                    </div>

                    {/* ✅ Storage Section with its own loader */}
                    <div className="mb-12">
                        {storageLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[1, 2, 3].map((item) => (
                                    <div
                                        key={item}
                                        className={`p-5 rounded-2xl shadow ${theme === "dark" ? "bg-gray-800" : "bg-white"
                                            }`}
                                    >
                                        <div className="animate-pulse">
                                            <div className={`h-8 w-8 rounded-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"}`}></div>
                                            <div className={`h-4 mt-2 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"}`}></div>
                                            <div className={`h-6 mt-2 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"}`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div
                                    className={`p-5 rounded-2xl shadow hover:shadow-lg transition ${theme === "dark"
                                        ? "bg-gray-800 text-gray-100"
                                        : "bg-white text-gray-800"
                                        }`}
                                >
                                    <FontAwesomeIcon
                                        icon={faHardDrive}
                                        className="text-3xl text-blue-500 mb-2"
                                    />
                                    <h3 className="text-sm opacity-80">Total Disk Space (Root)</h3>
                                    <p className="text-2xl font-semibold">
                                        {rootDrive?.size || "N/A"}
                                    </p>
                                </div>

                                <div
                                    className={`p-5 rounded-2xl shadow hover:shadow-lg transition ${theme === "dark"
                                        ? "bg-gray-800 text-gray-100"
                                        : "bg-white text-gray-800"
                                        }`}
                                >
                                    <FontAwesomeIcon
                                        icon={faDatabase}
                                        className="text-3xl text-orange-500 mb-2"
                                    />
                                    <h3 className="text-sm opacity-80">Used Space</h3>
                                    <p className="text-2xl font-semibold">
                                        {rootDrive?.used || "N/A"}
                                    </p>
                                </div>

                                <div
                                    className={`p-5 rounded-2xl shadow hover:shadow-lg transition ${theme === "dark"
                                        ? "bg-gray-800 text-gray-100"
                                        : "bg-white text-gray-800"
                                        }`}
                                >
                                    <FontAwesomeIcon
                                        icon={faMemory}
                                        className="text-3xl text-green-500 mb-2"
                                    />
                                    <h3 className="text-sm opacity-80">Available Space</h3>
                                    <p className="text-2xl font-semibold">
                                        {rootDrive?.avail || "N/A"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ✅ Client/Designer Section with its own loader */}
                    <div className="space-y-6">
                        {infoLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map((item) => (
                                    <div
                                        key={item}
                                        className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg shadow-md overflow-hidden"
                                    >
                                        <div className="p-6">
                                            <div className="animate-pulse">
                                                <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
                                                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                        <div className="bg-black bg-opacity-10 px-6 py-3">
                                            <div className="h-3 bg-gray-300 rounded w-1/4 mx-auto"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {/* First Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Total Clients */}
                                    <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                                        <Link to="/admin/all-clients/all" className="block">
                                            <div className="p-6 relative">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-4xl font-bold text-white">{info.tot_client}</h3>
                                                        <p className="text-yellow-100 text-lg mt-1 font-bold">Total Clients</p>
                                                    </div>
                                                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                                                        <FontAwesomeIcon icon={faUsers} className="w-8 h-8 text-black" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-black bg-opacity-10 px-6 py-3 text-center">
                                                <span className="text-yellow-100 text-sm font-medium">
                                                    See all <FontAwesomeIcon icon={faArrowRight} className="ml-1 w-3 h-3" />
                                                </span>
                                            </div>
                                        </Link>
                                    </div>

                                    {/* Total Designers */}
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                                        <Link to="/admin/all-designers/all" className="block">
                                            <div className="p-6 relative">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-4xl font-bold text-white">{info.tot_designer}</h3>
                                                        <p className="text-blue-100 text-lg mt-1 font-bold">Total Designers</p>
                                                    </div>
                                                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                                                        <FontAwesomeIcon icon={faUserFriends} className="w-8 h-8 text-black" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-black bg-opacity-10 px-6 py-3 text-center">
                                                <span className="text-blue-100 text-sm font-medium">
                                                    See all <FontAwesomeIcon icon={faArrowRight} className="ml-1 w-3 h-3" />
                                                </span>
                                            </div>
                                        </Link>
                                    </div>

                                    {/* Total Active Clients */}
                                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                                        <Link to="/admin/all-clients/active" className="block">
                                            <div className="p-6 relative">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-4xl font-bold text-white">{info.tot_active_client}</h3>
                                                        <p className="text-green-100 text-lg mt-1 font-bold">Active Clients</p>
                                                    </div>
                                                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                                                        <FontAwesomeIcon icon={faUserCheck} className="w-8 h-8 text-black" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-black bg-opacity-10 px-6 py-3 text-center">
                                                <span className="text-green-100 text-sm font-medium">
                                                    See all <FontAwesomeIcon icon={faArrowRight} className="ml-1 w-3 h-3" />
                                                </span>
                                            </div>
                                        </Link>
                                    </div>
                                </div>

                                {/* Second Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Total Active Designers */}
                                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                                        <Link to="/admin/all-designers/active" className="block">
                                            <div className="p-6 relative">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-4xl font-bold text-white">{info.tot_active_designer}</h3>
                                                        <p className="text-green-100 text-lg mt-1 font-bold">Active Designers</p>
                                                    </div>
                                                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                                                        <FontAwesomeIcon icon={faUserPen} className="w-8 h-8 text-black" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-black bg-opacity-10 px-6 py-3 text-center">
                                                <span className="text-green-100 text-sm font-medium">
                                                    See all <FontAwesomeIcon icon={faArrowRight} className="ml-1 w-3 h-3" />
                                                </span>
                                            </div>
                                        </Link>
                                    </div>

                                    {/* Total Deactive Clients */}
                                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                                        <Link to="/admin/all-clients/inactive" className="block">
                                            <div className="p-6 relative">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-4xl font-bold text-white">{info.tot_inactive_client}</h3>
                                                        <p className="text-red-100 text-lg mt-1 font-bold">Deactive Clients</p>
                                                    </div>
                                                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                                                        <FontAwesomeIcon icon={faUserSlash} className="w-8 h-8 text-black" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-black bg-opacity-10 px-6 py-3 text-center">
                                                <span className="text-red-100 text-sm font-medium">
                                                    See all <FontAwesomeIcon icon={faArrowRight} className="ml-1 w-3 h-3" />
                                                </span>
                                            </div>
                                        </Link>
                                    </div>

                                    {/* Total Deactive Designers */}
                                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                                        <Link to="/admin/all-designers/inactive" className="block">
                                            <div className="p-6 relative">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-4xl font-bold text-white">{info.tot_inactive_designer}</h3>
                                                        <p className="text-red-100 text-lg mt-1 font-bold">Deactive Designers</p>
                                                    </div>
                                                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                                                        <FontAwesomeIcon icon={faUserXmark} className="w-8 h-8 text-black" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-black bg-opacity-10 px-6 py-3 text-center">
                                                <span className="text-red-100 text-sm font-medium">
                                                    See all <FontAwesomeIcon icon={faArrowRight} className="ml-1 w-3 h-3" />
                                                </span>
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ✅ Cases Section with its own loader */}
                    <div className="space-y-6 mt-8">
                        {infoLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((item) => (
                                    <div
                                        key={item}
                                        className={`rounded-xl shadow-md overflow-hidden ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
                                    >
                                        <div className="p-6">
                                            <div className="animate-pulse">
                                                <div className={`h-10 w-10 rounded-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"} mb-3`}></div>
                                                <div className={`h-6 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"} mb-2`}></div>
                                                <div className={`h-4 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"} w-3/4`}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Total Cases */}
                                <Link to="/admin/all-cases" className="rounded-lg p-4 transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md shadow-lg hover:-translate-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-lg text-white text-lg bg-gradient-to-br from-purple-600 to-blue-600">
                                            <FontAwesomeIcon icon={faShoppingCart} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-gray-600 dark:text-gray-300">Total Cases</p>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{info.all || "0"}</h3>
                                        </div>
                                    </div>
                                </Link>

                                {/* New Cases */}
                                <Link to="/admin/new-cases" className="rounded-lg p-4 transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md shadow-lg hover:-translate-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-lg text-white text-lg bg-gradient-to-br from-blue-500 to-blue-600">
                                            <FontAwesomeIcon icon={faBell} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-gray-600 dark:text-gray-300">New Cases</p>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{info.new_cases || "0"}</h3>
                                        </div>
                                    </div>
                                </Link>

                                {/* In Progress Cases */}
                                <Link to="/admin/pending-cases" className="rounded-lg p-4 transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md shadow-lg hover:-translate-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-lg text-white text-lg bg-gradient-to-br from-yellow-500 to-amber-600">
                                            <FontAwesomeIcon icon={faSpinner} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-gray-600 dark:text-gray-300">In Progress</p>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{info.progress || "0"}</h3>
                                        </div>
                                    </div>
                                </Link>

                                {/* Completed Cases */}
                                <Link to="/admin/completed-cases" className="rounded-lg p-4 transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md shadow-lg hover:-translate-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-lg text-white text-lg bg-gradient-to-br from-green-500 to-emerald-600">
                                            <FontAwesomeIcon icon={faTasks} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-gray-600 dark:text-gray-300">Completed</p>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{info.completed || "0"}</h3>
                                        </div>
                                    </div>
                                </Link>

                                {/* Cancelled Cases */}
                                <Link to="/admin/cancelled-cases" className="rounded-lg p-4 transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md shadow-lg hover:-translate-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-lg text-white text-lg bg-gradient-to-br from-red-500 to-rose-600">
                                            <FontAwesomeIcon icon={faTimes} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-gray-600 dark:text-gray-300">Cancelled</p>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{info.canceled || "0"}</h3>
                                        </div>
                                    </div>
                                </Link>

                                {/* Rush Cases */}
                                <Link to="/admin/rush-cases" className="rounded-lg p-4 transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md shadow-lg hover:-translate-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-lg text-white text-lg bg-gradient-to-br from-orange-500 to-red-500">
                                            <FontAwesomeIcon icon={faBolt} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-gray-600 dark:text-gray-300">Rush Cases</p>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{info.rush || "0"}</h3>
                                        </div>
                                    </div>
                                </Link>

                                {/* QC Cases */}
                                <Link to="/admin/qc-cases" className="rounded-lg p-4 transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md shadow-lg hover:-translate-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-lg text-white text-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                                            <FontAwesomeIcon icon={faCogs} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-gray-600 dark:text-gray-300">QC Cases</p>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{info.qc || "0"}</h3>
                                        </div>
                                    </div>
                                </Link>

                                {/* Hold Cases */}
                                <Link to="/admin/hold-cases" className="rounded-lg p-4 transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md shadow-lg hover:-translate-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-lg text-white text-lg bg-gradient-to-br from-gray-600 to-gray-700">
                                            <FontAwesomeIcon icon={faPauseCircle} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-gray-600 dark:text-gray-300">Hold Cases</p>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{info.hold || "0"}</h3>
                                        </div>
                                    </div>
                                </Link>

                                {/* Redesign Cases */}
                                <Link to="/admin/redesign-cases" className="rounded-lg p-4 transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md shadow-lg hover:-translate-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-lg text-white text-lg bg-gradient-to-br from-cyan-500 to-blue-500">
                                            <FontAwesomeIcon icon={faRepeat} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-gray-600 dark:text-gray-300">Redesign Cases</p>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{info.redesign || "0"}</h3>
                                        </div>
                                    </div>
                                </Link>

                                {/* Yesterday's Cases */}
                                <Link to="/admin/yesterday-cases" className="rounded-lg p-4 transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md shadow-lg hover:-translate-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-lg text-white text-lg bg-gradient-to-br from-purple-500 to-purple-600">
                                            <FontAwesomeIcon icon={faCalendarDay} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-gray-600 dark:text-gray-300">Yesterday's Cases</p>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{info.yesterday_cases || "0"}</h3>
                                        </div>
                                    </div>
                                </Link>

                                {/* Today's Cases */}
                                <Link to="/admin/today-cases" className="rounded-lg p-4 transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md shadow-lg hover:-translate-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-lg text-white text-lg bg-gradient-to-br from-green-500 to-green-600">
                                            <FontAwesomeIcon icon={faCalendarCheck} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-gray-600 dark:text-gray-300">Today's Cases</p>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{info.today_cases || "0"}</h3>
                                        </div>
                                    </div>
                                </Link>

                                {/* This Week's Cases */}
                                <Link to="/admin/weekly-cases" className="rounded-lg p-4 transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md shadow-lg hover:-translate-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-lg text-white text-lg bg-gradient-to-br from-blue-500 to-blue-600">
                                            <FontAwesomeIcon icon={faCalendarWeek} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate text-gray-600 dark:text-gray-300">This Week</p>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{info.weekly_cases || "0"}</h3>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Foot />
        </>
    );
}