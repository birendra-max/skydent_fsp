import { useContext, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Hd from "./Hd";
import Foot from "./Foot";
import { ThemeContext } from "../../Context/ThemeContext";
import Datatable from "./Datatable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUnlockAlt } from "@fortawesome/free-solid-svg-icons";
import { fetchWithAuth } from "../../utils/adminapi";
import { useParams } from "react-router-dom";

export default function AllClients() {
    const { theme } = useContext(ThemeContext);
    const { id } = useParams();
    const [data, setData] = useState([]);

    // ============================
    // 📌 Dynamic Config Based on ID (CLIENT ONLY)
    // ============================
    const pageConfig = {
        "all": {
            title: "All Clients",
            columns: [
                { header: "Client ID", accessor: "userid" },
                { header: "Name", accessor: "name" },
                { header: "Designation", accessor: "designation" },
                { header: "Email", accessor: "email" },
                { header: "Occlusion", accessor: "occlusion" },
                { header: "Lab Name", accessor: "labname" },
                { header: "Mobile", accessor: "mobile" },
                { header: "Status", accessor: "status" },
                { header: "Delete", accessor: "delete" },
            ],
        },

        "active": {
            title: "Active Clients",
            columns: [
                { header: "Client ID", accessor: "userid" },
                { header: "Name", accessor: "name" },
                { header: "Designation", accessor: "designation" },
                { header: "Email", accessor: "email" },
                { header: "Occlusion", accessor: "occlusion" },
                { header: "Lab Name", accessor: "labname" },
                { header: "Mobile", accessor: "mobile" },
                { header: "Status", accessor: "status" },
                { header: "Delete", accessor: "delete" },
            ],
        },

        "inactive": {
            title: "Inactive Clients",
            columns: [
                { header: "Client ID", accessor: "userid" },
                { header: "Name", accessor: "name" },
                { header: "Designation", accessor: "designation" },
                { header: "Email", accessor: "email" },
                { header: "Occlusion", accessor: "occlusion" },
                { header: "Lab Name", accessor: "labname" },
                { header: "Mobile", accessor: "mobile" },
                { header: "Status", accessor: "status" },
                { header: "Delete", accessor: "delete" },
            ],
        },
    };

    const config = pageConfig[id];

    // ============================
    // 📌 Fetch Data from ONE API
    // ============================
    useEffect(() => {
        async function loadData() {
            try {
                const res = await fetchWithAuth(`/fetch-client-info/${id}`);

                if (res && res.status === "success") {
                    setData(res.data || []);
                } else {
                    setData([]);
                }
            } catch (e) {
                console.error("API Error:", e);
                setData([]);
            }
        }

        loadData();
    }, [id]);

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
                    {/* ===== Page Header ===== */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-semibold flex items-center gap-2">
                            <FontAwesomeIcon icon={faUnlockAlt} className="text-blue-500" />
                            {config?.title || "Client Info"}
                        </h1>
                    </div>

                    {/* ===== Dynamic Table ===== */}
                    <Datatable
                        columns={config?.columns || []}
                        data={data}
                        rowsPerPage={50}
                    />
                </div>
            </main>

            <Foot />
        </>
    );
}
