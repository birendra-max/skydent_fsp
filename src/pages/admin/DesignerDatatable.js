import { useState, useMemo, useEffect, useContext } from "react";
import Loder from "../../Components/Loder";
import Chatbox from "../../Components/Chatbox";
import { ThemeContext } from "../../Context/ThemeContext";
import { exportToExcel } from '../../helper/ExcelGenerate';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faTrashCan, faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import { fetchWithAuth } from "../../utils/adminapi";

export default function DesignerDatatable({
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
    const [tableData, setTableData] = useState(data); // ✅ Maintain local UI data

    useEffect(() => {
        setTableData(data);
    }, [data]);

    // ✅ Filter & Sort
    const filteredData = useMemo(() => {
        let filtered = tableData || [];

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
                return isNumeric
                    ? sortConfig.direction === "asc"
                        ? Number(aVal) - Number(bVal)
                        : Number(bVal) - Number(aVal)
                    : sortConfig.direction === "asc"
                        ? String(aVal).localeCompare(String(bVal))
                        : String(bVal).localeCompare(String(aVal));
            });
        }
        return filtered;
    }, [search, tableData, columns, sortConfig]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredData.slice(start, start + rowsPerPage);
    }, [currentPage, filteredData, rowsPerPage]);

    // ✅ Spinner control
    useEffect(() => {
        if (tableData && tableData.length > 0) {
            setStatus("hide");
        }
    }, [tableData]);

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


    const getPageNumbers = (totalPages, currentPage) => {
        const maxButtons = 5;
        const pages = [];
        if (totalPages <= maxButtons)
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);
        if (startPage > 1) pages.push(1, "...");
        for (let i = startPage; i <= endPage; i++) pages.push(i);
        if (endPage < totalPages) pages.push("...", totalPages);
        return pages;
    };

    // ✅ Status Toggle with Instant UI Update
    const handleStatusToggle = async (desiid, currentStatus) => {
        const newStatus = currentStatus?.toLowerCase() === "active" ? "inactive" : "active";

        // Instant UI update
        setTableData((prev) =>
            prev.map((item) =>
                item.desiid === desiid ? { ...item, status: newStatus } : item
            )
        );

        try {
            const res = await fetchWithAuth(`/update-status-designer/${desiid}`, {
                method: "PUT",
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.status !== "success") throw new Error("Update failed"); // ✅ FIX 2: Correct success check

        } catch (error) {
            setTableData((prev) =>
                prev.map((item) =>
                    item.desiid === desiid ? { ...item, status: currentStatus } : item
                )
            );
        }
    };

    const deleteUser = async (desiId) => {
        if (!window.confirm("Are you sure you want to delete this designer?")) return;

        try {
            const res = await fetchWithAuth(`/delete-designer/${desiId}`, {
                method: "DELETE",
            });

            if (res.status === "success") {
                setTableData((prev) => prev.filter((item) => item.desiid !== desiId));
                alert("✅ Designer deleted successfully!");
            } else {
                alert(data.message || "Failed to delete designer");
            }
        } catch (error) {
            console.error("Error deleting designer:", error);
            alert("⚠️ Something went wrong. Please try again.");
        }
    };

    // ✅ Theme-based styling helpers
    const getBackgroundClass = () =>
        theme === 'dark' ? 'bg-gray-900 text-white p-4 rounded-2xl shadow-lg' : 'p-4 bg-white text-gray-800 rounded-2xl shadow-lg';
    const getTableHeaderClass = () =>
        theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-blue-600 text-white';
    const getTableRowClass = (idx) =>
        theme === 'dark'
            ? idx % 2 === 0 ? 'bg-gray-800 text-white' : 'bg-gray-700 text-white'
            : idx % 2 === 0 ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-800';
    const getInputClass = () =>
        theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
            : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500';
    const getSelectClass = () =>
        theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-white'
            : 'bg-white border-gray-300 text-gray-800';
    const getNoDataClass = () =>
        theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600';

    return (
        <>
            <Loder status={status} />
            <Chatbox orderid={orderid} />

            {status === "hide" && (
                <section className={`overflow-scroll md:overflow-hidden mt-4 ${getBackgroundClass()}`}>
                    {columns.length === 0 ? (
                        <div className={`p-5 text-center rounded-lg ${getNoDataClass()}`}>
                            ⚠️ No columns provided.
                        </div>
                    ) : (
                        <>
                            {/* Controls */}
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-4">
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
                                        onClick={() => exportToExcel(tableData, "Reports")}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-700 text-white text-sm font-medium rounded-md border border-green-600 transition-all duration-200"
                                    >
                                        <FontAwesomeIcon icon={faDownload} />
                                        Download Report
                                    </button>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={handleSearch}
                                    className={`p-2 w-64 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${getInputClass()}`}
                                />
                            </div>

                            {/* Table */}
                            <table id="datatable" className="w-full border-collapse">
                                <thead>
                                    <tr className={getTableHeaderClass()}>
                                        {columns.map((col) => (
                                            <th
                                                key={col.accessor}
                                                onClick={() => handleSort(col.accessor)}
                                                className="py-3 px-4 border border-gray-300 cursor-pointer text-sm font-bold"
                                            >
                                                {col.header}
                                                {sortConfig.key === col.accessor && (
                                                    <span className="ml-1">
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
                                                {columns.map((col) => (
                                                    <td key={col.accessor} className="border border-gray-300 py-2 px-3 text-center text-[12px]">
                                                        {col.header === "Status" ? (
                                                            <div className="flex justify-center items-center">
                                                                {["active", "inactive"].includes(row.status?.toLowerCase()) && (
                                                                    <label className="relative inline-flex items-center cursor-pointer group">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={row.status?.toLowerCase() === "active"}
                                                                            onChange={() => handleStatusToggle(row.desiid, row.status)}
                                                                            className="sr-only peer"
                                                                        />
                                                                        <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-all duration-300"></div>
                                                                        <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 transform peer-checked:translate-x-5 shadow-md"></span>
                                                                    </label>
                                                                )}
                                                            </div>
                                                        ) : col.header === 'Delete' ? (
                                                            <button className="cursor-pointer" onClick={() => deleteUser(row.desiid)}>
                                                                <FontAwesomeIcon icon={faTrashCan} className="text-red-500 text-lg" />
                                                            </button>
                                                        ) : (
                                                            row[col.accessor] ?? "-"
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={columns.length} className={`pl-10 p-5 text-center ${getNoDataClass()}`}>
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
                        </>
                    )}
                </section>
            )}
        </>
    );
}
