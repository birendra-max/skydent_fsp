import { useContext, useState, useEffect } from "react";
import Hd from "./Hd";
import Foot from './Foot';
import { ThemeContext } from "../../Context/ThemeContext";
import CasesDatatable from "./CasesDatatable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSearch,
    faFilter,
    faFileAlt,
    faHome,
} from "@fortawesome/free-solid-svg-icons";
import { fetchWithAuth } from "../../utils/adminapi";
import Sidebar from "./Sidebar";
import { Link } from 'react-router-dom';

export default function MultiSearch() {
    const { theme } = useContext(ThemeContext);
    const [selectedFilter, setSelectedFilter] = useState('1'); // '1' = 'All'
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [orderIdFrom, setOrderIdFrom] = useState('');
    const [orderIdTo, setOrderIdTo] = useState('');
    const [allData, setAllData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const themeClasses = {
        main: theme === "dark" ? "bg-gray-950 text-gray-100" : "bg-gray-100 text-gray-900",
        card: theme === "dark" ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200",
        input:
            theme === "dark"
                ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-600",
        button: {
            success:
                theme === "dark"
                    ? "bg-emerald-700 hover:bg-emerald-600 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white",
            filterActive:
                theme === "dark"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-blue-600 text-white shadow-md",
            filterInactive:
                theme === "dark"
                    ? "bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100",
        },
    };

    const columns = [
        { header: "Order Id", accessor: "orderid" },
        { header: "File Name", accessor: "fname" },
        { header: "TAT", accessor: "tduration" },
        { header: "Status", accessor: "status" },
        { header: "Unit", accessor: "unit" },
        { header: "Tooth", accessor: "tooth" },
        { header: "Lab Name", accessor: "labname" },
        { header: "Date", accessor: "order_date" },
        { header: "Message", accessor: "message" },
    ];

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
    const handleOrderIdFromChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setOrderIdFrom(value);
    };

    const handleOrderIdToChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setOrderIdTo(value);
    };

    // ✅ FIXED: Apply all filters function
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
                '6': 'Pending', // Assuming "In Progress" maps to "Pending"
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

        // Apply order ID range filter
        if (orderIdFrom) {
            const fromId = parseInt(orderIdFrom);
            if (!isNaN(fromId)) {
                filtered = filtered.filter(item => {
                    const orderId = parseInt(item.orderid);
                    return !isNaN(orderId) && orderId >= fromId;
                });
            }
        }

        if (orderIdTo) {
            const toId = parseInt(orderIdTo);
            if (!isNaN(toId)) {
                filtered = filtered.filter(item => {
                    const orderId = parseInt(item.orderid);
                    return !isNaN(orderId) && orderId <= toId;
                });
            }
        }

        // Apply date range filter
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0); // Start of day
            filtered = filtered.filter(item => {
                if (!item.order_date) return false;
                const itemDate = new Date(item.order_date);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate >= start;
            });
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // End of day
            filtered = filtered.filter(item => {
                if (!item.order_date) return false;
                const itemDate = new Date(item.order_date);
                return itemDate <= end;
            });
        }

        setFilteredData(filtered);
    };

    // Filter button handler
    const handleFilterClick = (filterValue) => {
        setSelectedFilter(filterValue);
    };

    // Search button handler
    const handleSearchClick = async () => {
        if (!allData.length) {
            await fetchAllCases();
        }
        applyFilters();
    };

    // Clear all filters
    const handleClearFilters = () => {
        setSelectedFilter('1');
        setOrderIdFrom('');
        setOrderIdTo('');
        setStartDate('');
        setEndDate('');
        setFilteredData(allData);
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
                // Try different response keys
                const casesData = responseData.new_cases || responseData.cases || responseData.all_cases || [];
                setAllData(casesData);
                setFilteredData(casesData);
            } else {
                setAllData([]);
                setFilteredData([]);
            }
        } catch (error) {
            console.error("Error fetching cases:", error);
            setAllData([]);
            setFilteredData([]);
            setError("Network error. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch all cases on component mount
    useEffect(() => {
        fetchAllCases();
    }, []);

    // Apply filters whenever any filter criteria changes
    useEffect(() => {
        applyFilters();
    }, [selectedFilter, orderIdFrom, orderIdTo, startDate, endDate]);

    const getHeaderClass = () => {
        return theme === 'light'
            ? 'bg-gray-200 border-gray-200 text-gray-800'
            : 'bg-gray-800 border-gray-700 text-white';
    };

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
                    {/* Page Header */}
                    <div className={`bg-gray-50 rounded-xl border-b shadow-sm my-4 px-4 ${getHeaderClass()}`}>
                        <div className="container mx-auto px-3 sm:px py-4 sm:py-3">
                            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-center sm:text-left">
                                    <h1 className={`text-2xl sm:text-3xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'
                                        }`}>
                                        Reports & Analytics
                                    </h1>
                                    <p className={`mt-1 text-sm sm:text-base ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                                        }`}>Generate, filter, and analyze your case data</p>
                                </div>
                                <nav className="flex justify-center sm:justify-start">
                                    <ol className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
                                        <li>
                                            <Link to="/admin/dashboard" className={`hover:text-blue-800 transition-colors duration-300 flex items-center ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                                                }`}>
                                                <FontAwesomeIcon icon={faHome} className="w-3 h-3 mr-1 sm:mr-2" />
                                                <span className="hidden xs:inline">Dashboard</span>
                                            </Link>
                                        </li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>

                    {/* Search Card */}
                    <div className={`rounded-2xl p-6 shadow-lg ${themeClasses.card}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <FontAwesomeIcon icon={faFilter} className="text-blue-500" />
                                Advanced Case Filtering
                            </h2>
                            <button
                                onClick={handleClearFilters}
                                className={`px-4 py-2 text-sm rounded-lg ${themeClasses.button.filterInactive}`}
                            >
                                Clear Filters
                            </button>
                        </div>

                        {/* Filter Inputs */}
                        <div className="grid grid-cols-10 gap-4 items-end mb-6">
                            {/* Order ID From */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-2">Order ID From</label>
                                <input
                                    type="text"
                                    value={orderIdFrom}
                                    onChange={handleOrderIdFromChange}
                                    placeholder="e.g., 1001"
                                    className={`w-full px-4 py-2 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 transition-all ${themeClasses.input}`}
                                />
                            </div>

                            {/* Order ID To */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-2">Order ID To</label>
                                <input
                                    type="text"
                                    value={orderIdTo}
                                    onChange={handleOrderIdToChange}
                                    placeholder="e.g., 2000"
                                    className={`w-full px-4 py-2 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 transition-all ${themeClasses.input}`}
                                />
                            </div>

                            {/* Date From */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-2">Date From</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className={`w-full px-4 py-2 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 transition-all ${themeClasses.input}`}
                                />
                            </div>

                            {/* Date To */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-2">Date To</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className={`w-full px-4 py-2 rounded-lg border-2 focus:ring-2 focus:ring-blue-500 transition-all ${themeClasses.input}`}
                                />
                            </div>

                            {/* Search Button */}
                            <div className="col-span-2">
                                <button
                                    onClick={handleSearchClick}
                                    disabled={loading}
                                    className={`w-full h-10 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:scale-105 ${loading ? 'bg-gray-400' : themeClasses.button.success
                                        }`}
                                >
                                    <FontAwesomeIcon icon={faSearch} />
                                    {loading ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        </div>

                        {/* Status Filters */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {filterButtons.map((btn) => (
                                <button
                                    key={btn.value}
                                    onClick={() => handleFilterClick(btn.value)}
                                    disabled={loading}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedFilter === btn.value
                                        ? `${themeClasses.button.filterActive}`
                                        : themeClasses.button.filterInactive
                                        } ${loading ? 'opacity-50' : ''}`}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>

                        {/* Filter Summary */}
                        <div className="mt-4 text-sm text-gray-500">
                            Showing {filteredData.length} of {allData.length} total records
                            {selectedFilter !== '1' && ` • Filter: ${filterButtons.find(b => b.value === selectedFilter)?.label}`}
                            {(orderIdFrom || orderIdTo) && ` • Order ID: ${orderIdFrom || 'Any'} to ${orderIdTo || 'Any'}`}
                            {(startDate || endDate) && ` • Date: ${startDate || 'Any'} to ${endDate || 'Any'}`}
                        </div>
                    </div>

                    {/* Cases Datatable */}
                    <CasesDatatable 
                        columns={columns} 
                        data={filteredData} 
                        rowsPerPage={50} 
                        loading={loading} 
                        error={error} 
                    />
                </div>
            </main>
            <Foot />
        </>
    );
}