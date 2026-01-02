import { useContext, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Hd from "./Hd";
import Foot from "./Foot";
import { ThemeContext } from "../../Context/ThemeContext";
import CasesDatatable from "./CasesDatatable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { fetchWithAuth } from "../../utils/adminapi";

export default function CancelledCases() {
    const { theme } = useContext(ThemeContext);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const columns = [
        { header: "Order Id", accessor: "orderid" },
        { header: "File Name", accessor: "fname" },
        { header: "TAT", accessor: "tduration" },
        { header: "Status", accessor: "status" },
        { header: "Unit", accessor: "unit" },
        { header: "Tooth", accessor: "tooth" },
        { header: "Lab Name", accessor: "labname" },
        { header: "Run Self By", accessor: "run_self_by" },
        { header: "Date", accessor: "order_date" },
    ];

    useEffect(() => {
        async function fetchAllCases() {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchWithAuth('/get-cancelled', {
                    method: "GET",
                });

                // data is already the parsed JSON response
                if (data && data.status === 'success') {
                    setData(data);
                } else {
                    setData([]);
                    setError("No data found ! in the server")
                }
            } catch (error) {
                setData([]);
                setError("Network error. Please check your connection.");
            } finally {
                setLoading(false);
            }
        }

        fetchAllCases();
    }, []);

    return (
        <>
            <Hd />
            <main
                className={`min-h-screen flex ml-64 transition-all duration-300 ${theme === "dark"
                    ? "bg-gray-950 text-gray-100"
                    : "bg-gray-200 text-gray-800"
                    }`}
            >
                <Sidebar />

                <div className="flex-1 p-6 mt-18">
                    {/* Header */}
                    <div className="mb-2">
                        <h1
                            className={`text-3xl font-semibold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-800"
                                }`}
                        >
                            <FontAwesomeIcon icon={faCircleXmark} className="text-blue-500" />
                            Cancelled Cases
                        </h1>
                        <p
                            className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                }`}
                        >
                            Manage and monitor your all cases.
                        </p>
                    </div>
                    {/* 📊 Client Table */}
                    <CasesDatatable columns={columns} data={data} rowsPerPage={50} loading={loading} error={error} />
                </div>
            </main>
            <Foot />
        </>
    );
}
