import { useParams } from "react-router-dom";
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
    faCheckCircle,
    faFileAlt,
    faCube,
    faArchive,
    faSyncAlt,
    faClock,
    faBackward,
    faEdit,
    faPlus,
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
                        {/* Order Summary */}
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
                                        <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg">
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
                                                <option value="QC Required">QC Required</option>
                                                <option value="Hold">Hold</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Cancel">Cancel</option>
                                            </select>
                                        </div>
                                        <div className="lg:col-span-2">
                                            <button
                                                type="button"
                                                onClick={handleStatusUpdate}
                                                disabled={uploading}
                                                className={`w-full py-3 rounded-lg font-bold transition-all ${uploading
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

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column - STL Files */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`rounded-xl shadow-lg ${theme === "light" ? "bg-white" : "bg-gray-800"}`}
                            >
                                <div className="p-6">
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

                                    {/* STL Files Table */}
                                    {fileHistory.stl_files.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className={`w-full rounded-lg overflow-hidden ${theme === "light" ? "bg-white" : "bg-gray-700"}`}>
                                                <thead className={theme === "light" ? "bg-gray-200" : "bg-gray-600"}>
                                                    <tr>
                                                        <th className="p-4 text-left font-bold">#</th>
                                                        <th className="p-4 text-left font-bold">File Name</th>
                                                        <th className="p-4 text-left font-bold">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {fileHistory.stl_files.map((file, index) => (
                                                        <tr key={file.id} className={`border-b ${theme === "light" ? "border-gray-200 hover:bg-gray-50" : "border-gray-600 hover:bg-gray-600"}`}>
                                                            <td className="p-4 font-semibold">{index + 1}</td>
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <FontAwesomeIcon icon={faCube} className="text-blue-500" />
                                                                    <span className="font-semibold">
                                                                        {file.fname}
                                                                        <span className="text-[10px] text-normal">
                                                                            <br/>
                                                                            {file.upload_date || 'N/A'}
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
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
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className={`text-center py-8 rounded-lg ${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}>
                                            <FontAwesomeIcon icon={faCube} className="text-4xl mb-3 opacity-50" />
                                            <p className={`text-lg ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>No STL files uploaded yet</p>
                                            <p className={`text-sm mt-1 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`}>
                                                Upload your first STL file to get started
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Right Column - Finished Files & Details */}
                            <div className="space-y-6">
                                {/* Finished Files */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`rounded-xl shadow-lg ${theme === "light" ? "bg-white" : "bg-gray-800"}`}
                                >
                                    <div className="p-6">
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
                                        {fileHistory.finished_files.length > 0 ? (
                                            <div className="space-y-3">
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
                                            <div className={`text-center py-8 rounded-lg ${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}>
                                                <FontAwesomeIcon icon={faArchive} className="text-4xl mb-3 opacity-50" />
                                                <p className={`text-lg ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>No finished files uploaded yet</p>
                                                <p className={`text-sm mt-1 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`}>
                                                    Upload your first finished file (.zip, .rar, .7z)
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Product Details */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className={`rounded-xl shadow-lg ${theme === "light" ? "bg-white" : "bg-gray-800"}`}
                                >
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold mb-4">Product Details</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="font-semibold block mb-1">Tooth:</label>
                                                <p className="text-lg">{order?.tooth || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="font-semibold block mb-1">Unit:</label>
                                                <p className="text-lg">{order?.unit || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="font-semibold block mb-1">Design Type:</label>
                                                <p className="text-lg">{order?.product_type || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="font-semibold block mb-1">TAT:</label>
                                                <p className="text-lg">
                                                    {order?.tduration === 'Rush' ? '1-2 Hour' :
                                                        order?.tduration === 'Same Day' ? '6 Hour' :
                                                            order?.tduration === 'Next Day' ? '12 Hour' : 'Standard'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Foot />
        </>
    );
}