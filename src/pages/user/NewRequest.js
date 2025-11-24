import { useContext, useState } from "react";
import Hd from "./Hd";
import Foot from "./Foot";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../Context/ThemeContext";
import { UserContext } from "../../Context/UserContext";
import { fetchWithAuth } from '../../utils/userapi'

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
    // 1️⃣ Check if file already exists before upload
    try {
      const checkResponse = await fetchWithAuth(`check-file-exists?file=${encodeURIComponent(file.name)}`);

      if (checkResponse.message === 'File already exists') {
        const confirmUpload = window.confirm(
          `The file "${file.name}" already exists.\nDo you want to proceed with uploading?`
        );

        if (!confirmUpload) {
          // User selected CANCEL → Do not upload
          setFiles((prev) =>
            prev.map((f) =>
              f.fileName === file.name
                ? { ...f, uploadStatus: "Cancelled", progress: 0 }
                : f
            )
          );
          return;
        }
      }
    } catch (err) {
      console.error("File check error:", err);
    }

    // 2️⃣ Existing code continues...
    const fileKey = file.name + "_" + Date.now();
    let completed = false;
    let progressValue = 0;

    const intervalId = setInterval(() => {
      if (!completed && progressValue < 99) {
        progressValue += Math.random() * 1.8 + 0.4;
        if (progressValue > 99) progressValue = 99;

        setFiles((prev) =>
          prev.map((f) =>
            f.fileName === file.name
              ? { ...f, progress: progressValue, uploadStatus: `Uploading... ${Math.floor(progressValue)}%` }
              : f
          )
        );
      }
    }, 120);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${base_url}/new-orders`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Tenant": "skydent",
        },
        body: formData,
      });

      const result = await response.json();
      completed = true;

      const finishInterval = setInterval(() => {
        progressValue += 2;

        if (progressValue >= 100) {
          progressValue = 100;
          clearInterval(finishInterval);
          clearInterval(intervalId);

          setFiles((prev) =>
            prev.map((f) =>
              f.fileName === file.name
                ? {
                  ...f,
                  progress: 100,
                  uploadStatus: "Success",
                  orderId: result.id,
                  productType: result.product_type,
                  unit: result.unit,
                  tooth: result.tooth,
                  message: result.message
                }
                : f
            )
          );
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.fileName === file.name
                ? {
                  ...f,
                  progress: progressValue,
                  uploadStatus: `Uploading... ${Math.floor(progressValue)}%`
                }
                : f
            )
          );
        }
      }, 40);

    } catch (error) {
      completed = true;
      clearInterval(intervalId);

      setFiles((prev) =>
        prev.map((f) =>
          f.fileName === file.name
            ? {
              ...f,
              progress: 100,
              uploadStatus: "Failed",
              message: error.message
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

  const canSubmit = files.length > 0 &&
    files.some(f => f.uploadStatus === "Success") &&
    !files.some(f => f.uploadStatus.startsWith("Uploading...")) &&
    selectedDuration;

  // Professional color scheme - Navy Blue & Slate
  const getCardClass = () => {
    return theme === 'light'
      ? 'bg-white border-gray-200 shadow-sm'
      : 'bg-gray-900 border-gray-800 shadow-lg';
  };

  const getUploadAreaClass = () => {
    const baseClass = "border-2 min-h-[75vh] flex justify-center items-center flex-col border-dashed rounded-lg p-12 text-center transition-all duration-200";

    if (theme === 'light') {
      return drag
        ? `${baseClass} border-blue-600 bg-blue-50 scale-[1.01] text-gray-900`
        : `${baseClass} border-gray-300 hover:border-blue-500 hover:bg-gray-50 text-gray-900`;
    } else {
      return drag
        ? `${baseClass} border-blue-500 bg-blue-900/10 scale-[1.01] text-white`
        : `${baseClass} border-gray-600 hover:border-blue-400 hover:bg-gray-800/50 text-white`;
    }
  };

  const getTableContainerClass = () => {
    return theme === 'light'
      ? 'bg-gray-50/80 border-gray-200'
      : 'bg-gray-800/50 border-gray-700';
  };

  const getTableHeaderClass = () => {
    return theme === 'light'
      ? 'text-gray-700 bg-gray-100 font-semibold'
      : 'text-gray-300 bg-gray-700 font-semibold';
  };

  const getTableRowClass = () => {
    return theme === 'light'
      ? 'hover:bg-gray-50 text-gray-900 border-b border-gray-100'
      : 'hover:bg-gray-700/50 text-white border-b border-gray-800';
  };

  const getInputClass = () => {
    return theme === 'light'
      ? 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
      : 'border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  };

  const getDeliveryOptionClass = (option, isSelected) => {
    const baseClass = "block p-4 border rounded-lg cursor-pointer transition-all duration-200";

    if (isSelected) {
      const colorMap = {
        red: theme === 'light' ? 'border-red-500 bg-red-50' : 'border-red-500 bg-red-900/20',
        yellow: theme === 'light' ? 'border-yellow-500 bg-yellow-50' : 'border-yellow-500 bg-yellow-900/20',
        green: theme === 'light' ? 'border-green-500 bg-green-50' : 'border-green-500 bg-green-900/20'
      };
      return `${baseClass} ${colorMap[option.color]} shadow-sm`;
    } else {
      return theme === 'light'
        ? `${baseClass} border-gray-200 bg-white hover:border-gray-300 text-gray-700`
        : `${baseClass} border-gray-600 bg-gray-800 hover:border-gray-500 text-gray-200`;
    }
  };

  // Professional StatusBadge component with progress
  const StatusBadge = ({ status, message, progress }) => {
    const getStatusConfig = (status) => {
      const config = {
        Success: {
          light: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
          dark: { bg: "bg-green-900/20", text: "text-green-400", border: "border-green-800" }
        },
        Failed: {
          light: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
          dark: { bg: "bg-red-900/20", text: "text-red-400", border: "border-red-800" }
        },
        "Uploading...": {
          light: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
          dark: { bg: "bg-blue-900/20", text: "text-blue-400", border: "border-blue-800" }
        },
        "Waiting...": {
          light: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
          dark: { bg: "bg-gray-800", text: "text-gray-400", border: "border-gray-700" }
        }
      };

      return theme === 'light' ? config[status]?.light : config[status]?.dark;
    };

    const config = getStatusConfig(status.split(' ')[0]); // Get base status without percentage

    // For uploading status, show progress bar
    const isUploading = status.startsWith("Uploading...");
    const percentage = isUploading ? progress : 0;

    return (
      <div className="flex flex-col space-y-2">
        <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium border ${config?.bg || 'bg-gray-100'} ${config?.text || 'text-gray-700'} ${config?.border || 'border-gray-200'}`}>
          <div className={`w-2 h-2 rounded-full ${status === "Success" ? "bg-green-500" :
            status === "Failed" ? "bg-red-500" :
              isUploading ? "bg-blue-500 animate-pulse" :
                "bg-gray-400"
            }`} />
          <span>{status}</span>
        </div>

        {/* Progress Bar for Uploading Files */}
        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        )}

        {status === "Failed" && message && (
          <div className={`text-xs px-2 py-1 rounded ${theme === 'light'
            ? 'text-red-600 bg-red-50'
            : 'text-red-400 bg-red-900/20'
            }`}>
            {message}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Hd />
      <main id="main" className={`flex-grow px-6 transition-colors duration-300 ${theme === 'light' ? 'bg-gray-50 text-gray-900' : 'bg-gray-950 text-white'} pt-20`}>
        {/* Success Popup */}
        {showSuccessPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`rounded-xl p-8 max-w-md mx-4 shadow-xl ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-gray-800 text-white'
              }`}>
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === 'light' ? 'bg-green-100' : 'bg-green-900/20'
                  }`}>
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Submission Successful</h3>
                <p className={`mb-6 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                  All orders have been successfully submitted for design processing.
                </p>
                <button
                  onClick={resetPage}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors text-sm"
                >
                  Upload More Files
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="max-w-8xl mx-auto">
          {/* Main Content Card */}
          <div className={`rounded-xl border ${getCardClass()} mb-8`}>

            {/* Upload Area */}
            {files.length === 0 && (
              <div className="p-8">
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
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-blue-100' : 'bg-blue-900/20'
                    }`}>
                    <svg className={`w-8 h-8 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-400">
                    {drag ? "Drop files to upload" : "Upload Order Files"}
                  </h3>
                  <p className={`mb-6 max-w-md mx-auto text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                    Drag and drop your ZIP files here or click the button below
                  </p>
                  <p className={`text-xs mb-6 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                    Supported format: .zip only
                  </p>
                  <label className={`inline-flex items-center px-6 py-3 font-medium rounded-lg cursor-pointer transition-colors ${theme === 'light'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-700 hover:bg-blue-600 text-white'
                    }`}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    { count: files.length, label: "Total Files", bg: "bg-blue-500" },
                    { count: files.filter(f => f.uploadStatus === "Success").length, label: "Completed", bg: "bg-green-500" },
                    { count: files.filter(f => f.uploadStatus.startsWith("Uploading...")).length, label: "In Progress", bg: "bg-yellow-500" },
                    { count: files.filter(f => f.uploadStatus === "Waiting...").length, label: "Pending", bg: "bg-gray-500" },
                  ].map((card, index) => (
                    <div key={index} className={`${card.bg} text-white rounded-lg p-4`}>
                      <div className="text-2xl font-bold">{card.count}</div>
                      <div className="text-blue-50 text-sm">{card.label}</div>
                    </div>
                  ))}
                </div>

                {/* Table Container */}
                <div className={`rounded-lg border ${getTableContainerClass()} mb-8`}>
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
                              className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${header.width} ${getTableHeaderClass()}`}
                            >
                              {header.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {files.map((file, idx) => (
                          <tr key={idx} className={getTableRowClass()}>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-medium px-2 py-1 rounded ${theme === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-gray-700 text-white'
                                }`}>
                                {file.orderId}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <div className={`w-2 h-2 rounded-full ${file.uploadStatus === "Success" ? "bg-green-500" :
                                  file.uploadStatus === "Failed" ? "bg-red-500" :
                                    file.uploadStatus.startsWith("Uploading...") ? "bg-blue-500 animate-pulse" :
                                      "bg-gray-400"
                                  }`} />
                                <span className="text-sm font-medium">
                                  {file.fileName}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge
                                status={file.uploadStatus}
                                message={file.message}
                                progress={file.progress}
                              />
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
                                className={`w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${getInputClass()}`}
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
                <div className={`rounded-xl border p-6 ${getTableContainerClass()} shadow-sm`}>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Delivery Options */}
                    <div className="lg:col-span-2">
                      <h3 className={`text-xl font-bold mb-6 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Delivery Options</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          {
                            value: "Rush",
                            label: "Rush Delivery",
                            description: "1-2 Hours",
                            tagline: "Fastest possible",
                            // price: "+$50",
                            color: "red",
                            icon: (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            )
                          },
                          {
                            value: "Same Day",
                            label: "Same Day",
                            description: "6 Hours",
                            tagline: "Quick turnaround",
                            // price: "+$25",
                            color: "yellow",
                            icon: (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )
                          },
                          {
                            value: "Next Day",
                            label: "Next Day",
                            description: "12 Hours",
                            tagline: "Standard delivery",
                            // price: "Free",
                            color: "green",
                            icon: (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )
                          },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className={`
    relative flex p-5 rounded-xl border cursor-pointer transition-all duration-200 group
    ${selectedDuration === option.value
                                ? option.color === "red"
                                  ? "border-red-500 bg-white shadow-md"
                                  : option.color === "yellow"
                                    ? "border-yellow-500 bg-white shadow-md"
                                    : "border-green-500 bg-white shadow-md"
                                : theme === "light"
                                  ? "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
                                  : "border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-700"
                              }
  `}
                          >
                            <input
                              type="radio"
                              name="timeduration"
                              value={option.value}
                              checked={selectedDuration === option.value}
                              onChange={(e) => setSelectedDuration(e.target.value)}
                              className="sr-only"
                            />

                            {/* Radio Button */}
                            <div className="flex-shrink-0 mr-4 mt-1">
                              <div className={`
      w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
      ${selectedDuration === option.value
                                  ? option.color === "red"
                                    ? "border-red-500 bg-red-500"
                                    : option.color === "yellow"
                                      ? "border-yellow-500 bg-yellow-500"
                                      : "border-green-500 bg-green-500"
                                  : theme === "light"
                                    ? "border-gray-400 bg-white"
                                    : "border-gray-500 bg-gray-700"
                                }
    `}>
                                {selectedDuration === option.value && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                              <div className="flex items-start space-x-3">

                                {/* Icon Box (always white when selected) */}
                                <div className={`
        flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all
        ${selectedDuration === option.value
                                    ? "bg-white text-black border border-gray-300"
                                    : theme === "light"
                                      ? "bg-gray-100 text-gray-500"
                                      : "bg-gray-700 text-gray-400"
                                  }
      `}>
                                  {option.icon}
                                </div>

                                {/* Text Area */}
                                <div className="flex-1 min-w-0">
                                  <span
                                    className={`font-bold text-base block 
            ${selectedDuration === option.value ? "text-black" : theme === 'light' ? "text-gray-900" : "text-white"}
          `}
                                  >
                                    {option.label}
                                  </span>

                                  <span
                                    className={`text-sm font-medium block mt-1
            ${selectedDuration === option.value ? "text-black" : theme === 'light' ? "text-gray-700" : "text-gray-300"}
          `}
                                  >
                                    {option.description}
                                  </span>

                                  <span
                                    className={`text-xs block mt-1
            ${selectedDuration === option.value ? "text-black/70" : theme === 'light' ? "text-gray-500" : "text-gray-400"}
          `}
                                  >
                                    {option.tagline}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Selection Tick */}
                            {selectedDuration === option.value && (
                              <div className="absolute -top-2 -right-2">
                                <div className={`
        w-6 h-6 rounded-full flex items-center justify-center shadow-md
        ${option.color === "red"
                                    ? "bg-red-500"
                                    : option.color === "yellow"
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }
      `}>
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </label>
                        ))}
                      </div>

                      {/* Helper text to indicate selection */}
                      <div className={`mt-4 text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full border-2 border-gray-400 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                          </div>
                          <span>Select your preferred delivery option</span>
                        </div>
                      </div>
                    </div>

                    {/* Submit Section */}
                    <div className="flex flex-col justify-between">
                      <div>
                        <h3 className={`text-xl font-bold mb-6 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Submit Orders</h3>
                        <div className={`
          flex items-center p-4 rounded-lg mb-6 text-sm font-medium
          ${files.some(f => f.uploadStatus.startsWith("Uploading..."))
                            ? theme === 'light'
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                              : "bg-yellow-900/20 text-yellow-300 border border-yellow-800"
                            : !files.some(f => f.uploadStatus === "Success")
                              ? theme === 'light'
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-red-900/20 text-red-300 border border-red-800"
                              : canSubmit
                                ? theme === 'light'
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : "bg-green-900/20 text-green-300 border border-green-800"
                                : theme === 'light'
                                  ? "bg-gray-50 text-gray-600 border border-gray-200"
                                  : "bg-gray-800 text-gray-400 border border-gray-700"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {files.some(f => f.uploadStatus.startsWith("Uploading...")) ? (
                              <>
                                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                <span>Please wait for all uploads to complete</span>
                              </>
                            ) : !files.some(f => f.uploadStatus === "Success") ? (
                              <>
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span>No files successfully uploaded</span>
                              </>
                            ) : !selectedDuration ? (
                              <>
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span>Please select delivery timeframe</span>
                              </>
                            ) : files.some(f => f.uploadStatus === "Failed") ? (
                              <>
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span>Some files failed, but you can submit successful ones</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>All files are ready for processing</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <button
                          onClick={handleSubmit}
                          disabled={!canSubmit}
                          className={`
            w-full font-bold py-4 px-6 rounded-xl text-base transition-all duration-200 cursor-pointer
            ${canSubmit
                              ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                              : theme === 'light'
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                            }`}
                        >
                          {canSubmit ? (
                            <span className="flex items-center justify-center space-x-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span>Send for Design</span>
                            </span>
                          ) : (
                            "Send for Design"
                          )}
                        </button>

                        {files.some(f => f.uploadStatus === "Failed") && canSubmit && (
                          <div className={`
            flex items-center justify-center space-x-2 p-3 rounded-lg text-sm
            ${theme === 'light'
                              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                              : 'bg-yellow-900/20 text-yellow-300 border border-yellow-800'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>Only successful files will be submitted</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Foot />
    </>
  );
}