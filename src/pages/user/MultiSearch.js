import { useContext, useState, useEffect } from "react";
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
    faSync
} from '@fortawesome/free-solid-svg-icons';
import { fetchWithAuth } from '../../utils/userapi';

export default function MultiSearch() {
    const { theme } = useContext(ThemeContext);
    const [selectedFilter, setSelectedFilter] = useState('1'); // Default to 'All'
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [data, setData] = useState([]);

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

    // Single function to handle both search types
    const handleSearch = async (filterValue = null) => {
        const filterToUse = filterValue || selectedFilter;

        // Update filter state if a filter button was clicked
        if (filterValue) {
            setSelectedFilter(filterValue);
        }

        setIsLoading(true);

        try {
            const requestData = {
                filter: filterToUse,
                startDate,
                endDate,
            };

            const responseData = await fetchWithAuth("get-cases-data", {
                method: "POST",
                body: JSON.stringify(requestData),
            });

            if (responseData?.status === "success") {
                setData(responseData.cases);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Search error:", error);
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle search button click
    const handleSearchClick = () => {
        handleSearch();
    };

    // Handle filter button click
    const handleFilterClick = (filterValue) => {
        handleSearch(filterValue);
    };

    // Handle reset filters
    const handleResetFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedFilter('1');
        // Trigger search with reset values
        handleSearch('1');
    };

    const getHeaderClass = () => {
        return theme === 'light'
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 text-gray-800'
            : 'bg-gradient-to-r from-gray-800 to-blue-900/20 border-gray-700 text-white';
    };

    const getStatusBadgeClass = (status) => {
        const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";

        const statusConfig = {
            'New': theme === 'light'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-blue-900/30 text-blue-300 border border-blue-700',
            'In Progress': theme === 'light'
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                : 'bg-yellow-900/30 text-yellow-300 border border-yellow-700',
            'QC Required': theme === 'light'
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : 'bg-purple-900/30 text-purple-300 border border-purple-700',
            'On Hold': theme === 'light'
                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                : 'bg-orange-900/30 text-orange-300 border border-orange-700',
            'Designed Completed': theme === 'light'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-green-900/30 text-green-300 border border-green-700',
            'Canceled': theme === 'light'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-red-900/30 text-red-300 border border-red-700',
        };

        return `${baseClasses} ${statusConfig[status] || statusConfig['New']}`;
    };

    useEffect(() => {
        async function fetchAllCases() {
            setIsLoading(true);
            try {
                const data = await fetchWithAuth('/get-all-cases', {
                    method: "GET",
                });

                if (data && data.status === 'success') {
                    setData(data.new_cases);
                } else {
                    setData([]);
                }
            } catch (error) {
                console.error("Error fetching cases:", error);
                setData([]);
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
                <div className="px-2 sm:px-6 lg:px-2">
                    <div className="w-full max-w-full">

                        {/* Enhanced Header Section */}
                        <header className={`rounded-xl border shadow-sm my-6 px-6 py-4 ${getHeaderClass()}`}>
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
                        <div className={`rounded-xl ${themeClasses.card}  p-6 mb-8`}>

                            {/* Search Section */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className={`text-xl font-semibold ${themeClasses.text.primary} flex items-center`}>
                                        <FontAwesomeIcon icon={faSearch} className="w-5 h-5 mr-3 text-blue-500" />
                                        Search & Filter
                                    </h2>
                                    <button
                                        onClick={handleResetFilters}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${theme === 'light'
                                            ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                                            }`}
                                    >
                                        <FontAwesomeIcon icon={faSync} className="w-4 h-4" />
                                        <span>Reset</span>
                                    </button>
                                </div>

                                <div className="mr-20 max-w-5xl mx-auto">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                                        <div className="lg:col-span-3">
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
                                        <div className="lg:col-span-3">
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
                                        <div className="lg:col-span-4">
                                            <button
                                                onClick={handleSearchClick}
                                                disabled={isLoading}
                                                className={`w-full h-12 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${isLoading
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : themeClasses.button.success
                                                    }`}
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                        <span>Searching...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FontAwesomeIcon icon={faSearch} className="w-4 h-4" />
                                                        <span>Search Orders</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced Filter Section */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`text-lg font-semibold ${themeClasses.text.primary} flex items-center`}>
                                        <FontAwesomeIcon icon={faFilter} className="w-4 h-4 mr-2 text-blue-500" />
                                        Quick Filters
                                    </h3>
                                    <span className={`text-sm ${themeClasses.text.muted}`}>
                                        {data.length} orders found
                                    </span>
                                </div>

                                <div className="max-w-full mx-auto">
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {filterButtons.map((button) => (
                                            <button
                                                key={button.value}
                                                onClick={() => handleFilterClick(button.value)}
                                                disabled={isLoading}
                                                className={`cursor-pointer px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 min-w-[120px] ${selectedFilter === button.value
                                                    ? `${themeClasses.button.filterActive} transform scale-105`
                                                    : themeClasses.button.filterInactive
                                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                                            >
                                                <div className={`w-3 h-3 rounded-full ${selectedFilter === button.value
                                                    ? 'bg-white'
                                                    : 'bg-blue-500'
                                                    }`}></div>
                                                <span className="font-medium text-sm">{button.label}</span>
                                                {button.count > 0 && (
                                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedFilter === button.value
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                                        }`}>
                                                        {button.count}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Data Table Section */}
                            <div className="">
                                <Datatable
                                    columns={columns}
                                    data={data}
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