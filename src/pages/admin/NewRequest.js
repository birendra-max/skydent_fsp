import { useContext, useState, useRef } from "react";
import Hd from "./Hd";
import Foot from "./Foot";
import { ThemeContext } from "../../Context/ThemeContext";

export default function NewRequest() {
  const { theme } = useContext(ThemeContext);
  const [files, setFiles] = useState([]);
  const [drag, setDragActive] = useState(false);
  const [orderSelection, setOrderSelection] = useState({});
  let base_url = localStorage.getItem('bravo_admin_base_url');
  const progressIntervalRefs = useRef({});

  const handleFiles = async (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const validFiles = fileArray.filter((file) =>
      file.name.endsWith(".zip") || file.name.endsWith(".stl")
    );

    if (validFiles.length !== fileArray.length) {
      setFiles(prev => [...prev, {
        fileName: "Invalid files detected",
        progress: 0,
        uploadStatus: "Error",
        message: "Only .zip or .stl files are allowed!",
        isError: true
      }]);

      setTimeout(() => {
        setFiles(prev => prev.filter(f => !f.isError));
      }, 3000);
      return;
    }

    validFiles.forEach((file) => {
      setFiles((prev) => [
        ...prev,
        {
          fileName: file.name,
          progress: 0,
          uploadStatus: "Waiting...",
          message: "",
          file: file,
          matchingOrders: null,
          showOrderSelection: false,
          fileSize: file.size,
        },
      ]);
      uploadFile(file);
    });
  };

  const simulateProgress = (fileName) => {
    if (progressIntervalRefs.current[fileName]) {
      clearInterval(progressIntervalRefs.current[fileName]);
    }

    progressIntervalRefs.current[fileName] = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.fileName === fileName && f.progress < 95 && f.uploadStatus === "Uploading...") {
            let speed;
            if (f.progress < 70) {
              speed = 2.5;
            } else if (f.progress < 90) {
              speed = 1.2;
            } else {
              speed = 0.5;
            }

            // Add small randomness
            const randomFactor = 0.9 + Math.random() * 0.2;
            const increment = speed * randomFactor;

            return {
              ...f,
              progress: Math.min(f.progress + increment, 95),
              message: `Uploading... ${Math.round(f.progress + increment)}%`
            };
          }
          return f;
        })
      );
    }, 300);
  };

  const uploadFile = async (file, selectedOrderIds = null) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.fileName === file.name
          ? {
            ...f,
            uploadStatus: "Uploading...",
            progress: 5,
            showOrderSelection: false,
            message: "Starting upload..."
          }
          : f
      )
    );

    simulateProgress(file.name);
    if (selectedOrderIds && selectedOrderIds.length > 0) {
      await uploadToOrderFileEndpoint(file, selectedOrderIds);
    } else {
      await uploadToNewOrdersEndpoint(file);
    }
  };

  const uploadToNewOrdersEndpoint = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${base_url}/new-orders`, {
        method: "POST",
        headers: {
          'X-Tenant': 'skydent'
        },
        body: formData,
      });

      const result = await response.json();

      if (progressIntervalRefs.current[file.name]) {
        clearInterval(progressIntervalRefs.current[file.name]);
        delete progressIntervalRefs.current[file.name];
      }

      if (result.status === "success") {
        setFiles((prev) =>
          prev.map((f) =>
            f.fileName === file.name
              ? {
                ...f,
                uploadStatus: "Success",
                progress: 100,
                message: result.message || "File uploaded successfully",
                fileLink: result.file_link || ""
              }
              : f
          )
        );
      } else if (result.status === "multiple" && result.matches) {
        setFiles((prev) =>
          prev.map((f) =>
            f.fileName === file.name
              ? {
                ...f,
                uploadStatus: "Multiple Orders Found",
                progress: 100,
                message: result.message,
                matchingOrders: result.matches,
                showOrderSelection: true
              }
              : f
          )
        );
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      if (progressIntervalRefs.current[file.name]) {
        clearInterval(progressIntervalRefs.current[file.name]);
        delete progressIntervalRefs.current[file.name];
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.fileName === file.name
            ? {
              ...f,
              uploadStatus: "Failed",
              progress: 100,
              message: error.message || "Error uploading file",
            }
            : f
        )
      );
    }
  };


  const uploadToOrderFileEndpoint = async (file, selectedOrderIds) => {
    try {
      let totalProgress = 0;
      const progressPerOrder = 100 / selectedOrderIds.length;

      const uploadPromises = selectedOrderIds.map(async (orderId, index) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("orderid", orderId);
        
        const fileType = file.name.endsWith('.stl') ? 'stl' : 'finished';
        formData.append("type", fileType);

        const response = await fetch(`${base_url}/upload-order-file`, {
          method: "POST",
          headers: {
            'X-Tenant': 'skydent'
          },
          body: formData,
        });

        totalProgress += progressPerOrder;
        setFiles((prev) =>
          prev.map((f) =>
            f.fileName === file.name
              ? {
                ...f,
                progress: Math.min(Math.round(totalProgress), 100),
                message: `Uploading to order ${index + 1}/${selectedOrderIds.length}...`
              }
              : f
          )
        );

        return response.json();
      });

      const results = await Promise.all(uploadPromises);

      if (progressIntervalRefs.current[file.name]) {
        clearInterval(progressIntervalRefs.current[file.name]);
        delete progressIntervalRefs.current[file.name];
      }

      const allSuccessful = results.every(result => result.status === "success");

      if (allSuccessful) {
        setFiles((prev) =>
          prev.map((f) =>
            f.fileName === file.name
              ? {
                ...f,
                uploadStatus: "Success",
                progress: 100,
                message: `File uploaded successfully to ${selectedOrderIds.length} order(s)`,
                fileLink: results[0].file_link || ""
              }
              : f
          )
        );
      } else {
        const errorMessages = results
          .filter(result => result.status !== "success")
          .map(result => result.message)
          .join(', ');

        throw new Error(`Some uploads failed: ${errorMessages}`);
      }
    } catch (error) {
      if (progressIntervalRefs.current[file.name]) {
        clearInterval(progressIntervalRefs.current[file.name]);
        delete progressIntervalRefs.current[file.name];
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.fileName === file.name
            ? {
              ...f,
              uploadStatus: "Failed",
              progress: 100,
              message: error.message || "Error uploading file to selected orders",
            }
            : f
        )
      );
    }
  };

  // ✅ ADDED: Handle order selection in multi-order scenario
  const handleOrderSelection = (fileName, orderId, isChecked) => {
    setOrderSelection(prev => {
      const currentSelection = prev[fileName] || { selectedOrders: [] };
      let updatedSelectedOrders;

      if (isChecked) {
        updatedSelectedOrders = [...currentSelection.selectedOrders, orderId];
      } else {
        updatedSelectedOrders = currentSelection.selectedOrders.filter(id => id !== orderId);
      }

      return {
        ...prev,
        [fileName]: {
          ...currentSelection,
          selectedOrders: updatedSelectedOrders
        }
      };
    });
  };

  // ✅ ADDED: Confirm order selection and proceed with upload
  const confirmOrderSelection = (file) => {
    const selection = orderSelection[file.fileName];
    if (!selection || selection.selectedOrders.length === 0) {
      // Show error if no orders selected
      setFiles(prev =>
        prev.map(f =>
          f.fileName === file.fileName
            ? { ...f, message: "Please select at least one order" }
            : f
        )
      );
      return;
    }

    // Reset progress and retry upload with selected orders using upload-order-file endpoint
    setFiles((prev) =>
      prev.map((f) =>
        f.fileName === file.fileName
          ? {
            ...f,
            uploadStatus: "Uploading...",
            progress: 0,
            showOrderSelection: false,
            message: `Uploading to ${selection.selectedOrders.length} selected order(s)...`
          }
          : f
      )
    );

    // Retry upload with selected orders using the upload-order-file endpoint
    uploadFile(file.file, selection.selectedOrders);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // ✅ UPDATED: Reset page also clears order selection and progress intervals
  const resetPage = () => {
    // Clear all intervals
    Object.values(progressIntervalRefs.current).forEach(interval => {
      clearInterval(interval);
    });
    progressIntervalRefs.current = {};

    setFiles([]);
    setOrderSelection({});
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

  // Thick & Professional Progress Bar Component
  const ProgressBar = ({ file }) => {
    const getBarStyle = () => {
      switch (file.uploadStatus) {
        case "Success":
          return "from-green-500 to-green-400";
        case "Failed":
        case "Error":
          return "from-red-500 to-red-400";
        case "Multiple Orders Found":
          return "from-yellow-500 to-yellow-400";
        case "Uploading...":
          return "from-blue-600 to-blue-400 animate-pulse";
        default:
          return "from-gray-400 to-gray-300";
      }
    };

    return (
      <div className="w-full max-w-xs">
        <div className="flex items-center gap-4">
          {/* Progress Container */}
          <div
            className={`relative flex-1 h-3 rounded-full overflow-hidden ${theme === "light" ? "bg-gray-200" : "bg-gray-700"
              }`}
          >
            {/* Progress Fill */}
            <div
              className={`
              h-full rounded-full
              bg-gradient-to-r ${getBarStyle()}
              transition-all duration-500 ease-out
              ${file.uploadStatus === "Uploading..."
                  ? "shadow-[0_0_10px_rgba(59,130,246,0.7)]"
                  : ""
                }
            `}
              style={{ width: `${file.progress}%` }}
            />
          </div>

          {/* Percentage */}
          <span
            className={`text-sm font-semibold min-w-[50px] text-right ${theme === "light" ? "text-gray-800" : "text-gray-200"
              }`}
          >
            {Math.round(file.progress)}%
          </span>
        </div>

        {/* Status Text */}
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

  // ✅ ADDED: Order Selection Component
  const OrderSelection = ({ file }) => {
    const selection = orderSelection[file.fileName] || { selectedOrders: [] };

    return (
      <div className={`mt-4 p-4 rounded-lg border ${theme === 'light' ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-900/20 border-yellow-700'}`}>
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
                onChange={(e) => handleOrderSelection(file.fileName, order.orderid, e.target.checked)}
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

  // ✅ UPDATED: Status badge component to include multi-order handling
  const StatusBadge = ({ status, message, fileLink, file, showOrderSelection }) => {
    const getStatusColor = () => {
      if (status === "Success") {
        return theme === 'light'
          ? "bg-green-100 text-green-800 border-green-200"
          : "bg-green-900/30 text-green-400 border-green-800";
      }
      if (status === "Failed" || status === "Error") {
        return theme === 'light'
          ? "bg-red-100 text-red-800 border-red-200"
          : "bg-red-900/30 text-red-400 border-red-800";
      }
      if (status === "Uploading...") {
        return theme === 'light'
          ? "bg-blue-100 text-blue-800 border-blue-200"
          : "bg-blue-900/30 text-blue-400 border-blue-800";
      }
      if (status === "Multiple Orders Found") {
        return theme === 'light'
          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
          : "bg-yellow-900/30 text-yellow-400 border-yellow-800";
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

        {(status === "Failed" || status === "Error") && message && (
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

        {/* ✅ ADDED: Show order selection UI when multiple orders found */}
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
              {/* Upload Area */}
              {files.length === 0 && (
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
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-blue-100' : 'bg-blue-900/20'
                      }`}>
                      <svg className={`w-10 h-10 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      {drag ? "Drop files to upload" : "Upload Order Files"}
                    </h3>
                    <p className={`mb-6 max-w-md mx-auto ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                      }`}>
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

              {/* Files Table */}
              {files.length > 0 && (
                <div className="p-6">
                  {/* Header with reset button */}
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
                      {/* Icon */}
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

                  {/* Summary Cards - Updated to include "Multiple Orders Found" in Pending */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { count: files.length, label: "Total Files", gradient: "from-blue-500 to-blue-600" },
                      { count: files.filter(f => f.uploadStatus === "Success").length, label: "Completed", gradient: "from-green-500 to-green-600" },
                      { count: files.filter(f => f.uploadStatus === "Uploading...").length, label: "In Progress", gradient: "from-yellow-500 to-yellow-600" },
                      // ✅ UPDATED: Include "Multiple Orders Found" in pending count
                      { count: files.filter(f => f.uploadStatus === "Waiting..." || f.uploadStatus === "Multiple Orders Found").length, label: "Pending", gradient: "from-gray-500 to-gray-600" },
                    ].map((card, index) => (
                      <div key={index} className={`bg-gradient-to-r ${card.gradient} text-white rounded-lg p-4 shadow-sm`}>
                        <div className="text-2xl font-bold">{card.count}</div>
                        <div className="text-opacity-90 text-sm">{card.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Table Container - Now with 3 columns: FILE NAME, PROGRESS, STATUS */}
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
                          {files.map((file, idx) => (
                            <tr key={idx} className={getTableRowClass()}>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  {/* ✅ UPDATED: Added color for "Multiple Orders Found" */}
                                  <div className={`w-2 h-2 rounded-full ${file.uploadStatus === "Success" ? "bg-green-500" :
                                    file.uploadStatus === "Failed" ? "bg-red-500" :
                                      file.uploadStatus === "Uploading..." ? "bg-blue-500" :
                                        file.uploadStatus === "Error" ? "bg-red-500" :
                                          // ✅ ADDED: Color for multiple orders
                                          file.uploadStatus === "Multiple Orders Found" ? "bg-yellow-500" :
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
                                {/* ✅ UPDATED: Pass file and showOrderSelection props */}
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