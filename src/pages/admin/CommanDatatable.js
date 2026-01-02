import { useState, useMemo, useEffect, useContext } from "react";
import Loder from "../../Components/Loder";
import Chatbox from "../../Components/Chatbox";
import { ThemeContext } from "../../Context/ThemeContext";
import { exportToExcel } from '../../helper/ExcelGenerate';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import { fetchWithAuth } from '../../utils/adminapi';
import {
    faTrash
} from '@fortawesome/free-solid-svg-icons';

export default function CommanDatatable({
    columns = [],
    data = [],
    rowsPerPageOptions = [50, 100, 200, 500, 'All'],
    loading = false,
    error = null,
    onSelectionChange = () => { }
}) {
    const { theme } = useContext(ThemeContext);
    const [status, setStatus] = useState("show");
    const [search, setSearch] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [orderid, setOrderid] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [fileType, setFileType] = useState("finish");
    const [isFetchingPage, setIsFetchingPage] = useState(false);
    const [tableData, setTableData] = useState({ cases: [], pagination: {} });
    const base_url = localStorage.getItem('skydent_admin_base_url');

    // ✅ Initialize table data from props (like CasesDatatable)
    useEffect(() => {
        if (data && data.cases) {
            setTableData(data);
        } else if (data && data.data && data.data.cases) {
            setTableData(data.data);
        } else if (Array.isArray(data)) {
            setTableData({
                cases: data,
                pagination: {
                    totalRecords: data.length,
                    recordsFetched: data.length,
                    perPage: rowsPerPageOptions[0],
                    currentPage: 1,
                    totalPages: 1,
                    previousPage: null,
                    nextPage: null
                }
            });
        }
    }, [data]);

    useEffect(() => {
        onSelectionChange(selectedRows);
    }, [selectedRows]);

    const casesData = tableData?.cases || [];
    const paginationInfo = tableData?.pagination || {
        totalRecords: 0,
        recordsFetched: 0,
        perPage: rowsPerPageOptions[0],
        currentPage: 1,
        totalPages: 1,
        previousPage: null,
        nextPage: null
    };

    const {
        totalRecords,
        recordsFetched,
        perPage,
        currentPage,
        totalPages,
        previousPage,
        nextPage
    } = paginationInfo;

    useEffect(() => {
        if (!loading && !isFetchingPage) {
            setStatus("hide");
        } else {
            setStatus("show");
        }
    }, [loading, isFetchingPage]);

    const filteredData = useMemo(() => {
        let filtered = casesData;

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
    }, [search, casesData, columns, sortConfig]);

    // ✅ Server-side pagination fetch (like CasesDatatable)
    const fetchPage = async (url) => {
        if (!url || isFetchingPage) return;

        setIsFetchingPage(true);
        setStatus("show");

        try {
            // Use base_url if provided URL is relative
            let fullUrl = url;
            if (base_url && !url.startsWith('http://') && !url.startsWith('https://')) {
                fullUrl = `${base_url}${url}`;
            }

            const response = await fetch(fullUrl, {
                headers: {
                    'X-Tenant': 'skydent',
                    'Authorization': `Bearer ${localStorage.getItem('skydent_admin_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('skydent_admin_token');
                window.location.href = '/login';
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newData = await response.json();

            if (newData && newData.data) {
                setTableData(newData.data);
            } else if (newData && newData.cases) {
                setTableData(newData);
            }

            setSelectedRows([]);
        } catch (error) {
            console.error("Failed to fetch:", error);
            alert("Failed to load page");
        } finally {
            setIsFetchingPage(false);
            setStatus("hide");
        }
    };

    const handlePreviousPage = () => {
        if (previousPage) fetchPage(previousPage);
    };

    const handleNextPage = () => {
        if (nextPage) fetchPage(nextPage);
    };

    const handlePageNumberClick = (pageNum) => {
        if (pageNum === currentPage || pageNum < 1 || pageNum > totalPages) return;

        // Determine base URL
        let baseUrl;
        if (nextPage || previousPage) {
            baseUrl = nextPage || previousPage;
        } else {
            // Use base_url for constructing endpoint
            const path = window.location.pathname;
            let endpoint = 'get-all-cases';
            if (path.includes('initial-file')) endpoint = 'get-initial-file';
            else if (path.includes('stl-file')) endpoint = 'get-stl-file';
            else if (path.includes('finished-file')) endpoint = 'get-finished-file';

            // Use base_url if available
            if (base_url) {
                baseUrl = `${base_url}/${endpoint}`;
            }
        }

        if (typeof baseUrl === 'string') {
            try {
                const urlObj = new URL(baseUrl, window.location.origin);

                // Use correct page parameter
                if (baseUrl.includes('page=')) {
                    urlObj.searchParams.set('page', pageNum);
                } else if (baseUrl.includes('page_orders=')) {
                    urlObj.searchParams.set('page_orders', pageNum);
                } else {
                    // Default to page parameter
                    urlObj.searchParams.set('page', pageNum);
                }

                if (perPage && perPage !== 'All') {
                    urlObj.searchParams.set('per_page', perPage);
                } else if (perPage === 'All') {
                    urlObj.searchParams.set('per_page', totalRecords);
                }

                fetchPage(urlObj.toString());
            } catch (error) {
                console.error('Error constructing URL:', error);
                // Fallback using base_url
                const endpoint = window.location.pathname.includes('initial-file') ? 'get-initial-file' :
                    window.location.pathname.includes('stl-file') ? 'get-stl-file' :
                        window.location.pathname.includes('finished-file') ? 'get-finished-file' :
                            'get-all-cases';

                let url;
                if (base_url) {
                    url = `${base_url}/${endpoint}?page=${pageNum}&per_page=${perPage === 'All' ? totalRecords : perPage}`;
                }
                fetchPage(url);
            }
        }
    };

    const handleRowsPerPageChange = (e) => {
        const value = e.target.value;

        if (value === 'All') {
            if (nextPage || previousPage) {
                const baseUrl = nextPage || previousPage;
                try {
                    const urlObj = new URL(baseUrl, window.location.origin);
                    urlObj.searchParams.delete('per_page');
                    urlObj.searchParams.set('per_page', totalRecords);
                    // Reset to first page
                    if (urlObj.searchParams.has('page')) {
                        urlObj.searchParams.set('page', 1);
                    }
                    if (urlObj.searchParams.has('page_orders')) {
                        urlObj.searchParams.set('page_orders', 1);
                    }
                    fetchPage(urlObj.toString());
                } catch (error) {
                    console.error('Error constructing URL:', error);
                }
            }
        } else {
            const newPerPage = parseInt(value);
            if (nextPage || previousPage) {
                const baseUrl = nextPage || previousPage;
                try {
                    const urlObj = new URL(baseUrl, window.location.origin);
                    urlObj.searchParams.delete('per_page');
                    urlObj.searchParams.set('per_page', newPerPage);
                    // Reset to first page
                    if (urlObj.searchParams.has('page')) {
                        urlObj.searchParams.set('page', 1);
                    }
                    if (urlObj.searchParams.has('page_orders')) {
                        urlObj.searchParams.set('page_orders', 1);
                    }
                    fetchPage(urlObj.toString());
                } catch (error) {
                    console.error('Error constructing URL:', error);
                }
            }
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
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

    const getPageNumbers = () => {
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
        document.getElementById('chatbox').style.display = "block";
    }

    // Theme-based styling functions
    const getBackgroundClass = () => {
        return theme === 'dark'
            ? 'bg-gray-900 text-white p-4 rounded-2xl shadow-lg'
            : 'p-4 bg-white text-gray-800 rounded-2xl shadow-lg';
    };

    const getTableHeaderClass = () => {
        return theme === 'dark'
            ? 'bg-gray-700 text-white'
            : 'bg-blue-600 text-white';
    };

    const getTableRowClass = (idx) => {
        if (theme === 'dark') {
            return idx % 2 === 0 ? 'bg-gray-800 text-white' : 'bg-gray-700 text-white';
        } else {
            return idx % 2 === 0 ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-800';
        }
    };

    const getInputClass = () => {
        return theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
            : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500';
    };

    const getSelectClass = () => {
        return theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-white'
            : 'bg-white border-gray-300 text-gray-800';
    };

    const getPaginationButtonStyle = (isActive = false) => {
        const baseStyle = {
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
        };

        if (theme === 'dark') {
            return {
                ...baseStyle,
                background: isActive ? "#4f46e5" : "#374151",
                color: isActive ? "#fff" : "#d1d5db",
                borderColor: isActive ? "#4f46e5" : "#4b5563",
            };
        } else {
            return {
                ...baseStyle,
                background: isActive ? "#007bff" : "#fff",
                color: isActive ? "#fff" : "#000",
                borderColor: "#ccc",
            };
        }
    };

    const getDisabledButtonStyle = () => {
        return theme === 'dark'
            ? { ...getPaginationButtonStyle(), background: "#1f2937", color: "#6b7280", cursor: "not-allowed" }
            : { ...getPaginationButtonStyle(), background: "#f8f9fa", color: "#6c757d", cursor: "not-allowed" };
    };

    const getNoDataClass = () => {
        return theme === 'dark'
            ? 'bg-gray-800 text-gray-300'
            : 'bg-gray-100 text-gray-600';
    };

    const toggleSelectRow = (id) =>
        setSelectedRows((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );

    const toggleSelectAll = () => {
        const visibleIds = casesData.map((r) => r.orderid);
        if (casesData.every((r) => selectedRows.includes(r.orderid))) {
            setSelectedRows(selectedRows.filter((id) => !visibleIds.includes(id)));
        } else {
            setSelectedRows([...new Set([...selectedRows, ...visibleIds])]);
        }
    };

    const handleBulkDownload = () => {
        if (!selectedRows.length) return alert("Please select at least one record!");

        let missingFiles = [];
        let downloadedCount = 0;

        selectedRows.forEach((id) => {
            const row = casesData.find((r) => r.orderid === id);
            if (!row) return;

            let path = null;

            if (fileType === "initial") path = row.file_path;
            else if (fileType === "stl") path = row.stl_file_path;
            else if (fileType === "finish") path = row.finish_file_path;

            if (path && path.trim() !== "") {
                try {
                    // Use base_url for file paths if they are relative
                    let fullPath = path;
                    if (base_url && !path.startsWith('http://') && !path.startsWith('https://') && !path.startsWith('blob:')) {
                        fullPath = `${base_url}${path}`;
                    }

                    const parts = fullPath.split("/");
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

        if (missingFiles.length > 0) {
            alert(`File not available for these record(s): ${missingFiles.join(", ")}`);
        } else if (downloadedCount === 0) {
            alert("No files available for the selected type.");
        }
    };

    const handleDelete = async (orderid, fname) => {
        try {
            // Use fetchWithAuth with base_url support
            let deleteUrl = '/delete-file';
            if (base_url && !deleteUrl.startsWith('http')) {
                deleteUrl = `${base_url}${deleteUrl}`;
            }

            const resp = await fetch(deleteUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${localStorage.getItem('skydent_admin_token')}`,
                    'X-Tenant': 'skydent'
                },
                body: JSON.stringify({ orderid, filename: fname })
            });

            const result = await resp.json();
            return result;
        } catch (err) {
            console.error("Error deleting file:", err);
            return { status: 'error', message: `Error deleting file for order ${orderid}` };
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedRows.length) return alert("Please select at least one record!");

        const selectedRowsData = casesData.filter(row => selectedRows.includes(row.orderid));
        const confirmMessage = `Are you sure you want to delete files for ${selectedRows.length} selected records?\n\nSelected Order IDs: ${selectedRows.join(", ")}`;

        if (!window.confirm(confirmMessage)) return;

        let successCount = 0;
        let failedCount = 0;
        let failedOrders = [];

        // ✅ Use Promise.all to delete all files in parallel
        const results = await Promise.all(
            selectedRowsData.map(async (row) => {
                const result = await handleDelete(row.orderid, row.fname);
                if (result.status === 'success') successCount++;
                else {
                    failedCount++;
                    failedOrders.push(row.orderid);
                }
            })
        );

        // ✅ Show one summary alert after all deletions
        let message = `🗑️ Bulk Delete Summary:\n\n`;
        message += `✅ Successfully deleted: ${successCount}\n`;
        if (failedCount > 0) {
            message += `❌ Failed to delete: ${failedCount}\n`;
            message += `Failed Order IDs: ${failedOrders.join(", ")}\n`;
        }
        alert(message);

        // ✅ Clear selection
        setSelectedRows([]);
    };

    // ✅ Determine current perPage value for select
    const currentPerPageValue = perPage === totalRecords || perPage;

    return (
        <>
            <Loder status={status} />
            <Chatbox orderid={orderid} />

            {status === "hide" && (
                <section
                    style={{ padding: "20px" }}
                    className={`overflow-scroll md:overflow-hidden rounded-xl mt-4 ${getBackgroundClass()}`}
                >
                    {(!Array.isArray(columns) || columns.length === 0) && (
                        <div className={`p-5 text-center rounded-lg ${getNoDataClass()}`}>
                            ⚠️ No columns provided.
                        </div>
                    )}

                    {Array.isArray(columns) && columns.length > 0 && (
                        <>
                            <div
                                style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}
                            >
                                <div className="flex justify-around items-center gap-4">
                                    <label className={theme === "dark" ? "text-white" : "text-gray-800"}>
                                        Rows per page:{" "}
                                        <select
                                            value={currentPerPageValue}
                                            onChange={handleRowsPerPageChange}
                                            className={`p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-400 ${getSelectClass()}`}
                                            disabled={isFetchingPage}
                                        >
                                            {rowsPerPageOptions.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <button
                                        onClick={() => exportToExcel(casesData, "Reports")}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-800 text-white text-sm font-medium rounded-md border border-green-600 transition-all duration-200 shadow-sm hover:shadow-md"
                                        disabled={isFetchingPage}>
                                        <FontAwesomeIcon icon={faDownload} className="text-white text-base" />
                                        Download Report
                                    </button>

                                </div>

                                <div>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={search}
                                        onChange={handleSearch}
                                        className={`p-2 w-64 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${getInputClass()}`}
                                        disabled={isFetchingPage}
                                    />
                                </div>
                            </div>

                            <table id="datatable" style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr className={getTableHeaderClass()}>
                                        <th style={{
                                            border: "1px solid #ddd",
                                            width: "10vh",
                                            minWidth: "10vh",
                                            maxWidth: "10vh",
                                            textAlign: "center",
                                            padding: "8px"
                                        }} className="border border-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={casesData.length > 0 && casesData.every((r) => selectedRows.includes(r.orderid))}
                                                onChange={toggleSelectAll}
                                                style={{ transform: "scale(1.3)", cursor: "pointer" }}
                                                disabled={isFetchingPage}
                                            />
                                        </th>

                                        {columns.map((col) => (
                                            <th
                                                key={col.accessor}
                                                onClick={() => handleSort(col.accessor)}
                                                style={{ border: "1px solid #ddd", padding: "12px", cursor: "pointer" }}
                                                className="font-bold"
                                            >
                                                {col.header}
                                                {sortConfig.key === col.accessor && (
                                                    <span style={{ marginLeft: "5px" }}>
                                                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                                                    </span>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map((row, idx) => (
                                            <tr key={idx} className={getTableRowClass(idx)}>
                                                <td style={{
                                                    border: "1px solid #ddd",
                                                    textAlign: "center",
                                                    padding: "8px",
                                                    width: "40px",
                                                    minWidth: "40px",
                                                    maxWidth: "40px"
                                                }} className="border border-gray-300">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRows.includes(row.orderid)}
                                                        onChange={() => toggleSelectRow(row.orderid)}
                                                        style={{ transform: "scale(1.3)", cursor: "pointer" }}
                                                        disabled={isFetchingPage}
                                                    />
                                                </td>

                                                {columns.map((col) => (
                                                    <td
                                                        key={col.accessor}
                                                        style={{
                                                            border: "1px solid #ddd",
                                                            padding: "10px",
                                                            wordBreak: "break-word",
                                                            maxWidth: "200px",
                                                            overflowWrap: "break-word",
                                                            whiteSpace: "normal",
                                                            fontSize: "12px",
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        {col.header === 'Order Id' ? (
                                                            <div>
                                                                <div className="text-sm text-black" >
                                                                    {row.orderid}
                                                                </div>
                                                            </div>
                                                        ) : col.header === 'Message' ? (
                                                            <div className="flex justify-center items-center relative">
                                                                <div className="relative group">
                                                                    <div
                                                                        className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] shadow-lg"
                                                                        onClick={() => openPopup(`${row.orderid}`)}
                                                                    >
                                                                        <svg
                                                                            className="w-6 h-6 text-slate-200"
                                                                            fill="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path d="M4 4h16v11H8l-4 4V4z" />
                                                                        </svg>
                                                                    </div>
                                                                    <span className="absolute -top-2 -right-2 bg-gradient-to-br from-green-500 to-green-600 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center shadow-lg ring-2 ring-white/80">
                                                                        {row.totalMessages > 99 ? '99+' : row.totalMessages || 0}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : col.header === 'Status' ? (
                                                            <div className="flex justify-center items-center">
                                                                {(() => {
                                                                    let statusColor = '';
                                                                    let textColor = 'text-white';

                                                                    switch (row.status?.toLowerCase()) {
                                                                        case 'completed':
                                                                            statusColor = 'bg-green-600';
                                                                            break;
                                                                        case 'pending':
                                                                            statusColor = 'bg-yellow-500';
                                                                            textColor = 'text-black';
                                                                            break;
                                                                        case 'new':
                                                                            statusColor = 'bg-blue-500';
                                                                            break;
                                                                        case 'cancelled':
                                                                            statusColor = 'bg-red-600';
                                                                            break;
                                                                        case 'qc':
                                                                            statusColor = 'bg-purple-600';
                                                                            break;
                                                                        case 'redesign':
                                                                            statusColor = 'bg-orange-500'
                                                                            break;
                                                                        default:
                                                                            statusColor = 'bg-gray-400';
                                                                            break;
                                                                    }

                                                                    return (
                                                                        <span
                                                                            className={`px-2 py-1 text-[12px] font-bold text-nowrap rounded-full shadow-md ${statusColor} ${textColor}`}
                                                                        >
                                                                            {row.status ? row.status : 'Unknown'}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </div>
                                                        ) : col.header === 'File' ? (
                                                            Number(row.file_deleted) === 0 && row.file_path !== null ? (
                                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full">
                                                                    Available
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">
                                                                    Deleted
                                                                </span>
                                                            )
                                                        ) : (
                                                            row[col.accessor] ?? "-"
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={columns.length + 1}
                                                className={`pl-40 p-5 text-center`}
                                            >
                                                <FontAwesomeIcon icon={faFolderOpen} size="lg" className="me-2 text-blue-500" />
                                                {search ? "No matching records found." : "No records found."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {casesData.length > 0 && perPage !== 'All' && totalPages > 1 && (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px" }}>
                                    <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                                        Showing {recordsFetched} of {totalRecords} entries
                                        (Page {currentPage} of {totalPages})
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                        <button
                                            onClick={handlePreviousPage}
                                            disabled={!previousPage || isFetchingPage}
                                            style={!previousPage ? getDisabledButtonStyle() : getPaginationButtonStyle()}
                                        >
                                            Prev
                                        </button>

                                        {getPageNumbers().map((page, i) => (
                                            <button
                                                key={i}
                                                style={
                                                    typeof page === "number" && currentPage === page
                                                        ? getPaginationButtonStyle(true)
                                                        : getPaginationButtonStyle()
                                                }
                                                onClick={() => typeof page === "number" && handlePageNumberClick(page)}
                                                disabled={page === "..." || isFetchingPage}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            onClick={handleNextPage}
                                            disabled={!nextPage || isFetchingPage}
                                            style={!nextPage ? getDisabledButtonStyle() : getPaginationButtonStyle()}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}

                            {casesData.length > 0 && perPage === 'All' && (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px" }}>
                                    <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                                        Showing all {totalRecords} entries
                                    </div>
                                </div>
                            )}

                            {selectedRows.length > 0 && (
                                <div
                                    className={`fixed bottom-5 left-1/2 transform -translate-x-1/2 z-9999 flex items-center gap-4 px-6 py-3 rounded-xl shadow-lg ${theme === "dark"
                                        ? "bg-gradient-to-r from-gray-800 to-gray-700 text-white border border-gray-600"
                                        : "bg-gradient-to-r from-blue-50 to-white border border-gray-300 text-gray-800"
                                        }`}
                                >
                                    <span className="font-semibold">
                                        ✅ {selectedRows.length} selected
                                    </span>

                                    <select
                                        value={fileType}
                                        onChange={(e) => setFileType(e.target.value)}
                                        className={`p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-400 ${theme === "dark"
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300 text-gray-800"
                                            }`}
                                    >
                                        <option value="initial">Initial Files</option>
                                        <option value="stl">STL Files</option>
                                        <option value="finish">Finished Files</option>
                                    </select>

                                    <button
                                        onClick={handleBulkDownload}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md flex items-center gap-2 transition"
                                    >
                                        <FontAwesomeIcon icon={faDownload} /> Download All
                                    </button>

                                    <button
                                        onClick={handleBulkDelete}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md flex items-center gap-2 transition"
                                    >
                                        <FontAwesomeIcon icon={faTrash} /> Delete File
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>
            )}
        </>
    );
}