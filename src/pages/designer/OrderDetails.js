import { useParams } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import Loder from "../../Components/Loder";
import { ThemeContext } from "../../Context/ThemeContext";
import Hd from "./Hd";
import Foot from "./Foot";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faClock,
    faCheckCircle,
    faTimesCircle,
    faBoxArchive,
    faCube,
    faFileCircleCheck,
    faUpload,
    faDownload,
    faPlusCircle,
    faSearch,
    faInfoCircle,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";

export default function OrderDetails() {
    const { theme } = useContext(ThemeContext);
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [fileHistory, setFileHistory] = useState({
        stl_files: [],
        finished_files: []
    });

    const base_url = localStorage.getItem("base_url");
    const token = localStorage.getItem("token");

    // Fetch order details
    useEffect(() => {
        async function fetchOrderDetails() {
            try {
                setLoading(true);
                const response = await fetch(`${base_url}/get-order-details`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                        'X-Tenant': 'skydent'
                    },
                    body: JSON.stringify({ orderid: id }),
                });

                const resp = await response.json();
                if (resp.status === "success") {
                    setOrder(resp.order);
                    setSelectedStatus(resp.order.status);
                    // Fetch file history after order details
                    await fetchFileHistory();
                } else {
                    setError(resp.message || "Failed to fetch order details");
                }
            } catch (error) {
                console.error("Error fetching order details:", error);
                setError("Failed to fetch order details");
            } finally {
                setLoading(false);
            }
        }

        // Fetch file history
        async function fetchFileHistory() {
            try {
                const response = await fetch(`${base_url}/get-file-history`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                        'X-Tenant': 'skydent'
                    },
                    body: JSON.stringify({ orderid: id }),
                });

                const resp = await response.json();
                if (resp.status === "success") {
                    setFileHistory({
                        stl_files: resp.stl_files || [],
                        finished_files: resp.finished_files || []
                    });
                }
            } catch (error) {
                console.error("Error fetching file history:", error);
            }
        }

        if (id) fetchOrderDetails();
    }, [id]);

    const handleStatusUpdate = async () => {
        toast.loading("Updating order status...");
        try {
            const response = await fetch(`${base_url}/update-order-status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    'X-Tenant': 'skydent'
                },
                body: JSON.stringify({ orderid: id, status: selectedStatus }),
            });

            const resp = await response.json();
            toast.dismiss();
            if (resp.status === "success") {
                setOrder((prev) => ({ ...prev, status: selectedStatus }));
                toast.success("Order status updated successfully!");
            } else toast.error("Failed to update order status");
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Error updating order status");
        }
    };

    const handleDeleteFile = async (fileId, type) => {
        if (!window.confirm("Are you sure you want to delete this file?")) return;

        toast.loading("Deleting file...");
        try {
            const response = await fetch(`${base_url}/delete-file`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    'X-Tenant': 'skydent'
                },
                body: JSON.stringify({
                    file_id: fileId,
                    file_type: type
                }),
            });

            const resp = await response.json();
            toast.dismiss();
            if (resp.status === "success") {
                toast.success("File deleted successfully!");
                // Refresh file history
                await fetchFileHistory();
            } else {
                toast.error("Failed to delete file");
            }
        } catch (error) {
            console.error("Error deleting file:", error);
            toast.error("Error deleting file");
        }
    };

    const fetchFileHistory = async () => {
        try {
            const response = await fetch(`${base_url}/get-file-history`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    'X-Tenant': 'skydent'
                },
                body: JSON.stringify({ orderid: id }),
            });

            const resp = await response.json();
            if (resp.status === "success") {
                setFileHistory({
                    stl_files: resp.stl_files || [],
                    finished_files: resp.finished_files || []
                });
            }
        } catch (error) {
            console.error("Error fetching file history:", error);
        }
    };

    // ✅ Use your loader component
    if (loading)
        return (
            <>
                <Hd />
                <main
                    className={`min-h-screen flex flex-col items-center justify-center ${theme === "light" ? "bg-gray-50 text-gray-900" : "bg-gray-900 text-white"
                        }`}
                >
                    <Loder status="show" />
                </main>
                <Foot />
            </>
        );

    if (error)
        return (
            <>
                <Hd />
                <main
                    className={`min-h-screen flex flex-col items-center justify-center ${theme === "light" ? "bg-gray-50 text-gray-900" : "bg-gray-900 text-white"
                        }`}
                >
                    <FontAwesomeIcon icon={faTimesCircle} className="text-red-500 text-6xl mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Error Loading Order</h2>
                    <p className="text-gray-600 dark:text-gray-400">{error}</p>
                </main>
                <Foot />
            </>
        );

    return (
        <>
            <Toaster position="top-right" />
            <Hd />
            <main
                id="main"
                className={`flex-grow px-4 transition-colors duration-300 ${theme === "light" ? "bg-white text-black" : "bg-black text-white"
                    } pt-16 sm:pt-22 px-8`}
            >
                <motion.div
                    className="max-w-8xl mx-auto space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Header */}
                    <div
                        className={`rounded-2xl shadow-sm border px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${theme === "light"
                            ? "bg-gray-200 border-gray-200"
                            : "bg-gray-800 border-gray-700"
                            }`}
                    >
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Order Details</h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Manage and track your order below.
                            </p>
                        </div>

                        <motion.div
                            key={order?.status}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-3"
                        >
                            <StatusBadge status={order?.status} />
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md">
                                #{order?.orderid}
                            </div>
                        </motion.div>
                    </div>

                    {/* Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left */}
                        <div
                            className={`col-span-2 rounded-2xl shadow-xl border p-8 ${theme === "light"
                                ? "bg-gray-200 border-gray-200"
                                : "bg-gray-800 border-gray-700"
                                }`}
                        >
                            <OrderSummary
                                order={order}
                                theme={theme}
                                fileHistory={fileHistory}
                                onDeleteFile={handleDeleteFile}
                                onRefreshFiles={fetchFileHistory}
                            />
                        </div>

                        {/* Right */}
                        <div className="space-y-6">
                            {/* Initial File Download - Moved to top */}
                            <InitialFileDownload
                                order={order}
                                theme={theme}
                            />

                            <StatusUpdater
                                theme={theme}
                                selectedStatus={selectedStatus}
                                setSelectedStatus={setSelectedStatus}
                                handleStatusUpdate={handleStatusUpdate}
                            />
                            <FileUploader
                                theme={theme}
                                onFileUpload={fetchFileHistory}
                            />
                        </div>
                    </div>
                </motion.div>
            </main>
            <Foot />
        </>
    );
}

/* 🔹 Subcomponents */
function StatusBadge({ status }) {
    const map = {
        completed: { color: "bg-green-600", icon: faCheckCircle },
        pending: { color: "bg-yellow-500", icon: faClock, text: "text-black" },
        new: { color: "bg-blue-500", icon: faPlusCircle },
        cancel: { color: "bg-red-600", icon: faTimesCircle },
        qc: { color: "bg-purple-600", icon: faSearch },
    };
    const s = map[status?.toLowerCase()] || { color: "bg-gray-500", icon: faInfoCircle };
    return (
        <div
            className={`px-4 py-2 rounded-full flex items-center gap-2 font-semibold ${s.color} ${s.text || "text-white"
                }`}
        >
            <FontAwesomeIcon icon={s.icon} />
            <span className="capitalize">{status}</span>
        </div>
    );
}

function OrderSummary({ order, theme, fileHistory, onDeleteFile, onRefreshFiles }) {
    const turnaroundConfig = {
        rush: "bg-red-100 text-red-700 border border-red-200",
        standard: "bg-blue-100 text-blue-700 border border-blue-200",
        economy: "bg-green-100 text-green-700 border border-green-200",
    };

    return (
        <>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <FontAwesomeIcon icon={faFileCircleCheck} className="text-indigo-500" />
                    Order Summary
                </h2>
                <span
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold ${turnaroundConfig[order?.tduration?.toLowerCase()] ||
                        "bg-gray-600 text-white"
                        }`}
                >
                    {order?.tduration || "N/A"} Delivery
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-8">
                    <DetailItem label="Order ID" value={order?.orderid} />
                    <DetailItem label="File Name" value={order?.fname} />
                    <DetailItem label="Product Type" value={order?.product_type} />
                    <DetailItem label="Tooth" value={order?.tooth} />
                </div>
                <div className="space-y-8">
                    <DetailItem label="Unit" value={order?.unit} />
                    <DetailItem label="Lab Name" value={order?.labname} />
                    <DetailItem label="Designer ID" value={order?.designerid} />
                    <DetailItem
                        label="Order Date"
                        value={
                            order?.order_date
                                ? new Date(order.order_date).toLocaleDateString()
                                : "N/A"
                        }
                    />
                </div>
            </div>

            {/* File History Tables */}
            <div className="mt-10 space-y-8">
                <FileHistoryTable
                    title="STL Files History"
                    icon={faCube}
                    files={fileHistory.stl_files}
                    fileType="stl"
                    theme={theme}
                    onDeleteFile={onDeleteFile}
                />

                <FileHistoryTable
                    title="Finished Files History"
                    icon={faCheckCircle}
                    files={fileHistory.finished_files}
                    fileType="finished"
                    theme={theme}
                    onDeleteFile={onDeleteFile}
                />
            </div>
        </>
    );
}

