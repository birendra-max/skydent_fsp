import { useContext, useState, useEffect } from "react";
import Hd from "./Hd";
import Foot from './Foot';
import { ThemeContext } from "../../Context/ThemeContext";
import CasesDatatable from "./CasesDatatable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUserGear,
    faPaperPlane,
    faUsers,
    faCheckCircle
} from "@fortawesome/free-solid-svg-icons";
import { fetchWithAuth } from "../../utils/adminapi";
import Sidebar from "./Sidebar";

export default function AssignOrders() {
    const { theme } = useContext(ThemeContext);
    const [selectedFilter, setSelectedFilter] = useState('1');
    const [orderId, setOrderId] = useState('');
    const [selectedDesigner, setSelectedDesigner] = useState('');
    const [designers, setDesigners] = useState([]);
    const [allData, setAllData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [assignMode, setAssignMode] = useState('single'); // 'single' or 'bulk'

    const themeClasses = {
        main: theme === "dark" ? "bg-gray-950 text-gray-100" : "bg-gray-100 text-gray-900",
        card: theme === "dark" ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200",
        input:
            theme === "dark"
                ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-600",
        select:
            theme === "dark"
                ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-600",
        button: {
            assign:
                theme === "dark"
                    ? "bg-purple-700 hover:bg-purple-600 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white",
            bulkAssign:
                theme === "dark"
                    ? "bg-green-700 hover:bg-green-600 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white",
            filterActive:
                theme === "dark"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-blue-600 text-white shadow-md",
            filterInactive:
                theme === "dark"
                    ? "bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100",
            modeActive:
                theme === "dark"
                    ? "bg-purple-800 text-white border border-purple-600"
                    : "bg-purple-100 text-purple-800 border border-purple-300",
            modeInactive:
                theme === "dark"
                    ? "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200",
        },
    };

    const filterButtons = [
        { value: "1", label: "All" },
        { value: "5", label: "New" },
        { value: "6", label: "In Progress" },
        { value: "7", label: "QC Required" },
        { value: "8", label: "On Hold" },
        { value: "9", label: "Designed Completed" },
        { value: "10", label: "Canceled" },
        { value: "11", label: "Redesign" },
    ];

    // Order ID input validation
    const handleOrderIdChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setOrderId(value);
    };

    const fetchDesigners = async () => {
        try {
            const response = await fetchWithAuth("/get-designers", {
                method: "GET",
            });

            if (response && response.status === "Success") {
                const designersData = response.designers || [];
                const validDesigners = designersData.filter(d => d && d.desiid !== undefined && d.desiid !== null);
                setDesigners(validDesigners);
            } else {
                setDesigners([]);
            }
        } catch (error) {
            setDesigners([]);
        }
    };

    // Apply filters
    const applyFilters = () => {
        if (!allData.length) {
            setFilteredData([]);
            return;
        }

        let filtered = [...allData];

        // Apply status filter
        if (selectedFilter !== '1') {
            const statusMap = {
                '5': 'New',
                '6': 'Pending',
                '7': 'Qc',
                '8': 'Hold',
                '9': 'Completed',
                '10': 'Cancelled',
                '11': 'Redesign'
            };
            const targetStatus = statusMap[selectedFilter];

            if (targetStatus) {
                filtered = filtered.filter(item => {
                    const itemStatus = item.status?.toLowerCase();
                    const targetStatusLower = targetStatus.toLowerCase();
                    return itemStatus === targetStatusLower;
                });
            }
        }

        // Apply order ID filter if entered
        if (orderId) {
            const searchId = parseInt(orderId);
            if (!isNaN(searchId)) {
                filtered = filtered.filter(item => {
                    const itemId = parseInt(item.orderid);
                    return !isNaN(itemId) && itemId === searchId;
                });
            }
        }

        setFilteredData(filtered);
    };

    // Filter button handler
    const handleFilterClick = (filterValue) => {
        setSelectedFilter(filterValue);
    };

    // Assign orders to designer (handles both single and bulk)
    const handleAssignOrders = async () => {
        if (assignMode === 'single') {
            // Single assignment validation
            if (!orderId) {
                setError("Please enter an Order ID");
                setTimeout(() => setError(''), 3000);
                return;
            }
        } else {
            // Bulk assignment validation
            if (!selectedOrders.length) {
                setError("Please select at least one order from the table below");
                setTimeout(() => setError(''), 3000);
                return;
            }
        }

        if (!selectedDesigner) {
            setError("Please select a designer");
            setTimeout(() => setError(''), 3000);
            return;
        }

        try {
            setAssigning(true);
            setError(null);
            setSuccessMessage('');

            // Prepare request data based on mode
            const requestData = assignMode === 'single' 
                ? { order_id: orderId, designer_id: selectedDesigner }
                : { order_ids: selectedOrders, designer_id: selectedDesigner };

            const responseData = await fetchWithAuth("/assign-order-to-designer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            if (responseData?.status === "Success" || responseData?.status === "success") {
                if (assignMode === 'single') {
                    setSuccessMessage(`Order #${orderId} successfully assigned to Designer ${selectedDesigner}!`);
                    setOrderId('');
                } else {
                    setSuccessMessage(`✅ Successfully assigned ${selectedOrders.length} order(s) to Designer ${selectedDesigner}!`);
                    setSelectedOrders([]);
                }
                
                setSelectedDesigner('');
                await fetchAllCases();
                setTimeout(() => setSuccessMessage(''), 5000);
            } else {
                setError(responseData?.message || "Failed to assign orders. Please try again.");
                setTimeout(() => setError(''), 5000);
            }
        } catch (error) {
            setError("Network error. Please check your connection.");
            setTimeout(() => setError(''), 5000);
        } finally {
            setAssigning(false);
        }
    };

    // Handle selection change from datatable
    const handleSelectionChange = (selectedIds) => {
        setSelectedOrders(selectedIds);
    };

    // Clear all filters
    const handleClearFilters = () => {
        setSelectedFilter('1');
        setOrderId('');
        setSelectedDesigner('');
        setFilteredData(allData);
        setError(null);
        setSuccessMessage('');
    };

    // Clear selections
    const handleClearSelections = () => {
        setSelectedOrders([]);
    };

    // Fetch all cases
    const fetchAllCases = async () => {
        try {
            setLoading(true);
            setError(null);
            const responseData = await fetchWithAuth("/get-all-cases", {
                method: "GET",
            });

            if (responseData?.status === "success") {
                const casesData = responseData.new_cases || responseData.cases || responseData.all_cases || [];
                setAllData(casesData);
                setFilteredData(casesData);
            } else {
                setAllData([]);
                setFilteredData([]);
            }
        } catch (error) {
            setAllData([]);
            setFilteredData([]);
            setError("Network error. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch all cases and designers on component mount
    useEffect(() => {
        fetchAllCases();
        fetchDesigners();
    }, []);

    // Apply filters whenever any filter criteria changes
    useEffect(() => {
        applyFilters();
    }, [selectedFilter, orderId, allData]);

    // Define columns
    const columns = [
        { header: "Order Id", accessor: "orderid" },
        { header: "File Name", accessor: "fname" },
        { header: "TAT", accessor: "tduration" },
        { header: "Status", accessor: "status" },
        { header: "Unit", accessor: "unit" },
        { header: "Tooth", accessor: "tooth" },
        { header: "Run Self By", accessor: "run_self_by" },
        { header: "Assigned To", accessor: "assign_to" },
        { header: "Assign Date", accessor: "assign_date" },
    ];

    return (
        <>
            <Hd />

            <main className={`min-h-screen flex transition-all duration-300 ${themeClasses.main}`}>
                {/* Sidebar */}
                <div className="fixed top-0 left-0 h-full w-64 z-20">
                    <Sidebar />
                </div>

                {/* Main Content */}
                <div className="flex-1 ml-64 p-4 mt-16 space-y-8">
                    {/* Assign Order Card */}
                    <div className={`rounded-2xl p-6 shadow-lg ${themeClasses.card}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <FontAwesomeIcon icon={faUserGear} className="text-blue-500" />
                                Assign Task to Designer
                            </h2>
                            <div className="flex gap-2">
                                {selectedOrders.length > 0 && (
                                    <button
                                        onClick={handleClearSelections}
                                        className={`px-4 py-2 text-sm rounded-lg ${themeClasses.button.filterInactive}`}
                                    >
                                        Clear Selections ({selectedOrders.length})
                                    </button>
                                )}
                                <button
                                    onClick={handleClearFilters}
                                    className={`px-4 py-2 text-sm rounded-lg ${themeClasses.button.filterInactive}`}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>

                        {/* Success Message */}
                        {successMessage && (
                            <div className="mb-4 p-3 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-lg">
                                {successMessage}
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-lg">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Assign Mode Selection */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setAssignMode('single')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${assignMode === 'single' ? themeClasses.button.modeActive : themeClasses.button.modeInactive}`}
                            >
                                <FontAwesomeIcon icon={faPaperPlane} />
                                Single Order Assign
                            </button>
                            <button
                                onClick={() => setAssignMode('bulk')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${assignMode === 'bulk' ? themeClasses.button.modeActive : themeClasses.button.modeInactive}`}
                            >
                                <FontAwesomeIcon icon={faUsers} />
                                Multiple Order Assign
                            </button>
                        </div>

                        {/* Single Order Assignment Form */}
                        {assignMode === 'single' && (
                            <div className="grid grid-cols-10 gap-4 items-center mb-6">
                                {/* Order ID */}
                                <div className="col-span-3">
                                    <label className="block text-sm font-medium mb-2">Order ID</label>
                                    <input
                                        type="text"
                                        value={orderId}
                                        onChange={handleOrderIdChange}
                                        placeholder="Enter Order ID (e.g., 1001)"
                                        className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-purple-500 transition-all ${themeClasses.input}`}
                                    />
                                </div>

                                {/* Designer Dropdown */}
                                <div className="col-span-4">
                                    <label className="block text-sm font-medium mb-2">Select Designer</label>
                                    <select
                                        value={selectedDesigner}
                                        onChange={(e) => setSelectedDesigner(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-purple-500 transition-all ${themeClasses.select}`}
                                        disabled={assigning}
                                    >
                                        <option value="">Select a Designer</option>
                                        {designers.length === 0 ? (
                                            <option disabled value="">
                                                {loading ? "Loading designers..." : "No designers available"}
                                            </option>
                                        ) : (
                                            designers.map((designer, index) => {
                                                const desiidValue = String(designer.desiid || '').trim();
                                                return (
                                                    <option
                                                        key={desiidValue || `designer-${index}`}
                                                        value={desiidValue}
                                                    >
                                                        {desiidValue || `Designer ${index + 1}`}
                                                    </option>
                                                );
                                            })
                                        )}
                                    </select>
                                </div>

                                {/* Assign Order Button */}
                                <div className="col-span-3 mt-6">
                                    <button
                                        onClick={handleAssignOrders}
                                        disabled={assigning || !orderId || !selectedDesigner}
                                        className={`w-full h-12 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${themeClasses.button.assign}`}
                                    >
                                        <FontAwesomeIcon icon={faPaperPlane} />
                                        {assigning ? 'Assigning...' : 'Assign Order'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Bulk Assignment Form */}
                        {assignMode === 'bulk' && (
                            <div className="grid grid-cols-10 gap-4 items-center mb-6">
                                {/* Selected Orders Info */}
                                <div className="col-span-7">
                                    <label className="block text-sm font-medium mb-2">Selected Orders</label>
                                    <div className={`w-full px-4 py-3 rounded-lg border-2 min-h-[48px] flex items-center ${selectedOrders.length > 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                                        {selectedOrders.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedOrders.slice(0, 5).map((id, index) => (
                                                    <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                                                        #{id}
                                                    </span>
                                                ))}
                                                {selectedOrders.length > 5 && (
                                                    <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                                                        +{selectedOrders.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-500 dark:text-gray-400">
                                                Select orders from the table below
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Designer Dropdown */}
                                <div className="col-span-3">
                                    <label className="block text-sm font-medium mb-2">Select Designer</label>
                                    <select
                                        value={selectedDesigner}
                                        onChange={(e) => setSelectedDesigner(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-purple-500 transition-all ${themeClasses.select}`}
                                        disabled={assigning}
                                    >
                                        <option value="">Select a Designer</option>
                                        {designers.length === 0 ? (
                                            <option disabled value="">
                                                {loading ? "Loading designers..." : "No designers available"}
                                            </option>
                                        ) : (
                                            designers.map((designer, index) => {
                                                const desiidValue = String(designer.desiid || '').trim();
                                                return (
                                                    <option
                                                        key={desiidValue || `designer-${index}`}
                                                        value={desiidValue}
                                                    >
                                                        {desiidValue || `Designer ${index + 1}`}
                                                    </option>
                                                );
                                            })
                                        )}
                                    </select>
                                </div>

                                {/* Bulk Assign Button */}
                                <div className="col-span-10 mt-2">
                                    <button
                                        onClick={handleAssignOrders}
                                        disabled={assigning || selectedOrders.length === 0 || !selectedDesigner}
                                        className={`w-74 h-12 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${themeClasses.button.bulkAssign}`}
                                    >
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        {assigning ? `Assigning ${selectedOrders.length} Orders...` : `Assign ${selectedOrders.length} Selected Order(s)`}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Status Filters */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {filterButtons.map((btn) => (
                                <button
                                    key={btn.value}
                                    onClick={() => handleFilterClick(btn.value)}
                                    disabled={loading || assigning}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedFilter === btn.value
                                        ? `${themeClasses.button.filterActive}`
                                        : themeClasses.button.filterInactive
                                        } ${(loading || assigning) ? 'opacity-50' : ''}`}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>

                        {/* Filter Summary */}
                        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-4">
                                <span>📊 Showing {filteredData.length} of {allData.length} total orders</span>
                                {selectedFilter !== '1' && (
                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                                        Filter: {filterButtons.find(b => b.value === selectedFilter)?.label}
                                    </span>
                                )}
                                {orderId && assignMode === 'single' && (
                                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded">
                                        Order ID: {orderId}
                                    </span>
                                )}
                                {selectedOrders.length > 0 && assignMode === 'bulk' && (
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded">
                                        Selected: {selectedOrders.length} order(s)
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cases Datatable */}
                    <CasesDatatable
                        columns={columns}
                        data={filteredData}
                        rowsPerPage={50}
                        loading={loading || assigning}
                        error={error}
                        onSelectionChange={handleSelectionChange}
                    />
                </div>
            </main>
            <Foot />
        </>
    );
}