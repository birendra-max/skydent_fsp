import { useContext, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Hd from "./Hd";
import Foot from "./Foot";
import { ThemeContext } from "../../Context/ThemeContext";
import CommanDatatable from "./CommanDatatable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import { fetchWithAuth } from "../../utils/adminapi";

export default function StlFile() {
    const { theme } = useContext(ThemeContext);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const columns = [
        { header: "Order Id", accessor: "orderid" },
        { header: "File Name", accessor: "fname" },
        { header: "Upload By", accessor: "uploaded_by" },
        { header: "Upload Date", accessor: "upload_date" },
        { header: "File", accessor: "file_deleted" },
    ];

    const getClients = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetchWithAuth("/get-stl-file", { method: "GET" });
            console.log(res);
            if (res && res.status === "success") setData(res.data);
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
    };

    useEffect(() => {
        getClients();
    }, [])

    return (
        <>
            <Hd />
            <main
                className={`min-h-screen flex transition-all duration-300 ${theme === "dark"
                    ? "bg-gray-950 text-gray-100"
                    : "bg-gray-100 text-gray-800"
                    }`}
            >
                <div className="fixed top-0 left-0 h-full w-64 z-20">
                    <Sidebar />
                </div>

                <div className="w-full flex-1 ml-64 flex flex-col min-h-screen p-6 mt-16 space-y-8">
                    {/* Header */}
                    <div>
                        <h1
                            className={`text-3xl font-semibold flex items-center gap-3 ${theme === "dark" ? "text-white" : "text-gray-800"
                                }`}
                        >
                            <FontAwesomeIcon
                                icon={faFolderOpen}
                                className="text-blue-500"
                            />
                            STL Files
                        </h1>
                        <p
                            className={`mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                }`}
                        >
                            Register a new client below. Fill in all required details.
                        </p>
                    </div>

                    {/* Client Table */}
                    <CommanDatatable columns={columns} data={data} rowsPerPage={50} loading={loading} error={error} />
                </div>
            </main>
            <Foot />
        </>
    );
}
