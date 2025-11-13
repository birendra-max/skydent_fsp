import { useState, useRef, useEffect, useContext } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUser, faTimes, faFile, faPaperclip, faPaperPlane, faDownload
} from "@fortawesome/free-solid-svg-icons";
import { UserContext } from '../Context/UserContext';
import { DesignerContext } from '../Context/DesignerContext';
import config from '../config';

export default function Chatbox({ orderid }) {
    const token = localStorage.getItem('token');

    const userCtx = useContext(UserContext);
    const designerCtx = useContext(DesignerContext);

    // Detect user role and ID
    let currentUser = null, userId = null, userRole = null;
    if (userCtx?.user) {
        currentUser = userCtx.user;
        userId = currentUser.userid;
        userRole = 'client';
    } else if (designerCtx?.designer) {
        currentUser = designerCtx.designer;
        userId = currentUser.desiid;
        userRole = 'designer';
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

    // Track recently sent messages to avoid duplicates
    const recentlySentMessagesRef = useRef(new Set());

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    }, [newMessage]);

    // Reset messages when order changes
    useEffect(() => {
        setMessages([]);
        setNewMessage('');
        lastMessageIdRef.current = 0;
        recentlySentMessagesRef.current.clear();

        // Close existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        // Load chat history when order changes
        if (orderid && token) {
            loadChatHistory();
        }
    }, [orderid]);

    // Load initial chat history
    const loadChatHistory = async () => {
        try {
            const response = await fetch(`${config.API_BASE_URL}/chat/get-chat-history/${orderid}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant': 'skydent' }
            });
            const data = await response.json();

            if (data.status === 'success' && data.data) {
                const formatted = data.data.map(msg => {
                    const isClient = msg.user_type === 'Client';
                    const isDesigner = msg.user_type === 'Designer';
                    const showRight = (userRole === 'client' && isClient) || (userRole === 'designer' && isDesigner);

                    return {
                        id: msg.id,
                        orderid: msg.orderid,
                        text: msg.message,
                        timestamp: formatTimestamp(msg.message_date),
                        user_type: msg.user_type,
                        alignment: showRight ? 'right' : 'left',
                        file_path: msg.file_path || null,
                        filename: msg.attachment || null,
                        hasAttachment: !!msg.file_path
                    };
                });

                setMessages(formatted);

                // Set the last message ID for SSE
                if (formatted.length > 0) {
                    lastMessageIdRef.current = Math.max(...formatted.map(m => m.id));
                }

                // Start SSE connection after loading history
                startSSEConnection();
            }
        } catch (error) {
            console.error("❌ Failed to load chat history:", error);
            startSSEConnection(); // Still try to connect to SSE
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

    // Start SSE connection
    const startSSEConnection = () => {
        if (!orderid || !token || eventSourceRef.current) return;

        // const url = `${config.API_BASE_URL}/chat/stream-chat/${orderid}?lastId=${lastMessageIdRef.current}`;
        const url = `${config.API_BASE_URL}/chat/stream-chat/${orderid}?lastId=${lastMessageIdRef.current}&tenant=skydent`;


        try {
            eventSourceRef.current = new EventSource(url);

            eventSourceRef.current.onopen = () => {
                console.log("✅ SSE connection opened");
                setIsConnected(true);
            };

            eventSourceRef.current.onmessage = (event) => {
                // Skip heartbeat messages
                if (event.data === ': heartbeat') return;

                try {
                    const data = JSON.parse(event.data);

                    if (data.messages && Array.isArray(data.messages)) {
                        const newMessages = data.messages.map(msg => {
                            const isClient = msg.user_type === 'Client';
                            const isDesigner = msg.user_type === 'Designer';
                            const showRight = (userRole === 'client' && isClient) || (userRole === 'designer' && isDesigner);

                            return {
                                id: msg.id,
                                orderid: msg.orderid,
                                text: msg.message,
                                timestamp: formatTimestamp(msg.message_date),
                                user_type: msg.user_type,
                                alignment: showRight ? 'right' : 'left',
                                file_path: msg.file_path || null,
                                filename: msg.attachment || null,
                                hasAttachment: !!msg.file_path
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
                } catch (err) {
                    console.error("❌ SSE parse error:", err);
                }
            };

            eventSourceRef.current.addEventListener('connected', (event) => {
                console.log("✅ SSE connected event received");
                setIsConnected(true);
            });

            eventSourceRef.current.addEventListener('end', (event) => {
                console.log("🔚 SSE stream ended");
                eventSourceRef.current?.close();
                setIsConnected(false);
            });

            eventSourceRef.current.onerror = (err) => {
                console.error("❌ SSE error:", err);
                setIsConnected(false);

                // Attempt to reconnect after 3 seconds
                setTimeout(() => {
                    if (eventSourceRef.current) {
                        eventSourceRef.current.close();
                        eventSourceRef.current = null;
                    }
                    startSSEConnection();
                }, 3000);
            };

        } catch (error) {
            console.error("❌ Failed to create SSE connection:", error);
            setIsConnected(false);
        }
    };

    // Auto-scroll on new messages
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    // Send message (text) - FIXED: No optimistic updates to avoid duplicates
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
                    user_type: userRole === "client" ? "Client" : "Designer"
                }),
            });

            const data = await response.json();

            if (data.status === 'success') {
                lastMessageIdRef.current = data.data.id;   // <-- FIX
            }

            setNewMessage('');
        } catch (err) {
            console.error(err);
            setNewMessage('');
        }
    };


    // File upload - FIXED: No optimistic updates to avoid duplicates
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !orderid) return;

        const formData = new FormData();
        formData.append('orderid', orderid);
        formData.append('chatfile', file);

        // Create a unique identifier for this file upload to track duplicates
        const fileKey = `${file.name}_${Date.now()}`;
        recentlySentMessagesRef.current.add(fileKey);

        fetch(`${config.API_BASE_URL}/chat/chat-file`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant': 'skydent' },
            body: formData
        })
            .then(res => res.json())
            .then(res => {
                if (res.status !== 'success') {
                    console.error("❌ Upload failed:", res.message);
                }

                // Clear file input
                e.target.value = '';

                // Remove the file key after some time
                setTimeout(() => {
                    recentlySentMessagesRef.current.delete(fileKey);
                }, 5000);
            })
            .catch(err => {
                console.error("❌ File upload error:", err);
                e.target.value = ''; // Still clear input on error
            });
    };

    const triggerFileInput = () => fileInputRef.current?.click();

    // Updated handleKeyDown for textarea
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
        // Allow Shift+Enter for new line
    };

    const downloadFile = (url, name) => {
        if (!url) {
            alert('File Not Found!');
            return;
        }

        try {
            const parts = url.split('/');
            const encodedFile = encodeURIComponent(parts.pop());
            const encodedUrl = parts.join('/') + '/' + encodedFile;
            const link = document.createElement('a');
            link.href = encodedUrl;
            link.download = name || 'download';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            alert('⚠️ Error while downloading file:', error);
        }
    };


    // Draggable chatbox
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

    return (
        <section
            id="chatbox"
            ref={chatboxRef}
            style={{ position: "fixed", top: "80px", right: "24px" }}
            className="md:w-[320px] w-[300px] h-[420px] rounded-xl shadow-xl border border-blue-400/30 bg-gradient-to-br from-gray-900 to-gray-800 z-[999] hidden overflow-hidden backdrop-blur-sm"
        >
            {/* Header */}
            <div id="chatHeader" className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-800/60 to-purple-800/60 rounded-t-xl border-b border-blue-400/30 cursor-move select-none">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ring-1 ring-blue-400/50">
                        <FontAwesomeIcon icon={faUser} className="text-xs" />
                    </div>
                    <div>
                        <h4 className="text-white font-semibold text-sm bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                            {userRole === 'client' ? 'Designer Team' : orderid}
                        </h4>
                        <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <span className="text-xs text-gray-300">
                                {isConnected ? 'Connected' : 'Connecting...'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {/* <button className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-green-300 hover:bg-green-500/20 rounded">
                        <FontAwesomeIcon icon={faVideo} />
                    </button> */}
                    <button
                        onClick={() => document.getElementById('chatbox').style.display = "none"}
                        className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-red-300 hover:bg-red-500/20 rounded"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div ref={chatBodyRef} className="p-3 h-72 overflow-y-auto space-y-3 bg-gradient-to-br from-gray-900 to-gray-800">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400 text-sm">No messages yet. Start chatting!</p>
                    </div>
                ) : (
                    messages.map(msg => {
                        const isRight = msg.alignment === 'right';
                        return (
                            <div key={msg.id} className={`flex flex-col ${isRight ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] p-2 rounded-lg shadow-md ${isRight
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-br-none'
                                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-bl-none'
                                    }`}>
                                    {msg.hasAttachment && msg.file_path ? (
                                        <div className="flex items-center gap-2 p-1">
                                            <FontAwesomeIcon icon={faFile} className="text-blue-200" />
                                            <span className="text-[10px] text-white/90">{msg.filename}</span>
                                            <button
                                                onClick={() => downloadFile(msg.file_path, msg.filename)}
                                                className="text-green-300 hover:text-green-200 ml-2"
                                                title="Download file"
                                            >
                                                <FontAwesomeIcon icon={faDownload} className="text-lg" />
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-xs whitespace-pre-wrap">{msg.text}</p>
                                    )}
                                </div>
                                <span className={`text-[10px] mt-1 px-1 ${isRight ? 'text-green-100' : 'text-blue-100'}`}>
                                    {msg.timestamp}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-blue-400/20 px-3 py-2 bg-gradient-to-r from-gray-800 to-gray-700 rounded-b-xl">
                <div className="flex items-start gap-1.5">
                    <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
                    <button
                        onClick={triggerFileInput}
                        disabled={!orderid}
                        className="w-7 h-7 flex items-center justify-center text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded disabled:opacity-50 mt-1"
                    >
                        <FontAwesomeIcon icon={faPaperclip} />
                    </button>
                    <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={orderid ? "Type a message..." : "Select an order to chat"}
                        className="flex-1 bg-gray-700/80 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 border border-gray-600 disabled:opacity-50 resize-none"
                        disabled={!orderid}
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
                        <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                </div>
            </div>
        </section>
    );
}