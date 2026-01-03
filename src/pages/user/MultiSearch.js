import { useContext, useState, useEffect, useMemo } from "react";
import Hd from './Hd';
import Foot from './Foot';
import { ThemeContext } from "../../Context/ThemeContext";
import Datatable from './Datatable';
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHome,
    faSearch,
    faFilter,
    faCalendarAlt,
    faSync,
    faHashtag
} from '@fortawesome/free-solid-svg-icons';
import { fetchWithAuth } from '../../utils/userapi';

export default function MultiSearch() {
    const { theme } = useContext(ThemeContext);
    const [selectedFilter, setSelectedFilter] = useState('1'); // Default to 'All'
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [orderIdFrom, setOrderIdFrom] = useState('');
    const [orderIdTo, setOrderIdTo] = useState('');
    const [allData, setAllData] = useState([]); // Store all data from backend
    const [filteredData, setFilteredData] = useState([]); // Store filtered data for display

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
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all'
                    : 'bg-blue-700 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all',
                success: isLight
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg'
                    : 'bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg',
                filterActive: isLight
                    ? 'bg-blue-600 text-white shadow-md border border-blue-600'
                    : 'bg-blue-700 text-white shadow-md border border-blue-600',
                filterInactive: isLight
                    ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm'
                    : 'bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600 hover:border-gray-500 shadow-sm'
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
        { header: "Order ID", accessor: "orderid" },
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
        { value: '1', label: 'All', count: 0 },
        { value: '2', label: 'New', count: 0 },
        { value: '3', label: 'In Progress', count: 0 },
        { value: '4', label: 'QC Required', count: 0 },
        { value: '5', label: 'On Hold', count: 0 },
        { value: '6', label: 'Designed Completed', count: 0 },
        { value: '7', label: 'Canceled', count: 0 },
    ];

    // Parse date string to Date object
    const parseOrderDateOnly = (dateStr) => {
        if (!dateStr) return null;
        const [datePart] = dateStr.split(' ');
        const [day, monthStr, year] = datePart.split('-');
        
        const months = {
            Jan: 0, Feb: 1, Mar: 2, Apr: 3,
            May: 4, Jun: 5, Jul: 6, Aug: 7,
            Sep: 8, Oct: 9, Nov: 10, Dec: 11
        };
        
        return new Date(Number(year), months[monthStr], Number(day));
    };

    // MAIN FIX: Apply all filters completely independently
    const applyFilters = () => {
        if (!allData.length) {
            setFilteredData([]);
            return;
        }

        let filtered = [...allData];

        // STATUS FILTER - works independently
        if (selectedFilter !== '1') {
            const statusMap = {
                '2': 'New',
                '3': 'Pending',
                '4': 'Qc',
                '5': 'Hold',
                '6': 'Completed',
                '7': 'Cancelled'
            };
            const targetStatus = statusMap[selectedFilter];
            filtered = filtered.filter(item => item.status === targetStatus);
        }

        // ORDER ID RANGE FILTER - works independently
        // Filter by "Order ID From" if provided
        if (orderIdFrom && orderIdFrom.trim() !== '') {
            const fromId = parseInt(orderIdFrom);
            if (!isNaN(fromId)) {
                filtered = filtered.filter(item => {
                    const orderId = parseInt(item.orderid);
                    return !isNaN(orderId) && orderId >= fromId;
                });
            }
        }

        // Filter by "Order ID To" if provided
        if (orderIdTo && orderIdTo.trim() !== '') {
            const toId = parseInt(orderIdTo);
            if (!isNaN(toId)) {
                filtered = filtered.filter(item => {
                    const orderId = parseInt(item.orderid);
                    return !isNaN(orderId) && orderId <= toId;
                });
            }
        }

        // DATE RANGE FILTER - works independently
        if (startDate && startDate.trim() !== '') {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            filtered = filtered.filter(item => {
                const itemDate = parseOrderDateOnly(item.order_date);
                return itemDate && itemDate >= start;
            });
        }

        if (endDate && endDate.trim() !== '') {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include entire end day

            filtered = filtered.filter(item => {
                const itemDate = parseOrderDateOnly(item.order_date);
                return itemDate && itemDate <= end;
            });
        }

        setFilteredData(filtered);
    };

    // Handle search button click
    const handleSearchClick = () => {
        applyFilters();
    };

    // Handle filter button click - works independently
    const handleFilterClick = (filterValue) => {
        setSelectedFilter(filterValue);
        // Filter will be applied automatically by useEffect
    };

    // Handle reset filters - completely clear everything
    const handleResetFilters = () => {
        setStartDate('');
        setEndDate('');
        setOrderIdFrom('');
        setOrderIdTo('');
        setSelectedFilter('1');
        // Show all data immediately
        setFilteredData(allData);
    };

    // Handle order ID input
    const handleOrderIdFromChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setOrderIdFrom(value);
    };

    const handleOrderIdToChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setOrderIdTo(value);
    };

    // Update filter counts
    const updatedFilterButtons = useMemo(() => {
        if (!allData.length) return filterButtons;

        return filterButtons.map(button => {
            let count = 0;

            if (button.value === '1') {
                count = allData.length;
            } else {
                const statusMap = {
                    '2': 'New',
                    '3': 'Pending',
                    '4': 'Qc',
                    '5': 'Hold',
                    '6': 'Completed',
                    '7': 'Cancelled'
                };
                const targetStatus = statusMap[button.value];
                count = allData.filter(item => item.status === targetStatus).length;
            }

            return { ...button, count };
        });
    }, [allData]);

    // Apply filters whenever ANY filter changes
    useEffect(() => {
        applyFilters();
    }, [selectedFilter, startDate, endDate, orderIdFrom, orderIdTo, allData]);

    // Initial data fetch
    useEffect(() => {
        async function fetchAllCases() {
            setIsLoading(true);
            try {
                const data = await fetchWithAuth('/get-all-cases', {
                    method: "GET",
                });

                if (data && data.status === 'success') {
                    setAllData(data.new_cases);
                    setFilteredData(data.new_cases);
                } else {
                    setAllData([]);
                    setFilteredData([]);
                }
            } catch (error) {
                console.error("Error fetching cases:", error);
                setAllData([]);
                setFilteredData([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAllCases();
    }, []);

    // Get active filter count
    const getActiveFilterCount = () => {
        let count = 0;
        if (selectedFilter !== '1') count++;
        if (startDate) count++;
        if (endDate) count++;
        if (orderIdFrom) count++;
        if (orderIdTo) count++;
        return count;
    };

    return (
        <>
            <Hd />
            <main id="main" className={`flex-grow px-4 transition-colors duration-300 ${themeClasses.main} pt-14`}>
                <div className="px-2 sm:px-6 lg:px-2">
                    <div className="w-full max-w-full">

                        {/* Header Section */}
                        <header className={`rounded-xl border shadow-sm my-6 px-6 py-4 ${theme === 'light' 
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 text-gray-800'
                            : 'bg-gradient-to-r from-gray-800 to-blue-900/20 border-gray-700 text-white'
                        }`}>
                            <div className="container mx-auto">
                                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-center sm:text-left">
                                        <h1 className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent`}>
                                            Order Management
                                        </h1>
                                        <p className={`mt-2 text-sm sm:text-base ${themeClasses.text.secondary}`}>
                                            Monitor and manage your dental laboratory orders
                                        </p>
                                    </div>
                                    <nav className="flex justify-center sm:justify-start">
                                        <ol className="flex items-center space-x-2 sm:space-x-3 text-sm">
                                            <li>
                                                <Link
                                                    to="/user/home"
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
                                                <span>Orders</span>
                                            </li>
                                        </ol>
                                    </nav>
                                </div>
                            </div>
                        </header>

                        {/* Main Card Container */}
                        <div className={`rounded-xl ${themeClasses.card} mb-8`}>

                            {/* Search Section */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-6 p-4">
                                    <div className="flex items-center">
                                        <h2 className={`text-xl font-semibold ${themeClasses.text.primary} flex items-center mr-4`}>
                                            <FontAwesomeIcon icon={faSearch} className="w-5 h-5 mr-3 text-blue-500" />
                                            Search & Filter
                                        </h2>
                                        {getActiveFilterCount() > 0 && (
                                            <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
                                                {getActiveFilterCount()} active filter(s)
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleResetFilters}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${theme === 'light'
                                            ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                                            }`}
                                    >
                                        <FontAwesomeIcon icon={faSync} className="w-4 h-4" />
                                        <span>Reset All</span>
                                    </button>
                                </div>

                                <div className="ml-44 max-w-8xl mx-auto">
                                    <div className="flex items-end gap-4 flex-nowrap overflow-x-auto">

                                        {/* Order ID From */}
                                        <div className="min-w-[160px]">
                                            <label className={`block text-sm font-semibold ${themeClasses.text.primary} mb-2 flex items-center`}>
                                                <FontAwesomeIcon icon={faHashtag} className="w-4 h-4 mr-2 text-blue-500" />
                                                Order ID From
                                            </label>
                                            <input
                                                type="text"
                                                value={orderIdFrom}
                                                onChange={handleOrderIdFromChange}
                                                placeholder="e.g., 1001"
                                                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${themeClasses.input}`}
                                            />
                                        </div>

                                        {/* Order ID To */}
                                        <div className="min-w-[160px]">
                                            <label className={`block text-sm font-semibold ${themeClasses.text.primary} mb-2 flex items-center`}>
                                                <FontAwesomeIcon icon={faHashtag} className="w-4 h-4 mr-2 text-blue-500" />
                                                Order ID To
                                            </label>
                                            <input
                                                type="text"
                                                value={orderIdTo}
                                                onChange={handleOrderIdToChange}
                                                placeholder="e.g., 2000"
                                                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${themeClasses.input}`}
                                            />
                                        </div>

                                        {/* OR */}
                                        <div className="pb-3 font-bold text-lg whitespace-nowrap">
                                            OR
                                        </div>

                                        {/* Start Date */}
                                        <div className="min-w-[160px]">
                                            <label className={`block text-sm font-semibold ${themeClasses.text.primary} mb-2 flex items-center`}>
                                                <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2 text-blue-500" />
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${themeClasses.input}`}
                                            />
                                        </div>

                                        {/* End Date */}
                                        <div className="min-w-[160px]">
                                            <label className={`block text-sm font-semibold ${themeClasses.text.primary} mb-2 flex items-center`}>
                                                <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2 text-blue-500" />
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${themeClasses.input}`}
                                            />
                                        </div>

                                        {/* Apply Button */}
                                        <div className="min-w-[180px] pb-1">
                                            <button
                                                onClick={handleSearchClick}
                                                disabled={isLoading}
                                                className={`w-full h-12 text-white font-semibold rounded-lg flex items-center justify-center space-x-2 transition-all ${isLoading ? 'bg-gray-400 cursor-not-allowed' : themeClasses.button.success}`}
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                        <span>Searching...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FontAwesomeIcon icon={faSearch} />
                                                        <span>Apply Filters</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tips */}
                                    <div className="mt-3 text-left">
                                        <p className={`text-xs ${themeClasses.text.muted}`}>
                                            Tip: All filters work independently. Use date OR order ID OR both. Status filter works with any combination.
                                        </p>
                                    </div>
                                </div>

                            </div>

                            {/* Quick Filter Section */}
                            <div className="mb-8 p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`text-lg font-semibold ${themeClasses.text.primary} flex items-center`}>
                                        <FontAwesomeIcon icon={faFilter} className="w-4 h-4 mr-2 text-blue-500" />
                                        Quick Status Filters
                                    </h3>
                                    <span className={`text-sm ${themeClasses.text.muted}`}>
                                        Showing {filteredData.length} of {allData.length} orders
                                    </span>
                                </div>

                                <div className="max-w-full mx-auto">
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {updatedFilterButtons.map((button) => (
                                            <button
                                                key={button.value}
                                                onClick={() => handleFilterClick(button.value)}
                                                disabled={isLoading}
                                                className={`cursor-pointer px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 min-w-[120px] ${selectedFilter === button.value
                                                    ? `${themeClasses.button.filterActive} transform scale-105`
                                                    : themeClasses.button.filterInactive
                                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-100'}`}
                                            >
                                                <div className={`w-3 h-3 rounded-full ${selectedFilter === button.value
                                                    ? 'bg-white'
                                                    : 'bg-blue-500'
                                                    }`}></div>
                                                <span className="font-medium text-sm">{button.label}</span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedFilter === button.value
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                                    }`}>
                                                    {button.count}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Data Table Section */}
                            <div className="">
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