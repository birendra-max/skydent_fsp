import { useContext, useEffect, useState } from "react";
import Hd from './Hd';
import Foot from './Foot';
import Datatable from "./Datatable";
import { ThemeContext } from "../../Context/ThemeContext";
import { useParams } from "react-router-dom";
import { fetchWithAuth } from "../../utils/userapi";

export default function SearchOrder() {
    const { theme } = useContext(ThemeContext);
    const [data, setData] = useState([]);
    const { searchData } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    useEffect(() => {
        async function fetchOrders() {
            try {
                setLoading(true);
                setError(null);
                const decodedSearch = decodeURIComponent(searchData);
                const response = await fetchWithAuth(`/get-order`, {
                    method: "POST",
                    body: JSON.stringify({ search: decodedSearch }),
                });

                if (response.status === "success") {
                    setData(response.orders);
                } else {
                    setData([]);
                }
            } catch (error) {
                setData([]);
                setError("Network error. Please check your connection.");
            } finally {
                setLoading(false);
            }
        }

        if (searchData) {
            fetchOrders();
        }
    }, [searchData]);

    return (
        <>
            <Hd />
            <main
                id="main"
                className={`flex-grow px-4 transition-colors duration-300 ${theme === "light" ? "bg-white text-black" : "bg-black text-white"
                    } pt-16 sm:pt-22`}
            >
                <Datatable columns={columns} data={data} rowsPerPage={50} loading={loading} error={error} />
            </main>
            <Foot />
        </>
    );
}
