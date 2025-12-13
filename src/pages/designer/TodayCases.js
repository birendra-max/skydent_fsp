import { useContext, useEffect, useState } from "react";
import Hd from './Hd';
import Foot from './Foot';
import Datatable from "./Datatable";
import Dashboard from "./Dashboard";
import { ThemeContext } from "../../Context/ThemeContext";
import { fetchWithAuth } from '../../utils/designerapi';


export default function TodayCases() {
    const { theme } = useContext(ThemeContext);
    const [data, setData] = useState([]);
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
        async function fetchTodayCases() {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchWithAuth('/today-cases', {
                    method: "GET",
                });
                // data is already the parsed JSON response
                if (data && data.status === 'success') {
                    setData(data.new_cases);
                } else {
                    setData([]);
                    setError("No data found ! in the server");
                }
            } catch (error) {
                setData([]);
                setError("Network error. Please check your connection.");
            } finally {
                setLoading(false);
            }
        }

        fetchTodayCases();
    }, []);


    return (
        <>
            <Hd />
            <main id="main" className={`flex-grow px-4 transition-colors duration-300 ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'} pt-16 sm:pt-22`}>
                <Dashboard />
                <Datatable columns={columns} data={data} rowsPerPage={50} loading={loading} error={error} />
            </main>
            <Foot />
        </>
    );
}
