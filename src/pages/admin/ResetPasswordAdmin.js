import { useContext, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Hd from "./Hd";
import Foot from "./Foot";
import { ThemeContext } from "../../Context/ThemeContext";
import AdminDatatable from "./AdminDatatable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUnlockAlt, faEye, faEyeSlash, faKey } from "@fortawesome/free-solid-svg-icons";
import { fetchWithAuth } from "../../utils/adminapi";

export default function ResetPasswordAdmin() {
    const { theme } = useContext(ThemeContext);
    const [data, setData] = useState([]);
    const [resetEmail, setResetEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const columns = [
        { header: "Admin Id", accessor: "id" },
        { header: "Name", accessor: "name" },
        { header: "Email", accessor: "email" },
        { header: "Mobile", accessor: "mobile" },
        { header: "Status", accessor: "status" },
        { header: "Delete", accessor: "delete" },
    ];

    useEffect(() => {
        async function getClients() {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchWithAuth("/get-admin", {
                    method: "GET",
                });
                if (data && data.status === "success") setData(data.admin);
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

    // ✅ Handle Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setMessage({ text: "", type: "" });
        setLoading(true);

        try {
            const res = await fetchWithAuth(`/reset-password-admin`, {
                method: "POST",
                body: JSON.stringify({
                    email: resetEmail,
                    new_password: newPassword,
                }),
            });

            if (res.status === "success") {
                setMessage({ text: res.message, type: res.status });
                setResetEmail("");
                setNewPassword("");
            } else {
                setMessage({ text: res.message || "Failed to reset password", type: "error" });
            }
        } catch (error) {
            console.error("Error resetting password:", error);
            setMessage({ text: "⚠️ Something went wrong!", type: "error" });
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
                    <div className="mb-6">
                        <h1
                            className={`text-3xl font-semibold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-800"
                                }`}
                        >
                            <FontAwesomeIcon icon={faUnlockAlt} className="text-blue-500" />
                            Reset Password
                        </h1>

                        <p
                            className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                }`}
                        >
                            Update your account password securely.
                        </p>
                    </div>


                    {/* 🔐 Reset Password Form */}
                    <div
                        className={`p-6 mb-6 rounded-xl shadow-lg border ${theme === "dark"
                            ? "bg-gray-900 border-gray-800"
                            : "bg-white border-gray-300"
                            }`}
                    >
                        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                            <FontAwesomeIcon icon={faKey} className="text-yellow-500" />
                            Reset Admin Password
                        </h2>

                        <form
                            onSubmit={handleResetPassword}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end"
                        >
                            {/* Email */}
                            <div className="md:col-span-1">
                                <label className="font-semibold block mb-2">Client Email</label>
                                <input
                                    type="email"
                                    placeholder="Enter admin email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                    className={`w-full p-2.5 rounded-md border focus:ring-2 focus:ring-blue-500 ${theme === "dark"
                                        ? "bg-gray-800 border-gray-700 text-white"
                                        : "bg-gray-50 border-gray-300 text-gray-800"
                                        }`}
                                />
                            </div>

                            {/* Password with Eye Toggle */}
                            <div className="md:col-span-1 relative">
                                <label className="font-semibold block mb-2">New Password</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className={`w-full p-2.5 rounded-md border focus:ring-2 focus:ring-blue-500 ${theme === "dark"
                                        ? "bg-gray-800 border-gray-700 text-white"
                                        : "bg-gray-50 border-gray-300 text-gray-800"
                                        }`}
                                />
                                <FontAwesomeIcon
                                    icon={showPassword ? faEyeSlash : faEye}
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`text-xl absolute right-3 top-11 cursor-pointer text-gray-500 ${theme === "dark" ? "hover:text-gray-300" : "hover:text-gray-700"
                                        }`}
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${loading
                                        ? "bg-blue-400 text-white cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                        }`}
                                >
                                    {loading ? "Resetting..." : "Reset Password"}
                                </button>
                            </div>
                        </form>

                        {/* Message */}
                        {message.text && (
                            <div
                                className={`mt-4 inline-block px-4 py-2 rounded-md text-sm font-medium ${message.type === "success"
                                    ? "bg-green-100 text-green-700 border border-green-300"
                                    : "bg-red-100 text-red-700 border border-red-300"
                                    }`}
                            >
                                {message.text}
                            </div>
                        )}
                    </div>

                    {/* 📊 Client Table */}
                    <AdminDatatable columns={columns} data={data} rowsPerPage={50} loading={loading} error={error} />
                </div>
            </main>
            <Foot />
        </>
    );
}