function DetailItem({ label, value }) {
    const { theme } = useContext(ThemeContext);
    return (
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-8">
            <span
                className={`font-bold ${theme === "light" ? "text-gray-800" : "text-gray-200"
                    }`}
            >
                {label}
            </span>
            <span
                className={`font-medium truncate ${theme === "light" ? "text-gray-800" : "text-gray-200"
                    }`}
            >
                {value}
            </span>
        </div>
    );
}
// Clean & Professional Initial File Download Component
function InitialFileDownload({ order, theme }) {
    const downloadFile = (filename, path) => {
        if (!path) return;
        const parts = path.split("/");
        const encodedFile = encodeURIComponent(parts.pop());
        const encodedUrl = parts.join("/") + "/" + encodedFile;
        const link = document.createElement("a");
        link.href = encodedUrl;
        link.download = filename;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isLight = theme === "light";

    return (
        <div
            className={`rounded-2xl shadow-md border p-6 transition-all duration-300 ${isLight ? "bg-gray-200 border-gray-200" : "bg-gray-800 border-gray-200"
                } p-6`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div
                        className={`p-2 rounded-md ${isLight ? "bg-blue-100 text-blue-700" : "bg-blue-800 text-blue-200"
                            }`}
                    >
                        <FontAwesomeIcon icon={faBoxArchive} />
                    </div>
                    <h2 className={`text-lg font-bold ${isLight ? "text-gray-900" : "text-gray-100"}`}>
                        Initial File
                    </h2>
                </div>

                {order?.file_path && (
                    <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${isLight
                            ? "bg-green-100 text-green-700"
                            : "bg-green-800 text-green-300"
                            }`}
                    >
                        Available
                    </span>
                )}
            </div>

            {/* File Info */}
            <div>
                <h2 className={`font-medium text-lg mb-1 truncate ${isLight ? "text-gray-900" : "text-gray-100"}`}>
                    {order?.fname || "Initial File"}
                </h2>

                {/* Download Button or Placeholder */}
                {order?.file_path ? (
                    <button
                        onClick={() =>
                            downloadFile(order.fname || "initial_file.zip", order.file_path)
                        }
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isLight
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                            }`}
                    >
                        <FontAwesomeIcon icon={faDownload} />
                        Download File
                    </button>
                ) : (
                    <span
                        className={`inline-block text-sm italic ${isLight ? "text-gray-400" : "text-gray-500"
                            }`}
                    >
                        Not available
                    </span>
                )}
            </div>

            {/* Footer Info */}
            {order?.file_path && (
                <div
                    className={`mt-4 flex justify-between items-center text-xs ${isLight ? "text-gray-500" : "text-gray-400"
                        }`}
                >
                    <span>
                        {order?.upload_date
                            ? new Date(order.upload_date).toLocaleDateString()
                            : "Upload date unavailable"}
                    </span>
                    <span className="uppercase font-medium tracking-wide">
                        {order?.file_path?.split(".").pop() || "ZIP"} File
                    </span>
                </div>
            )}
        </div>
    );
}



function FileHistoryTable({ title, icon, files, fileType, theme, onDeleteFile }) {
    const downloadFile = (url, filename) => {
        if (!url) return;
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={`rounded-2xl shadow-md border p-6 ${theme === "light"
            ? "bg-gray-50 border-gray-200"
            : "bg-gray-800 border-gray-700"
            }`}>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={icon} className="text-blue-500" />
                {title} ({files.length})
            </h3>

            {files.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className={`w-full text-sm ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                        <thead>
                            <tr className={`border-b ${theme === "light" ? "border-gray-300" : "border-gray-600"}`}>
                                <th className="py-3 px-4 text-left">ID</th>
                                <th className="py-3 px-4 text-left">File Name</th>
                                <th className="py-3 px-4 text-left">Upload Date</th>
                                <th className="py-3 px-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.map((file, index) => (
                                <tr
                                    key={file.id}
                                    className={`border-b ${theme === "light" ? "border-gray-200 hover:bg-gray-100" : "border-gray-700 hover:bg-gray-750"}`}
                                >
                                    <td className="py-3 px-4">{index + 1}</td>
                                    <td className="py-3 px-4 font-medium break-words max-w-xs">{file.fname}</td>
                                    <td className="py-3 px-4">
                                        {file.upload_date ? file.upload_date : 'N/A'}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => downloadFile(file.url || file.path, file.fname)}
                                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                <FontAwesomeIcon icon={faDownload} size="xs" />
                                                Download
                                            </button>
                                            <button
                                                onClick={() => onDeleteFile(file.id, fileType)}
                                                className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                            >
                                                <FontAwesomeIcon icon={faTrash} size="xs" />
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className={`text-center py-8 ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                    <FontAwesomeIcon icon={icon} className="text-4xl mb-2 opacity-50" />
                    <p>No {fileType} files found</p>
                </div>
            )}
        </div>
    );
}

function StatusUpdater({ theme, selectedStatus, setSelectedStatus, handleStatusUpdate }) {
    return (
        <div
            className={`rounded-2xl shadow-md border p-6 ${theme === "light"
                ? "bg-gray-200 border-gray-200"
                : "bg-gray-800 border-gray-700"
                }`}
        >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-500" />
                Update Order Status
            </h2>
            <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`w-full p-3 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${theme === "light"
                    ? "bg-gray-50 border-gray-300 text-gray-900"
                    : "bg-gray-700 border-gray-600 text-white"
                    }`}
            >
                <option value="New">New</option>
                <option value="Pending">Pending</option>
                <option value="Qc">QC</option>
                <option value="Hold">Hold</option>
                <option value="Redesign">Redesign</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
            </select>
            <button
                onClick={handleStatusUpdate}
                className="w-full mt-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-semibold transition-all"
            >
                Update Status
            </button>
        </div>
    );
}

