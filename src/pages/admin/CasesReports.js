import { useContext, useState, useEffect, useMemo } from "react";
import Hd from './Hd';
import Foot from './Foot';
import { ThemeContext } from "../../Context/ThemeContext";
import CasesDatatable from './CasesDatatable';
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHome,
} from '@fortawesome/free-solid-svg-icons';
import { fetchWithAuth } from "../../utils/adminapi";

export default function Reports() {
    const { theme } = useContext(ThemeContext);
    const [selectedFilter, setSelectedFilter] = useState('4'); // ✅ CHANGED: Default to 'All Time'
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [orderIdFrom, setOrderIdFrom] = useState(''); // ✅ ADDED: Order ID range filter
    const [orderIdTo, setOrderIdTo] = useState(''); // ✅ ADDED: Order ID range filter
    const [allData, setAllData] = useState([]); // ✅ ADDED: Store all data from backend
    const [filteredData, setFilteredData] = useState([]); // ✅ ADDED: Store filtered data for display
    const [reportStats, setReportStats] = useState({ // ✅ ADDED: Report statistics
        totalOrders: 0,
        completed: 0,
        inProgress: 0,
        pending: 0
    });


    // Theme-based classes
    const getThemeClasses = () => {
        const isLight = theme === 'light';
        return {
            main: isLight ? 'bg-gray-50 text-gray-900' : 'bg-gray-900 text-white',
            card: isLight ? 'bg-gray-200 shadow-xl border border-gray-100' : 'bg-gray-800 border-gray-700 shadow-2xl',
            input: isLight
                ? 'bg-white border-gray-200 focus:border-blue-500 text-gray-900 placeholder-gray-500'
                : 'bg-gray-700 border-gray-600 focus:border-blue-400 text-white placeholder-gray-400',
            button: {
                primary: isLight
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-blue-700 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl',
                success: isLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl',
                filterActive: isLight
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-blue-700 text-white shadow-md',
                filterInactive: isLight
                    ? 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm hover:shadow-md'
                    : 'bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600 shadow-sm hover:shadow-md'
            },
            text: {
                primary: isLight ? 'text-gray-900' : 'text-white',
                secondary: isLight ? 'text-gray-600' : 'text-gray-300',
                muted: isLight ? 'text-gray-500' : 'text-gray-400'
            }
        };
    };

    const themeClasses = getThemeClasses();

    const columns = [
        { header: "Order Id", accessor: "orderid" },
        { header: "File Name", accessor: "fname" },
        { header: "TAT", accessor: "tduration" },
        { header: "Status", accessor: "status" },
        { header: "Unit", accessor: "unit" },
        { header: "Tooth", accessor: "tooth" },
        { header: "Lab Name", accessor: "labname" },
        { header: "Order Date", accessor: "order_date" },
        { header: "Run Self By", accessor: "run_self_by" },
        { header: "Assign To", accessor: "assign_to" },
        { header: "Assign Date", accessor: "assign_date" },
        { header: "Message", accessor: "message" },
    ];

    // ✅ UPDATED: Filter buttons with All Time option
    const filterButtons = [
        { value: '1', label: 'Today' },
        { value: '2', label: 'Weekly' },
        { value: '3', label: 'Monthly' },
        { value: '4', label: 'All Time' },
    ];

    // ✅ ADDED: Calculate report statistics
    const calculateStats = (cases) => {
        const stats = {
            totalOrders: cases.length,
            completed: cases.filter(caseItem => caseItem.status === 'Designed Completed').length,
            inProgress: cases.filter(caseItem => caseItem.status === 'In Progress').length,
            pending: cases.filter(caseItem => caseItem.status === 'New' || caseItem.status === 'QC Required').length
        };
        setReportStats(stats);
    };

    // ✅ ADDED: Apply all filters function
    const applyFilters = () => {
        if (!allData.length) {
            setFilteredData([]);
            calculateStats([]);
            return;
        }

        let filtered = [...allData];

        // ✅ ADDED: Apply time period filter
        const now = new Date();
        switch (selectedFilter) {
            case '1': // Today
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                filtered = filtered.filter(item => {
                    const itemDate = new Date(item.order_date);
                    return itemDate >= today;
                });
                break;
            case '2': // Weekly
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                weekAgo.setHours(0, 0, 0, 0);
                filtered = filtered.filter(item => {
                    const itemDate = new Date(item.order_date);
                    return itemDate >= weekAgo;
                });
                break;
            case '3': // Monthly
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                monthAgo.setHours(0, 0, 0, 0);
                filtered = filtered.filter(item => {
                    const itemDate = new Date(item.order_date);
                    return itemDate >= monthAgo;
                });
                break;
            case '4': // All Time - no date filtering
                break;
            default:
                break;
        }

        // ✅ ADDED: Apply order ID range filter
        if (orderIdFrom) {
            filtered = filtered.filter(item => {
                const orderId = parseInt(item.orderid);
                const fromId = parseInt(orderIdFrom);
                return orderId >= fromId;
            });
        }

        if (orderIdTo) {
            filtered = filtered.filter(item => {
                const orderId = parseInt(item.orderid);
                const toId = parseInt(orderIdTo);
                return orderId <= toId;
            });
        }

        // ✅ ADDED: Apply custom date range filter
        if (startDate) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.order_date);
                const start = new Date(startDate);
                return itemDate >= start;
            });
        }

        if (endDate) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.order_date);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // Include entire end day
                return itemDate <= end;
            });
        }

        setFilteredData(filtered);
        calculateStats(filtered);
    };

    // ✅ CHANGED: Updated search button handler
    const handleSearchClick = () => {
        applyFilters();
    };

    // ✅ CHANGED: Updated filter button handler
    const handleFilterClick = (filterValue) => {
        setSelectedFilter(filterValue);
        // Filters will be applied in useEffect
    };

    // ✅ ADDED: Handle download report
    const handleDownloadReport = () => {
        if (filteredData.length === 0) {
            alert('No data available to download');
            return;
        }

        // Create CSV content
        const headers = columns.map(col => col.header).join(',');
        const rows = filteredData.map(item =>
            columns.map(col => `"${item[col.accessor] || ''}"`).join(',')
        ).join('\n');

        const csvContent = `${headers}\n${rows}`;

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    // ✅ ADDED: Handle reset filters
    const handleResetFilters = () => {
        setStartDate('');
        setEndDate('');
        setOrderIdFrom('');
        setOrderIdTo('');
        setSelectedFilter('4'); // Reset to "All Time"
        setFilteredData(allData);
        calculateStats(allData);
    };

    // ✅ ADDED: Handle order ID input validation
    const handleOrderIdFromChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setOrderIdFrom(value);
    };

    const handleOrderIdToChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setOrderIdTo(value);
    };

    // ✅ ADDED: Apply filters whenever any filter criteria changes
    useEffect(() => {
        applyFilters();
    }, [selectedFilter, allData]);

    // ✅ CHANGED: Updated initial data fetch to use get-reports endpoint
    useEffect(() => {
        async function fetchAllCases() {
            setIsLoading(true);
            try {
                const responseData = await fetchWithAuth("/get-reports", {
                    method: "POST",
                    body: JSON.stringify({
                        filter: 'all',
                        startDate: '',
                        endDate: '',
                    }),
                });

                if (responseData?.status === "success") {
                    setAllData(responseData.cases);
                    setFilteredData(responseData.cases);
                    calculateStats(responseData.cases);
                } else {
                    setAllData([]);
                    setFilteredData([]);
                    setReportStats({ totalOrders: 0, completed: 0, inProgress: 0, pending: 0 });
                }
            } catch (error) {
                console.error("Report fetch error:", error);
                setAllData([]);
                setFilteredData([]);
                setReportStats({ totalOrders: 0, completed: 0, inProgress: 0, pending: 0 });
            } finally {
                setIsLoading(false);
            }
        }

        fetchAllCases();
    }, []);

    const getHeaderClass = () => {
        return theme === 'light'
            ? 'bg-gray-200 border-gray-200 text-gray-800'
            : 'bg-gray-800 border-gray-700 text-white';
    };

    return (
        <>
            <Hd />
            <main id="main" className={`flex-grow px-4 transition-colors duration-300 ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'} pt-16 sm:pt-18`}>
                <div className="min-h-screen px-2 sm:px-6 lg:px-2">
                    <div className="w-full max-w-full">

                        {/* Header Section */}
                        <header className={`bg-gray-50 rounded-xl border-b shadow-sm my-4 px-4 ${getHeaderClass()}`}>
                            <div className="container mx-auto px-3 sm:px py-4 sm:py-3">
                                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-center sm:text-left">
                                        <h1 className={`text-2xl sm:text-3xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'
                                            }`}>
                                            Generate & Download Reports
                                        </h1>
                                        <p className={`mt-1 text-sm sm:text-base ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                                            }`}>Generate your reports and download</p>
                                    </div>
                                    <nav className="flex justify-center sm:justify-start">
                                        <ol className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
                                            <li>
                                                <Link to="/user/home" className={`hover:text-blue-800 transition-colors duration-300 flex items-center ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                                                    }`}>
                                                    <FontAwesomeIcon icon={faHome} className="w-3 h-3 mr-1 sm:mr-2" />
                                                    <span className="hidden xs:inline">Home</span>
                                                </Link>
                                            </li>
                                        </ol>
                                    </nav>
                                </div>
                            </div>
                        </header>


                        {/* Main Card Container */}
                        <div className={`bg-gray-50 rounded-xl ${themeClasses.card} p-4`}>

                            {/* ✅ UPDATED: Search Section with Order ID range inputs */}
                            <div className="mb-8">
                                <div className="max-w-7xl mx-auto ml-50">
                                    <div className="grid grid-cols-12 gap-4 items-center">

                                        {/* Order ID From */}
                                        <div className="col-span-2">
                                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                                                Order ID From
                                            </label>
                                            <input
                                                type="text"
                                                value={orderIdFrom}
                                                onChange={handleOrderIdFromChange}
                                                placeholder="e.g., 1001"
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 ${themeClasses.input}`}
                                            />
                                        </div>

                                        {/* Order ID To */}
                                        <div className="col-span-2">
                                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                                                Order ID To
                                            </label>
                                            <input
                                                type="text"
                                                value={orderIdTo}
                                                onChange={handleOrderIdToChange}
                                                placeholder="e.g., 2000"
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 ${themeClasses.input}`}
                                            />
                                        </div>

                                        {/* OR */}
                                        <div className="col-span-1 flex justify-center items-end font-bold text-lg text-gray-500 mt-4">
                                            OR
                                        </div>

                                        {/* Date From */}
                                        <div className="col-span-2">
                                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                                                Date From
                                            </label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 ${themeClasses.input}`}
                                            />
                                        </div>

                                        {/* Date To */}
                                        <div className="col-span-2">
                                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                                                Date To
                                            </label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 ${themeClasses.input}`}
                                            />
                                        </div>

                                        {/* Button */}
                                        <div className="col-span-3 flex items-end mt-6">
                                            <button
                                                onClick={handleSearchClick}
                                                disabled={isLoading}
                                                className={`cursor-pointer w-44 h-12 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 ${isLoading ? 'bg-gray-400' : themeClasses.button.success
                                                    }`}
                                            >
                                                {isLoading ? 'Searching...' : 'Search Cases'}
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            </div>


                            {/* ✅ UPDATED: Filter Section with All Time option */}
                            <div className="mb-8">
                                <div className="max-w-full mx-auto">
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {filterButtons.map((button) => (
                                            <button
                                                key={button.value}
                                                onClick={() => handleFilterClick(button.value)}
                                                disabled={isLoading}
                                                className={`cursor-pointer px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 ${selectedFilter === button.value
                                                    ? `${themeClasses.button.filterActive} scale-105`
                                                    : themeClasses.button.filterInactive
                                                    } ${isLoading ? 'opacity-50' : ''}`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${selectedFilter === button.value ? 'bg-white' : 'bg-blue-500'
                                                    }`}></div>
                                                <span className="font-medium">{button.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Data Table */}
                            <div className="mt-8">
                                {/* ✅ CHANGED: Pass filteredData instead of all data */}
                                <CasesDatatable columns={columns} data={filteredData} rowsPerPage={50} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Foot />
        </>
    );
}