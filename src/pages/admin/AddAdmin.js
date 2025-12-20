import { useContext, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Hd from "./Hd";
import Foot from "./Foot";
import { ThemeContext } from "../../Context/ThemeContext";
import AdminDatatable from "./AdminDatatable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { fetchWithAuth } from "../../utils/adminapi";

export default function AddAdmin() {
    const { theme } = useContext(ThemeContext);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [showPassword, setShowPassword] = useState(false); // 👈 For toggle
    const [error, setError] = useState(null);


    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        mobile: "",
    });

    const columns = [
        { header: "Admin Id", accessor: "id" },
        { header: "Name", accessor: "name" },
        { header: "Email", accessor: "email" },
        { header: "Mobile", accessor: "mobile" },
        { header: "Status", accessor: "status" },
        { header: "Delete", accessor: "delete" },
    ];

    const getClients = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetchWithAuth("/get-admin", {
                method: "GET",
            });

            if (res && res.status === "success") {
                setData(res.admin);
            }
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
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: "", type: "" });

        try {
            const resp = await fetchWithAuth(`/add-admin`, {
                method: "POST",
                body: JSON.stringify(formData),
            });

            if (resp.status === "success") {
                setMessage({ text: resp.message, type: resp.status });
                setFormData({
                    name: "",
                    email: "",
                    password: "",
                    mobile: "",
                });
                getClients();
            } else {
                setMessage({ text: resp.message, type: "error" });
            }
        } catch (error) {
            console.error("Error adding client:", error);
            setMessage({ text: "⚠️ Error adding client.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

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
                    <div>
                        <h1
                            className={`text-3xl font-semibold flex items-center gap-3 ${theme === "dark" ? "text-white" : "text-gray-800"
                                }`}
                        >
                            <FontAwesomeIcon
                                icon={faUserPlus}
                                className="text-blue-500"
                            />
                            Add Admin
                        </h1>
                        <p
                            className={`mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                }`}
                        >
                            Register a new admin below. Fill in all required details.
                        </p>
                    </div>

                    {/* Form Card */}
                    <div
                        className={`mt-8 p-8 rounded-2xl shadow-xl border ${theme === "dark"
                            ? "bg-gray-900 border-gray-800"
                            : "bg-white border-gray-200"
                            }`}
                    >
                        {/* Form Header */}
                        <div className="mb-8">
                            <h2
                                className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-800"
                                    }`}
                            >
                                Client Information
                            </h2>
                            <p
                                className={`mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                    }`}
                            >
                                Enter the required details to add a new client.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-7">

                            {/* Full Name */}
                            <div>
                                <label className="font-semibold block mb-2">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter client's name"
                                    className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 ${theme === "dark"
                                        ? "bg-gray-800 border-gray-700 text-gray-200"
                                        : "bg-gray-50 border-gray-300 text-gray-800"
                                        }`}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="font-semibold block mb-2">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter client's email"
                                    className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 ${theme === "dark"
                                        ? "bg-gray-800 border-gray-700 text-gray-200"
                                        : "bg-gray-50 border-gray-300 text-gray-800"
                                        }`}
                                />
                            </div>

                            {/* Mobile */}
                            <div>
                                <label className="font-semibold block mb-2">Mobile Number</label>
                                <input
                                    type="text"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter mobile number"
                                    className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 ${theme === "dark"
                                        ? "bg-gray-800 border-gray-700 text-gray-200"
                                        : "bg-gray-50 border-gray-300 text-gray-800"
                                        }`}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="font-semibold block mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter password"
                                        className={`w-full p-3 pr-10 rounded-lg border focus:ring-2 focus:ring-blue-500 ${theme === "dark"
                                            ? "bg-gray-800 border-gray-700 text-gray-200"
                                            : "bg-gray-50 border-gray-300 text-gray-800"
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-500 hover:text-blue-600"
                                    >
                                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                    </button>
                                </div>
                            </div>

                            {/* Row: Submit + Message */}
                            <div className="md:col-span-2 flex items-center justify-end gap-4 pt-5">

                                {/* Message */}
                                {message.text && (
                                    <div
                                        className={`px-4 py-2 rounded-md text-sm font-medium ${message.type === "success"
                                            ? "bg-green-100 text-green-700 border border-green-300"
                                            : "bg-red-100 text-red-700 border border-red-300"
                                            }`}
                                    >
                                        {message.text}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`px-10 py-2.5 rounded-xl font-semibold shadow-md transition-all ${loading
                                        ? "bg-blue-400 text-white cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                        }`}
                                >
                                    {loading ? "Saving..." : "Save Admin"}
                                </button>
                            </div>
                        </form>
                    </div>


                    {/* Client Table */}
                    <AdminDatatable columns={columns} data={data} rowsPerPage={50} loading={loading} error={error}/>
                </div>
            </main>
            <Foot />
        </>
    );
}
