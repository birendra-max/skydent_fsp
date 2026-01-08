import { useState, useMemo, useEffect, useContext } from "react";
import Loder from "../../Components/Loder";
import Chatbox from "../../Components/Chatbox";
import { ThemeContext } from "../../Context/ThemeContext";
import { exportToExcel } from '../../helper/ExcelGenerate';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faTrashCan, faFolderOpen, faPenToSquare, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { fetchWithAuth } from "../../utils/adminapi";
import { Link } from "react-router-dom";

export default function Datatable({
    columns = [],
    data = [],
    rowsPerPageOptions = [50, 100, 200, 500],
    loading = false,
    error = null
}) {
    const { theme } = useContext(ThemeContext);
    const [status, setStatus] = useState("show");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [orderid, setOrderid] = useState(null);
    const [tableData, setTableData] = useState(data); // ✅ Maintain local UI data
    const [showModal, setShowModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [formLoading, setFormLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        designation: "",
        email: "",
        occlusion: "",
        labname: "",
        mobile: "",
        anatomy: "",
        contact: "",
        pontic: "",
        password: "",
        remark: ""
    });

    // ✅ Update local data when parent data changes
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

    // ✅ Control loader based on parent's loading prop
    useEffect(() => {
        if (!loading) {
            setStatus("hide");
        } else {
            setStatus("show");
        }
    }, [loading]);

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

    function openPopup(id) {
        setOrderid(id);
        document.getElementById('chatbox').style.display = "block";
    }

    // ✅ Status Toggle with Instant UI Update
    const handleStatusToggle = async (userid, currentStatus) => {
        const newStatus = currentStatus?.toLowerCase() === "active" ? "inactive" : "active";

        // Instant UI update
        setTableData((prev) =>
            prev.map((item) =>
                item.userid === userid ? { ...item, status: newStatus } : item
            )
        );

        try {
            const res = await fetchWithAuth(`/update-status/${userid}`, {
                method: "PUT",
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.status !== "success") throw new Error("Update failed");

        } catch (err) {
            console.error("Status update error:", err);

            // Revert UI
            setTableData((prev) =>
                prev.map((item) =>
                    item.userid === userid ? { ...item, status: currentStatus } : item
                )
            );
        }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this client?")) return;

        try {
            const res = await fetchWithAuth(`/delete-user/${userId}`, {
                method: "DELETE",
            });

            if (res.status === "success") {
                setTableData((prev) => prev.filter((item) => item.userid !== userId));
                alert("✅ Client deleted successfully!");
            } else {
                alert(res.message || "Failed to delete client");
            }
        } catch (error) {
            console.error("Error deleting client:", error);
            alert("⚠️ Something went wrong. Please try again.");
        }
    };

    const editUser = (userid) => {
        if (userid !== '' && userid != null) {
            // Find the user data
            const user = tableData.find(item => item.userid === userid);
            if (user) {
                // Populate form data with user information
                setFormData({
                    name: user.name || "",
                    designation: user.designation || "",
                    email: user.email || "",
                    occlusion: user.occlusion || "",
                    labname: user.labname || "",
                    mobile: user.mobile || "",
                    anatomy: user.anatomy || "",
                    contact: user.contact || "",
                    pontic: user.pontic || "",
                    password: "", // Don't pre-fill password for security
                    remark: user.remark || ""
                });
                setShowModal(true);
            } else {
                alert('User not found');
            }
        } else {
            alert('User ID not found');
        }
    };

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setMessage({ text: "", type: "" });

        try {
            // Check if editing or adding new
            const userId = tableData.find(item =>
                item.email === formData.email ||
                item.mobile === formData.mobile
            )?.userid;

            const url = `/update-client/${userId}`;
            const method = 'PUT';

            const res = await fetchWithAuth(url, {
                method: method,
                body: JSON.stringify(formData),
            });

            if (res.status === "success") {
                setMessage({
                    text: res.message,
                    type: res.status,
                });

                setTimeout(() => {
                    setFormData({
                        name: "",
                        designation: "",
                        email: "",
                        occlusion: "",
                        labname: "",
                        mobile: "",
                        anatomy: "",
                        contact: "",
                        pontic: "",
                        password: "",
                        remark: ""
                    });
                    setShowModal(false);
                    setMessage({ text: "", type: "" });
                }, 2000);
            } else {
                setMessage({
                    text: res.message || "❌ Failed to save client",
                    type: "error"
                });
            }
        } catch (error) {
            console.error("Error saving client:", error);
            setMessage({
                text: "⚠️ Something went wrong. Please try again.",
                type: "error"
            });
        } finally {
            setFormLoading(false);
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

            {/* Popup Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className={`flex items-center justify-between p-6 rounded-t-2xl ${theme === "dark"
                            ? "bg-gray-800 border-b border-gray-700"
                            : "bg-white border-b border-gray-200"
                            }`}>
                            <h2 className="text-xl font-bold">Edit Client</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className={`p-2 rounded-lg hover:bg-opacity-20 ${theme === "dark"
                                    ? "hover:bg-gray-700 text-gray-300"
                                    : "hover:bg-gray-200 text-gray-600"
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Form Card */}
                        <div className={`p-8 rounded-b-2xl ${theme === "dark"
                            ? "bg-gray-900"
                            : "bg-white"
                            }`}
                        >
                            <form
                                onSubmit={handleSubmit}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                {/* Common input component */}
                                {[
                                    { label: "Full Name", name: "name", placeholder: "Enter client's name" },
                                    { label: "Designation", name: "designation", placeholder: "e.g., Dentist, Technician" },
                                    { label: "Email Address", name: "email", type: "email", placeholder: "Enter email" },
                                    { label: "Occlusion", name: "occlusion", placeholder: "Enter occlusion" },
                                    { label: "Lab Name", name: "labname", placeholder: "Enter lab name" },
                                    { label: "Mobile Number", name: "mobile", placeholder: "Enter mobile number" },
                                    { label: "Anatomy", name: "anatomy", placeholder: "Enter anatomy details" },
                                    { label: "Contact", name: "contact", placeholder: "Enter contact info" },
                                    { label: "Pontic", name: "pontic", placeholder: "Enter pontic info" },
                                ].map((field) => (
                                    <div key={field.name}>
                                        <label className="font-semibold block mb-2">{field.label}</label>
                                        <input
                                            type={field.type || "text"}
                                            name={field.name}
                                            value={formData[field.name]}
                                            onChange={handleChange}
                                            required
                                            placeholder={field.placeholder}
                                            className={`w-full p-3 rounded-md border focus:ring-2 focus:ring-blue-500 ${theme === "dark"
                                                ? "bg-gray-800 border-gray-700"
                                                : "bg-gray-50 border-gray-300"
                                                }`}
                                        />
                                    </div>
                                ))}

                                {/* Password Field with Eye Toggle */}
                                <div className="relative">
                                    <label className="font-semibold block mb-2">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Enter new password (leave blank to keep current)"
                                            className={`w-full p-3 pr-10 rounded-md border focus:ring-2 focus:ring-blue-500 ${theme === "dark"
                                                ? "bg-gray-800 border-gray-700"
                                                : "bg-gray-50 border-gray-300"
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-gray-500 hover:text-blue-600"
                                        >
                                            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Leave blank to keep current password
                                    </p>
                                </div>

                                {/* Remark full width */}
                                <div className="md:col-span-2">
                                    <label className="font-semibold block mb-2">Remark</label>
                                    <textarea
                                        name="remark"
                                        value={formData.remark}
                                        onChange={handleChange}
                                        placeholder="Enter remarks"
                                        rows={3}
                                        className={`w-full p-3 rounded-md border focus:ring-2 focus:ring-blue-500 ${theme === "dark"
                                            ? "bg-gray-800 border-gray-700"
                                            : "bg-gray-50 border-gray-300"
                                            }`}
                                    ></textarea>
                                </div>

                                {/* Submit Section */}
                                <div className="md:col-span-2 flex items-center justify-between mt-6">
                                    {/* Message Alert */}
                                    {message.text && (
                                        <div
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${message.type === "success"
                                                ? "bg-green-100 text-green-700 border border-green-300"
                                                : "bg-red-100 text-red-700 border border-red-300"
                                                }`}
                                        >
                                            {message.text}
                                        </div>
                                    )}

                                    <div className="flex items-center space-x-4 ml-auto">
                                        {/* Cancel Button */}
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${theme === "dark"
                                                ? "bg-gray-700 hover:bg-gray-600 text-white"
                                                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                                                }`}
                                        >
                                            Cancel
                                        </button>

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={formLoading}
                                            className={`px-8 py-2.5 rounded-lg font-semibold transition-all ${formLoading
                                                ? "bg-blue-400 text-white cursor-not-allowed"
                                                : "bg-blue-600 hover:bg-blue-700 text-white"
                                                }`}
                                        >
                                            {formLoading ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

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
                                                        {col.header === 'Order Id' ? (
                                                            <div>
                                                                <Link to={`/admin/orderDeatails/${row.orderid}`} className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-bold" > {row.orderid} </Link>
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
                                                                        {row.totalMessages > 99 ? '99+' : row.totalMessages}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : col.header === "Status" ? (
                                                            <div className="flex justify-center items-center">
                                                                {["active", "inactive"].includes(row.status?.toLowerCase()) && (
                                                                    <label className="relative inline-flex items-center cursor-pointer group">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={row.status?.toLowerCase() === "active"}
                                                                            onChange={() => handleStatusToggle(row.userid, row.status)}
                                                                            className="sr-only peer"
                                                                        />
                                                                        <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-all duration-300"></div>
                                                                        <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 transform peer-checked:translate-x-5 shadow-md"></span>
                                                                    </label>
                                                                )}
                                                            </div>
                                                        ) : col.header === 'Action' ? (
                                                            <div>
                                                                <button
                                                                    className="cursor-pointer mr-3"
                                                                    onClick={() => editUser(row.userid)}
                                                                    title="Edit Client"
                                                                >
                                                                    <FontAwesomeIcon
                                                                        icon={faPenToSquare}
                                                                        className="text-blue-500 text-lg"
                                                                    />
                                                                </button>
                                                                <button
                                                                    className="cursor-pointer"
                                                                    onClick={() => deleteUser(row.userid)}
                                                                    title="Delete Client"
                                                                >
                                                                    <FontAwesomeIcon icon={faTrashCan} className="text-red-500 text-lg" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            row[col.accessor] ?? "-"
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={columns.length} className={`pl-20 p-5 text-center`}>
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