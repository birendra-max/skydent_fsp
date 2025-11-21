import { useContext, useEffect, useState } from "react";
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
    faArrowRight
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
                                        <a href="/clients" className="block">
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
                                                    More info <FontAwesomeIcon icon={faArrowRight} className="ml-1 w-3 h-3" />
                                                </span>
                                            </div>
                                        </a>
                                    </div>

                                    {/* Total Designers */}
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                                        <a href="/designers" className="block">
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
                                                    More info <FontAwesomeIcon icon={faArrowRight} className="ml-1 w-3 h-3" />
                                                </span>
                                            </div>
                                        </a>
                                    </div>

                                    {/* Total Active Clients */}
                                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                                        <a href="/clients?status=active" className="block">
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
                                                    More info <FontAwesomeIcon icon={faArrowRight} className="ml-1 w-3 h-3" />
                                                </span>
                                            </div>
                                        </a>
                                    </div>
                                </div>

                                {/* Second Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Total Active Designers */}
                                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                                        <a href="/designers?status=active" className="block">
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
                                                    More info <FontAwesomeIcon icon={faArrowRight} className="ml-1 w-3 h-3" />
                                                </span>
                                            </div>
                                        </a>
                                    </div>

                                    {/* Total Deactive Clients */}
                                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                                        <a href="/clients?status=inactive" className="block">
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
                                                    More info <FontAwesomeIcon icon={faArrowRight} className="ml-1 w-3 h-3" />
                                                </span>
                                            </div>
                                        </a>
                                    </div>

                                    {/* Total Deactive Designers */}
                                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                                        <a href="/designers?status=inactive" className="block">
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
                                                    More info <FontAwesomeIcon icon={faArrowRight} className="ml-1 w-3 h-3" />
                                                </span>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
            <Foot />
        </>
    );
}