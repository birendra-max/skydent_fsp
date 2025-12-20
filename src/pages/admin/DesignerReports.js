import { useContext, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Hd from "./Hd";
import Foot from "./Foot";
import { ThemeContext } from "../../Context/ThemeContext";
import Datatable from "./Datatable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartBar } from "@fortawesome/free-solid-svg-icons";
import { fetchWithAuth } from "../../utils/adminapi";

export default function ClientReports() {
    const { theme } = useContext(ThemeContext);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const columns = [
        { header: "Client Id", accessor: "userid" },
        { header: "Name", accessor: "name" },
        { header: "Email", accessor: "email" },
        { header: "Case Status", accessor: "case_status" },
        { header: "Total", accessor: "count" },
    ];

    useEffect(() => {
        async function getClients() {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchWithAuth("/get-reports", { method: "GET" });
                if (data && data.status === "success") setData(data.data);
                else {
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
        getClients();
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
                    <div className="mb-6">
                        <h1
                            className={`text-3xl font-semibold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-800"
                                }`}
                        >
                            <FontAwesomeIcon icon={faChartBar} className="text-blue-500" />
                            Designer Reports
                        </h1>
                        <p
                            className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                }`}
                        >
                            Manage and monitor your client reports.
                        </p>
                    </div>

                    {/* 📊 Client Table */}
                    <Datatable columns={columns} data={data} rowsPerPage={50} loading={loading} error={error} />
                </div>
            </main>
            <Foot />
        </>
    );
}
