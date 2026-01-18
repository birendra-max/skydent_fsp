import { useContext, useState, useRef, useEffect } from "react";
import Hd from "./Hd";
import Foot from "./Foot";
import { ThemeContext } from "../../Context/ThemeContext";
import { DesignerContext } from "../../Context/DesignerContext";

export default function NewRequest() {
  const { theme } = useContext(ThemeContext);
  const { designer } = useContext(DesignerContext);
  const [files, setFiles] = useState([]);
  const [drag, setDragActive] = useState(false);
  const [orderSelection, setOrderSelection] = useState({});
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const token = localStorage.getItem('skydent_designer_token');
  let base_url = localStorage.getItem('skydent_designer_base_url');
  const uploadControllers = useRef({});
  const uploadQueue = useRef([]);

  useEffect(() => {
    const errorFiles = files.filter(f => f.isError);
    if (errorFiles.length > 0) {
      const timer = setTimeout(() => {
        setFiles(prev => prev.filter(f => !f.isError));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [files]);

  useEffect(() => {
    if (uploadQueue.current.length > 0 && !isProcessingQueue) {
      processUploadQueue();
    }
  }, [files, isProcessingQueue]);

  const hasRealFiles = () => {
    return files.some(file => !file.isError);
  };

  const handleFiles = async (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);

    const validFiles = fileArray.filter((file) =>
      file.name.endsWith(".zip") || file.name.endsWith(".stl")
    );

    const invalidFiles = fileArray.filter((file) =>
      !(file.name.endsWith(".zip") || file.name.endsWith(".stl"))
    );

    if (validFiles.length > 0) {
      validFiles.forEach((file) => {
        const fileId = `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setFiles((prev) => [
          ...prev.filter(f => !f.isError),
          {
            id: fileId,
            fileName: file.name,
            progress: 0,
            uploadStatus: "Queued",
            message: "Waiting in queue...",
            file: file,
            matchingOrders: null,
            showOrderSelection: false,
            fileSize: file.size,
            isUploading: false,
            currentUploadIndex: 0,
            totalUploads: 0
          },
        ]);

        uploadQueue.current.push({
          fileId,
          file,
          status: 'pending'
        });
      });
    }

    if (invalidFiles.length > 0) {
      const errorId = `error-${Date.now()}`;
      setFiles(prev => [
        ...prev.filter(f => !f.isError),
        {
          id: errorId,
          fileName: `Invalid files detected (${invalidFiles.length})`,
          progress: 0,
          uploadStatus: "Error",
          message: `Only .zip or .stl files are allowed! Skipped: ${invalidFiles.map(f => f.name).join(', ')}`,
          isError: true,
          isUploading: false,
        },
      ]);
    }
  };

  const processUploadQueue = async () => {
    if (isProcessingQueue || uploadQueue.current.length === 0) return;

    setIsProcessingQueue(true);
    
    const nextUpload = uploadQueue.current.find(item => item.status === 'pending');
    
    if (!nextUpload) {
      setIsProcessingQueue(false);
      return;
    }

    nextUpload.status = 'processing';
    
    setFiles((prev) =>
      prev.map((f) =>
        f.id === nextUpload.fileId
          ? {
            ...f,
            uploadStatus: "Starting...",
            message: "Starting upload...",
            isUploading: true
          }
          : f
      )
    );

    await uploadFile(nextUpload.file, nextUpload.fileId);
    
    nextUpload.status = 'completed';
    
    setTimeout(() => {
      setIsProcessingQueue(false);
      if (uploadQueue.current.some(item => item.status === 'pending')) {
        processUploadQueue();
      }
    }, 1000);
  };

  const uploadFile = async (file, fileId, selectedOrderIds = null) => {
    const controller = new AbortController();
    uploadControllers.current[fileId] = controller;

    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? {
            ...f,
            uploadStatus: "Uploading...",
            progress: 0,
            showOrderSelection: false,
            message: "Preparing upload...",
            isUploading: true,
            currentUploadIndex: 0,
            totalUploads: selectedOrderIds ? selectedOrderIds.length : 1
          }
          : f
      )
    );

    if (selectedOrderIds && selectedOrderIds.length > 0) {
      await uploadToOrderFileEndpoint(file, fileId, selectedOrderIds, controller);
    } else {
      await uploadToNewOrdersEndpoint(file, fileId, controller);
    }
  };

  const uploadToNewOrdersEndpoint = async (file, fileId, controller) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append('desiid', designer.desiid);

    try {
      const xhr = new XMLHttpRequest();
      xhr.timeout = 0;

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const uploadProgress = Math.round((event.loaded / event.total) * 100);
          const uploadedMB = (event.loaded / (1024 * 1024)).toFixed(2);
          const totalMB = (event.total / (1024 * 1024)).toFixed(2);

          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                  ...f,
                  progress: uploadProgress,
                  message: `Uploading: ${uploadedMB}MB / ${totalMB}MB (${uploadProgress}%)`,
                  uploadStatus: "Uploading..."
                }
                : f
            )
          );
        }
      });

      xhr.addEventListener('load', () => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                ...f,
                progress: 100,
                uploadStatus: "Processing...",
                message: "File upload complete, processing response..."
              }
              : f
          )
        );

        try {
          const result = JSON.parse(xhr.responseText);

          if (result.status === "success") {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileId
                  ? {
                    ...f,
                    uploadStatus: "Success",
                    message: result.message || "File uploaded successfully",
                    fileLink: result.file_link || "",
                    isUploading: false
                  }
                  : f
              )
            );
          } else if (result.status === "multiple" && result.matches) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileId
                  ? {
                    ...f,
                    uploadStatus: "Multiple Orders Found",
                    message: result.message,
                    matchingOrders: result.matches,
                    showOrderSelection: true,
                    isUploading: false
                  }
                  : f
              )
            );
          } else {
            throw new Error(result.message || "Upload failed");
          }
        } catch (error) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                  ...f,
                  uploadStatus: "Failed",
                  message: error.message || "Error processing upload",
                  isUploading: false
                }
                : f
            )
          );
        }
      });

      xhr.addEventListener('error', () => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                ...f,
                uploadStatus: "Failed",
                progress: 0,
                message: "Network error. Please check your connection.",
                isUploading: false
              }
              : f
          )
        );
      });

      xhr.addEventListener('abort', () => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                ...f,
                uploadStatus: "Cancelled",
                progress: 0,
                message: "Upload cancelled",
                isUploading: false
              }
              : f
          )
        );
      });

      xhr.open('POST', `${base_url}/new-orders`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('X-Tenant', 'skydent');
      xhr.send(formData);

      controller.xhr = xhr;

    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
              ...f,
              uploadStatus: "Failed",
              progress: 0,
              message: error.message || "Error starting upload",
              isUploading: false
            }
            : f
        )
      );
    } finally {
      delete uploadControllers.current[fileId];
    }
  };

  const uploadToOrderFileEndpoint = async (file, fileId, selectedOrderIds, controller) => {
    try {
      const totalOrders = selectedOrderIds.length;
      
      for (let index = 0; index < selectedOrderIds.length; index++) {
        const orderId = selectedOrderIds[index];
        
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                ...f,
                progress: 0,
                currentUploadIndex: index + 1,
                message: `Starting upload to order ${index + 1}/${totalOrders}...`
              }
              : f
          )
        );

        const result = await uploadSingleOrderFile(file, orderId, fileId, controller);
        
        if (result.status !== "success") {
          throw new Error(`Failed to upload to order ${orderId}: ${result.message}`);
        }
        
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                ...f,
                progress: 100,
                message: `Order ${index + 1}/${totalOrders} uploaded successfully`
              }
              : f
          )
        );
        
        if (index < selectedOrderIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
              ...f,
              uploadStatus: "Success",
              progress: 100,
              message: `File uploaded successfully to ${totalOrders} order(s)`,
              isUploading: false
            }
            : f
        )
      );
    } catch (error) {
      if (error.message === "Cancelled") {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                ...f,
                uploadStatus: "Cancelled",
                progress: 0,
                message: "Upload cancelled by user",
                isUploading: false,
                currentUploadIndex: 0,
                totalUploads: 0
              }
              : f
          )
        );
      } else {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                ...f,
                uploadStatus: "Failed",
                progress: 100,
                message: error.message || "Error uploading file to selected orders",
                isUploading: false
              }
              : f
          )
        );
      }
    } finally {
      delete uploadControllers.current[fileId];
    }
  };

  const uploadSingleOrderFile = (file, orderId, fileId, controller) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orderid", orderId);
      formData.append('desiid', designer.desiid);
      
      const fileType = file.name.endsWith('.stl') ? 'stl' : 'finished';
      formData.append("type", fileType);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const uploadProgress = Math.round((event.loaded / event.total) * 100);
          const uploadedMB = (event.loaded / (1024 * 1024)).toFixed(2);
          const totalMB = (event.total / (1024 * 1024)).toFixed(2);

          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                  ...f,
                  progress: uploadProgress,
                  message: `Order ${f.currentUploadIndex}/${f.totalUploads}: Uploading ${uploadedMB}MB / ${totalMB}MB (${uploadProgress}%)`
                }
                : f
            )
          );
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error("Network error"));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error("Cancelled"));
      });

      xhr.open('POST', `${base_url}/upload-order-file`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('X-Tenant', 'skydent');
      xhr.timeout = 0;
      xhr.send(formData);

      controller.xhr = xhr;
    });
  };

  const handleOrderSelection = (fileId, orderId, isChecked) => {
    setOrderSelection(prev => {
      const currentSelection = prev[fileId] || { selectedOrders: [] };
      let updatedSelectedOrders;

      if (isChecked) {
        updatedSelectedOrders = [...currentSelection.selectedOrders, orderId];
      } else {
        updatedSelectedOrders = currentSelection.selectedOrders.filter(id => id !== orderId);
      }

      return {
        ...prev,
        [fileId]: {
          ...currentSelection,
          selectedOrders: updatedSelectedOrders
        }
      };
    });
  };

  const confirmOrderSelection = (file) => {
    const selection = orderSelection[file.id];
    if (!selection || selection.selectedOrders.length === 0) {
      setFiles(prev =>
        prev.map(f =>
          f.id === file.id
            ? { ...f, message: "Please select at least one order" }
            : f
        )
      );
      return;
    }

    setFiles((prev) =>
      prev.map((f) =>
        f.id === file.id
          ? {
            ...f,
            uploadStatus: "Uploading...",
            progress: 0,
            showOrderSelection: false,
            message: `Starting upload to ${selection.selectedOrders.length} order(s)...`,
            isUploading: true,
            currentUploadIndex: 0,
            totalUploads: selection.selectedOrders.length
          }
          : f
      )
    );

    uploadFile(file.file, file.id, selection.selectedOrders);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const resetPage = () => {
    Object.values(uploadControllers.current).forEach(controller => {
      if (controller.abort) controller.abort();
      if (controller.xhr) controller.xhr.abort();
    });
    uploadControllers.current = {};
    
    uploadQueue.current = [];
    setIsProcessingQueue(false);

    setFiles([]);
    setOrderSelection({});
  };

  const cancelUpload = (fileId) => {
    const controller = uploadControllers.current[fileId];
    if (controller) {
      if (controller.abort) controller.abort();
      if (controller.xhr) controller.xhr.abort();
      delete uploadControllers.current[fileId];
    }
    
    uploadQueue.current = uploadQueue.current.filter(item => item.fileId !== fileId);
    
    setFiles(prev =>
      prev.map(f =>
        f.id === fileId
          ? {
            ...f,
            uploadStatus: "Cancelled",
            progress: 0,
            message: "Upload cancelled",
            isUploading: false
          }
          : f
      )
    );

    if (!isProcessingQueue) {
      processUploadQueue();
    }
  };

  const getCardClass = () => {
    return theme === 'light'
      ? 'bg-white border-gray-200'
      : 'bg-gray-800 border-gray-700';
  };

  const getUploadAreaClass = () => {
    const baseClass = "border-3 min-h-[75vh] flex justify-center items-center flex-col border-dashed rounded-2xl p-12 text-center transition-all duration-200";

    if (theme === 'light') {
      return drag
        ? `${baseClass} border-blue-500 bg-blue-50 scale-[1.02] text-gray-900`
        : `${baseClass} border-gray-300 hover:border-blue-400 hover:bg-blue-25 text-gray-900`;
    } else {
      return drag
        ? `${baseClass} border-blue-500 bg-blue-900/20 scale-[1.02] text-white`
        : `${baseClass} border-gray-600 hover:border-blue-400 hover:bg-gray-800 text-white`;
    }
  };

  const getTableContainerClass = () => {
    return theme === 'light'
      ? 'bg-gray-50 border-gray-200'
      : 'bg-gray-800 border-gray-700';
  };

  const getTableHeaderClass = () => {
    return theme === 'light'
      ? 'text-gray-700 bg-gray-100'
      : 'text-gray-300 bg-gray-700';
  };

  const getTableRowClass = () => {
    return theme === 'light'
      ? 'hover:bg-white text-gray-900'
      : 'hover:bg-gray-700 text-white';
  };

  const ProgressBar = ({ file }) => {
    const getBarStyle = () => {
      switch (file.uploadStatus) {
        case "Success":
          return "from-green-500 to-green-400";
        case "Failed":
        case "Error":
        case "Cancelled":
          return "from-red-500 to-red-400";
        case "Multiple Orders Found":
          return "from-yellow-500 to-yellow-400";
        case "Uploading...":
        case "Processing...":
          return file.totalUploads > 1 
            ? "from-purple-600 to-purple-400" 
            : "from-blue-600 to-blue-400";
        case "Queued":
        case "Starting...":
          return "from-gray-400 to-gray-300";
        default:
          return "from-gray-400 to-gray-300";
      }
    };

    return (
      <div className="w-full max-w-xs">
        <div className="flex items-center gap-4">
          <div
            className={`relative flex-1 h-3 rounded-full overflow-hidden ${theme === "light" ? "bg-gray-200" : "bg-gray-700"
              }`}
          >
            <div
              className={`
              h-full rounded-full
              bg-gradient-to-r ${getBarStyle()}
              transition-all duration-300 ease-out
              ${file.uploadStatus === "Uploading..." || file.uploadStatus === "Processing..."
                  ? file.totalUploads > 1 
                    ? "shadow-[0_0_10px_rgba(168,85,247,0.7)]" 
                    : "shadow-[0_0_10px_rgba(59,130,246,0.7)]"
                  : ""
                }
            `}
              style={{ width: `${file.progress}%` }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-semibold min-w-[50px] text-right ${theme === "light" ? "text-gray-800" : "text-gray-200"
                }`}
            >
              {Math.round(file.progress)}%
            </span>
          </div>
        </div>

        {file.message && (
          <div
            className={`mt-1 text-xs ${theme === "light" ? "text-gray-600" : "text-gray-400"
              }`}
          >
            {file.message}
          </div>
        )}
      </div>
    );
  };

  const OrderSelection = ({ file }) => {
    const selection = orderSelection[file.id] || { selectedOrders: [] };

    return (
      <div className={`mt-3 p-4 rounded-lg border ${theme === 'light' ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-900/20 border-yellow-700'}`}>
        <div className="flex items-center mb-3">
          <svg className={`w-5 h-5 mr-2 ${theme === 'light' ? 'text-yellow-600' : 'text-yellow-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className={`font-semibold ${theme === 'light' ? 'text-yellow-700' : 'text-yellow-300'}`}>
            Multiple orders found for this file
          </span>
        </div>

        <p className={`text-sm mb-4 ${theme === 'light' ? 'text-yellow-600' : 'text-yellow-400'}`}>
          Please select which orders you want to update with this file:
        </p>

        <div className="space-y-2 mb-4">
          {file.matchingOrders && file.matchingOrders.map((order) => (
            <label key={order.orderid} className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${theme === 'light'
              ? 'bg-white border-gray-200 hover:bg-gray-50'
              : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
              }`}>
              <input
                type="checkbox"
                checked={selection.selectedOrders.includes(order.orderid)}
                onChange={(e) => handleOrderSelection(file.id, order.orderid, e.target.checked)}
                className={`w-4 h-4 rounded ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}
              />
              <div className="flex-1">
                <div className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  Order ID: {order.orderid}
                </div>
                {order.fname && (
                  <div className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    File: {order.fname}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <span className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            {selection.selectedOrders.length} order(s) selected
          </span>
          <button
            onClick={() => confirmOrderSelection(file)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${theme === 'light'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-700 hover:bg-blue-600 text-white'
              }`}
          >
            Confirm Selection
          </button>
        </div>
      </div>
    );
  };

  const StatusBadge = ({ status, message, fileLink, file, showOrderSelection }) => {
    const getStatusColor = () => {
      if (status === "Success") {
        return theme === 'light'
          ? "bg-green-100 text-green-800 border-green-200"
          : "bg-green-900/30 text-green-400 border-green-800";
      }
      if (status === "Failed" || status === "Error" || status === "Cancelled") {
        return theme === 'light'
          ? "bg-red-100 text-red-800 border-red-200"
          : "bg-red-900/30 text-red-400 border-red-800";
      }
      if (status === "Uploading...") {
        return theme === 'light'
          ? "bg-blue-100 text-blue-800 border-blue-200"
          : "bg-blue-900/30 text-blue-400 border-blue-800";
      }
      if (status === "Processing...") {
        return theme === 'light'
          ? "bg-purple-100 text-purple-800 border-purple-200"
          : "bg-purple-900/30 text-purple-400 border-purple-800";
      }
      if (status === "Multiple Orders Found") {
        return theme === 'light'
          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
          : "bg-yellow-900/30 text-yellow-400 border-yellow-800";
      }
      if (status === "Queued" || status === "Starting...") {
        return theme === 'light'
          ? "bg-gray-100 text-gray-800 border-gray-200"
          : "bg-gray-800 text-gray-400 border-gray-700";
      }
      return theme === 'light'
        ? "bg-gray-100 text-gray-800 border-gray-200"
        : "bg-gray-800 text-gray-400 border-gray-700";
    };

    return (
      <div className="flex flex-col space-y-2">
        <div className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium border ${getStatusColor()}`}>
          <span>{status}</span>
        </div>

        {(status === "Failed" || status === "Error" || status === "Cancelled") && message && (
          <div className={`flex items-start space-x-2 text-xs px-3 py-2 rounded-lg border ${theme === 'light'
            ? 'text-red-600 bg-red-50 border-red-200'
            : 'text-red-400 bg-red-900/20 border-red-700'
            }`}>
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="flex-1">{message}</span>
          </div>
        )}

        {status === "Multiple Orders Found" && showOrderSelection && file.matchingOrders && (
          <OrderSelection file={file} />
        )}

        {status === "Success" && fileLink && (
          <a
            href={fileLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center space-x-2 text-xs px-3 py-2 rounded-lg border ${theme === 'light'
              ? 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100'
              : 'text-green-400 bg-green-900/20 border-green-700 hover:bg-green-900/30'
              } transition-colors`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>View File</span>
          </a>
        )}

        {(status === "Uploading..." || status === "Processing..." || status === "Queued" || status === "Starting...") && (
          <button
            onClick={() => cancelUpload(file.id)}
            className={`text-xs px-3 py-1 rounded border ${theme === 'light'
              ? 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100'
              : 'text-red-400 bg-red-900/20 border-red-700 hover:bg-red-900/30'
              } transition-colors`}
          >
            Cancel Upload
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <Hd />
      <main id="main" className={`flex-grow px-4 transition-colors duration-300 ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'} pt-16 sm:pt-18`}>
        <section className={theme === 'light' ? 'bg-gray-50' : 'bg-black'}>
          <div className="max-w-full mx-auto mt-4">
            <div className={`rounded-xl shadow-sm border ${getCardClass()}`}>
              {!hasRealFiles() && (
                <div className="p-6">
                  <div
                    className={getUploadAreaClass()}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragActive(true);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragActive(false);
                    }}
                    onDrop={handleDrop}
                  >
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-blue-100' : 'bg-blue-900/20'}`}>
                      <svg className={`w-10 h-10 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      {drag ? "Drop files to upload" : "Upload Order Files"}
                    </h3>
                    <p className={`mb-6 max-w-md mx-auto ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                      Drag and drop your files here or click the button below. Supported formats: .zip or .stl
                    </p>
                    <label className={`inline-flex items-center px-8 py-3 font-semibold rounded-lg shadow-sm cursor-pointer transition-colors ${theme === 'light'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-700 hover:bg-blue-600 text-white'
                      }`}>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Choose Files
                      <input
                        type="file"
                        accept=".zip,.stl"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                      />
                    </label>
                  </div>
                </div>
              )}

              {hasRealFiles() && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Uploaded Files</h2>

                    <button
                      onClick={resetPage}
                      className={`
                        inline-flex items-center gap-2 px-5 py-2.5
                        rounded-xl font-semibold text-sm
                        transition-all duration-300
                        shadow-md hover:shadow-lg active:scale-95
                        ${theme === "light"
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600"
                          : "bg-gradient-to-r from-blue-700 to-blue-600 text-white hover:from-blue-600 hover:to-blue-500"
                        }
                      `}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Upload New Files
                    </button>
                  </div>

                  <div className={`rounded-lg border ${getTableContainerClass()}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={`border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
                            <th className={`px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider ${getTableHeaderClass()}`}>
                              FILE NAME
                            </th>
                            <th className={`px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider ${getTableHeaderClass()}`}>
                              PROGRESS
                            </th>
                            <th className={`px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider ${getTableHeaderClass()}`}>
                              STATUS
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'}`}>
                          {files
                            .filter(file => !file.isError)
                            .map((file) => (
                              <tr key={file.id} className={getTableRowClass()}>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-2 h-2 rounded-full ${file.uploadStatus === "Success" ? "bg-green-500" :
                                      file.uploadStatus === "Failed" || file.uploadStatus === "Cancelled" ? "bg-red-500" :
                                        file.uploadStatus === "Uploading..." ? 
                                          file.totalUploads > 1 ? "bg-purple-500" : "bg-blue-500" :
                                        file.uploadStatus === "Processing..." ? "bg-purple-500" :
                                        file.uploadStatus === "Error" ? "bg-red-500" :
                                        file.uploadStatus === "Multiple Orders Found" ? "bg-yellow-500" :
                                        file.uploadStatus === "Queued" || file.uploadStatus === "Starting..." ? "bg-gray-400" :
                                          "bg-gray-400"
                                      }`}></div>
                                    <span className="text-sm font-medium truncate max-w-xs">
                                      {file.fileName}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <ProgressBar file={file} />
                                </td>
                                <td className="px-6 py-4">
                                  <StatusBadge
                                    status={file.uploadStatus}
                                    message={file.message}
                                    fileLink={file.fileLink}
                                    file={file}
                                    showOrderSelection={file.showOrderSelection}
                                  />
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Foot />
    </>
  );
}