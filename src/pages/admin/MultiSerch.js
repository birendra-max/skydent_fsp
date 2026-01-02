import { useContext, useState, useEffect } from "react";
import Hd from './Hd';
import Foot from './Foot';
import { ThemeContext } from "../../Context/ThemeContext";
import CasesDatatable from './CasesDatatable';
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';
import { fetchWithAuth } from '../../utils/adminapi';

export default function MultiSearch() {
    const { theme } = useContext(ThemeContext);
    const [selectedFilter, setSelectedFilter] = useState('1');
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [orderIdFrom, setOrderIdFrom] = useState('');
    const [orderIdTo, setOrderIdTo] = useState('');
    const [filteredData, setFilteredData] = useState({ cases: [], pagination: {} });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

    const filterButtons = [
        { value: '1', label: 'All' },
        { value: '2', label: 'New' },
        { value: '3', label: 'In Progress' },
        { value: '4', label: 'QC Required' },
        { value: '5', label: 'On Hold' },
        { value: '6', label: 'Designed Completed' },
        { value: '7', label: 'Canceled' },
    ];

    const fetchFilteredData = async (filterValue = selectedFilter) => {
        setLoading(true);
        setIsLoading(true);
        
        const params = new URLSearchParams();
        
        if (orderIdFrom) params.append('order_id_from', orderIdFrom);
        if (orderIdTo) params.append('order_id_to', orderIdTo);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        const statusMap = {
            '1': '', // All - no status filter
            '2': 'New',
            '3': 'Pending',
            '4': 'Qc',
            '5': 'Hold',
            '6': 'Completed',
            '7': 'Cancelled'
        };
        
        const statusValue = statusMap[filterValue];
        if (statusValue) {
            params.append('status', statusValue);
        }

        try {
            const queryString = params.toString();
            const url = `/get-all-cases${queryString ? `?${queryString}` : ''}`;
            
            const response = await fetchWithAuth(url, {
                method: "GET",
            });

            if (response && response.status === 'success') {
                setFilteredData(response.data);
            } else {
                setFilteredData({ cases: [], pagination: {} });
            }
        } catch (error) {
            setFilteredData({ cases: [], pagination: {} });
        } finally {
            setLoading(false);
            setIsLoading(false);
        }
    };

    const handleSearchClick = () => {
        fetchFilteredData();
    };

    const handleFilterClick = (filterValue) => {
        setSelectedFilter(filterValue);
        fetchFilteredData(filterValue);
    };

    const handleOrderIdFromChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setOrderIdFrom(value);
    };

    const handleOrderIdToChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setOrderIdTo(value);
    };

    useEffect(() => {
        fetchFilteredData();
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

                        <header className={`bg-gray-50 rounded-xl border-b shadow-sm my-4 px-4 ${getHeaderClass()}`}>
                            <div className="container mx-auto px-3 sm:px py-4 sm:py-3">
                                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-center sm:text-left">
                                        <h1 className={`text-2xl sm:text-3xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                                            View Orders
                                        </h1>
                                        <p className={`mt-1 text-sm sm:text-base ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                                            Manage your account orders and preferences
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
                                        </ol>
                                    </nav>
                                </div>
                            </div>
                        </header>

                        <div className={`bg-gray-50 rounded-xl ${themeClasses.card} p-4`}>

                            <div className="mb-8">
                                <div className="max-w-8xl mx-auto ml-50">
                                    <div className="grid grid-cols-12 gap-4 items-center">

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

                                        <div className="col-span-1 flex justify-center items-end font-bold text-lg text-gray-500 mt-4">
                                            OR
                                        </div>

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

                                        <div className="col-span-3 flex items-end mt-6">
                                            <button
                                                onClick={handleSearchClick}
                                                disabled={isLoading}
                                                className={`cursor-pointer w-44 h-12 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 ${isLoading ? 'bg-gray-400' : themeClasses.button.success}`}
                                            >
                                                {isLoading ? 'Searching...' : 'Search Cases'}
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            </div>

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
                                                <div className={`w-2 h-2 rounded-full ${selectedFilter === button.value ? 'bg-white' : 'bg-blue-500'}`}></div>
                                                <span className="font-medium">{button.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

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