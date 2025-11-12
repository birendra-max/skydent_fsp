import { useContext, useState,useEffect } from "react";
import Hd from './Hd';
import Foot from './Foot';
import { ThemeContext } from "../../Context/ThemeContext";
import Datatable from './Datatable';
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHome,
} from '@fortawesome/free-solid-svg-icons';
import { fetchWithAuth } from "../../utils/designerapi";

export default function Reports() {
    const { theme } = useContext(ThemeContext);
    const [selectedFilter, setSelectedFilter] = useState();
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [data, setData] = useState([]);


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
        { header: "Date", accessor: "order_date" },
        { header: "Message", accessor: "message" },
    ];

    const filterButtons = [
        { value: '1', label: 'Today' },
        { value: '2', label: 'Weekly' },
        { value: '3', label: 'Monthely' },
    ];

    // Single function to handle both search types
    const handleSearch = async (filterValue = null) => {
        // Update filter state if a filter button was clicked
        if (filterValue) {
            setSelectedFilter(filterValue);
        }

        setIsLoading(true);

        try {
            const requestData = {
                filter: filterValue || selectedFilter,
                startDate,
                endDate,
            };

            // Use centralized fetchWithAuth for API call
            const responseData = await fetchWithAuth("/get-reports", {
                method: "POST",
                body: JSON.stringify(requestData),
            });

            if (responseData?.status === "success") {
                setData(responseData.cases);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Report fetch error:", error);
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle search button click
    const handleSearchClick = () => {
        handleSearch(); // Uses current selectedFilter
    };

    // Handle filter button click
    const handleFilterClick = (filterValue) => {
        handleSearch(filterValue);
    };


    const getHeaderClass = () => {
        return theme === 'light'
            ? 'bg-gray-200 border-gray-200 text-gray-800'
            : 'bg-gray-800 border-gray-700 text-white';
    };

    useEffect(() => {
        async function fetchAllCases() {
            try {
                const data = await fetchWithAuth('/get-all-cases', {
                    method: "GET",
                });

                // data is already the parsed JSON response
                if (data && data.status === 'success') {
                    setData(data.new_cases);
                } else {
                    setData([]);
                }
            } catch (error) {
                console.error("Error fetching cases:", error);
                setData([]);
            }
        }

        fetchAllCases();
    }, []);

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

                            {/* Search Section */}
                            <div className="mb-8 ">
                                <div className="max-w-4xl mx-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                        <div className="md:col-span-2">
                                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                                                Date From
                                            </label>
                                            <input
                                                type="date"
                                                id="snumber"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 ${themeClasses.input}`}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>
                                                Date To
                                            </label>
                                            <input
                                                type="date"
                                                id="enumber"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 ${themeClasses.input}`}
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <button
                                                onClick={handleSearchClick}
                                                className={`cursor-pointer w-full h-12 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 ${themeClasses.button.success}`}
                                            >
                                                Search Cases
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filter Section */}
                            <div className="mb-8">
                                <div className="max-w-full mx-auto">
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {filterButtons.map((button) => (
                                            <button
                                                key={button.value}
                                                onClick={() => handleFilterClick(button.value)}
                                                className={`cursor-pointer px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 ${selectedFilter === button.value
                                                    ? `${themeClasses.button.filterActive} scale-105`
                                                    : themeClasses.button.filterInactive
                                                    }`}
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
                                <Datatable columns={columns} data={data} rowsPerPage={50}/>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Loading Indicator */}
                {isLoading && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
                        <div className={`rounded-2xl p-8 flex flex-col items-center space-y-4 transform transition-all duration-300 ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
                            <div className="relative">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-900"></div>
                                <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 dark:border-blue-400"></div>
                            </div>
                            <span className={`text-xl font-semibold ${themeClasses.text.primary}`}>Loading Cases...</span>
                            <p className={`${themeClasses.text.secondary} text-center`}>
                                Please wait while we fetch your case data
                            </p>
                        </div>
                    </div>
                )}
            </main>
            <Foot />
        </>
    );
}