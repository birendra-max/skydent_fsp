import { useContext, useState, useEffect, useMemo } from "react";
import Hd from './Hd';
import Foot from './Foot';
import { ThemeContext } from "../../Context/ThemeContext";
import Datatable from './Datatable';
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHome,
    faFileAlt,
    faDownload,
    faCalendarAlt,
    faFilter,
    faSearch,
    faChartBar,
    faSync,
    faHashtag
} from '@fortawesome/free-solid-svg-icons';
import { fetchWithAuth } from "../../utils/designerapi";

export default function Reports() {
    const { theme } = useContext(ThemeContext);
    const [selectedFilter, setSelectedFilter] = useState('4'); // Default to 'All Time'
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [orderIdFrom, setOrderIdFrom] = useState('');
    const [orderIdTo, setOrderIdTo] = useState('');
    const [allData, setAllData] = useState([]); // Store all data from backend
    const [filteredData, setFilteredData] = useState([]); // Store filtered data for display
    const [reportStats, setReportStats] = useState({
        totalOrders: 0,
        completed: 0,
        inProgress: 0,
        pending: 0
    });

    // Professional theme-based classes
    const getThemeClasses = () => {
        const isLight = theme === 'light';
        return {
            main: isLight
                ? 'bg-gradient-to-br from-gray-25 to-gray-50 text-gray-900'
                : 'bg-gradient-to-br from-gray-900 to-gray-950 text-white',
            card: isLight
                ? 'bg-gradient-to-br from-slate-50 to-blue-50 shadow-lg border border-gray-100'
                : 'bg-gray-800 border-gray-700 shadow-xl',
            input: isLight
                ? 'bg-white border-gray-300 focus:border-blue-500 text-gray-900 placeholder-gray-500 shadow-sm'
                : 'bg-gray-700 border-gray-600 focus:border-blue-400 text-white placeholder-gray-400 shadow-sm',
            button: {
                primary: isLight
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer'
                    : 'bg-blue-700 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all cursor-pointer',
                success: isLight
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg'
                    : 'bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg',
                filterActive: isLight
                    ? 'bg-blue-600 text-white shadow-md border border-blue-600'
                    : 'bg-blue-700 text-white shadow-md border border-blue-600',
                filterInactive: isLight
                    ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm'
                    : 'bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600 hover:border-gray-500 shadow-sm',
                download: isLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg'
                    : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg'
            },
            text: {
                primary: isLight ? 'text-gray-900' : 'text-white',
                secondary: isLight ? 'text-gray-600' : 'text-gray-300',
                muted: isLight ? 'text-gray-500' : 'text-gray-400',
                accent: isLight ? 'text-blue-600' : 'text-blue-400'
            },
            border: isLight ? 'border-gray-200' : 'border-gray-700'
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
        { header: "Date", accessor: "order_date" },
        { header: "Message", accessor: "message" },
    ];

    const filterButtons = [
        { value: '1', label: 'Today', icon: faCalendarAlt },
        { value: '2', label: 'Weekly', icon: faChartBar },
        { value: '3', label: 'Monthly', icon: faFileAlt },
        { value: '4', label: 'All Time', icon: faFilter },
    ];

    // Calculate report statistics
    const calculateStats = (cases) => {
        const stats = {
            totalOrders: cases.length,
            completed: cases.filter(caseItem => caseItem.status === 'Designed Completed').length,
            inProgress: cases.filter(caseItem => caseItem.status === 'In Progress').length,
            pending: cases.filter(caseItem => caseItem.status === 'New' || caseItem.status === 'QC Required').length
        };
        setReportStats(stats);
    };

    // Filter data based on all criteria
    const applyFilters = () => {
        if (!allData.length) {
            setFilteredData([]);
            calculateStats([]);
            return;
        }

        let filtered = [...allData];

        // Apply time period filter
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

        // Apply order ID range filter
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

        // Apply custom date range filter
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

    // Handle search button click
    const handleSearchClick = () => {
        applyFilters();
    };

    // Handle filter button click
    const handleFilterClick = (filterValue) => {
        setSelectedFilter(filterValue);
    };

    // Handle download report
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

    // Handle reset filters
    const handleResetFilters = () => {
        setStartDate('');
        setEndDate('');
        setOrderIdFrom('');
        setOrderIdTo('');
        setSelectedFilter('4'); // Reset to "All Time"
        setFilteredData(allData);
        calculateStats(allData);
    };

    // Handle order ID input validation
    const handleOrderIdFromChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setOrderIdFrom(value);
    };

    const handleOrderIdToChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setOrderIdTo(value);
    };

    const getHeaderClass = () => {
        return theme === 'light'
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 text-gray-800'
            : 'bg-gradient-to-r from-gray-800 to-blue-900/20 border-gray-700 text-white';
    };

    const getStatCardClass = (index) => {
        const gradients = [
            'from-blue-500 to-blue-600',
            'from-emerald-500 to-green-600',
            'from-amber-500 to-orange-600',
            'from-purple-500 to-purple-600'
        ];
        return `bg-gradient-to-r ${gradients[index]} text-white`;
    };

    // Apply filters whenever any filter criteria changes
    useEffect(() => {
        applyFilters();
    }, [selectedFilter, allData]);

    // Initial data fetch
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

    return (
        <>
            <Hd />
            <main id="main" className={`flex-grow px-4 transition-colors duration-300 ${themeClasses.main} pt-14`}>
                <div className="min-h-screen px-2 sm:px-6 lg:px-2">
                    <div className="w-full max-w-full">

                        {/* Enhanced Header Section */}
                        <header className={`rounded-xl border shadow-sm my-6 px-6 py-4 ${getHeaderClass()}`}>
                            <div className="container mx-auto">
                                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-center sm:text-left">
                                        <h1 className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent`}>
                                            Reports & Analytics
                                        </h1>
                                        <p className={`mt-2 text-sm sm:text-base ${themeClasses.text.secondary}`}>
                                            Generate comprehensive reports and analyze order performance
                                        </p>
                                    </div>
                                    <nav className="flex justify-center sm:justify-start">
                                        <ol className="flex items-center space-x-2 sm:space-x-3 text-sm">
                                            <li>
                                                <Link
                                                    to="/designer/home"
                                                    className={`hover:text-blue-700 transition-colors duration-300 flex items-center ${themeClasses.text.accent}`}
                                                >
                                                    <FontAwesomeIcon icon={faHome} className="w-4 h-4 mr-2" />
                                                    <span>Dashboard</span>
                                                </Link>
                                            </li>
                                            <li className={themeClasses.text.muted}>
                                                <span>/</span>
                                            </li>
                                            <li className={themeClasses.text.muted}>
                                                <span>Reports</span>
                                            </li>
                                        </ol>
                                    </nav>
                                </div>
                            </div>
                        </header>

                        {/* Main Card Container */}
                        <div className={`rounded-xl ${themeClasses.card} p-6 mb-8`}>

                            {/* Search Section */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className={`text-xl font-semibold ${themeClasses.text.primary} flex items-center`}>
                                        <FontAwesomeIcon icon={faSearch} className="w-5 h-5 mr-3 text-blue-500" />
                                        Report Criteria
                                    </h2>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={handleResetFilters}
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${theme === 'light'
                                                ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                                                }`}
                                        >
                                            <FontAwesomeIcon icon={faSync} className="w-4 h-4" />
                                            <span>Reset</span>
                                        </button>
                                        <button
                                            onClick={handleDownloadReport}
                                            disabled={filteredData.length === 0}
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${filteredData.length === 0
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : themeClasses.button.download
                                                }`}
                                        >
                                            <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                                            <span>Export Report</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="max-w-6xl mx-auto">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                                        {/* Order ID From */}
                                        <div className="lg:col-span-2">
                                            <label className={`block text-sm font-semibold ${themeClasses.text.primary} mb-2 flex items-center`}>
                                                <FontAwesomeIcon icon={faHashtag} className="w-4 h-4 mr-2 text-blue-500" />
                                                Order ID From
                                            </label>
                                            <input
                                                type="text"
                                                value={orderIdFrom}
                                                onChange={handleOrderIdFromChange}
                                                placeholder="e.g., 1001"
                                                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 ${themeClasses.input}`}
                                            />
                                        </div>

                                        {/* Order ID To */}
                                        <div className="lg:col-span-2">
                                            <label className={`block text-sm font-semibold ${themeClasses.text.primary} mb-2 flex items-center`}>
                                                <FontAwesomeIcon icon={faHashtag} className="w-4 h-4 mr-2 text-blue-500" />
                                                Order ID To
                                            </label>
                                            <input
                                                type="text"
                                                value={orderIdTo}
                                                onChange={handleOrderIdToChange}
                                                placeholder="e.g., 2000"
                                                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 ${themeClasses.input}`}
                                            />
                                        </div>

                                        {/* Start Date */}
                                        <div className="lg:col-span-2">
                                            <label className={`block text-sm font-semibold ${themeClasses.text.primary} mb-2 flex items-center`}>
                                                <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2 text-blue-500" />
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 ${themeClasses.input}`}
                                            />
                                        </div>

                                        {/* End Date */}
                                        <div className="lg:col-span-2">
                                            <label className={`block text-sm font-semibold ${themeClasses.text.primary} mb-2 flex items-center`}>
                                                <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2 text-blue-500" />
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 ${themeClasses.input}`}
                                            />
                                        </div>

                                        {/* Search Button */}
                                        <div className="lg:col-span-4">
                                            <button
                                                onClick={handleSearchClick}
                                                disabled={isLoading}
                                                className={`w-44 h-12 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer ${isLoading
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : themeClasses.button.success
                                                    }`}
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                        <span>Applying Filters...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FontAwesomeIcon icon={faFileAlt} className="w-4 h-4" />
                                                        <span>Apply Filters</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Search Tips */}
                                    <div className="mt-4 text-center">
                                        <p className={`text-xs ${themeClasses.text.muted}`}>
                                            Tip: Use Order ID range and date filters to refine your report. Showing {filteredData.length} of {allData.length} records.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced Filter Section */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`text-lg font-semibold ${themeClasses.text.primary} flex items-center`}>
                                        <FontAwesomeIcon icon={faFilter} className="w-4 h-4 mr-2 text-blue-500" />
                                        Time Period
                                    </h3>
                                    <span className={`text-sm ${themeClasses.text.muted}`}>
                                        {filteredData.length} of {allData.length} records shown
                                    </span>
                                </div>

                                <div className="max-w-full mx-auto">
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {filterButtons.map((button) => (
                                            <button
                                                key={button.value}
                                                onClick={() => handleFilterClick(button.value)}
                                                disabled={isLoading}
                                                className={`px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 min-w-[120px] cursor-pointer ${selectedFilter === button.value
                                                    ? `${themeClasses.button.filterActive} transform scale-105`
                                                    : themeClasses.button.filterInactive
                                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                                            >
                                                <FontAwesomeIcon
                                                    icon={button.icon}
                                                    className={`w-4 h-4 ${selectedFilter === button.value ? 'text-white' : 'text-blue-500'
                                                        }`}
                                                />
                                                <span className="font-medium">{button.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Data Table Section */}
                            <div className="mt-8">
                                <Datatable
                                    columns={columns}
                                    data={filteredData}
                                    rowsPerPage={50}
                                    theme={theme}
                                />
                            </div>

                        </div>
                    </div>
                </div>
            </main>
            <Foot />
        </>
    );
}