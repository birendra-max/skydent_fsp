import { useState, useMemo, useEffect, useContext } from "react";
import Loder from "../../Components/Loder";
import Chatbox from "../../Components/Chatbox";
import { ThemeContext } from "../../Context/ThemeContext";
import { exportToExcel } from '../../helper/ExcelGenerate';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { fetchWithAuth } from '../../utils/designerapi';
import { Link } from 'react-router-dom';
import {
    faRepeat,
    faFolderOpen,
    faSearch,
    faSort,
    faSortUp,
    faSortDown
} from '@fortawesome/free-solid-svg-icons';

export default function Datatable({
    columns = [],
    data = [],
    rowsPerPageOptions = [50, 100, 200, 500],
}) {
    const { theme } = useContext(ThemeContext);
    const [status, setStatus] = useState("show");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [orderid, setOrderid] = useState(null);

    // ✅ NEW STATES for multi-select & dropdown
    const [selectedRows, setSelectedRows] = useState([]);
    const [fileType, setFileType] = useState("initial");

    // Filter & Sort
    const filteredData = useMemo(() => {
        let filtered = data || [];

        if (search) {
            filtered = filtered.filter((row) =>
                columns.some((col) =>
                    String(row[col.accessor] ?? "")
                        .toLowerCase()
                        .includes(search.toLowerCase())
                )
            );
        }

        if (sortConfig.key) {
            filtered = [...filtered].sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;

                const isNumeric = !isNaN(aVal) && !isNaN(bVal);

                if (isNumeric) {
                    return sortConfig.direction === "asc"
                        ? Number(aVal) - Number(bVal)
                        : Number(bVal) - Number(aVal);
                } else {
                    return sortConfig.direction === "asc"
                        ? String(aVal).localeCompare(String(bVal))
                        : String(bVal).localeCompare(String(aVal));
                }
            });
        }

        return filtered;
    }, [search, data, columns, sortConfig]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredData.slice(start, start + rowsPerPage);
    }, [currentPage, filteredData, rowsPerPage]);

    // ✅ Spinner control: hide loader once data is ready
    useEffect(() => {
        if (data && data.length > 0) {
            setStatus("hide");
        }

        setTimeout(() => {
            setStatus('hide');
        }, 1000)

    }, [data]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        } else if (sortConfig.key === key && sortConfig.direction === "desc") {
            setSortConfig({ key: null, direction: "asc" });
            return;
        }
        setSortConfig({ key, direction });
    };

    const handleRowsPerPageChange = (e) => {
        setRowsPerPage(parseInt(e.target.value));
        setCurrentPage(1);
    };

    const getPageNumbers = (totalPages, currentPage) => {
        const maxButtons = 5;
        const pages = [];

        if (totalPages <= maxButtons) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) pages.push(1, "...");
        for (let i = startPage; i <= endPage; i++) pages.push(i);
        if (endPage < totalPages) pages.push("...", totalPages);

        return pages;
    };

    function openPopup(id) {
        setOrderid(id);
        document.getElementById('chatbox').style.display = "block"
    }

    // Theme-based styling functions
    const getBackgroundClass = () => {
        return theme === 'dark'
            ? 'bg-gray-900 text-white mt-4'
            : 'bg-gradient-to-br from-slate-50 to-blue-50 text-gray-800 mt-4';
    };

    const getTableHeaderClass = () => {
        return theme === 'dark'
            ? 'bg-gradient-to-r from-gray-800 to-gray-700 text-white border-b border-gray-600'
            : 'bg-gradient-to-r from-cyan-800 to-cyan-900 text-white border-b border-blue-500';
    };

    const getTableRowClass = (idx) => {
        if (theme === 'dark') {
            return idx % 2 === 0 ? 'bg-gray-800 hover:bg-gray-750 text-white' : 'bg-gray-700 hover:bg-gray-650 text-white';
        } else {
            return idx % 2 === 0 ? 'bg-white hover:bg-blue-50 text-gray-800' : 'bg-gray-50 hover:bg-blue-50 text-gray-800';
        }
    };

    const getInputClass = () => {
        return theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
    };

    const getSelectClass = () => {
        return theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            : 'bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
    };

    const getButtonClass = (isActive = false) => {
        if (theme === 'dark') {
            return `px-3 py-2 rounded-lg font-medium transition-all duration-200 ${isActive
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                }`;
        } else {
            return `px-3 py-2 rounded-lg font-medium transition-all duration-200 ${isActive
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`;
        }
    };

    const getDisabledButtonClass = () => {
        return theme === 'dark'
            ? 'px-3 py-2 rounded-lg bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
            : 'px-3 py-2 rounded-lg bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed';
    };

    const getNoDataClass = () => {
        return theme === 'dark'
            ? 'bg-gray-800 text-gray-300 border border-gray-700'
            : 'bg-white text-gray-600 border border-gray-200';
    };

    // ✅ Multi-select logic
    const toggleSelectRow = (id) =>
        setSelectedRows((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );

    const toggleSelectAll = () => {
        const visibleIds = paginatedData.map((r) => r.orderid);
        if (paginatedData.every((r) => selectedRows.includes(r.orderid))) {
            setSelectedRows(selectedRows.filter((id) => !visibleIds.includes(id)));
        } else {
            setSelectedRows([...new Set([...selectedRows, ...visibleIds])]);
        }
    };

    const handleBulkDownload = () => {
        if (!selectedRows.length) {
            alert("Please select at least one record to proceed with the download.");
            return;
        }

        let missingFiles = [];
        let downloadedCount = 0;

        selectedRows.forEach((id) => {
            const row = data.find((r) => r.orderid === id);
            if (!row) return;

            let path = null;

            if (fileType === "initial") path = row.file_path;
            else if (fileType === "stl") path = row.stl_file_path;
            else if (fileType === "finish") path = row.finish_file_path;

            if (path && path.trim() !== "") {
                try {
                    const parts = path.split("/");
                    const encodedFile = encodeURIComponent(parts.pop());
                    const encodedUrl = parts.join("/") + "/" + encodedFile;

                    const link = document.createElement("a");
                    link.href = encodedUrl;
                    link.download = `${fileType}_${id}`;
                    link.target = "_blank";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    downloadedCount++;
                } catch (err) {
                    console.error("Download error:", err);
                    missingFiles.push(id);
                }
            } else {
                missingFiles.push(id);
            }
        });

        // Professional Notification Section
        if (missingFiles.length > 0) {
            alert(
                `Download Summary\n\n` +
                `Files Successfully Downloaded: ${downloadedCount}\n` +
                `Files Not Available: ${missingFiles.length}\n\n` +
                `File Not found for this IDs: ${missingFiles.join(", ")}`
            );
        }
        else if (downloadedCount === 0) {
            alert("No files are available for the selected file type.");
        }
    };

    return (
        <>
            <Loder status={status} />
            <Chatbox orderid={orderid} />

            {status === "hide" && (
                <section className={`p-4 rounded-xl ${getBackgroundClass()}`}>
                    {(!Array.isArray(columns) || columns.length === 0) && (
                        <div className={`p-8 text-center rounded-xl border ${getNoDataClass()}`}>
                            <FontAwesomeIcon icon={faFolderOpen} size="2x" className="mb-3 text-blue-500 opacity-60" />
                            <p className="text-lg font-medium">⚠️ No columns provided.</p>
                        </div>
                    )}

                    {Array.isArray(columns) && columns.length > 0 && (
                        <>
                            {/* Header Controls */}
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    {/* Rows per page */}
                                    <div className="flex items-center gap-2">
                                        <label className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                            Rows per page:
                                        </label>
                                        <select
                                            value={rowsPerPage}
                                            onChange={handleRowsPerPageChange}
                                            className={`px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all ${getSelectClass()}`}
                                        >
                                            {rowsPerPageOptions.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Download Report */}
                                    <button
                                        onClick={() => exportToExcel(data, "Reports")}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm font-medium rounded-lg border border-green-600 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
                                    >
                                        <FontAwesomeIcon icon={faDownload} className="text-white" />
                                        Download Report
                                    </button>

                                    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl`}>

                                        <select
                                            value={fileType}
                                            onChange={(e) => setFileType(e.target.value)}
                                            className={`px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all ${getSelectClass()}`}
                                        >
                                            <option value="initial">Initial Files</option>
                                            <option value="stl">STL Files</option>
                                            <option value="finish">Finished Files</option>
                                        </select>

                                        <button
                                            onClick={handleBulkDownload}
                                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200 font-medium text-sm cursor-pointer"
                                        >
                                            <FontAwesomeIcon icon={faDownload} /> Download All
                                        </button>
                                    </div>
                                </div>

                                {/* Search */}
                                <div className="relative">
                                    <FontAwesomeIcon
                                        icon={faSearch}
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search across all columns..."
                                        value={search}
                                        onChange={handleSearch}
                                        className={`pl-10 pr-4 py-2 w-80 rounded-lg border text-sm focus:outline-none transition-all ${getInputClass()}`}
                                    />
                                </div>
                            </div>

                            {/* Table Container */}
                            <div className="rounded-sm overflow-hidden shadow-lg">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className={getTableHeaderClass()}>
                                                {/* Checkbox Column */}
                                                <th className="p-4 text-center border-r border-gray-500/30 w-16">
                                                    <input
                                                        type="checkbox"
                                                        checked={paginatedData.length > 0 && paginatedData.every((r) => selectedRows.includes(r.orderid))}
                                                        onChange={toggleSelectAll}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer transform scale-125"
                                                    />
                                                </th>

                                                {columns.map((col) => (
                                                    <th
                                                        key={col.accessor}
                                                        onClick={() => handleSort(col.accessor)}
                                                        className="p-4 text-left font-semibold text-sm cursor-pointer hover:bg-gray-600/50 transition-colors border-r border-gray-500/100 last:border-r-0"
                                                    >
                                                        <div className="flex items-center gap-2 font-bold">
                                                            {col.header}
                                                            <FontAwesomeIcon
                                                                icon={
                                                                    sortConfig.key === col.accessor
                                                                        ? sortConfig.direction === "asc"
                                                                            ? faSortUp
                                                                            : faSortDown
                                                                        : faSort
                                                                }
                                                                className={`text-xs ${sortConfig.key === col.accessor
                                                                    ? 'text-blue-300'
                                                                    : 'text-gray-400'
                                                                    }`}
                                                            />
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedData.length > 0 ? (
                                                paginatedData.map((row, idx) => (
                                                    <tr key={idx} className={`${getTableRowClass(idx)} transition-colors duration-200`}>
                                                        {/* Checkbox Cell */}
                                                        <td className="p-4 text-center border-r border-gray-300/30 dark:border-gray-600/30">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedRows.includes(row.orderid)}
                                                                onChange={() => toggleSelectRow(row.orderid)}
                                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer transform scale-125"
                                                            />
                                                        </td>

                                                        {columns.map((col) => (
                                                            <td
                                                                key={col.accessor}
                                                                className="p-4 text-[12px] border-r border-gray-300/30 dark:border-gray-600/30 last:border-r-0"
                                                            >
                                                                {col.header === 'Order Id' ? (
                                                                    <div>
                                                                        <Link
                                                                            to={`/designer/orderDeatails/${row.orderid}`}
                                                                            className="text-[14px] text-blue-600 hover:text-blue-800 hover:underline font-bold transition-colors"
                                                                        >
                                                                            {row.orderid}
                                                                        </Link>
                                                                    </div>
                                                                ) : col.header === 'Message' ? (
                                                                    <div className="flex justify-center items-center relative">
                                                                        <div className="relative group">
                                                                            <img
                                                                                src="/img/messages.png"
                                                                                alt="Message"
                                                                                className="w-9 h-9 cursor-pointer transition-all duration-200 group-hover:scale-110 group-hover:rotate-12"
                                                                                onClick={() => openPopup(`${row.orderid}`)}
                                                                            />
                                                                            <span className=" absolute -top-2 -right-2  bg-gradient-to-br from-red-500 via-red-600 to-red-700  text-white text-[12px] font-semibold  rounded-full min-w-[18px] h-[18px]  flex items-center justify-center  shadow-[0_0_8px_rgba(255,0,0,0.6)]ring-2 ring-white/60 backdrop-blur-sm">
                                                                                {row.totalMessages > 99 ? '99+' : row.totalMessages}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ) : col.header === 'Status' ? (
                                                                    <div className="flex justify-center">
                                                                        {(() => {
                                                                            let statusColor = '';
                                                                            let textColor = 'text-white';

                                                                            switch (row.status?.toLowerCase()) {
                                                                                case 'completed':
                                                                                    statusColor = 'bg-gradient-to-r from-green-500 to-green-600';
                                                                                    break;
                                                                                case 'pending':
                                                                                    statusColor = 'bg-gradient-to-r from-yellow-500 to-yellow-600';
                                                                                    textColor = 'text-gray-900';
                                                                                    break;
                                                                                case 'new':
                                                                                    statusColor = 'bg-gradient-to-r from-blue-500 to-blue-600';
                                                                                    break;
                                                                                case 'cancelled':
                                                                                    statusColor = 'bg-gradient-to-r from-red-500 to-red-600';
                                                                                    break;
                                                                                case 'qc':
                                                                                    statusColor = 'bg-gradient-to-r from-purple-500 to-purple-600';
                                                                                    break;
                                                                                case 'redesign':
                                                                                    statusColor = 'bg-gradient-to-r from-orange-500 to-orange-600';
                                                                                    break;
                                                                                default:
                                                                                    statusColor = 'bg-gradient-to-r from-gray-500 to-gray-600';
                                                                                    break;
                                                                            }

                                                                            return (
                                                                                <span
                                                                                    className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-md ${statusColor} ${textColor} transition-all duration-200 hover:shadow-lg`}
                                                                                >
                                                                                    {row.status ? row.status : 'Unknown'}
                                                                                </span>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                ) : (
                                                                    <div className="truncate max-w-xs" title={row[col.accessor] ?? "-"}>
                                                                        {row[col.accessor] ?? "-"}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={columns.length + 1} className="p-8 text-center">
                                                        <div className={`flex flex-col items-center justify-center p-8 rounded-lg ${getNoDataClass()}`}>
                                                            <FontAwesomeIcon icon={faFolderOpen} size="3x" className="mb-4 text-blue-500 opacity-60" />
                                                            <p className="text-lg font-medium mb-2">No records found</p>
                                                            <p className="text-sm opacity-75">Try adjusting your search criteria</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pagination */}
                            {paginatedData.length > 0 && (
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                                    <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Showing <span className="font-bold">{paginatedData.length}</span> of <span className="font-bold">{filteredData.length}</span> entries
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={currentPage === 1 ? getDisabledButtonClass() : getButtonClass()}
                                        >
                                            Previous
                                        </button>

                                        {getPageNumbers(totalPages, currentPage).map((page, i) => (
                                            <button
                                                key={i}
                                                className={
                                                    typeof page === "number" && currentPage === page
                                                        ? getButtonClass(true)
                                                        : page === "..."
                                                            ? getDisabledButtonClass()
                                                            : getButtonClass()
                                                }
                                                onClick={() => typeof page === "number" && handlePageChange(page)}
                                                disabled={page === "..."}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={currentPage === totalPages ? getDisabledButtonClass() : getButtonClass()}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </section>
            )}
        </>
    );
}