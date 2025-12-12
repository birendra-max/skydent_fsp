import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext, useRef } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import Loder from "../../Components/Loder";
import { ThemeContext } from "../../Context/ThemeContext";
import Hd from "./Hd";
import Foot from "./Foot";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Chatbox from "../../Components/Chatbox";
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
    faFileCircleCheck,
    faEdit,
    faSave,
    faTimes,
    faPaperPlane,
    faUser,
    faRobot,
    faComments
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
    const [isEditing, setIsEditing] = useState(false);
    const [editedOrder, setEditedOrder] = useState({});
    const [showChat, setShowChat] = useState(false);
    const navigate = useNavigate();

    const base_url = localStorage.getItem("base_url");
    const token = localStorage.getItem("token");
    const fileInputRef = useRef(null);
    const chatContainerRef = useRef(null);

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
                    setEditedOrder(resp.order);
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
                setEditedOrder((prev) => ({ ...prev, status: selectedStatus }));
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

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Determine file type based on extension
        const fileName = file.name.toLowerCase();
        let fileType = '';
        
        if (fileName.endsWith('.stl')) {
            fileType = 'stl';
        } else if (fileName.endsWith('.zip') || fileName.endsWith('.rar') || fileName.endsWith('.7z')) {
            fileType = 'finished';
        } else {
            toast.error("Please upload only .stl, .zip, .rar, or .7z files!");
            return;
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
        const encodedPath = encodeURIComponent(path);
        const finalUrl = `${base_url}/download?path=${encodedPath}`;

        const link = document.createElement("a");
        link.href = finalUrl;
        link.target = "_blank";
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEditToggle = () => {
        if (isEditing) {
            // Cancel editing
            setEditedOrder(order);
        }
        setIsEditing(!isEditing);
    };

    const handleSaveOrder = async () => {
        toast.loading("Saving order details...");
        try {
            const response = await fetch(`${base_url}/update-order-details`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    'X-Tenant': 'skydent'
                },
                body: JSON.stringify({
                    orderid: id,
                    updates: editedOrder
                }),
            });

            const resp = await response.json();
            toast.dismiss();
            if (resp.status === "success") {
                setOrder(editedOrder);
                setIsEditing(false);
                toast.success("Order details updated successfully!");
            } else {
                toast.error("Failed to update order details");
            }
        } catch (error) {
            console.error("Error updating order:", error);
            toast.error("Error updating order details");
        }
    };

    const handleInputChange = (field, value) => {
        setEditedOrder(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Function to show the floating chatbox
    const showFloatingChat = () => {
        const chatbox = document.getElementById('chatbox');
        if (chatbox) {
            chatbox.style.display = 'block';
        }
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
            
            {/* Chatbox Component - Floating/Draggable */}
            <Chatbox orderid={id} />
            
            <main className={`min-h-screen py-12 ${theme === "light" ? "bg-gray-100 text-gray-900" : "bg-gray-900 text-white"}`}>
                <section className="py-8">
                    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Order Summary & Status */}
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

                        {/* File Upload & Table Section - 50/50 Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            {/* File Upload - 50% width */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`rounded-xl shadow-lg ${theme === "light" ? "bg-white" : "bg-gray-800"}`}
                            >
                                <div className="p-6 h-full">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-xl ${theme === "light" ? "bg-blue-100 text-blue-600" : "bg-blue-900 text-blue-300"}`}>
                                                <FontAwesomeIcon icon={faUpload} className="text-xl" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold">File Upload</h3>
                                                <p className={`text-sm ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                                                    Upload STL or Finished files
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* File Upload Card */}
                                    <div className={`rounded-lg border-2 border-dashed p-8 flex flex-col items-center justify-center h-[calc(100%-100px)] ${theme === "light" ? "bg-gray-50 border-gray-300" : "bg-gray-700 border-gray-600"}`}>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept=".stl,.zip,.rar,.7z"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                        <div className="text-center">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                                className={`w-full flex flex-col items-center gap-3 px-8 py-8 rounded-lg font-bold text-lg transition-all hover:scale-105 ${uploading
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : theme === "light"
                                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                                                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg'
                                                    }`}
                                            >
                                                <FontAwesomeIcon icon={faUpload} className="text-3xl mb-2" />
                                                Upload Files
                                            </button>
                                            <p className={`text-sm mt-4 ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                                                Drag & drop or click to upload
                                            </p>
                                            <p className={`text-xs mt-2 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`}>
                                                Supported: .STL, .ZIP, .RAR, .7Z
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Files Table - 50% width */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`rounded-xl shadow-lg ${theme === "light" ? "bg-white" : "bg-gray-800"}`}
                            >
                                <div className="p-6 h-full">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-xl ${theme === "light" ? "bg-green-100 text-green-600" : "bg-green-900 text-green-300"}`}>
                                                <FontAwesomeIcon icon={faFileAlt} className="text-xl" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold">Uploaded Files</h3>
                                                <p className={`text-sm ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                                                    {fileHistory.stl_files.length + fileHistory.finished_files.length} total files
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Files Table */}
                                    <div className="overflow-x-auto h-[calc(100%-100px)]">
                                        <table className="w-full">
                                            <thead>
                                                <tr className={`border-b ${theme === "light" ? "border-gray-200" : "border-gray-700"}`}>
                                                    <th className="py-3 px-4 text-left font-bold text-sm">Type</th>
                                                    <th className="py-3 px-4 text-left font-bold text-sm">File Name</th>
                                                    <th className="py-3 px-4 text-left font-bold text-sm">Upload Date</th>
                                                    <th className="py-3 px-4 text-left font-bold text-sm">Size</th>
                                                    <th className="py-3 px-4 text-left font-bold text-sm">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...fileHistory.stl_files, ...fileHistory.finished_files].map((file, index) => (
                                                    <tr key={file.id} className={`border-b ${theme === "light" ? "border-gray-100 hover:bg-gray-50" : "border-gray-700 hover:bg-gray-700"}`}>
                                                        <td className="py-3 px-4">
                                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${file.type === 'stl' || file.file_type === 'stl'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-green-100 text-green-700'
                                                                }`}>
                                                                <FontAwesomeIcon icon={file.type === 'stl' || file.file_type === 'stl' ? faCube : faArchive} />
                                                                {file.type === 'stl' || file.file_type === 'stl' ? 'STL' : 'Finished'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-2 max-w-[150px]">
                                                                <FontAwesomeIcon icon={faFileAlt} className="text-gray-400 flex-shrink-0" />
                                                                <span className="font-medium truncate" title={file.fname}>
                                                                    {file.fname}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-sm">
                                                            {file.upload_date || 'N/A'}
                                                        </td>
                                                        <td className="py-3 px-4 text-sm">
                                                            {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => downloadFile(file.fname, file.url || file.path)}
                                                                    className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all"
                                                                >
                                                                    <FontAwesomeIcon icon={faDownload} />
                                                                    Download
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteFile(file.id, file.type || file.file_type)}
                                                                    className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-all"
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {fileHistory.stl_files.length === 0 && fileHistory.finished_files.length === 0 && (
                                                    <tr>
                                                        <td colSpan="5" className="py-8 text-center">
                                                            <div className="flex flex-col items-center justify-center py-4">
                                                                <FontAwesomeIcon icon={faFileAlt} className="text-3xl mb-3 opacity-50" />
                                                                <p className={`text-lg ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>No files uploaded yet</p>
                                                                <p className={`text-sm mt-1 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`}>
                                                                    Upload your first file to get started
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Order Summary & Chat Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Order Summary - Editable */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`rounded-xl shadow-lg ${theme === "light" ? "bg-white" : "bg-gray-800"}`}
                            >
                                <div className="p-6">
                                    {/* Header with Edit Button */}
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className={`text-xl font-bold flex items-center gap-2 ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                                            <FontAwesomeIcon icon={faFileCircleCheck} className="text-blue-600" />
                                            Order Summary
                                        </h3>
                                        <div className="flex gap-2">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        onClick={handleSaveOrder}
                                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                                                    >
                                                        <FontAwesomeIcon icon={faSave} />
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={handleEditToggle}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
                                                    >
                                                        <FontAwesomeIcon icon={faTimes} />
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={handleEditToggle}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                    Edit
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Details Form */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>
                                                    User Order No
                                                </label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editedOrder.user_order_no || ''}
                                                        onChange={(e) => handleInputChange('user_order_no', e.target.value)}
                                                        className={`w-full p-2 rounded-lg border text-sm ${theme === "light"
                                                            ? "bg-white border-gray-300 text-gray-900"
                                                            : "bg-gray-700 border-gray-600 text-white"
                                                            }`}
                                                    />
                                                ) : (
                                                    <p className={`p-2 rounded-lg text-sm ${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}>
                                                        {order?.user_order_no || "N/A"}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>
                                                    User ID
                                                </label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editedOrder.userid || ''}
                                                        onChange={(e) => handleInputChange('userid', e.target.value)}
                                                        className={`w-full p-2 rounded-lg border text-sm ${theme === "light"
                                                            ? "bg-white border-gray-300 text-gray-900"
                                                            : "bg-gray-700 border-gray-600 text-white"
                                                            }`}
                                                    />
                                                ) : (
                                                    <p className={`p-2 rounded-lg text-sm ${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}>
                                                        {order?.userid || "N/A"}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>
                                                Lab Name
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editedOrder.labname || ''}
                                                    onChange={(e) => handleInputChange('labname', e.target.value)}
                                                    className={`w-full p-2 rounded-lg border text-sm ${theme === "light"
                                                        ? "bg-white border-gray-300 text-gray-900"
                                                        : "bg-gray-700 border-gray-600 text-white"
                                                        }`}
                                                />
                                            ) : (
                                                <p className={`p-2 rounded-lg text-sm ${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}>
                                                    {order?.labname || "N/A"}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>
                                                    Tooth
                                                </label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editedOrder.tooth || ''}
                                                        onChange={(e) => handleInputChange('tooth', e.target.value)}
                                                        className={`w-full p-2 rounded-lg border text-sm ${theme === "light"
                                                            ? "bg-white border-gray-300 text-gray-900"
                                                            : "bg-gray-700 border-gray-600 text-white"
                                                            }`}
                                                    />
                                                ) : (
                                                    <p className={`p-2 rounded-lg text-sm ${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}>
                                                        {order?.tooth || "N/A"}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>
                                                    Unit
                                                </label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editedOrder.unit || ''}
                                                        onChange={(e) => handleInputChange('unit', e.target.value)}
                                                        className={`w-full p-2 rounded-lg border text-sm ${theme === "light"
                                                            ? "bg-white border-gray-300 text-gray-900"
                                                            : "bg-gray-700 border-gray-600 text-white"
                                                            }`}
                                                    />
                                                ) : (
                                                    <p className={`p-2 rounded-lg text-sm ${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}>
                                                        {order?.unit || "N/A"}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>
                                                Product Type
                                            </label>
                                            {isEditing ? (
                                                <select
                                                    value={editedOrder.product_type || ''}
                                                    onChange={(e) => handleInputChange('product_type', e.target.value)}
                                                    className={`w-full p-2 rounded-lg border text-sm ${theme === "light"
                                                        ? "bg-white border-gray-300 text-gray-900"
                                                        : "bg-gray-700 border-gray-600 text-white"
                                                        }`}
                                                >
                                                    <option value="">Select Product Type</option>
                                                    <option value="Crown">Crown</option>
                                                    <option value="Bridge">Bridge</option>
                                                    <option value="Veneer">Veneer</option>
                                                    <option value="Denture">Denture</option>
                                                    <option value="Implant">Implant</option>
                                                </select>
                                            ) : (
                                                <p className={`p-2 rounded-lg text-sm ${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}>
                                                    {order?.product_type || "N/A"}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>
                                                Turnaround Time
                                            </label>
                                            {isEditing ? (
                                                <select
                                                    value={editedOrder.tduration || ''}
                                                    onChange={(e) => handleInputChange('tduration', e.target.value)}
                                                    className={`w-full p-2 rounded-lg border text-sm ${theme === "light"
                                                        ? "bg-white border-gray-300 text-gray-900"
                                                        : "bg-gray-700 border-gray-600 text-white"
                                                        }`}
                                                >
                                                    <option value="">Select TAT</option>
                                                    <option value="Rush">Rush (1-2 Hours)</option>
                                                    <option value="Same Day">Same Day (6 Hours)</option>
                                                    <option value="Next Day">Next Day (12 Hours)</option>
                                                    <option value="Standard">Standard</option>
                                                </select>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <p className={`p-2 rounded-lg text-sm flex-1 ${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}>
                                                        {order?.tduration === "Rush"
                                                            ? "1–2 Hours"
                                                            : order?.tduration === "Same Day"
                                                                ? "6 Hours"
                                                                : order?.tduration === "Next Day"
                                                                    ? "12 Hours"
                                                                    : "Standard"}
                                                    </p>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${theme === "light"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-blue-900 text-blue-300"
                                                        }`}>
                                                        {order?.tduration || "N/A"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>
                                                Order Date
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={editedOrder.order_date || ''}
                                                    onChange={(e) => handleInputChange('order_date', e.target.value)}
                                                    className={`w-full p-2 rounded-lg border text-sm ${theme === "light"
                                                        ? "bg-white border-gray-300 text-gray-900"
                                                        : "bg-gray-700 border-gray-600 text-white"
                                                        }`}
                                                />
                                            ) : (
                                                <p className={`p-2 rounded-lg text-sm ${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}>
                                                    {order?.order_date || "N/A"}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Chat Section - Show Chatbox Instructions */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`rounded-xl shadow-lg flex flex-col ${theme === "light" ? "bg-white" : "bg-gray-800"}`}
                            >
                                <div className="p-6 flex-1 flex flex-col h-full">
                                    {/* Chat Header with Open Chat Button */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${theme === "light" ? "bg-blue-100 text-blue-600" : "bg-blue-900 text-blue-300"}`}>
                                                <FontAwesomeIcon icon={faComments} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold">Order Chat</h3>
                                                <p className={`text-sm ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                                                    Real-time communication for order #{order?.orderid}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={showFloatingChat}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${theme === "light"
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                                            }`}
                                        >
                                            <FontAwesomeIcon icon={faPaperPlane} />
                                            Open Chat
                                        </button>
                                    </div>

                                    {/* Chat Instructions */}
                                    <div className={`flex-1 rounded-lg border-2 border-dashed p-8 flex flex-col items-center justify-center ${theme === "light" ? "bg-gray-50 border-gray-300" : "bg-gray-700 border-gray-600"}`}>
                                        <div className="text-center">
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === "light" ? "bg-blue-100 text-blue-600" : "bg-blue-900 text-blue-300"}`}>
                                                <FontAwesomeIcon icon={faComments} className="text-2xl" />
                                            </div>
                                            <h4 className={`text-lg font-bold mb-2 ${theme === "light" ? "text-gray-800" : "text-white"}`}>
                                                Chat with Support Team
                                            </h4>
                                            <p className={`mb-6 ${theme === "light" ? "text-gray-600" : "text-gray-400"}`}>
                                                Click "Open Chat" to start a conversation about this order.
                                            </p>
                                            
                                            <div className="space-y-3 text-left max-w-md mx-auto">
                                                <div className={`flex items-start gap-3 p-3 rounded-lg ${theme === "light" ? "bg-blue-50" : "bg-blue-900/30"}`}>
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${theme === "light" ? "bg-green-100 text-green-600" : "bg-green-900 text-green-300"}`}>
                                                        <FontAwesomeIcon icon={faUser} className="text-sm" />
                                                    </div>
                                                    <div>
                                                        <p className={`font-semibold text-sm ${theme === "light" ? "text-gray-800" : "text-white"}`}>Your Messages</p>
                                                        <p className={`text-xs ${theme === "light" ? "text-gray-600" : "text-gray-400"}`}>Will appear on the right side</p>
                                                    </div>
                                                </div>
                                                
                                                <div className={`flex items-start gap-3 p-3 rounded-lg ${theme === "light" ? "bg-gray-100" : "bg-gray-700"}`}>
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${theme === "light" ? "bg-blue-100 text-blue-600" : "bg-blue-900 text-blue-300"}`}>
                                                        <FontAwesomeIcon icon={faRobot} className="text-sm" />
                                                    </div>
                                                    <div>
                                                        <p className={`font-semibold text-sm ${theme === "light" ? "text-gray-800" : "text-white"}`}>Support Team</p>
                                                        <p className={`text-xs ${theme === "light" ? "text-gray-600" : "text-gray-400"}`}>Will appear on the left side</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-6">
                                                <button
                                                    onClick={showFloatingChat}
                                                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 ${theme === "light"
                                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                                                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg'
                                                    }`}
                                                >
                                                    <FontAwesomeIcon icon={faPaperPlane} />
                                                    Launch Chat Window
                                                </button>
                                                <p className={`text-xs mt-3 ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                                                    Drag the chat window anywhere on your screen
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Chat Features */}
                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        <div className={`text-center p-3 rounded-lg ${theme === "light" ? "bg-green-50" : "bg-green-900/20"}`}>
                                            <FontAwesomeIcon icon={faFileAlt} className={`text-sm mb-1 ${theme === "light" ? "text-green-600" : "text-green-400"}`} />
                                            <p className={`text-xs font-semibold ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>File Sharing</p>
                                            <p className={`text-xs ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>Share files directly</p>
                                        </div>
                                        <div className={`text-center p-3 rounded-lg ${theme === "light" ? "bg-blue-50" : "bg-blue-900/20"}`}>
                                            <FontAwesomeIcon icon={faDownload} className={`text-sm mb-1 ${theme === "light" ? "text-blue-600" : "text-blue-400"}`} />
                                            <p className={`text-xs font-semibold ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>Real-time</p>
                                            <p className={`text-xs ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>Instant messaging</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </main>
            <Foot />
        </>
    );
}