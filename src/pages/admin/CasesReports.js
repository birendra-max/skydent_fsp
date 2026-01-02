import { useContext, useState, useEffect } from "react";
import Hd from './Hd';
import Foot from './Foot';
import { ThemeContext } from "../../Context/ThemeContext";
import CasesDatatable from './CasesDatatable';
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
} from '@fortawesome/free-solid-svg-icons';
import { fetchWithAuth } from '../../utils/adminapi';

export default function CasesReports() {
    const { theme } = useContext(ThemeContext);
    const [selectedFilter, setSelectedFilter] = useState('4'); // Default to 'All Time'
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [orderIdFrom, setOrderIdFrom] = useState('');
    const [orderIdTo, setOrderIdTo] = useState('');
    const [allData, setAllData] = useState({ cases: [], pagination: {} });
    const [filteredData, setFilteredData] = useState({ cases: [], pagination: {} });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeFilterType, setActiveFilterType] = useState('time');

    const getThemeClasses = () => {
        const isLight = theme === 'light';
        return {
            main: isLight ? 'bg-white text-black' : 'bg-black text-white',
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
                    : 'bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600 shadow-sm hover:shadow-md',
                download: isLight
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl'
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

    const filterButtons = [
        { value: '1', label: 'Today', icon: faCalendarAlt },
        { value: '2', label: 'Weekly', icon: faChartBar },
        { value: '3', label: 'Monthly', icon: faFileAlt },
        { value: '4', label: 'All Time', icon: faFilter },
    ];

    // Fetch data with filters from backend
    const fetchDataWithFilters = async (filters = {}) => {
        setLoading(true);
        setIsLoading(true);
        try {
            // Build query parameters
            const params = new URLSearchParams();
            
            // Add filter parameters
            if (filters.orderIdFrom) {
                params.append('order_id_from', filters.orderIdFrom);
            }
            if (filters.orderIdTo) {
                params.append('order_id_to', filters.orderIdTo);
            }
            if (filters.startDate) {
                params.append('start_date', filters.startDate);
            }
            if (filters.endDate) {
                params.append('end_date', filters.endDate);
            }
            if (filters.filterType) {
                params.append('filter_type', filters.filterType);
            }

            const url = `/get-all-cases?${params.toString()}`;
            const response = await fetchWithAuth(url, {
                method: "GET",
            });

            if (response && response.status === 'success') {
                setAllData(response.data);
                setFilteredData(response.data);
            } else {
                setAllData({ cases: [], pagination: {} });
                setFilteredData({ cases: [], pagination: {} });
            }
        } catch (error) {
            console.error("Error fetching cases:", error);
            setAllData({ cases: [], pagination: {} });
            setFilteredData({ cases: [], pagination: {} });
            setError(error.message);
        } finally {
            setLoading(false);
            setIsLoading(false);
        }
    };

    // Handle search button click for custom filters
    const handleSearchClick = () => {
        setActiveFilterType('custom');
        
        // Send filters to backend
        const filters = {
            orderIdFrom: orderIdFrom,
            orderIdTo: orderIdTo,
            startDate: startDate,
            endDate: endDate,
            filterType: '4' // For custom search, we don't use time filter
        };
        
        fetchDataWithFilters(filters);
    };

    // Handle filter button click for time filters
    const handleFilterClick = (filterValue) => {
        setSelectedFilter(filterValue);
        setActiveFilterType('time');
        
        // Clear custom filters when clicking time filters
        setOrderIdFrom('');
        setOrderIdTo('');
        setStartDate('');
        setEndDate('');
        
        // Send time filter to backend
        const filters = {
            orderIdFrom: '',
            orderIdTo: '',
            startDate: '',
            endDate: '',
            filterType: filterValue
        };
        
        fetchDataWithFilters(filters);
    };

    // Handle download report
    const handleDownloadReport = () => {
        if (filteredData.cases && filteredData.cases.length > 0) {
            const fileName = `report_${new Date().toISOString().split('T')[0]}.csv`;

            // Simple CSV export
            const headers = columns.map(col => col.header).join(',');
            const csvData = filteredData.cases.map(row =>
                columns.map(col => {
                    const value = row[col.accessor] || '';
                    return `"${String(value).replace(/"/g, '""')}"`;
                }).join(',')
            ).join('\n');

            const csvContent = `${headers}\n${csvData}`;
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } else {
            alert('No data to export');
        }
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
            ? 'bg-gray-200 border-gray-200 text-gray-800'
            : 'bg-gray-800 border-gray-700 text-white';
    };

    // Initial data fetch
    useEffect(() => {
        // Fetch all data on initial load
        fetchDataWithFilters({});
    }, []);

    return (
        <>
            <Hd />
            <main id="main" className={`flex-grow px-4 transition-colors duration-300 ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'} pt-16 sm:pt-18`}>
                <div className="min-h-screen px-2 sm:px-6 lg:px-2">
                    <div className="w-full max-w-full">

                        {/* Header Section - EXACT SAME DESIGN AS MULTISEARCH */}
                        <header className={`bg-gray-50 rounded-xl border-b shadow-sm my-4 px-4 ${getHeaderClass()}`}>
                            <div className="container mx-auto px-3 sm:px py-4 sm:py-3">
                                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-center sm:text-left">
                                        <h1 className={`text-2xl sm:text-3xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                                            Reports & Analytics
                                        </h1>
                                        <p className={`mt-1 text-sm sm:text-base ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                                            Generate comprehensive reports and analyze order performance
                                        </p>
                                    </div>
                                    <nav className="flex justify-center sm:justify-start">
                                        <ol className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
                                            <li>
                                                <Link to="/user/home" className={`hover:text-blue-800 transition-colors duration-300 flex items-center ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>
                                                    <FontAwesomeIcon icon={faHome} className="w-3 h-3 mr-1 sm:mr-2" />
                                                    <span className="hidden xs:inline">Home</span>
                                                </Link>
                                            </li>
                                            <li className={theme === 'light' ? 'text-gray-500' : 'text-gray-400'}>
                                                <span>/</span>
                                            </li>
                                            <li className={theme === 'light' ? 'text-gray-500' : 'text-gray-400'}>
                                                <span>Reports</span>
                                            </li>
                                        </ol>
                                    </nav>
                                </div>
                            </div>
                        </header>

                        {/* Main Card Container - EXACT SAME DESIGN AS MULTISEARCH */}
                        <div className={`bg-gray-50 rounded-xl ${themeClasses.card} p-4`}>

                            {/* Search Section - EXACT SAME LAYOUT AS MULTISEARCH */}
                            <div className="mb-8">
                                <div className="max-w-8xl mx-auto ml-4">
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

                                        {/* OR Divider */}
                                        <div className="col-span-1 flex justify-center items-end font-bold text-lg text-gray-500 mt-4">
                                            OR
                                        </div>

                                        {/* Start Date */}
                                        <div className="col-span-2">
                                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 ${themeClasses.input}`}
                                            />
                                        </div>

                                        {/* End Date */}
                                        <div className="col-span-2">
                                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 ${themeClasses.input}`}
                                            />
                                        </div>

                                        {/* Apply Button */}
                                        <div className="col-span-3 flex items-end mt-6">
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleSearchClick}
                                                    disabled={isLoading}
                                                    className={`cursor-pointer px-6 py-3 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 ${isLoading ? 'bg-gray-400' : themeClasses.button.success}`}
                                                >
                                                    {isLoading ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                            <span>Applying...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FontAwesomeIcon icon={faSearch} className="w-4 h-4" />
                                                            <span>Search Cases</span>
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={handleDownloadReport}
                                                    disabled={!filteredData.cases || filteredData.cases.length === 0}
                                                    className={`cursor-pointer px-6 py-3 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 ${!filteredData.cases || filteredData.cases.length === 0 ? 'bg-gray-400 cursor-not-allowed' : themeClasses.button.download}`}
                                                >
                                                    <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                                                    <span>Export</span>
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* Filter Section - EXACT SAME DESIGN AS MULTISEARCH */}
                            <div className="mb-8">
                                <div className="max-w-full mx-auto">
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {filterButtons.map((button) => (
                                            <button
                                                key={button.value}
                                                onClick={() => handleFilterClick(button.value)}
                                                disabled={isLoading}
                                                className={`cursor-pointer px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 ${selectedFilter === button.value && activeFilterType === 'time'
                                                        ? `${themeClasses.button.filterActive} scale-105`
                                                        : themeClasses.button.filterInactive
                                                    } ${isLoading ? 'opacity-50' : ''}`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${selectedFilter === button.value && activeFilterType === 'time' ? 'bg-white' : 'bg-blue-500'}`}></div>
                                                <span className="font-medium">{button.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Data Table Section */}
                            <div className="mt-8">
                                <CasesDatatable
                                    columns={columns}
                                    data={filteredData}
                                    loading={loading}
                                    error={error}
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