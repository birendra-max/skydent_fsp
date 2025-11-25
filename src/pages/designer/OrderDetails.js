import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext, useRef } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import Loder from "../../Components/Loder";
import { ThemeContext } from "../../Context/ThemeContext";
import Hd from "./Hd";
import Foot from "./Foot";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faDownload,
    faUpload,
    faTrash,
    faFileAlt,
    faCube,
    faArchive,
    faClock,
    faBackward,
    faPlus,
    faFileCircleCheck
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
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();

    const base_url = localStorage.getItem("base_url");
    const token = localStorage.getItem("token");
    const stlFileInputRef = useRef(null);
    const finishedFileInputRef = useRef(null);

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

    const handleFileUpload = async (event, fileType) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type for finished files
        if (fileType === "finished") {
            const allowedExtensions = ['.zip', '.rar', '.7z'];
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            if (!allowedExtensions.includes(fileExtension)) {
                toast.error("Please upload only .zip, .rar, or .7z files for finished files!");
                return;
            }
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("orderid", id);
        formData.append("type", fileType);

        toast.loading(`Uploading ${fileType === 'stl' ? 'STL' : 'Finished'} file...`);

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
                await fetchFileHistory();
            } else {
                toast.error(result.message || "Upload failed");
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Upload error!");
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

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

    if (loading)
        return (
            <>
                <Hd />
                <main className={`min-h-screen flex flex-col items-center justify-center ${theme === "light" ? "bg-gray-50" : "bg-gray-900"}`}>
                    <Loder status="show" />
                </main>
                <Foot />
            </>
        );

    if (error)
        return (
            <>
                <Hd />
                <main className={`min-h-screen flex flex-col items-center justify-center ${theme === "light" ? "bg-gray-50" : "bg-gray-900"}`}>
                    <div className="text-center">
                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                        <h2 className={`text-2xl font-bold mb-2 ${theme === "light" ? "text-gray-900" : "text-white"}`}>Error Loading Order</h2>
                        <p className={theme === "light" ? "text-gray-600" : "text-gray-400"}>{error}</p>
                    </div>
                </main>
                <Foot />
            </>
        );

    return (
        <>
            <Toaster position="top-right" />
            <Hd />
            <main className={`min-h-screen py-12 ${theme === "light" ? "bg-gray-100 text-gray-900" : "bg-gray-900 text-white"}`}>
                {/* Main Content */}
                <section className="py-8">
                    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Order Summary - Full Width */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-xl shadow-lg mb-8 ${theme === "light" ? "bg-white" : "bg-gray-800"}`}
                        >
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <div>
                                        <label className="font-bold text-lg">Order ID: </label>
                                        <span className="text-xl font-bold text-blue-600">{order?.orderid}</span>
                                    </div>
                                    <div>
                                        <label className="font-bold text-lg">
                                            <FontAwesomeIcon icon={faClock} className="mr-2" />
                                            Status:
                                        </label>
                                        <span className={`ml-2 px-4 py-2 rounded-full text-sm font-bold ${order?.status === 'Completed'
                                            ? 'bg-green-500 text-white'
                                            : order?.status === 'Cancel'
                                                ? 'bg-red-500 text-white'
                                                : 'bg-yellow-500 text-gray-900'
                                            }`}>
                                            {order?.status === 'progress' ? 'In Progress' : order?.status}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <button onClick={() => navigate(-1)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg cursor-pointer">
                                            <FontAwesomeIcon icon={faBackward} className="mr-2" />
                                            Back to Orders
                                        </button>
                                    </div>
                                </div>

                                {/* Status Update Form */}
                                <form className="border-t pt-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                                        <div className="lg:col-span-7">
                                            <label className="font-bold block mb-3 text-lg">Initial Scan: </label>
                                            {order?.file_path ? (
                                                <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg">
                                                    <FontAwesomeIcon icon={faFileAlt} className="text-blue-500 text-xl" />
                                                    <div className="flex-1">
                                                        <a
                                                            href={order.file_path}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-lg"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                downloadFile(order.fname || "initial_file.zip", order.file_path);
                                                            }}
                                                        >
                                                            {order?.fname}
                                                        </a>
                                                        <p className={`text-sm ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                                                            Uploaded: {order?.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => downloadFile(order.fname || "initial_file.zip", order.file_path)}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${theme === "light"
                                                            ? "bg-blue-600 text-white hover:bg-blue-700"
                                                            : "bg-blue-500 text-white hover:bg-blue-600"}`}
                                                    >
                                                        <FontAwesomeIcon icon={faDownload} />
                                                        Download
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className={`text-center py-4 ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                                                    <FontAwesomeIcon icon={faFileAlt} className="text-3xl mb-2 opacity-50" />
                                                    <p className="text-lg">No initial file available</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="lg:col-span-3">
                                            <label className="font-bold block mb-2">Update Status:</label>
                                            <select
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                                className={`w-full p-3 rounded-lg border-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none ${theme === "light"
                                                    ? "bg-white border-gray-300 text-gray-900"
                                                    : "bg-gray-700 border-gray-600 text-white"
                                                    }`}
                                            >
                                                <option value="">Select Status</option>
                                                <option value="New">New</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Qc">QC Required</option>
                                                <option value="Hold">Hold</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Cancelled">Cancel</option>
                                            </select>
                                        </div>
                                        <div className="lg:col-span-2">
                                            <button
                                                type="button"
                                                onClick={handleStatusUpdate}
                                                disabled={uploading}
                                                className={`w-full py-3 rounded-lg font-bold transition-all cursor-pointer ${uploading
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                                                    }`}
                                            >
                                                {uploading ? 'Updating...' : 'Update Status'}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </motion.div>

                        {/* File Sections - Equal Height */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                            {/* Left Column - STL Files */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`rounded-xl shadow-lg flex flex-col ${theme === "light" ? "bg-white" : "bg-gray-800"}`}
                            >
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-xl ${theme === "light" ? "bg-blue-100 text-blue-600" : "bg-blue-900 text-blue-300"}`}>
                                                <FontAwesomeIcon icon={faCube} className="text-xl" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold">STL Files</h3>
                                                <p className={`text-sm ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                                                    {fileHistory.stl_files.length} file{fileHistory.stl_files.length !== 1 ? 's' : ''} uploaded
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upload STL Section */}
                                    <div className="mb-6">
                                        <label className="font-bold block mb-3">Upload STL Files</label>
                                        <div className={`card rounded-lg border-2 border-dashed ${theme === "light" ? "bg-gray-50 border-gray-300" : "bg-gray-700 border-gray-600"}`}>
                                            <div className="card-body p-6">
                                                <div className="text-center">
                                                    <input
                                                        type="file"
                                                        ref={stlFileInputRef}
                                                        accept=".stl"
                                                        onChange={(e) => handleFileUpload(e, 'stl')}
                                                        className="hidden"
                                                    />
                                                    <button
                                                        onClick={() => stlFileInputRef.current?.click()}
                                                        disabled={uploading}
                                                        className={`inline-flex items-center gap-2 px-6 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 ${uploading
                                                            ? 'bg-gray-400 cursor-not-allowed'
                                                            : theme === "light"
                                                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                                                                : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
                                                            }`}
                                                    >
                                                        <FontAwesomeIcon icon={faPlus} />
                                                        <FontAwesomeIcon icon={faUpload} />
                                                        Upload STL Files
                                                    </button>
                                                    <p className={`text-sm mt-3 ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                                                        Click to upload .STL files
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* STL Files List */}
                                    <div className="flex-1">
                                        {fileHistory.stl_files.length > 0 ? (
                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                {fileHistory.stl_files.map((file, index) => (
                                                    <div
                                                        key={file.id}
                                                        className={`flex items-center justify-between p-4 rounded-lg border ${theme === "light" ? "bg-gray-50 border-gray-200 hover:bg-gray-100" : "bg-gray-700 border-gray-600 hover:bg-gray-600"}`}
                                                    >
                                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${theme === "light" ? "bg-blue-600" : "bg-blue-500"}`}>
                                                                {index + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`font-semibold truncate ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                                                                    {file.fname}
                                                                </p>
                                                                <p className={`text-sm ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                                                                    Uploaded: {file.upload_date || 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => downloadFile(file.fname, file.url || file.path)}
                                                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all hover:scale-105"
                                                            >
                                                                <FontAwesomeIcon icon={faDownload} />
                                                                Download
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteFile(file.id, 'stl')}
                                                                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all hover:scale-105"
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className={`text-center py-8 rounded-lg flex-1 flex items-center justify-center ${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}>
                                                <div>
                                                    <FontAwesomeIcon icon={faCube} className="text-4xl mb-3 opacity-50" />
                                                    <p className={`text-lg ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>No STL files uploaded yet</p>
                                                    <p className={`text-sm mt-1 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`}>
                                                        Upload your first STL file to get started
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Right Column - Finished Files */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`rounded-xl shadow-lg flex flex-col ${theme === "light" ? "bg-white" : "bg-gray-800"}`}
                            >
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-xl ${theme === "light" ? "bg-green-100 text-green-600" : "bg-green-900 text-green-300"}`}>
                                                <FontAwesomeIcon icon={faArchive} className="text-xl" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold">Finished Files</h3>
                                                <p className={`text-sm ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                                                    {fileHistory.finished_files.length} file{fileHistory.finished_files.length !== 1 ? 's' : ''} uploaded
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upload Finished Section */}
                                    <div className="mb-6">
                                        <label className="font-bold block mb-3">Upload Finished Files</label>
                                        <div className={`card rounded-lg border-2 border-dashed ${theme === "light" ? "bg-gray-50 border-gray-300" : "bg-gray-700 border-gray-600"}`}>
                                            <div className="card-body p-6">
                                                <div className="text-center">
                                                    <input
                                                        type="file"
                                                        ref={finishedFileInputRef}
                                                        accept=".zip,.rar,.7z"
                                                        onChange={(e) => handleFileUpload(e, 'finished')}
                                                        className="hidden"
                                                    />
                                                    <button
                                                        onClick={() => finishedFileInputRef.current?.click()}
                                                        disabled={uploading}
                                                        className={`inline-flex items-center gap-2 px-6 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 ${uploading
                                                            ? 'bg-gray-400 cursor-not-allowed'
                                                            : theme === "light"
                                                                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                                                                : 'bg-green-500 text-white hover:bg-green-600 shadow-lg'
                                                            }`}
                                                    >
                                                        <FontAwesomeIcon icon={faPlus} />
                                                        <FontAwesomeIcon icon={faUpload} />
                                                        Upload Finished Files
                                                    </button>
                                                    <p className={`text-sm mt-3 ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                                                        Accepted: .zip, .rar, .7z files only
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Finished Files List */}
                                    <div className="flex-1">
                                        {fileHistory.finished_files.length > 0 ? (
                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                {fileHistory.finished_files.map((file, index) => (
                                                    <div
                                                        key={file.id}
                                                        className={`flex items-center justify-between p-4 rounded-lg border ${theme === "light" ? "bg-gray-50 border-gray-200 hover:bg-gray-100" : "bg-gray-700 border-gray-600 hover:bg-gray-600"}`}
                                                    >
                                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${theme === "light" ? "bg-green-600" : "bg-green-500"}`}>
                                                                {index + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`font-semibold truncate ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                                                                    {file.fname}
                                                                </p>
                                                                <p className={`text-sm ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                                                                    Uploaded: {file.upload_date || 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => downloadFile(file.fname, file.url || file.path)}
                                                                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all hover:scale-105"
                                                            >
                                                                <FontAwesomeIcon icon={faDownload} />
                                                                Download
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteFile(file.id, 'finished')}
                                                                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all hover:scale-105"
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className={`text-center py-8 rounded-lg flex-1 flex items-center justify-center ${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}>
                                                <div>
                                                    <FontAwesomeIcon icon={faArchive} className="text-4xl mb-3 opacity-50" />
                                                    <p className={`text-lg ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>No finished files uploaded yet</p>
                                                    <p className={`text-sm mt-1 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`}>
                                                        Upload your first finished file (.zip, .rar, .7z)
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* ORDER SUMMARY */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mt-8"
                        >
                            <div
                                className={`rounded-xl shadow-md p-6 border
            ${theme === "light"
                                        ? "bg-white border-gray-200"
                                        : "bg-gray-800 border-gray-700"
                                    }`}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <h3
                                        className={`text-xl font-bold flex items-center gap-2
                    ${theme === "light" ? "text-gray-900" : "text-white"}
                `}
                                    >
                                        <FontAwesomeIcon
                                            icon={faFileCircleCheck}
                                            className={theme === "light" ? "text-blue-600" : "text-blue-400"}
                                        />
                                        Order Summary
                                    </h3>

                                    {/* Order ID Badge */}
                                    <span
                                        className={`
                    px-3 py-1.5 rounded-full text-xs font-semibold
                    ${theme === "light"
                                                ? "bg-gray-100 text-gray-700"
                                                : "bg-gray-700 text-gray-300"
                                            }
                `}
                                    >
                                        #{order?.orderid}
                                    </span>
                                </div>

                                {/* GRID */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6">

                                    {/* Order ID */}
                                    <div>
                                        <p className={`${theme === "light" ? "text-gray-500" : "text-gray-400"} text-xs uppercase tracking-wide`}>
                                            Order ID
                                        </p>
                                        <p className={`${theme === "light" ? "text-gray-900" : "text-white"} text-base font-medium mt-1`}>
                                            {order?.orderid || "N/A"}
                                        </p>
                                    </div>

                                    {/* User Order No */}
                                    <div>
                                        <p className={`${theme === "light" ? "text-gray-500" : "text-gray-400"} text-xs uppercase tracking-wide`}>
                                            User Order No
                                        </p>
                                        <p className={`${theme === "light" ? "text-gray-900" : "text-white"} text-base font-medium mt-1`}>
                                            {order?.user_order_no || "N/A"}
                                        </p>
                                    </div>

                                    {/* User ID */}
                                    <div>
                                        <p className={`${theme === "light" ? "text-gray-500" : "text-gray-400"} text-xs uppercase tracking-wide`}>
                                            User ID
                                        </p>
                                        <p className={`${theme === "light" ? "text-gray-900" : "text-white"} text-base font-medium mt-1`}>
                                            {order?.userid || "N/A"}
                                        </p>
                                    </div>

                                    {/* Lab Name */}
                                    <div>
                                        <p className={`${theme === "light" ? "text-gray-500" : "text-gray-400"} text-xs uppercase tracking-wide`}>
                                            Lab Name
                                        </p>
                                        <p className={`${theme === "light" ? "text-gray-900" : "text-white"} text-base font-medium mt-1`}>
                                            {order?.labname || "N/A"}
                                        </p>
                                    </div>

                                    {/* Order Date */}
                                    <div>
                                        <p className={`${theme === "light" ? "text-gray-500" : "text-gray-400"} text-xs uppercase tracking-wide`}>
                                            Order Date
                                        </p>
                                        <p className={`${theme === "light" ? "text-gray-900" : "text-white"} text-base font-medium mt-1`}>
                                            {order?.order_date || "N/A"}
                                        </p>
                                    </div>

                                    {/* Tooth */}
                                    <div>
                                        <p className={`${theme === "light" ? "text-gray-500" : "text-gray-400"} text-xs uppercase tracking-wide`}>
                                            Tooth
                                        </p>
                                        <p className={`${theme === "light" ? "text-gray-900" : "text-white"} text-base font-medium mt-1`}>
                                            {order?.tooth || "N/A"}
                                        </p>
                                    </div>

                                    {/* Unit */}
                                    <div>
                                        <p className={`${theme === "light" ? "text-gray-500" : "text-gray-400"} text-xs uppercase tracking-wide`}>
                                            Unit
                                        </p>
                                        <p className={`${theme === "light" ? "text-gray-900" : "text-white"} text-base font-medium mt-1`}>
                                            {order?.unit || "N/A"}
                                        </p>
                                    </div>

                                    {/* Product Type */}
                                    <div className="sm:col-span-2 lg:col-span-1">
                                        <p className={`${theme === "light" ? "text-gray-500" : "text-gray-400"} text-xs uppercase tracking-wide`}>
                                            Product Type
                                        </p>
                                        <p className={`${theme === "light" ? "text-gray-900" : "text-white"} text-base font-medium mt-1`}>
                                            {order?.product_type || "N/A"}
                                        </p>
                                    </div>

                                    {/* TAT */}
                                    <div>
                                        <p className={`${theme === "light" ? "text-gray-500" : "text-gray-400"} text-xs uppercase tracking-wide`}>
                                            Turnaround Time
                                        </p>

                                        <p className={`${theme === "light" ? "text-gray-900" : "text-white"} text-base font-medium mt-1`}>
                                            {order?.tduration === "Rush"
                                                ? "1–2 Hours"
                                                : order?.tduration === "Same Day"
                                                    ? "6 Hours"
                                                    : order?.tduration === "Next Day"
                                                        ? "12 Hours"
                                                        : "Standard"}
                                        </p>

                                        <span
                                            className={`
                        inline-block mt-2 text-[10px] px-2 py-1 rounded-full font-semibold
                        ${theme === "light"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-blue-900 text-blue-300"
                                                }
                    `}
                                        >
                                            {order?.tduration || "N/A"}
                                        </span>
                                    </div>

                                </div>
                            </div>
                        </motion.div>


                    </div>
                </section>
            </main>
            <Foot />
        </>
    );
}