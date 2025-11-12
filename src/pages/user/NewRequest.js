import { useContext, useState } from "react";
import Hd from "./Hd";
import Foot from "./Foot";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../Context/ThemeContext";
import { UserContext } from "../../Context/UserContext";

export default function NewRequest() {
  let base_url = localStorage.getItem('base_url');
  const { theme } = useContext(ThemeContext);
  const { logout } = useContext(UserContext);
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [drag, setDragActive] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleFiles = async (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const zipFiles = fileArray.filter((file) => file.name.endsWith(".zip"));

    if (zipFiles.length !== fileArray.length) {
      setFiles(prev => [...prev, {
        fileName: "Invalid files detected",
        progress: 0,
        uploadStatus: "Error",
        orderId: "-",
        productType: "-",
        unit: "-",
        tooth: "-",
        message: "Only .zip files are allowed!",
        isError: true
      }]);

      setTimeout(() => {
        setFiles(prev => prev.filter(f => !f.isError));
      }, 3000);
      return;
    }

    zipFiles.forEach((file) => {
      setFiles((prev) => [
        ...prev,
        {
          fileName: file.name,
          progress: 0,
          uploadStatus: "Waiting...",
          orderId: "-",
          productType: "-",
          unit: "-",
          tooth: "-",
          message: "",
          file: file,
        },
      ]);
      uploadFile(file);
    });
  };

  const token = localStorage.getItem('token');

  const uploadFile = async (file) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.fileName === file.name
          ? { ...f, uploadStatus: "Uploading...", progress: 20 }
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

      // Check if the backend response indicates success or error
      if (result.status === "success") {
        setFiles((prev) =>
          prev.map((f) =>
            f.fileName === file.name
              ? {
                ...f,
                uploadStatus: "Success",
                progress: 100,
                orderId: result.id || "ORD-001",
                productType: result.product_type || "Crown",
                unit: result.unit || "1",
                tooth: result.tooth || "15",
                message: result.message || "",
              }
              : f
          )
        );
      } else {
        // Backend returned an error
        throw new Error(result.message || "Upload failed");
        if (result.error === 'Invalid or expired token') {
          alert('Invalid or expired token. Please log in again.')
          navigate(logout);
        }
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

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleMessageChange = (fileName, value) => {
    setFiles((prev) =>
      prev.map((f) => (f.fileName === fileName ? { ...f, message: value } : f))
    );
  };

  const resetPage = () => {
    setFiles([]);
    setSelectedDuration("");
    setShowSuccessPopup(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDuration) {
      alert("Please select a time duration");
      return;
    }

    // Apply selectedDuration to all files dynamically
    const filesWithDuration = files.map(file => ({
      ...file,
      tduration: selectedDuration
    }));

    try {
      const response = await fetch(`${base_url}/new-orders-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
          'X-Tenant': 'skydent'
        },
        body: JSON.stringify(filesWithDuration),
      });

      const resp = await response.json();
      if (resp.status === 'completed') {
        if (resp.results.length === files.length) {
          setShowSuccessPopup(true);
          // Auto reset after 3 seconds
          setTimeout(() => {
            resetPage();
          }, 3000);
        }
      }
      else {
        if (resp.error === 'Invalid or expired token') {
          alert('Invalid or expired token. Please log in again.')
          navigate(logout);
        }
      }

    } catch (error) {
      console.error("Error submitting:", error);
    }
  };

  // Check if files are ready for submission (at least one success and no uploading files)
  const canSubmit = files.length > 0 &&
    files.some(f => f.uploadStatus === "Success") &&
    !files.some(f => f.uploadStatus === "Uploading...") &&
    selectedDuration;

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

  const getInputClass = () => {
    return theme === 'light'
      ? 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500'
      : 'border-gray-600 bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500';
  };

  const getDeliveryOptionClass = (option, isSelected) => {
    const baseClass = "block p-4 border-2 rounded-xl cursor-pointer transition-all";

    if (isSelected) {
      const colorMap = {
        red: theme === 'light' ? 'border-red-500 bg-red-50' : 'border-red-500 bg-red-900/20',
        yellow: theme === 'light' ? 'border-yellow-500 bg-yellow-50' : 'border-yellow-500 bg-yellow-900/20',
        green: theme === 'light' ? 'border-green-500 bg-green-50' : 'border-green-500 bg-green-900/20'
      };
      return `${baseClass} ${colorMap[option.color]} shadow-md scale-105`;
    } else {
      return theme === 'light'
        ? `${baseClass} border-gray-200 hover:border-gray-300 hover:shadow-sm text-gray-900`
        : `${baseClass} border-gray-600 hover:border-gray-500 hover:shadow-sm text-white`;
    }
  };

  const getStatusTextClass = () => {
    return theme === 'light' ? 'text-gray-600' : 'text-gray-300';
  };

  // Status badge component with enhanced design
  const StatusBadge = ({ status, message }) => {
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
                "bg-gray-400"
            }`}>
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {status === "Success" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />}
              {status === "Failed" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />}
              {status === "Uploading..." && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />}
              {status === "Waiting..." && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
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
        {status === "Failed" && message && (
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
      </div>
    );
  };

  return (
    <>
      <Hd />
      <main id="main" className={`flex-grow px-4 transition-colors duration-300 ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'} pt-16 sm:pt-18`}>
        {/* Success Popup */}
        {showSuccessPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-xl p-8 max-w-md mx-4 shadow-2xl ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-gray-800 text-white'
              }`}>
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === 'light' ? 'bg-green-100' : 'bg-green-900/20'
                  }`}>
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Success!</h3>
                <p className={`mb-6 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                  All orders have been successfully submitted for design.
                </p>
                <button
                  onClick={resetPage}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Upload More Files
                </button>
              </div>
            </div>
          </div>
        )}

        <section className={theme === 'light' ? 'bg-gray-50' : 'bg-black'}>
          <div className="max-w-full mx-auto mt-4">
            {/* Main Content - Full Width */}
            <div className={`rounded-xl shadow-lg border ${getCardClass()}`}>
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
                      Drag and drop your ZIP files here or click the button below. Supported format: .zip only
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
                        accept=".zip"
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
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { count: files.length, label: "Total Files", gradient: "from-blue-500 to-blue-600" },
                      { count: files.filter(f => f.uploadStatus === "Success").length, label: "Completed", gradient: "from-green-500 to-green-600" },
                      { count: files.filter(f => f.uploadStatus === "Uploading...").length, label: "In Progress", gradient: "from-yellow-500 to-yellow-600" },
                      { count: files.filter(f => f.uploadStatus === "Waiting...").length, label: "Pending", gradient: "from-gray-500 to-gray-600" },
                    ].map((card, index) => (
                      <div key={index} className={`bg-gradient-to-r ${card.gradient} text-white rounded-lg p-4 shadow-sm`}>
                        <div className="text-2xl font-bold">{card.count}</div>
                        <div className="text-opacity-90 text-sm">{card.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Table Container */}
                  <div className={`rounded-lg border ${getTableContainerClass()}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={`border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
                            {[
                              { name: "ORDER ID", width: "w-32" },
                              { name: "FILE NAME", width: "w-62" },
                              { name: "STATUS", width: "w-48" },
                              { name: "PRODUCT TYPE", width: "w-32" },
                              { name: "UNIT", width: "w-20" },
                              { name: "TOOTH", width: "w-20" },
                              { name: "MESSAGE", width: "w-48" },
                            ].map((header, index) => (
                              <th
                                key={index}
                                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${header.width} ${getTableHeaderClass()}`}
                              >
                                {header.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'}`}>
                          {files.map((file, idx) => (
                            <tr key={idx} className={getTableRowClass()}>
                              <td className="px-4 py-3">
                                <span className={`text-sm font-medium px-2 py-1 rounded ${theme === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-gray-700 text-white'
                                  }`}>
                                  {file.orderId}
                                </span>
                              </td>
                              <td className="px-4 py-3 w-44">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-2 h-2 rounded-full ${file.uploadStatus === "Success" ? "bg-green-500" :
                                    file.uploadStatus === "Failed" ? "bg-red-500" :
                                      file.uploadStatus === "Uploading..." ? "bg-blue-500 animate-pulse" :
                                        "bg-gray-400"
                                    }`}></div>
                                  <span className="text-sm font-medium truncate max-w-sm">
                                    {file.fileName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge status={file.uploadStatus} message={file.message} />
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm">{file.productType}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm font-medium">{file.unit}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm font-medium">{file.tooth}</span>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={file.message}
                                  onChange={(e) => handleMessageChange(file.fileName, e.target.value)}
                                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getInputClass()}`}
                                  placeholder="Add instructions..."
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Delivery Options and Submit Section */}
                  <div className={`mt-8 rounded-xl border p-6 ${getTableContainerClass()}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Delivery Options */}
                      <div className="lg:col-span-2">
                        <h3 className="text-lg font-semibold mb-4">Delivery Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            {
                              value: "Rush",
                              label: "Rush Delivery",
                              description: "1-2 Hours",
                              price: "+$50",
                              color: "red"
                            },
                            {
                              value: "Same Day",
                              label: "Same Day",
                              description: "6 Hours",
                              price: "+$25",
                              color: "yellow"
                            },
                            {
                              value: "Next Day",
                              label: "Next Day",
                              description: "12 Hours",
                              price: "Free",
                              color: "green"
                            },
                          ].map((option) => (
                            <label
                              key={option.value}
                              className={getDeliveryOptionClass(option, selectedDuration === option.value)}
                            >
                              <input
                                type="radio"
                                name="timeduration"
                                value={option.value}
                                checked={selectedDuration === option.value}
                                onChange={(e) => setSelectedDuration(e.target.value)}
                                className="sr-only"
                              />
                              <div className="text-center">
                                <div className="font-semibold text-sm">{option.label}</div>
                                <div className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                                  }`}>{option.description}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Submit Section */}
                      <div className="flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Submit Orders</h3>
                          <div className={`text-sm mb-4 ${files.some(f => f.uploadStatus === "Uploading...")
                            ? theme === 'light' ? "text-yellow-600" : "text-yellow-400"
                            : !files.some(f => f.uploadStatus === "Success")
                              ? theme === 'light' ? "text-red-600" : "text-red-400"
                              : canSubmit
                                ? theme === 'light' ? "text-green-600" : "text-green-400"
                                : getStatusTextClass()
                            }`}>
                            {files.some(f => f.uploadStatus === "Uploading...")
                              ? "⏳ Please wait for all uploads to complete"
                              : !files.some(f => f.uploadStatus === "Success")
                                ? "❌ No files successfully uploaded. Please check failed files."
                                : !selectedDuration
                                  ? "📋 Please select delivery timeframe"
                                  : files.some(f => f.uploadStatus === "Failed")
                                    ? "⚠️ Some files failed, but you can submit successful ones"
                                    : "✅ All files are ready for processing"
                            }
                          </div>
                        </div>
                        <div className="space-y-3">
                          <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className={`w-full font-semibold py-3 px-6 rounded-lg text-sm transition-all ${canSubmit
                              ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                              : theme === 'light'
                                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                                : "bg-gray-600 text-gray-400 cursor-not-allowed"
                              }`}
                          >
                            {canSubmit ? (
                              <span className="flex items-center justify-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Send for Design
                              </span>
                            ) : (
                              "Send for Design"
                            )}
                          </button>
                          {files.some(f => f.uploadStatus === "Failed") && canSubmit && (
                            <div className={`text-xs text-center py-1 rounded ${theme === 'light'
                              ? 'text-yellow-600 bg-yellow-50'
                              : 'text-yellow-400 bg-yellow-900/20'
                              }`}>
                              ⚠️ Only successful files will be submitted
                            </div>
                          )}
                        </div>
                      </div>
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