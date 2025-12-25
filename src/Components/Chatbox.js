import { useState, useRef, useEffect, useContext } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUser, faTimes, faFile, faPaperclip, faPaperPlane, faDownload,
    faCrown, faShieldAlt, faUserTie
} from "@fortawesome/free-solid-svg-icons";
import { UserContext } from '../Context/UserContext';
import { DesignerContext } from '../Context/DesignerContext';
import { AdminContext } from '../Context/AdminContext';
import config from '../config';

export default function Chatbox({ orderid }) {
    const userToken = localStorage.getItem('token');
    const adminToken = localStorage.getItem('skydent_admin_token');
    const designerToken = localStorage.getItem('token');
    const token = userToken || adminToken || designerToken || "";

    const userCtx = useContext(UserContext);
    const designerCtx = useContext(DesignerContext);
    const adminCtx = useContext(AdminContext);

    let currentUser = null, userId = null, userRole = null, userName = null;

    if (userCtx?.user?.userid) {
        currentUser = userCtx.user;
        userId = currentUser.userid;
        userRole = 'client';
        userName = currentUser.name || 'Client';
    } else if (designerCtx?.designer?.desiid) {
        currentUser = designerCtx.designer;
        userId = currentUser.desiid;
        userRole = 'designer';
        userName = currentUser.name || 'Designer';
    } else if (adminCtx?.admin?.id) {
        currentUser = adminCtx.admin;
        userId = currentUser.id;
        userRole = 'admin';
        userName = currentUser.name || 'Admin';
    } else {
        try {
            const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
            const storedAdmin = localStorage.getItem('skydent_admin') ? JSON.parse(localStorage.getItem('skydent_admin')) : null;
            const storedDesigner = localStorage.getItem('designer') ? JSON.parse(localStorage.getItem('designer')) : null;

            if (storedUser?.userid) {
                userId = storedUser.userid;
                userRole = 'client';
                userName = storedUser.name || 'Client';
            } else if (storedAdmin?.id) {
                userId = storedAdmin.id;
                userRole = 'admin';
                userName = storedAdmin.name || 'Admin';
            } else if (storedDesigner?.desiid) {
                userId = storedDesigner.desiid;
                userRole = 'designer';
                userName = storedDesigner.name || 'Designer';
            }
        } catch (e) { }
    }

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const fileInputRef = useRef(null);
    const chatBodyRef = useRef(null);
    const chatboxRef = useRef(null);
    const textareaRef = useRef(null);
    const eventSourceRef = useRef(null);
    const lastMessageIdRef = useRef(0);
    const posRef = useRef({ x: 0, y: 0, left: 0, top: 0 });
    const recentlySentMessagesRef = useRef(new Set());

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    }, [newMessage]);

    useEffect(() => {
        if (!orderid) return;

        setMessages([]);
        setNewMessage('');
        lastMessageIdRef.current = 0;
        recentlySentMessagesRef.current.clear();

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        if (orderid && token) {
            loadChatHistory();
        }
    }, [orderid]);

    const loadChatHistory = async () => {
        try {
            const response = await fetch(`${config.API_BASE_URL}/chat/get-chat-history/${orderid}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant': 'skydent'
                }
            });

            if (!response.ok) return;

            const data = await response.json();

            if (data.status === 'success' && data.data) {
                const formatted = data.data.map(msg => {
                    const isRight = msg.user_type === 'Admin' || msg.user_type === 'Designer';

                    return {
                        id: msg.id,
                        orderid: msg.orderid,
                        text: msg.message,
                        timestamp: msg.message_date,
                        user_type: msg.user_type,
                        user_name: msg.user_name || msg.user_type,
                        alignment: isRight ? 'right' : 'left',
                        file_path: msg.file_path || null,
                        filename: msg.attachment || null,
                        hasAttachment: !!msg.file_path,
                        isAdmin: msg.user_type === 'Admin',
                        isDesigner: msg.user_type === 'Designer',
                        isClient: msg.user_type === 'Client'
                    };
                });

                setMessages(formatted);

                if (formatted.length > 0) {
                    lastMessageIdRef.current = Math.max(...formatted.map(m => m.id));
                }

                startSSEConnection();
            }
        } catch (error) {
            startSSEConnection();
        }
    };

    const formatTimestamp = (dateString) => {
        if (!dateString) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    };

    const getUserTypeForApi = () => {
        if (userRole === 'client') return 'Client';
        if (userRole === 'designer') return 'Designer';
        if (userRole === 'admin') return 'Admin';
        return 'Designer';
    };

    const startSSEConnection = () => {
        if (!orderid || !token || eventSourceRef.current) return;

        const url = `${config.API_BASE_URL}/chat/stream-chat/${orderid}?lastId=${lastMessageIdRef.current}&tenant=skydent`;

        try {
            eventSourceRef.current = new EventSource(url);

            eventSourceRef.current.onopen = () => {
                setIsConnected(true);
            };

            eventSourceRef.current.onmessage = (event) => {
                if (event.data === ': heartbeat') return;

                try {
                    const data = JSON.parse(event.data);

                    if (data.messages && Array.isArray(data.messages)) {
                        const newMessages = data.messages.map(msg => {
                            const isRight = msg.user_type === 'Admin' || msg.user_type === 'Designer';

                            return {
                                id: msg.id,
                                orderid: msg.orderid,
                                text: msg.message,
                                timestamp: formatTimestamp(msg.message_date),
                                user_type: msg.user_type,
                                user_name: msg.user_name || msg.user_type,
                                alignment: isRight ? 'right' : 'left',
                                file_path: msg.file_path || null,
                                filename: msg.attachment || null,
                                hasAttachment: !!msg.file_path,
                                isAdmin: msg.user_type === 'Admin',
                                isDesigner: msg.user_type === 'Designer',
                                isClient: msg.user_type === 'Client'
                            };
                        });

                        setMessages(prev => {
                            const existingIds = new Set(prev.map(m => m.id));
                            const unique = newMessages.filter(m => !existingIds.has(m.id));

                            if (unique.length > 0) {
                                lastMessageIdRef.current = Math.max(...unique.map(m => m.id));
                                return [...prev, ...unique];
                            }
                            return prev;
                        });
                    }
                } catch (err) { }
            };

            eventSourceRef.current.addEventListener('connected', () => {
                setIsConnected(true);
            });

            eventSourceRef.current.addEventListener('end', () => {
                eventSourceRef.current?.close();
                setIsConnected(false);
            });

            eventSourceRef.current.onerror = () => {
                setIsConnected(false);

                setTimeout(() => {
                    if (eventSourceRef.current) {
                        eventSourceRef.current.close();
                        eventSourceRef.current = null;
                    }
                    startSSEConnection();
                }, 3000);
            };

        } catch (error) {
            setIsConnected(false);
        }
    };

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    const sendMessage = async () => {
        if (!newMessage.trim() || !orderid || !userId) return;

        const messageText = newMessage.trim();

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
                    text: messageText,
                    user_type: getUserTypeForApi()
                }),
            });

            const data = await response.json();

            if (data.status === 'success') {
                lastMessageIdRef.current = data.data.id;
                setNewMessage('');
            } else {
                alert(`Failed to send message: ${data.message}`);
            }
        } catch (err) {
            alert("Network error. Please check your connection.");
        }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length || !orderid) return;

        for (const file of files) {
            const formData = new FormData();
            formData.append('orderid', orderid);
            formData.append('chatfile', file);

            const fileKey = `${file.name}_${Date.now()}`;
            recentlySentMessagesRef.current.add(fileKey);

            try {
                const res = await fetch(`${config.API_BASE_URL}/chat/chat-file`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Tenant': 'skydent'
                    },
                    body: formData
                });

                const result = await res.json();

                if (result.status !== 'success') {
                    alert(`Upload failed: ${result.message}`);
                }

                setTimeout(() => {
                    recentlySentMessagesRef.current.delete(fileKey);
                }, 5000);

            } catch (err) {
                alert("File upload failed. Please try again.");
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
            alert("File Not Found!");
            return;
        }

        try {
            const base_url = localStorage.getItem("base_url") || config.API_BASE_URL;
            const encodedPath = encodeURIComponent(url);
            const finalUrl = `${base_url}/download?path=${encodedPath}`;

            const link = document.createElement("a");
            link.href = finalUrl;
            link.target = "_blank";
            link.download = name || "download";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            alert("Error while downloading file");
        }
    };

    useEffect(() => {
        const chatbox = chatboxRef.current;
        const header = document.getElementById("chatHeader");
        if (!chatbox || !header) return;

        const mouseDownHandler = (e) => {
            posRef.current = { x: e.clientX, y: e.clientY, left: chatbox.offsetLeft, top: chatbox.offsetTop };
            document.addEventListener("mousemove", mouseMoveHandler);
            document.addEventListener("mouseup", mouseUpHandler);
        };
        const mouseMoveHandler = (e) => {
            const dx = e.clientX - posRef.current.x;
            const dy = e.clientY - posRef.current.y;
            chatbox.style.left = `${posRef.current.left + dx}px`;
            chatbox.style.top = `${posRef.current.top + dy}px`;
        };
        const mouseUpHandler = () => {
            document.removeEventListener("mousemove", mouseMoveHandler);
            document.removeEventListener("mouseup", mouseUpHandler);
        };
        header.addEventListener("mousedown", mouseDownHandler);
        return () => header.removeEventListener("mousedown", mouseDownHandler);
    }, []);

    const getUserIcon = (userType) => {
        switch (userType) {
            case 'Admin': return faCrown;
            case 'Designer': return faUserTie;
            case 'Client': return faUser;
            default: return faUser;
        }
    };

    const getMessageColor = (userType, isRight) => {
        if (userType === 'Admin') {
            return isRight
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-br-none'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-bl-none';
        } else if (userType === 'Designer') {
            return isRight
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-br-none'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-bl-none';
        } else {
            return isRight
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-br-none'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-bl-none';
        }
    };

    const getChatHeaderTitle = () => {
        if (userRole === 'client') return 'Designer Team';
        if (userRole === 'designer') return `Order: ${orderid}`;
        if (userRole === 'admin') return `Order: ${orderid}`;
        return `Chat - Order: ${orderid}`;
    };

    return (
        <section
            id="chatbox"
            ref={chatboxRef}
            style={{ position: "fixed", top: "80px", right: "24px" }}
            className="md:w-[400px] w-[300px] h-[520px] rounded-xl shadow-xl border border-blue-400/30 bg-gradient-to-br from-gray-900 to-gray-800 z-[999] hidden overflow-hidden backdrop-blur-sm"
        >
            <div id="chatHeader" className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-800/60 to-purple-800/60 rounded-t-xl border-b border-blue-400/30 cursor-move select-none">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ring-1 ring-blue-400/50 ${userRole === 'admin' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                        userRole === 'designer' ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
                            'bg-gradient-to-br from-blue-400 to-purple-500'
                        }`}>
                        <FontAwesomeIcon icon={getUserIcon(userRole === 'admin' ? 'Admin' : userRole === 'designer' ? 'Designer' : 'Client')} className="text-xs" />
                    </div>
                    <div>
                        <h4 className="text-white font-semibold text-sm bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                            {getChatHeaderTitle()}
                        </h4>
                        <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full bg-green-400`}></div>
                            <span className="text-xs text-gray-300">
                                Connected
                            </span>
                            <span className={`text-xs ${userRole === 'admin' ? 'text-purple-300' :
                                userRole === 'designer' ? 'text-green-300' :
                                    'text-blue-300'
                                } ml-1`}>
                                ({userName})
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => document.getElementById('chatbox').style.display = "none"}
                        className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-red-300 hover:bg-red-500/20 rounded"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            </div>

            <div ref={chatBodyRef} className="p-3 h-[78%] overflow-y-auto space-y-3 bg-gradient-to-br from-gray-900 to-gray-800">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400 text-sm">No messages yet. Start chatting!</p>
                        {!token && <p className="text-red-400 text-xs mt-2">No authentication token found</p>}
                    </div>
                ) : (
                    messages.map(msg => {
                        const isRight = msg.alignment === 'right';
                        const isAdmin = msg.user_type === 'Admin';
                        const isDesigner = msg.user_type === 'Designer';
                        const isClient = msg.user_type === 'Client';

                        return (
                            <div key={msg.id} className={`flex flex-col ${isRight ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] p-2 rounded-lg shadow-md ${getMessageColor(msg.user_type, isRight)}`}>
                                    <div className="flex items-center gap-1 mb-1">
                                        <FontAwesomeIcon
                                            icon={getUserIcon(msg.user_type)}
                                            className={`w-3 h-3 ${isAdmin ? 'text-yellow-300' :
                                                isDesigner ? 'text-green-300' :
                                                    'text-blue-300'
                                                }`}
                                        />
                                        <span className="text-[10px] font-semibold opacity-90">
                                            {msg.user_name || msg.user_type}
                                        </span>
                                    </div>
                                    {msg.hasAttachment && msg.file_path ? (
                                        <div className="flex items-center gap-2 p-1">
                                            <FontAwesomeIcon icon={faFile} className="text-white/70" />
                                            <span className="text-[10px] text-white/90">{msg.filename}</span>
                                            <button
                                                onClick={() => downloadFile(msg.file_path, msg.filename)}
                                                className="text-white/80 hover:text-white ml-2"
                                                title="Download file"
                                            >
                                                <FontAwesomeIcon icon={faDownload} className="text-xl hover:text-white cursor-pointer" />
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-xs whitespace-pre-wrap">{msg.text}</p>
                                    )}
                                </div>
                                <span className={`text-[10px] mt-1 px-1 ${isAdmin ? 'text-purple-200' :
                                    isDesigner ? 'text-green-200' :
                                        'text-blue-200'
                                    }`}>
                                    {msg.timestamp}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 border-t border-blue-400/20 px-3 py-2 bg-gradient-to-r from-gray-800 to-gray-700 rounded-b-xl">
                <div className="flex items-start gap-1.5">
                    <input ref={fileInputRef} type="file" onChange={handleFileUpload} multiple className="hidden" />
                    <button
                        onClick={triggerFileInput}
                        disabled={!orderid || !token}
                        className="w-10 h-10 flex items-center justify-center text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded disabled:opacity-50"
                        title="Attach file"
                    >
                        <FontAwesomeIcon icon={faPaperclip} className='text-[20px]' />
                    </button>
                    <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={!token ? "Not authenticated" : !orderid ? "Select an order to chat" : "Type a message..."}
                        className="flex-1 bg-gray-700/80 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 border border-gray-600 disabled:opacity-50 resize-none"
                        disabled={!orderid || !token}
                        rows="1"
                        style={{
                            minHeight: '40px',
                            maxHeight: '120px',
                            overflowY: 'auto'
                        }}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || !orderid}
                        className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200 cursor-pointer shadow-md hover:shadow-blue-500/20 text-xs disabled:opacity-50 disabled:cursor-not-allowed "
                    >
                        <FontAwesomeIcon icon={faPaperPlane} className='text-lg' />
                    </button>
                </div>
            </div>
        </section>
    );
}