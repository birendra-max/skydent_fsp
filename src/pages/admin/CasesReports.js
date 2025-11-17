import { useContext, useState, useEffect } from "react";
import Hd from "./Hd";
import Foot from './Foot';
import { ThemeContext } from "../../Context/ThemeContext";
import CasesDatatable from "./CasesDatatable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalendarAlt,
    faSearch,
    faFilter,
    faFileAlt,
} from "@fortawesome/free-solid-svg-icons";
import { fetchWithAuth } from "../../utils/adminapi";
import Sidebar from "./Sidebar";

export default function CasesReports() {
    const { theme } = useContext(ThemeContext);
    const [selectedFilter, setSelectedFilter] = useState();
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [data, setData] = useState([]);

    const themeClasses = {
        main: theme === "dark" ? "bg-gray-950 text-gray-100" : "bg-gray-100 text-gray-900",
        card: theme === "dark" ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200",
        input:
            theme === "dark"
                ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-600",
        button: {
            primary:
                theme === "dark"
                    ? "bg-blue-700 hover:bg-blue-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white",
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
    ];

    const filterButtons = [
        { value: "1", label: "Today" },
        { value: "2", label: "Weekly" },
        { value: "3", label: "Monthly" },
    ];

    const handleSearch = async (filterValue = null) => {
        if (filterValue) setSelectedFilter(filterValue);
        setIsLoading(true);

        try {
            const responseData = await fetchWithAuth("/get-reports-cases", {
                method: "POST",
                body: JSON.stringify({
                    filter: filterValue || selectedFilter,
                    startDate,
                    endDate,
                }),
            });

            setData(responseData?.status === "success" ? responseData.cases : []);
        } catch (error) {
            console.error("Report fetch error:", error);
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                const res = await fetchWithAuth("/get-all-cases", { method: "GET" });
                setData(res?.status === "success" ? res.new_cases : []);
            } catch (error) {
                console.error("Error fetching cases:", error);
                setData([]);
            }
        })();
    }, []);

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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <FontAwesomeIcon icon={faFileAlt} className="text-blue-500" />
                                Reports & Analytics
                            </h1>
                            <p className="text-gray-500 mt-1">
                                Generate, filter, and analyze your case data.
                            </p>
                        </div>
                    </div>

                    {/* Search Card */}
                    <div className={`rounded-2xl p-6 shadow-lg ${themeClasses.card}`}>
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-blue-500" />
                            Filter Cases by Date
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Date From</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 ${themeClasses.input}`}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Date To</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 ${themeClasses.input}`}
                                />
                            </div>
                            <div className="md:col-span-1">
                                <button
                                    onClick={() => handleSearch()}
                                    className={`w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 ${themeClasses.button.primary}`}
                                >
                                    <FontAwesomeIcon icon={faSearch} />
                                    Search
                                </button>
                            </div>
                        </div>

                        {/* Quick Filters */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-8">
                            {filterButtons.map((btn) => (
                                <button
                                    key={btn.value}
                                    onClick={() => handleSearch(btn.value)}
                                    className={`px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-300 ${selectedFilter === btn.value
                                        ? `${themeClasses.button.filterActive} scale-105`
                                        : themeClasses.button.filterInactive
                                        }`}
                                >
                                    <FontAwesomeIcon icon={faCalendarAlt} />
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <CasesDatatable columns={columns} data={data} rowsPerPage={50} />
                </div>
            </main>
            <Foot />
        </>
    );
}
