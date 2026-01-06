import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext, useRef } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import Loder from "../../Components/Loder";
import { ThemeContext } from "../../Context/ThemeContext";
import Hd from "./Hd";
import Foot from "./Foot";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import config from '../../config';
import {
    faDownload,
    faUpload,
    faTrash,
    faFileAlt,
    faCube,
    faArchive,
    faClock,
    faBackward,
    faFileCircleCheck,
    faEdit,
    faSave,
    faTimes,
    faPaperPlane,
    faComments,
    faFile,
    faPaperclip,
    faPalette,
    faUserCog,
    faSpinner
} from "@fortawesome/free-solid-svg-icons";
import { UserContext } from "../../Context/UserContext";
import { DesignerContext } from "../../Context/DesignerContext";
import { AdminContext } from "../../Context/AdminContext";


function Chatbox({ orderid, theme }) {
    const userToken = localStorage.getItem('skydent_user_token');
    const adminToken = localStorage.getItem('skydent_admin_token');
    const designerToken = localStorage.getItem('skydent_designer_token');
    const token = userToken || adminToken || designerToken;

    const userCtx = useContext(UserContext);
    const designerCtx = useContext(DesignerContext);

    let userRole = null;
    if (userCtx?.user) userRole = 'client';
    else if (designerCtx?.designer) userRole = 'designer';
    else {
        // Check localStorage for admin
        try {
            const storedAdmin = localStorage.getItem('skydent_admin') ? JSON.parse(localStorage.getItem('skydent_admin')) : null;
            if (storedAdmin?.id) userRole = 'admin';
        } catch (e) { }
    }

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const fileInputRef = useRef(null);
    const chatBodyRef = useRef(null);
    const textareaRef = useRef(null);
    const pollingIntervalRef = useRef(null);
    const lastMessageIdRef = useRef(0);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    }, [newMessage]);

    useEffect(() => {
        setMessages([]);
        setNewMessage('');
        lastMessageIdRef.current = 0;

        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        if (orderid && token) loadChatHistory();
    }, [orderid]);

    const loadChatHistory = async () => {
        try {
            const response = await fetch(`${config.API_BASE_URL}/chat/get-chat-history/${orderid}`, {
                headers: { 'X-Tenant': 'skydent' }
            });
            const data = await response.json();

            if (data.status === 'success' && data.data) {
                const formatted = data.data.map(msg => {
                    // Client messages -> LEFT, Designer/Admin messages -> RIGHT
                    const isClient = msg.user_type === 'Client';
                    const isDesigner = msg.user_type === 'Designer';
                    const isAdmin = msg.user_type === 'Admin';

                    // Show right if: (client viewing own message) OR (designer viewing designer message) OR (admin viewing any non-client message)
                    const showRight = (userRole === 'client' && isClient) ||
                        (userRole === 'designer' && isDesigner) ||
                        (userRole === 'admin' && !isClient);

                    return {
                        id: msg.id,
                        text: msg.message,
                        timestamp: msg.message_date,
                        alignment: showRight ? 'right' : 'left',
                        file_path: msg.file_path || null,
                        filename: msg.attachment || null,
                        hasAttachment: !!msg.file_path
                    };
                });

                setMessages(formatted);
                if (formatted.length > 0) lastMessageIdRef.current = Math.max(...formatted.map(m => m.id));
                startPolling();
            }
        } catch (error) {
            startPolling();
        }
    };

    const startPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        pollingIntervalRef.current = setInterval(fetchNewMessages, 3000);
        setIsConnected(true);
    };

    const fetchNewMessages = async () => {
        if (!orderid || !token) return;

        try {
            const response = await fetch(
                `${config.API_BASE_URL}/chat/get-chat-history/${orderid}?lastId=${lastMessageIdRef.current}`,
                { headers: { 'X-Tenant': 'skydent' } }
            );

            if (!response.ok) {
                setIsConnected(false);
                return;
            }

            const data = await response.json();

            if (data.status === 'success' && data.data) {
                const newMessages = data.data
                    .filter(msg => msg.id > lastMessageIdRef.current)
                    .map(msg => {
                        const isClient = msg.user_type === 'Client';
                        const isDesigner = msg.user_type === 'Designer';
                        const isAdmin = msg.user_type === 'Admin';

                        const showRight = (userRole === 'client' && isClient) ||
                            (userRole === 'designer' && isDesigner) ||
                            (userRole === 'admin' && !isClient);

                        return {
                            id: msg.id,
                            text: msg.message,
                            timestamp: msg.message_date,
                            alignment: showRight ? 'right' : 'left',
                            file_path: msg.file_path || null,
                            filename: msg.attachment || null,
                            hasAttachment: !!msg.file_path
                        };
                    });

                if (newMessages.length > 0) {
                    setMessages(prev => {
                        const existingIds = new Set(prev.map(m => m.id));
                        const unique = newMessages.filter(m => !existingIds.has(m.id));

                        if (unique.length > 0) {
                            lastMessageIdRef.current = Math.max(...unique.map(m => m.id));
                            return [...prev, ...unique];
                        }
                        return prev;
                    });

                    setIsConnected(true);
                }
            }
        } catch (error) {
            setIsConnected(false);
        }
    };

    useEffect(() => {
        if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }, [messages]);

    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, []);

    const getUserTypeForApi = () => {
        if (userRole === 'client') return 'Client';
        if (userRole === 'designer') return 'Designer';
        if (userRole === 'admin') return 'Admin';
        return 'Designer';
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !orderid) return;

        try {
            const response = await fetch(`${config.API_BASE_URL}/chat/send-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant': 'skydent'
                },
                body: JSON.stringify({
                    orderid,
                    text: newMessage.trim(),
                    user_type: getUserTypeForApi()
                }),
            });

            const data = await response.json();
            if (data.status === 'success') {
                lastMessageIdRef.current = data.data.id;

                // Add message immediately with correct alignment
                const isClient = getUserTypeForApi() === 'Client';
                const isDesigner = getUserTypeForApi() === 'Designer';
                const isAdmin = getUserTypeForApi() === 'Admin';

                const showRight = (userRole === 'client' && isClient) ||
                    (userRole === 'designer' && isDesigner) ||
                    (userRole === 'admin' && !isClient);

                const newMsg = {
                    id: data.data.id,
                    text: newMessage.trim(),
                    timestamp: new Date().toISOString(),
                    alignment: showRight ? 'right' : 'left',
                    file_path: null,
                    filename: null,
                    hasAttachment: false
                };

                setMessages(prev => [...prev, newMsg]);
                setNewMessage('');

                // Trigger immediate poll
                setTimeout(() => fetchNewMessages(), 500);
            }
        } catch (err) {
            setNewMessage('');
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length || !orderid) return;

        for (const file of files) {
            const formData = new FormData();
            formData.append('orderid', orderid);
            formData.append('chatfile', file);

            try {
                await fetch(`${config.API_BASE_URL}/chat/chat-file`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Tenant': 'skydent'
                    },
                    body: formData
                });

                // Trigger immediate poll
                setTimeout(() => fetchNewMessages(), 500);
            } catch (err) {
                toast.error(`Failed to upload ${file.name}`);
            }
        }

        e.target.value = '';
    };

    const triggerFileInput = () => fileInputRef.current?.click();

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const downloadFile = (url, name) => {
        if (!url) {
            toast.error("File Not Found!");
            return;
        }

        try {
            const encodedPath = encodeURIComponent(url);
            const finalUrl = `${config.API_BASE_URL}/download?path=${encodedPath}`;

            const link = document.createElement("a");
            link.href = finalUrl;
            link.target = "_blank";
            link.download = name || "download";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            toast.error("Error while downloading file");
        }
    };

    return (
        <div className={`flex flex-col h-full rounded-xl overflow-hidden border ${theme === "light" ? "bg-white border-gray-200" : "bg-gray-900 border-gray-700"}`}>

            {/* ================= HEADER ================= */}
            <div className={`shrink-0 flex items-center justify-between px-6 py-4 border-b ${theme === "light" ? "bg-white border-gray-200" : "bg-gray-800 border-gray-700"}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full ${theme === "light" ? "bg-blue-100 text-blue-600" : "bg-blue-900 text-blue-300"}`}>
                        <FontAwesomeIcon icon={faComments} />
                    </div>
                    <div>
                        <h3 className={`font-bold ${theme === "light" ? "text-gray-900" : "text-white"}`}>Order Chat</h3>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full bg-green-500`} />
                            <span className={`text-xs ${theme === "light" ? "text-gray-600" : "text-gray-400"}`}>
                                Connected
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= CHAT BODY (scrollable) ================= */}
            <div
                ref={chatBodyRef}
                className={`flex-1 overflow-y-auto p-6 space-y-4 ${theme === "light" ? "bg-gray-50" : "bg-gray-800"}`}
            >
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <FontAwesomeIcon icon={faComments} className={`text-4xl mb-3 ${theme === "light" ? "text-gray-300" : "text-gray-600"}`} />
                            <p className={`${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>No messages yet. Start the conversation!</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isRight = msg.alignment === "right";
                        return (
                            <div key={msg.id} className={`flex flex-col ${isRight ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[80%] rounded-2xl p-3 break-words ${isRight ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" : "bg-gradient-to-r from-blue-500 to-purple-600 text-white"}`}>
                                    {msg.hasAttachment && msg.file_path ? (
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faFile} className="text-white/90" />
                                            <span className="text-sm font-medium text-white">{msg.filename}</span>
                                            <button onClick={() => downloadFile(msg.file_path, msg.filename)} className="ml-2 hover:opacity-80 transition-opacity" title="Download file">
                                                <FontAwesomeIcon icon={faDownload} className="text-white/90 hover:text-white" />
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-white leading-relaxed">{msg.text}</p>
                                    )}
                                </div>
                                <div className={`text-xs mt-1 px-2 ${isRight ? "text-right" : "text-left"} ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                                    {msg.timestamp}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ================= INPUT ================= */}
            <div className={`shrink-0 border-t p-4 rounded-xl ${theme === "light" ? "bg-white border-gray-200" : "bg-gray-800 border-gray-700"}`}>
                <div className="flex items-start gap-2">
                    <input ref={fileInputRef} type="file" onChange={handleFileUpload} multiple className="hidden" />
                    <button onClick={triggerFileInput} disabled={!orderid} className={`p-3 rounded-lg ${theme === "light" ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-gray-700 text-gray-300 hover:bg-gray-600"} disabled:opacity-50`}>
                        <FontAwesomeIcon icon={faPaperclip} />
                    </button>
                    <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={orderid ? "Type your message..." : "Loading chat..."}
                        rows="1"
                        disabled={!orderid}
                        style={{ minHeight: "44px", maxHeight: "120px", overflowY: "auto" }}
                        className={`w-full p-3 rounded-lg text-sm resize-none focus:outline-none ${theme === "light" ? "bg-gray-100 text-gray-900 border border-gray-300" : "bg-gray-700 text-white border border-gray-600"}`}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || !orderid}
                        className={`p-3 rounded-lg font-medium ${theme === "light" ? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400" : "bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-800"} disabled:cursor-not-allowed`}
                    >
                        <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function OrderDetails() {
    const { theme } = useContext(ThemeContext);
    const { admin } = useContext(AdminContext);
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [fileHistory, setFileHistory] = useState({ stl_files: [], finished_files: [] });
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [editedOrder, setEditedOrder] = useState({});
    const [designPreferences, setDesignPreferences] = useState(null);
    const [preferencesLoading, setPreferencesLoading] = useState(false);
    const navigate = useNavigate();
    const base_url = localStorage.getItem("skydent_admin_base_url");
    const token = localStorage.getItem("skydent_admin_token");
    const fileInputRef = useRef(null);

    // ✅ FIXED: Move fetchFileHistory outside useEffect so it can be reused
    const fetchFileHistory = async () => {
        try {
            const response = await fetch(`${base_url}/get-file-history`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, 'X-Tenant': 'skydent' },
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

    useEffect(() => {
        async function fetchOrderDetails() {
            try {
                setLoading(true);
                const response = await fetch(`${base_url}/get-order-details`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, 'X-Tenant': 'skydent' },
                    body: JSON.stringify({ orderid: id }),
                });

                const resp = await response.json();
                if (resp.status === "success") {
                    setOrder(resp.order);
                    setEditedOrder(resp.order);
                    setSelectedStatus(resp.order.status);

                    // ✅ FIXED: Call the reusable function
                    await fetchFileHistory();

                    if (resp.order?.userid) {
                        fetchUserPreferences(resp.order.userid);
                    }
                } else {
                    setError(resp.message || "Failed to fetch order details");
                }
            } catch (error) {
                setError("Failed to fetch order details");
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchOrderDetails();
    }, [id]);

    const fetchUserPreferences = async (userid) => {
        try {
            setPreferencesLoading(true);
            const response = await fetch(`${base_url}/get-default-pref/${userid}`, {
                headers: { 'X-Tenant': 'skydent' }
            });

            const result = await response.json();

            if (result.status === 'Success') {
                setDesignPreferences(result.prefe || {});
            } else {
                setDesignPreferences({});
            }
        } catch (error) {
            setDesignPreferences({});
        } finally {
            setPreferencesLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!selectedStatus) {
            toast.error("Please select a status");
            return;
        }

        toast.loading("Updating order status...");
        try {
            const response = await fetch(`${base_url}/update-order-status`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, 'X-Tenant': 'skydent' },
                body: JSON.stringify({ orderid: id, status: selectedStatus }),
            });

            const resp = await response.json();
            toast.dismiss();
            if (resp.status === "success") {
                setOrder((prev) => ({ ...prev, status: selectedStatus }));
                setEditedOrder((prev) => ({ ...prev, status: selectedStatus }));
                toast.success("Order status updated successfully!");
            } else {
                toast.error(resp.message || "Failed to update order status");
            }
        } catch (error) {
            toast.error("Error updating order status");
        }
    };

    const handleDeleteFile = async (fileId, type) => {
        if (!window.confirm("Are you sure you want to delete this file?")) return;

        toast.loading("Deleting file...");
        try {
            const response = await fetch(`${base_url}/delete-orderdetails-file`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, 'X-Tenant': 'skydent' },
                body: JSON.stringify({ file_id: fileId, file_type: type }),
            });

            const resp = await response.json();
            toast.dismiss();
            if (resp.status === "success") {
                toast.success("File deleted successfully!");

                // ✅ FIXED: Update fileHistory state immediately to reflect deletion
                setFileHistory(prev => {
                    const newStlFiles = prev.stl_files.filter(file => file.id !== fileId);
                    const newFinishedFiles = prev.finished_files.filter(file => file.id !== fileId);

                    return {
                        stl_files: newStlFiles,
                        finished_files: newFinishedFiles
                    };
                });

                // Also fetch from server to ensure consistency
                await fetchFileHistory();
            } else {
                toast.error(resp.message || "Failed to delete file");
            }
        } catch (error) {
            toast.error("Error deleting file");
        }
    };

    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (!files || files.length === 0) return;

        // Reset progress
        setUploadProgress({});
        setUploading(true);

        let successCount = 0;
        let errorMessages = [];
        let completedCount = 0;

        for (const [index, file] of files.entries()) {
            const fileNameLower = file.name.toLowerCase();
            let fileType = '';

            if (fileNameLower.endsWith('.stl')) {
                fileType = 'stl';
            } else if (
                fileNameLower.endsWith('.zip') ||
                fileNameLower.endsWith('.rar') ||
                fileNameLower.endsWith('.7z')
            ) {
                fileType = 'finished';
            } else {
                errorMessages.push(
                    `${file.name}: Invalid file type. Only .stl, .zip, .rar, .7z allowed`
                );
                completedCount++;
                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: { progress: 100, status: 'error', error: 'Invalid file type' }
                }));
                continue;
            }

            // Set initial progress
            setUploadProgress(prev => ({
                ...prev,
                [file.name]: { progress: 0, status: 'uploading', fileName: file.name, fileSize: formatFileSize(file.size) }
            }));

            const formData = new FormData();
            formData.append("file", file);
            formData.append("orderid", id);
            formData.append("type", fileType);
            formData.append("desiid", admin.desiid);

            try {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const progress = Math.round((e.loaded / e.total) * 100);
                        setUploadProgress(prev => ({
                            ...prev,
                            [file.name]: {
                                ...prev[file.name],
                                progress: progress,
                                status: progress === 100 ? 'processing' : 'uploading'
                            }
                        }));
                    }
                });

                const uploadPromise = new Promise((resolve, reject) => {
                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const result = JSON.parse(xhr.responseText);
                                if (result.status === "success") {
                                    successCount++;
                                    setUploadProgress(prev => ({
                                        ...prev,
                                        [file.name]: { ...prev[file.name], progress: 100, status: 'completed' }
                                    }));
                                    resolve(result);
                                } else {
                                    errorMessages.push(`${file.name}: ${result.message || "Upload failed"}`);
                                    setUploadProgress(prev => ({
                                        ...prev,
                                        [file.name]: { ...prev[file.name], progress: 100, status: 'error', error: result.message || "Upload failed" }
                                    }));
                                    reject(new Error(result.message));
                                }
                            } catch {
                                errorMessages.push(`${file.name}: Invalid server response`);
                                setUploadProgress(prev => ({
                                    ...prev,
                                    [file.name]: { ...prev[file.name], progress: 100, status: 'error', error: 'Invalid server response' }
                                }));
                                reject(new Error('Invalid response'));
                            }
                        } else {
                            errorMessages.push(`${file.name}: Upload failed (${xhr.status})`);
                            setUploadProgress(prev => ({
                                ...prev,
                                [file.name]: { ...prev[file.name], progress: 100, status: 'error', error: `Upload failed (${xhr.status})` }
                            }));
                            reject(new Error(`HTTP ${xhr.status}`));
                        }
                        completedCount++;
                    };

                    xhr.onerror = () => {
                        errorMessages.push(`${file.name}: Network error`);
                        setUploadProgress(prev => ({
                            ...prev,
                            [file.name]: { ...prev[file.name], progress: 100, status: 'error', error: 'Network error' }
                        }));
                        completedCount++;
                        reject(new Error('Network error'));
                    };

                    xhr.ontimeout = () => {
                        errorMessages.push(`${file.name}: Request timeout`);
                        setUploadProgress(prev => ({
                            ...prev,
                            [file.name]: { ...prev[file.name], progress: 100, status: 'error', error: 'Request timeout' }
                        }));
                        completedCount++;
                        reject(new Error('Timeout'));
                    };
                });

                xhr.open("POST", `${base_url}/upload-order-file`);
                xhr.setRequestHeader("Authorization", `Bearer ${token}`);
                xhr.setRequestHeader("X-Tenant", "skydent");
                xhr.timeout = 300000; // 5 minutes timeout

                xhr.send(formData);

                await uploadPromise;

            } catch (error) {
                errorMessages.push(`${file.name}: Upload error`);
                completedCount++;
            }
        }

        // Wait a moment for all uploads to complete
        const checkCompletion = setInterval(() => {
            if (completedCount === files.length) {
                clearInterval(checkCompletion);
                setUploading(false);

                // Show success/error messages
                if (successCount > 0) {
                    toast.success(`${successCount} file(s) uploaded successfully`);
                    fetchFileHistory();

                    // Clear progress after 3 seconds
                    setTimeout(() => {
                        setUploadProgress({});
                    }, 3000);
                }

                if (errorMessages.length > 0) {
                    errorMessages.forEach(msg => toast.error(msg));
                }
            }
        }, 100);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const downloadFile = (filename, path) => {
        if (!path) {
            toast.error("File path not found!");
            return;
        }

        const encodedPath = encodeURIComponent(path);
        const finalUrl = `${base_url}/download?path=${encodedPath}`;

        const link = document.createElement("a");
        link.href = finalUrl;
        link.target = "_blank";
        link.download = filename || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEditToggle = () => {
        if (isEditing) setEditedOrder(order);
        setIsEditing(!isEditing);
    };

    const handleSaveOrder = async () => {
        toast.loading("Saving order details...");
        try {
            const updates = {};
            const editableFields = ['user_order_no', 'labname', 'tooth', 'unit', 'product_type', 'tduration', 'message', 'status'];

            editableFields.forEach(field => {
                const originalValue = order?.[field];
                const editedValue = editedOrder[field];
                if (editedValue !== undefined && editedValue !== originalValue) updates[field] = editedValue;
            });

            if (Object.keys(updates).length === 0) {
                toast.dismiss();
                toast.error("No changes to save");
                return;
            }

            const response = await fetch(`${base_url}/update-order-details`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, 'X-Tenant': 'skydent' },
                body: JSON.stringify({ orderid: id, userid: order?.userid, updates: updates }),
            });

            const resp = await response.json();
            toast.dismiss();

            if (resp.status === "success") {
                toast.success(resp.message || "Order details updated successfully!");
                if (resp.order) {
                    setOrder(resp.order);
                    setEditedOrder(resp.order);
                }
                setIsEditing(false);
            } else {
                toast.error(resp.message || "Failed to update order details");
            }
        } catch (error) {
            toast.error("Error updating order details");
        }
    };

    const handleInputChange = (field, value) => {
        setEditedOrder(prev => ({ ...prev, [field]: value }));
    };

    if (loading) return (<><Hd /><main className={`min-h-screen flex flex-col items-center justify-center ${theme === "light" ? "bg-gray-50" : "bg-gray-900"}`}><Loder status="show" /></main><Foot /></>);
    if (error) return (<><Hd /><main className={`min-h-screen flex flex-col items-center justify-center ${theme === "light" ? "bg-gray-50" : "bg-gray-900"}`}><div className="text-center"><div className="text-red-500 text-6xl mb-4">⚠️</div><h2 className={`text-2xl font-bold mb-2 ${theme === "light" ? "text-gray-900" : "text-white"}`}>Error Loading Order</h2><p className={theme === "light" ? "text-gray-600" : "text-gray-400"}>{error}</p></div></main><Foot /></>);

    return (
        <>
            <Toaster position="top-right" />
            <Hd />

            <main className={`min-h-screen py-12 ${theme === "light" ? "bg-gray-100 text-gray-900" : "bg-gray-900 text-white"}`}>
                <section className="py-8">
                    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl shadow-lg ${theme === "light" ? "bg-white" : "bg-gray-800"}`}>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                                    <div>
                                        <label className="font-bold text-lg">Order ID: </label>
                                        <span className="text-xl font-bold text-blue-600">{order?.orderid}</span>
                                    </div>
                                    <div>
                                        <label className="font-bold text-lg"><FontAwesomeIcon icon={faClock} className="mr-2" />Status:</label>
                                        <span className={`ml-2 px-4 py-2 rounded-full text-sm font-bold ${order?.status === 'Completed' ? 'bg-green-500 text-white' : order?.status === 'Cancel' || order?.status === 'Cancelled' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-gray-900'}`}>
                                            {order?.status === 'progress' ? 'In Progress' : order?.status}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="font-bold text-lg">Run Self By: </label>
                                        <span className="text-xl font-bold text-blue-600">{order?.run_self_by}</span>
                                    </div>
                                    <div className="text-right">
                                        <button onClick={() => navigate(-1)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg cursor-pointer">
                                            <FontAwesomeIcon icon={faBackward} className="mr-2" />Back to Orders
                                        </button>
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                                        <div className="lg:col-span-7">
                                            <label className="font-bold block mb-3 text-lg">Initial Scan: </label>
                                            {order?.file_path ? (
                                                <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg">
                                                    <FontAwesomeIcon icon={faFileAlt} className="text-blue-500 text-xl" />
                                                    <div className="flex-1">
                                                        <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-lg" onClick={(e) => { e.preventDefault(); downloadFile(order.fname || "initial_file.zip", order.file_path); }}>{order?.fname}</a>
                                                        <p className={`text-sm ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>Uploaded: {order?.order_date || 'N/A'}</p>
                                                    </div>
                                                    <button onClick={() => downloadFile(order.fname || "initial_file.zip", order.file_path)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${theme === "light" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-500 text-white hover:bg-blue-600"}`}>
                                                        <FontAwesomeIcon icon={faDownload} />Download
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
                                            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className={`w-full p-3 rounded-lg border-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none ${theme === "light" ? "bg-white border-gray-300 text-gray-900" : "bg-gray-700 border-gray-600 text-white"}`}>
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
                                            <button type="button" onClick={handleStatusUpdate} disabled={uploading || !selectedStatus} className={`w-full py-3 rounded-lg font-bold transition-all cursor-pointer ${uploading || !selectedStatus ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'}`}>
                                                {uploading ? 'Updating...' : 'Update Status'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 mt-8">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`rounded-xl shadow-lg ${theme === "light" ? "bg-white" : "bg-gray-800"}`}>
                                <div className="p-6 h-full">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-xl ${theme === "light" ? "bg-blue-100 text-blue-600" : "bg-blue-900 text-blue-300"}`}>
                                                <FontAwesomeIcon icon={faUpload} className="text-xl" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold">File Upload</h3>
                                                <p className={`text-sm ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>Upload STL or Finished files</p>
                                            </div>
                                        </div>
                                        {uploading && (
                                            <div className="flex items-center gap-2">
                                                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-600" />
                                                <span className="text-sm font-semibold">Uploading...</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress Bars Section */}
                                    {Object.keys(uploadProgress).length > 0 && (
                                        <div className="mb-6">
                                            <div className={`rounded-lg p-4 ${theme === "light" ? "bg-gray-50 border border-gray-200" : "bg-gray-700 border border-gray-600"}`}>
                                                <h4 className="font-bold mb-3 text-sm">Upload Progress</h4>
                                                <div className="space-y-3">
                                                    {Object.entries(uploadProgress).map(([fileName, progress]) => (
                                                        <div key={fileName} className="space-y-1">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs font-medium truncate max-w-[70%]" title={fileName}>
                                                                    {progress.fileName || fileName}
                                                                </span>
                                                                <span className="text-xs font-semibold">
                                                                    {progress.progress}%
                                                                    {progress.fileSize && ` • ${progress.fileSize}`}
                                                                </span>
                                                            </div>
                                                            <div className={`h-2 rounded-full overflow-hidden ${theme === "light" ? "bg-gray-200" : "bg-gray-600"}`}>
                                                                <div
                                                                    className={`h-full transition-all duration-300 ${progress.status === 'completed' ? 'bg-green-500' :
                                                                        progress.status === 'error' ? 'bg-red-500' :
                                                                            progress.status === 'processing' ? 'bg-yellow-500' :
                                                                                'bg-blue-500'
                                                                        }`}
                                                                    style={{ width: `${progress.progress}%` }}
                                                                />
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className={`font-medium ${progress.status === 'completed' ? 'text-green-600' :
                                                                    progress.status === 'error' ? 'text-red-600' :
                                                                        progress.status === 'processing' ? 'text-yellow-600' :
                                                                            'text-blue-600'
                                                                    }`}>
                                                                    {progress.status === 'uploading' ? 'Uploading...' :
                                                                        progress.status === 'processing' ? 'Processing...' :
                                                                            progress.status === 'completed' ? 'Completed' :
                                                                                progress.status === 'error' ? `Error: ${progress.error}` : 'Pending'}
                                                                </span>
                                                                {progress.status === 'error' && (
                                                                    <button
                                                                        onClick={() => setUploadProgress(prev => {
                                                                            const newProgress = { ...prev };
                                                                            delete newProgress[fileName];
                                                                            return newProgress;
                                                                        })}
                                                                        className="text-red-500 hover:text-red-700 text-xs"
                                                                    >
                                                                        Dismiss
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className={`rounded-lg border-2 border-dashed p-8 flex flex-col items-center justify-center min-h-[200px] ${theme === "light" ? "bg-gray-50 border-gray-300" : "bg-gray-700 border-gray-600"}`}>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept=".stl,.zip,.rar,.7z"
                                            multiple
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            disabled={uploading}
                                        />
                                        <div className="text-center">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                                className={`w-full flex flex-col items-center gap-3 px-8 py-8 rounded-lg font-bold text-lg transition-all hover:scale-105 ${uploading ? 'bg-gray-400 cursor-not-allowed' :
                                                    theme === "light" ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg' :
                                                        'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg'
                                                    }`}
                                            >
                                                {uploading ? (
                                                    <>
                                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl mb-2" />
                                                        <span>Uploading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FontAwesomeIcon icon={faUpload} className="text-3xl mb-2" />
                                                        <span>Upload Files</span>
                                                    </>
                                                )}
                                            </button>
                                            <p className={`text-sm mt-4 ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                                                Drag & drop or click to upload multiple files
                                            </p>
                                            <p className={`text-xs mt-2 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`}>
                                                Supported: .STL, .ZIP, .RAR, .7Z (Select multiple files)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`rounded-xl shadow-lg ${theme === "light" ? "bg-white" : "bg-gray-800"}`}>
                                <div className="p-6 h-full flex flex-col">
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

                                    <div className="flex-grow flex flex-col min-h-0">
                                        <div className="overflow-x-auto flex-shrink-0">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className={`border-b ${theme === "light" ? "border-gray-200" : "border-gray-700"}`}>
                                                        <th className="py-3 px-4 text-left font-bold text-sm w-[40%]">File Name</th>
                                                        <th className="py-3 px-4 text-right font-bold text-sm">Actions</th>
                                                    </tr>
                                                </thead>
                                            </table>
                                        </div>

                                        <div className="overflow-y-auto flex-grow" style={{ maxHeight: '400px' }}>
                                            <table className="w-full">
                                                <tbody>
                                                    {fileHistory.stl_files.length === 0 && fileHistory.finished_files.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="2" className="py-8 text-center">
                                                                <div className="flex flex-col items-center justify-center py-4">
                                                                    <FontAwesomeIcon icon={faFileAlt} className="text-3xl mb-3 opacity-50" />
                                                                    <p className={`text-lg ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>No files uploaded yet</p>
                                                                    <p className={`text-sm mt-1 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`}>Upload your first file to get started</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        <>
                                                            {[...fileHistory.stl_files, ...fileHistory.finished_files].map((file, index) => {
                                                                const isStlFile = file.type === 'stl' || file.file_type === 'stl' || (file.fname && file.fname.endsWith('.stl'));
                                                                const fileIcon = isStlFile ? faCube : faArchive;
                                                                const fileType = isStlFile ? 'STL' : 'Finished';

                                                                return (
                                                                    <tr key={file.id || index} className={`border-b ${theme === "light" ? "border-gray-100 hover:bg-gray-50" : "border-gray-700 hover:bg-gray-700"}`}>
                                                                        <td className="py-3 px-4 w-[80%]">
                                                                            <div className="flex items-start gap-3">
                                                                                <div className="mt-1">
                                                                                    <FontAwesomeIcon icon={fileIcon} className={`text-sm ${isStlFile ? 'text-blue-500' : 'text-green-500'}`} />
                                                                                </div>
                                                                                <div>
                                                                                    <p className={`font-semibold text-[14px] ${theme === "light" ? "text-gray-900" : "text-white"}`} title={file.fname}>
                                                                                        {file.fname}
                                                                                    </p>
                                                                                    <p className={`text-xs mt-1 ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                                                                                        <FontAwesomeIcon icon={faClock} className="mr-1 text-xs" />
                                                                                        Uploaded: {file.upload_date || 'N/A'}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 px-4">
                                                                            <div className="flex gap-2">
                                                                                <button onClick={() => { const filePath = file.url || file.path || file.file_path; if (filePath) downloadFile(file.fname, filePath); else toast.error("File path not found!"); }} className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-md font-semibold transition-all">
                                                                                    <FontAwesomeIcon icon={faDownload} />
                                                                                </button>
                                                                                <button onClick={() => { const fileType = file.type || file.file_type || (isStlFile ? 'stl' : 'finished'); handleDeleteFile(file.id, fileType); }} className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-md font-semibold transition-all">
                                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`max-h-[800px] rounded-xl shadow-lg ${theme === "light" ? "bg-white" : "bg-gray-800"}`}>
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className={`text-xl font-bold flex items-center gap-2 ${theme === "light" ? "text-gray-900" : "text-white"}`}>
                                            <FontAwesomeIcon icon={faFileCircleCheck} className="text-blue-600" />
                                            Order Summary
                                        </h3>
                                        <div className="flex gap-2">
                                            {isEditing ? (
                                                <>
                                                    <button onClick={handleSaveOrder} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all">
                                                        <FontAwesomeIcon icon={faSave} />
                                                        Save
                                                    </button>
                                                    <button onClick={handleEditToggle} className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all">
                                                        <FontAwesomeIcon icon={faTimes} />
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button onClick={handleEditToggle} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all">
                                                    <FontAwesomeIcon icon={faEdit} />
                                                    Edit
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {/* User Order No - Always Disabled */}
                                            <div className="flex flex-col">
                                                <label className={`block text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>
                                                    User Order No
                                                </label>
                                                <div className={`w-full p-4 rounded-lg border text-sm ${theme === "light"
                                                    ? "bg-gray-50 border-gray-300 text-gray-900"
                                                    : "bg-gray-700 border-gray-600 text-gray-300"}`}>
                                                    {order?.user_order_no || "N/A"}
                                                </div>
                                            </div>

                                            {/* User ID - Always Disabled */}
                                            <div className="flex flex-col">
                                                <label className={`block text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>
                                                    User ID
                                                </label>
                                                <div className={`w-full p-4 rounded-lg border text-sm ${theme === "light"
                                                    ? "bg-gray-50 border-gray-300 text-gray-900"
                                                    : "bg-gray-700 border-gray-600 text-gray-300"}`}>
                                                    {order?.userid || "N/A"}
                                                </div>
                                            </div>

                                            {/* Lab Name - Always Disabled */}
                                            <div className="flex flex-col">
                                                <label className={`block text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>
                                                    Lab Name
                                                </label>
                                                <div className={`w-full p-4 rounded-lg border text-sm ${theme === "light"
                                                    ? "bg-gray-50 border-gray-300 text-gray-900"
                                                    : "bg-gray-700 border-gray-600 text-gray-300"}`}>
                                                    {order?.labname || "N/A"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>Tooth</label>
                                                {isEditing ? (
                                                    <input type="text" value={editedOrder.tooth || ''} onChange={(e) => handleInputChange('tooth', e.target.value)} className={`w-full p-4 rounded-lg border text-sm ${theme === "light" ? "bg-white border-gray-300 text-gray-900" : "bg-gray-700 border-gray-600 text-white"}`} />
                                                ) : (
                                                    <p className={`p-4 rounded-lg text-sm ${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}>{order?.tooth || "N/A"}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>Unit</label>
                                                {isEditing ? (
                                                    <input type="text" value={editedOrder.unit || ''} onChange={(e) => handleInputChange('unit', e.target.value)} className={`w-full p-4 rounded-lg border text-sm ${theme === "light" ? "bg-white border-gray-300 text-gray-900" : "bg-gray-700 border-gray-600 text-white"}`} />
                                                ) : (
                                                    <p className={`p-4 rounded-lg text-sm ${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}>{order?.unit || "N/A"}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>Product Type</label>
                                            {isEditing ? (
                                                <input type="text" value={editedOrder.product_type || ''} onChange={(e) => handleInputChange('product_type', e.target.value)} className={`w-full p-4 rounded-lg border text-sm ${theme === "light" ? "bg-white border-gray-300 text-gray-900" : "bg-gray-700 border-gray-600 text-white"}`} />
                                            ) : (
                                                <p className={`p-4 rounded-lg text-sm ${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}>{order?.product_type || "N/A"}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>Turnaround Time</label>
                                            {isEditing ? (
                                                <select value={editedOrder.tduration || ''} onChange={(e) => handleInputChange('tduration', e.target.value)} className={`w-full p-4 rounded-lg border text-sm ${theme === "light" ? "bg-white border-gray-300 text-gray-900" : "bg-gray-700 border-gray-600 text-white"}`}>
                                                    <option value="">Select TAT</option>
                                                    <option value="Rush">Rush (1-2 Hours)</option>
                                                    <option value="Same Day">Same Day (6 Hours)</option>
                                                    <option value="Next Day">Next Day (12 Hours)</option>
                                                </select>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <p className={`p-4 rounded-lg text-sm flex-1 ${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}>
                                                        {order?.tduration === "Rush" ? "1–2 Hours" : order?.tduration === "Same Day" ? "6 Hours" : order?.tduration === "Next Day" ? "12 Hours" : "N/A"}
                                                    </p>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${theme === "light" ? "bg-blue-100 text-blue-700" : "bg-blue-900 text-blue-300"}`}>
                                                        {order?.tduration || "N/A"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>Order Date</label>
                                            <p className={`p-4 rounded-lg text-sm ${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}>{order?.order_date || "N/A"}</p>
                                        </div>

                                        {order?.message && (
                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>Message</label>
                                                {isEditing ? (
                                                    <textarea value={editedOrder.message || ''} onChange={(e) => handleInputChange('message', e.target.value)} className={`w-full p-4 rounded-lg border text-sm ${theme === "light" ? "bg-white border-gray-300 text-gray-900" : "bg-gray-700 border-gray-600 text-white"}`} rows="3" />
                                                ) : (
                                                    <p className={`p-4 rounded-lg text-sm ${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}>{order?.message || "N/A"}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`rounded-xl shadow-lg max-h-[800px] ${theme === "light" ? "bg-white" : "bg-gray-800"}`}>
                                <div className="p-6 h-full flex flex-col">
                                    {/* Default Design Preferences Section */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                                <FontAwesomeIcon icon={faPalette} className="text-purple-600" />
                                                Default Design Preferences
                                            </h2>
                                            {preferencesLoading && (
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                            )}
                                        </div>

                                        {designPreferences ? (
                                            <div className={`rounded-lg p-4 ${theme === "light" ? "bg-gray-50" : "bg-gray-700/50"}`}>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className={`text-sm font-bold ${theme === "light" ? "text-black" : "text-gray-300"}`}>
                                                            Contact:
                                                        </span>
                                                        <span className={`text-sm font-semibold px-3 py-1 rounded ${theme === "light" ? "text-black" : "bg-blue-900/50 text-blue-300"}`}>
                                                            {designPreferences.contact}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <span className={`text-sm font-bold ${theme === "light" ? "text-black" : "text-gray-300"}`}>
                                                            Occlusion:
                                                        </span>
                                                        <span className={`text-sm font-semibold px-3 py-1 rounded ${theme === "light" ? "text-black" : "bg-green-900/50 text-green-300"}`}>
                                                            {designPreferences.occlusion}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <span className={`text-sm font-bold ${theme === "light" ? "text-black" : "text-gray-300"}`}>
                                                            Anatomy:
                                                        </span>
                                                        <span className={`text-sm font-semibold px-3 py-1 rounded ${theme === "light" ? "text-black" : "bg-purple-900/50 text-purple-300"}`}>
                                                            {designPreferences.anatomy}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <span className={`text-sm font-bold ${theme === "light" ? "text-black" : "text-gray-300"}`}>
                                                            Pontic:
                                                        </span>
                                                        <span className={`text-sm font-semibold px-3 py-1 rounded ${theme === "light" ? "text-black" : "bg-amber-900/50 text-amber-300"}`}>
                                                            {designPreferences.pontic}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <span className={`text-sm font-bold ${theme === "light" ? "text-black" : "text-gray-300"}`}>
                                                            Liner Spacer:
                                                        </span>
                                                        <span className={`text-sm font-semibold px-3 py-1 rounded ${theme === "light" ? "text-black" : "bg-indigo-900/50 text-indigo-300"}`}>
                                                            {designPreferences.liner_spacer}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between items-center">
                                                        <span className={`text-sm font-bold ${theme === "light" ? "text-black" : "text-gray-300"}`}>
                                                            Custom:
                                                        </span>
                                                        <span className={`text-sm font-semibold px-3 py-1 rounded ${theme === "light" ? "text-black" : "bg-pink-900/50 text-pink-300"}`}>
                                                            {designPreferences.custom}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`rounded-lg p-4 text-center ${theme === "light" ? "bg-gray-50" : "bg-gray-700/50"}`}>
                                                <FontAwesomeIcon icon={faUserCog} className={`text-2xl mb-2 ${theme === "light" ? "text-gray-400" : "text-gray-500"}`} />
                                                <p className={`text-sm ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                                                    No design preferences found for this user
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Chatbox Section */}
                                    <div className="flex flex-col h-full rounded-xl overflow-hidden">
                                        <Chatbox orderid={id} theme={theme} />
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