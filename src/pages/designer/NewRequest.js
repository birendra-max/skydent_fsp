import { useContext, useState } from "react";
import Hd from "./Hd";
import Foot from "./Foot";
import { ThemeContext } from "../../Context/ThemeContext";

export default function NewRequest() {
  const { theme } = useContext(ThemeContext);
  const [files, setFiles] = useState([]);
  const [drag, setDragActive] = useState(false);
  const [orderSelection, setOrderSelection] = useState({}); // { fileName: { selectedOrders: [], availableOrders: [] } }
  const token = localStorage.getItem('token');
  let base_url = localStorage.getItem('base_url');

  const handleFiles = async (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);

    // Allow both ZIP and STL files based on backend
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
          matchingOrders: null, // Will store matching orders when found
          showOrderSelection: false, // Control visibility of order selection
        },
      ]);
      uploadFile(file);
    });
  };

  const uploadFile = async (file, selectedOrderIds = null) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.fileName === file.name
          ? { ...f, uploadStatus: "Uploading...", progress: 20, showOrderSelection: false }
          : f
      )
    );

    const progressInterval = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) =>
          f.fileName === file.name && f.progress < 80
            ? { ...f, progress: f.progress + 5 }
            : f
        )
      );
    }, 300);

    // If we have selected order IDs, use the upload-order-file endpoint
    if (selectedOrderIds && selectedOrderIds.length > 0) {
      await uploadToOrderFileEndpoint(file, selectedOrderIds, progressInterval);
    } else {
      // First time upload - use new-orders endpoint
      await uploadToNewOrdersEndpoint(file, progressInterval);
    }
  };

  const uploadToNewOrdersEndpoint = async (file, progressInterval) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${base_url}/new-orders`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant': 'skydent'
        },
        body: formData,
      });

      clearInterval(progressInterval);

      const result = await response.json();

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
        // Handle multiple matching orders
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
      clearInterval(progressInterval);
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

  const uploadToOrderFileEndpoint = async (file, selectedOrderIds, progressInterval) => {
    try {
      // Upload to each selected order individually
      const uploadPromises = selectedOrderIds.map(async (orderId) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("orderid", orderId);

        // Determine file type based on extension
        const fileType = file.name.endsWith('.stl') ? 'stl' : 'finished';
        formData.append("type", fileType);

        const response = await fetch(`${base_url}/upload-order-file`, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant': 'skydent'
          },
          body: formData,
        });

        return response.json();
      });

      const results = await Promise.all(uploadPromises);
      clearInterval(progressInterval);

      // Check if all uploads were successful
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
                fileLink: results[0].file_link || "" // Use first result's file link
              }
              : f
          )
        );
      } else {
        // Some uploads failed
        const errorMessages = results
          .filter(result => result.status !== "success")
          .map(result => result.message)
          .join(', ');

        throw new Error(`Some uploads failed: ${errorMessages}`);
      }
    } catch (error) {
      clearInterval(progressInterval);
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

  const resetPage = () => {
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

  // Order Selection Component
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

  // Status badge component
  const StatusBadge = ({ status, message, fileLink, file, showOrderSelection }) => {
    const getStatusConfig = (status) => {
      const lightConfig = {
        Success: {
          bgColor: "bg-gradient-to-r from-green-50 to-green-100",
          textColor: "text-green-700",
          borderColor: "border-green-200",
        },
        Failed: {
          bgColor: "bg-gradient-to-r from-red-50 to-red-100",
          textColor: "text-red-700",
          borderColor: "border-red-200",
        },
        "Uploading...": {
          bgColor: "bg-gradient-to-r from-blue-50 to-blue-100",
          textColor: "text-blue-700",
          borderColor: "border-blue-200",
        },
        "Waiting...": {
          bgColor: "bg-gradient-to-r from-gray-50 to-gray-100",
          textColor: "text-gray-700",
          borderColor: "border-gray-200",
        },
        "Error": {
          bgColor: "bg-gradient-to-r from-red-50 to-red-100",
          textColor: "text-red-700",
          borderColor: "border-red-200",
        },
        "Multiple Orders Found": {
          bgColor: "bg-gradient-to-r from-yellow-50 to-yellow-100",
          textColor: "text-yellow-700",
          borderColor: "border-yellow-200",
        }
      };

      const darkConfig = {
        Success: {
          bgColor: "bg-gradient-to-r from-green-900/20 to-green-800/20",
          textColor: "text-green-400",
          borderColor: "border-green-700",
        },
        Failed: {
          bgColor: "bg-gradient-to-r from-red-900/20 to-red-800/20",
          textColor: "text-red-400",
          borderColor: "border-red-700",
        },
        "Uploading...": {
          bgColor: "bg-gradient-to-r from-blue-900/20 to-blue-800/20",
          textColor: "text-blue-400",
          borderColor: "border-blue-700",
        },
        "Waiting...": {
          bgColor: "bg-gradient-to-r from-gray-700 to-gray-800",
          textColor: "text-gray-400",
          borderColor: "border-gray-600",
        },
        "Error": {
          bgColor: "bg-gradient-to-r from-red-900/20 to-red-800/20",
          textColor: "text-red-400",
          borderColor: "border-red-700",
        },
        "Multiple Orders Found": {
          bgColor: "bg-gradient-to-r from-yellow-900/20 to-yellow-800/20",
          textColor: "text-yellow-400",
          borderColor: "border-yellow-700",
        }
      };

      const config = theme === 'light' ? lightConfig[status] : darkConfig[status];

      return {
        ...config,
        shadow: "shadow-sm",
        icon: (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${status === "Success" ? "bg-green-500" :
            status === "Failed" ? "bg-red-500" :
              status === "Uploading..." ? "bg-blue-500" :
                status === "Error" ? "bg-red-500" :
                  status === "Multiple Orders Found" ? "bg-yellow-500" :
                    "bg-gray-400"
            }`}>
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {status === "Success" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />}
              {status === "Failed" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />}
              {status === "Uploading..." && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />}
              {status === "Waiting..." && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
              {status === "Error" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />}
              {status === "Multiple Orders Found" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
            </svg>
          </div>
        )
      };
    };

    const config = getStatusConfig(status);

    return (
      <div className="flex flex-col space-y-2">
        <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold border ${config.bgColor} ${config.textColor} ${config.borderColor} ${config.shadow} transition-all duration-200`}>
          {config.icon}
          <span className="font-medium">{status}</span>
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
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${theme === 'light'
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                    >
                      Upload New Files
                    </button>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { count: files.length, label: "Total Files", gradient: "from-blue-500 to-blue-600" },
                      { count: files.filter(f => f.uploadStatus === "Success").length, label: "Completed", gradient: "from-green-500 to-green-600" },
                      { count: files.filter(f => f.uploadStatus === "Uploading...").length, label: "In Progress", gradient: "from-yellow-500 to-yellow-600" },
                      { count: files.filter(f => f.uploadStatus === "Waiting..." || f.uploadStatus === "Multiple Orders Found").length, label: "Pending", gradient: "from-gray-500 to-gray-600" },
                    ].map((card, index) => (
                      <div key={index} className={`bg-gradient-to-r ${card.gradient} text-white rounded-lg p-4 shadow-sm`}>
                        <div className="text-2xl font-bold">{card.count}</div>
                        <div className="text-opacity-90 text-sm">{card.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Table Container - Only FILE NAME and STATUS */}
                  <div className={`rounded-lg border ${getTableContainerClass()}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={`border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
                            <th className={`px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider ${getTableHeaderClass()}`}>
                              FILE NAME
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
                                  <div className={`w-2 h-2 rounded-full ${file.uploadStatus === "Success" ? "bg-green-500" :
                                    file.uploadStatus === "Failed" ? "bg-red-500" :
                                      file.uploadStatus === "Uploading..." ? "bg-blue-500 animate-pulse" :
                                        file.uploadStatus === "Error" ? "bg-red-500" :
                                          file.uploadStatus === "Multiple Orders Found" ? "bg-yellow-500" :
                                            "bg-gray-400"
                                    }`}></div>
                                  <span className="text-sm font-medium">
                                    {file.fileName}
                                  </span>
                                </div>
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