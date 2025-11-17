import { useContext, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Hd from "./Hd";
import Foot from "./Foot";
import { ThemeContext } from "../../Context/ThemeContext";
import CasesDatatable from "./CasesDatatable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate } from "@fortawesome/free-solid-svg-icons";
import { fetchWithAuth } from "../../utils/adminapi";

export default function RedesignCases() {
    const { theme } = useContext(ThemeContext);
    const [data, setData] = useState([]);

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

    useEffect(() => {
        async function fetchAllCases() {
            try {
                const data = await fetchWithAuth('/get-redesign-cases', {
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
                            <FontAwesomeIcon icon={faRotate} className="text-blue-500" />
                            Redesign Cases
                        </h1>
                        <p
                            className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                }`}
                        >
                            Manage and monitor your all cases.
                        </p>
                    </div>
                    {/* 📊 Client Table */}
                    <CasesDatatable columns={columns} data={data} rowsPerPage={50} />
                </div>
            </main>
            <Foot />
        </>
    );
}
