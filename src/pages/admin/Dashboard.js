import { useContext, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faHardDrive,
    faDatabase,
    faMemory,
    faGauge,
} from "@fortawesome/free-solid-svg-icons";
import Sidebar from "./Sidebar";
import Hd from "./Hd";
import Foot from "./Foot";
import { ThemeContext } from "../../Context/ThemeContext";
import Loder from "../../Components/Loder";

export default function Dashboard() {
    const { theme } = useContext(ThemeContext);
    const [filesystems, setFilesystems] = useState([]);
    const [memory, setMemory] = useState(null);
    const [loading, setLoading] = useState(true);
    const base_url = localStorage.getItem("base_url");
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${base_url}/filesystems`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                        'X-Tenant': 'skydent'
                    },
                });
                const data = await res.json();
                setFilesystems(data.filesystems || []);
                setMemory(data.memory || null);
            } catch (error) {
                console.error("Failed to load server info:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [base_url, token]);

    // ✅ Find root drive (C: or /)
    const rootDrive =
        filesystems.find(
            (fs) => fs.mounted === "/" || fs.fs === "C:" || fs.fs === "C:\\"
        ) || filesystems[0];

    // ✅ Show Loader while fetching
    if (loading) {
        return (
            <>
                <Hd />
                <main
                    className={`flex items-center justify-center transition-all duration-300 ${theme === "dark"
                        ? "bg-gray-950 text-gray-100"
                        : "bg-gray-200 text-gray-800"
                        }`}
                >
                    <Sidebar />
                    <Loder status="show" />
                </main>
            </>
        );
    }

    return (
        <>
            <Hd />
            <main
                className={`flex transition-all duration-300 ${theme === "dark"
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

                    {/* ✅ Root Drive Summary */}
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

                    {/* ✅ Filesystem Table + RAM */}
                    <div
                        className={`rounded-2xl shadow overflow-hidden ${theme === "dark" ? "bg-gray-800" : "bg-white"
                            }`}
                    >
                        <table className="min-w-full text-sm">
                            <thead
                                className={`uppercase text-xs ${theme === "dark"
                                    ? "bg-gray-700 text-gray-300"
                                    : "bg-gray-100 text-gray-700"
                                    }`}
                            >
                                <tr>
                                    <th className="py-3 px-4 text-left">Type</th>
                                    <th className="py-3 px-4 text-left">Size</th>
                                    <th className="py-3 px-4 text-left">Used</th>
                                    <th className="py-3 px-4 text-left">Available</th>
                                    <th className="py-3 px-4 text-left">Use%</th>
                                    <th className="py-3 px-4 text-left">Mounted on</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filesystems.map((item, index) => (
                                    <tr
                                        key={index}
                                        className={`border-b transition ${theme === "dark"
                                            ? "border-gray-700 hover:bg-gray-700"
                                            : "border-gray-200 hover:bg-gray-50"
                                            }`}
                                    >
                                        <td className="py-3 px-4 font-medium">{item.fs}</td>
                                        <td className="py-3 px-4">{item.size}</td>
                                        <td className="py-3 px-4">{item.used}</td>
                                        <td className="py-3 px-4">{item.avail}</td>
                                        <td className="py-3 px-4">{item.use}</td>
                                        <td className="py-3 px-4">{item.mounted}</td>
                                    </tr>
                                ))}

                                {/* ✅ Add RAM Row */}
                                {memory && (
                                    <tr
                                        className={`border-t font-semibold ${theme === "dark" ? "border-gray-700" : "border-gray-200"
                                            }`}
                                    >
                                        <td className="py-3 px-4">Memory (RAM)</td>
                                        <td className="py-3 px-4">{memory.total}</td>
                                        <td className="py-3 px-4">{memory.used}</td>
                                        <td className="py-3 px-4">{memory.free}</td>
                                        <td className="py-3 px-4">{memory.use}</td>
                                        <td className="py-3 px-4">System Memory</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
            <Foot />
        </>
    );
}
