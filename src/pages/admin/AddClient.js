import { useContext, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Hd from "./Hd";
import Foot from "./Foot";
import { ThemeContext } from "../../Context/ThemeContext";
import Datatable from "./Datatable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { fetchWithAuth } from "../../utils/adminapi";

export default function AllClients() {
    const { theme } = useContext(ThemeContext);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [showPassword, setShowPassword] = useState(false); // 👈 For toggle

    const [formData, setFormData] = useState({
        name: "",
        designation: "",
        email: "",
        password: "",
        occlusion: "",
        labname: "",
        mobile: "",
        anatomy: "",
        remark: "",
        contact: "",
        pontic: "",
    });

    const columns = [
        { header: "Client Id", accessor: "userid" },
        { header: "Name", accessor: "name" },
        { header: "Email", accessor: "email" },
        { header: "Password", accessor: "password" },
        { header: "Lab Name", accessor: "labname" },
        { header: "Mobile", accessor: "mobile" },
        { header: "Status", accessor: "status" },
        { header: "Delete", accessor: "delete" },
    ];

    const getClients = async () => {
        try {
            const res = await fetchWithAuth("/get-all-clients", {
                method: "GET",
            });
            if (res && res.status === "success") setData(res.clients);
            else setData([]);
        } catch (error) {
            console.error("Error fetching clients:", error);
            setData([]);
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
            const resp = await fetchWithAuth(`/add-client`, {
                method: "POST",
                body: JSON.stringify(formData),
            });

            if (resp.status === "success") {
                setMessage({ text: resp.message, type: resp.status });
                setFormData({
                    name: "",
                    designation: "",
                    email: "",
                    password: "",
                    occlusion: "",
                    labname: "",
                    mobile: "",
                    anatomy: "",
                    remark: "",
                    contact: "",
                    pontic: "",
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
                            Add Client
                        </h1>
                        <p
                            className={`mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                }`}
                        >
                            Register a new client below. Fill in all required details.
                        </p>
                    </div>

                    {/* Form Card */}
                    <div
                        className={`mt-8 p-8 rounded-2xl shadow-lg border ${theme === "dark"
                            ? "bg-gray-900 border-gray-800"
                            : "bg-white border-gray-200"
                            }`}
                    >
                        <form
                            onSubmit={handleSubmit}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            {/* Common input component */}
                            {[
                                { label: "Full Name", name: "name", placeholder: "Enter client's name" },
                                { label: "Designation", name: "designation", placeholder: "e.g., Dentist, Technician" },
                                { label: "Email Address", name: "email", type: "email", placeholder: "Enter email" },
                                { label: "Occlusion", name: "occlusion", placeholder: "Enter occlusion" },
                                { label: "Lab Name", name: "labname", placeholder: "Enter lab name" },
                                { label: "Mobile Number", name: "mobile", placeholder: "Enter mobile number" },
                                { label: "Anatomy", name: "anatomy", placeholder: "Enter anatomy details" },
                                { label: "Contact", name: "contact", placeholder: "Enter contact info" },
                                { label: "Pontic", name: "pontic", placeholder: "Enter pontic info" },
                            ].map((field) => (
                                <div key={field.name}>
                                    <label className="font-semibold block mb-2">{field.label}</label>
                                    <input
                                        type={field.type || "text"}
                                        name={field.name}
                                        value={formData[field.name]}
                                        onChange={handleChange}
                                        required
                                        placeholder={field.placeholder}
                                        className={`w-full p-3 rounded-md border focus:ring-2 focus:ring-blue-500 ${theme === "dark"
                                            ? "bg-gray-800 border-gray-700"
                                            : "bg-gray-50 border-gray-300"
                                            }`}
                                    />
                                </div>
                            ))}

                            {/* ✅ Password Field with Eye Toggle */}
                            <div className="relative">
                                <label className="font-semibold block mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter password"
                                        className={`w-full p-3 pr-10 rounded-md border focus:ring-2 focus:ring-blue-500 ${theme === "dark"
                                            ? "bg-gray-800 border-gray-700"
                                            : "bg-gray-50 border-gray-300"
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

                            {/* Remark full width */}
                            <div className="md:col-span-2">
                                <label className="font-semibold block mb-2">Remark</label>
                                <textarea
                                    name="remark"
                                    value={formData.remark}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter remarks"
                                    rows={3}
                                    className={`w-full p-3 rounded-md border focus:ring-2 focus:ring-blue-500 ${theme === "dark"
                                        ? "bg-gray-800 border-gray-700"
                                        : "bg-gray-50 border-gray-300"
                                        }`}
                                ></textarea>
                            </div>

                            {/* Submit Section */}
                            <div className="md:col-span-2 flex items-center justify-end mt-6 space-x-4">
                                {/* Message Alert */}
                                {message.text && (
                                    <div
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${message.type === "success"
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
                                    className={`px-8 py-2.5 rounded-lg font-semibold transition-all ${loading
                                        ? "bg-blue-400 text-white cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                        }`}
                                >
                                    {loading ? "Adding..." : "Save Client"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Client Table */}
                    <Datatable columns={columns} data={data} rowsPerPage={50} />
                </div>
            </main>
            <Foot />
        </>
    );
}
