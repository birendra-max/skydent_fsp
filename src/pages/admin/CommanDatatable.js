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
    const [fileType, setFileType] = useState("finish");

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


    const sendRedesign = async (orderId, status) => {
        if (status.toLowerCase() === 'completed') {
            try {
                const data = await fetchWithAuth(`send-for-redesign/${orderId}`, {
                    method: "GET",
                });

                // data is already the parsed JSON response
                if (data.status === 'success') {
                    alert(data.message);
                } else {
                    console.log(data.message);
                }
            } catch (error) {
                console.error("Error fetching cases:", error);
            }
        } else {
            alert(`${orderId} is not completed yet! You can't send it for redesign.`);
        }
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
        if (!selectedRows.length) return alert("Please select at least one record!");

        let missingFiles = [];
        let downloadedCount = 0;

        selectedRows.forEach((id) => {
            const row = data.find((r) => r.orderid === id);
            if (!row) return;

            let path = row.file_path;

            // ✅ Check if valid path exists
            if (path && path.trim() !== "") {
                try {
                    // ✅ Use your symbol-safe download logic
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
        if (missingFiles.length > 0) {
            alert(`File not available for these record(s): ${missingFiles.join(", ")}`);
        } else if (downloadedCount === 0) {
            alert("No files available for the selected type.");
        }
    };

    const handleDelete = async (orderid, fname) => {
        try {
            const resp = await fetchWithAuth('/delete-file', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ orderid, filename: fname })
            });

            return resp; // ✅ Return the response so caller can handle it
        } catch (err) {
            console.error("Error deleting file:", err);
            return { status: 'error', message: `Error deleting file for order ${orderid}` };
        }
    };


    const handleBulkDelete = async () => {
        if (!selectedRows.length) return alert("Please select at least one record!");

        const selectedRowsData = data.filter(row => selectedRows.includes(row.orderid));
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



    return (
        <>
            <Loder status={status} />
            <Chatbox orderid={orderid} />
            {/* Table is only shown after loader is hidden */}
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
                            {/* Search + Rows per page */}
                            <div
                                style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}
                            >
                                <div className="flex justify-around items-center gap-4">
                                    {/* Rows per page dropdown */}
                                    <label className={theme === "dark" ? "text-white" : "text-gray-800"}>
                                        Rows per page:{" "}
                                        <select
                                            value={rowsPerPage}
                                            onChange={handleRowsPerPageChange}
                                            className={`p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-400 ${getSelectClass()}`}
                                        >
                                            {rowsPerPageOptions.map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <button
                                        onClick={() => exportToExcel(data, "Reports")}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-800 text-white text-sm font-medium rounded-md border border-green-600 transition-all duration-200 shadow-sm hover:shadow-md">
                                        <FontAwesomeIcon icon={faDownload} className="text-white text-base" />
                                        Download Report
                                    </button>

                                </div>

                                {/* Search bar */}
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={search}
                                        onChange={handleSearch}
                                        className={`p-2 w-64 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${getInputClass()}`}
                                    />
                                </div>
                            </div>


                            {/* Table */}
                            <table id="datatable" style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr className={getTableHeaderClass()}>
                                        {/* ✅ Fixed checkbox column only */}
                                        <th style={{
                                            width: "10vh",
                                            minWidth: "10vh",
                                            maxWidth: "10vh",
                                            textAlign: "center",
                                            padding: "8px"
                                        }} className="border border-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={paginatedData.length > 0 && paginatedData.every((r) => selectedRows.includes(r.orderid))}
                                                onChange={toggleSelectAll}
                                                style={{ transform: "scale(1.3)", cursor: "pointer" }}
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
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((row, idx) => (
                                            <tr key={idx} className={getTableRowClass(idx)}>
                                                {/* ✅ Fixed checkbox cell only */}
                                                <td style={{
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
                                                        {col.header === 'Status' ? (
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
                                                                            className={`px-3 py-1 text-xs font-bold rounded-full shadow-md ${statusColor} ${textColor}`}
                                                                        >
                                                                            {row.status ? row.status : 'Unknown'}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </div>
                                                        ) : col.header === 'File' ? (
                                                            Number(row.file_deleted) === 0 ? (
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
                                                        )
                                                        }

                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={columns.length}
                                                className={`pl-40 p-5 text-center`}
                                            >
                                                <FontAwesomeIcon icon={faFolderOpen} size="lg" className="me-2 text-blue-500" />
                                                No records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {paginatedData.length > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px" }}>
                                    <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                                        Showing {paginatedData.length} of {filteredData.length} entries
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            style={currentPage === 1 ? getDisabledButtonStyle() : getPaginationButtonStyle()}
                                        >
                                            Prev
                                        </button>

                                        {getPageNumbers(totalPages, currentPage).map((page, i) => (
                                            <button
                                                key={i}
                                                style={
                                                    typeof page === "number" && currentPage === page
                                                        ? getPaginationButtonStyle(true)
                                                        : getPaginationButtonStyle()
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
                                            style={currentPage === totalPages ? getDisabledButtonStyle() : getPaginationButtonStyle()}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ✅ Floating Toolbar */}
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