function FileUploader({ theme, onFileUpload }) {
    const { id } = useParams();
    const base_url = localStorage.getItem("base_url");
    const token = localStorage.getItem("token");

    const handleFileUpload = async (event, type) => {
        const file = event.target.files[0];
        if (!file) return toast.error("No file selected!");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("orderid", id);
        formData.append("type", type);

        toast.loading(`Uploading ${type} file...`);

        try {
            const response = await fetch(`${base_url}/upload-order-file`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    'X-Tenant': 'skydent'
                },
                body: formData,
            });

            const result = await response.json();
            toast.dismiss();

            if (result.status === "success") {
                toast.success(`${file.name} uploaded successfully!`);
                onFileUpload(); // Refresh file history
            } else {
                toast.error(result.message || "Upload failed");
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Upload error!");
        }
    };

    return (
        <div
            className={`rounded-2xl shadow-md border p-6 ${theme === "light"
                ? "bg-gray-200 border-gray-200"
                : "bg-gray-800 border-gray-700"
                }`}
        >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faUpload} className="text-green-500" />
                Upload Files
            </h2>
            {[
                { type: "stl", label: "STL File", icon: faCube, color: "text-green-500" },
                { type: "finished", label: "Finished File", icon: faCheckCircle, color: "text-purple-500" }
            ].map((fileType) => (
                <UploadBox
                    key={fileType.type}
                    type={fileType}
                    theme={theme}
                    onFileUpload={handleFileUpload}
                />
            ))}
        </div>
    );
}

function UploadBox({ type, theme, onFileUpload }) {
    // Define allowed file types based on the type
    const acceptedFileTypes = {
        zip: ".zip,.rar,.7z",
        stl: ".stl",
        finished: ".zip,.rar,.7z,.stl", // if finished files can be multiple types
    };

    return (
        <div
            className={`p-5 rounded-lg border-2 border-dashed mb-4 text-center transition-all hover:shadow-lg ${theme === "light"
                ? "border-gray-300 bg-gray-50 hover:bg-gray-100"
                : "border-gray-600 bg-gray-700/30 hover:bg-gray-700/60"
                }`}
        >
            <FontAwesomeIcon icon={type.icon} className={`text-3xl mb-2 ${type.color}`} />
            <p className="text-sm mb-3">Upload {type.label}</p>

            <input
                type="file"
                id={`${type.type}-upload`}
                accept={acceptedFileTypes[type.type] || "*/*"}
                className="hidden"
                onChange={(e) => onFileUpload(e, type.type)}
            />
            <label
                htmlFor={`${type.type}-upload`}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:opacity-90 transition-all"
            >
                Upload {type.label}
            </label>
        </div>
    );
}
