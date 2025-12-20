import { useContext, useState, useEffect } from 'react';
import Hd from './Hd';
import Foot from './Foot';
import { AdminContext } from '../../Context/AdminContext';
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ThemeContext } from "../../Context/ThemeContext";
import { fetchWithAuth } from '../../utils/adminapi';
import {
    faEye,
    faEyeSlash,
    faCamera,
    faCheckCircle,
    faUser,
    faEnvelope,
    faHome,
    faSave,
    faKey,
    faExclamationTriangle,
    faSpinner,
    faCalendarAlt,
    faIdCard,
    faShieldAlt
} from '@fortawesome/free-solid-svg-icons';

export default function Profile() {
    const { theme } = useContext(ThemeContext);
    const [formStatus, setFormStatus] = useState(0);
    const { admin, setAdmin } = useContext(AdminContext);
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    // Fetch user data from backend on component mount
    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const response = await fetchWithAuth(`/get-admin-profile`);

            if (response.status === 'success') {
                setAdmin(response.admin);
                setForm({
                    email: response.admin.email || "",
                    password: "",
                });
            }
        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("profile", file);

            try {
                setProfileLoading(true);
                const profileresp = await fetchWithAuth(`/update-profile`, {
                    method: "POST",
                    body: formData,
                });

                const statusEl = document.getElementById('profilestatus');
                if (profileresp.status === 'success') {
                    statusEl.className = `w-full px-2 py-2 text-xs font-medium text-center rounded-lg mb-2 ${theme === 'light' ? 'bg-green-100 text-green-800' : 'bg-green-900 text-green-300'
                        }`;
                    statusEl.innerText = profileresp.message;
                    await fetchUserData();
                    setTimeout(() => {
                        statusEl.innerText = '';
                        statusEl.className = '';
                    }, 3000);
                } else {
                    statusEl.className = `w-full px-2 py-2 text-xs font-medium text-center rounded-lg mb-2 ${theme === 'light' ? 'bg-red-100 text-red-800' : 'bg-red-900 text-red-300'
                        }`;
                    statusEl.innerText = profileresp.message;
                }
            } catch (err) {
                const statusEl = document.getElementById('profilestatus');
                statusEl.className = `w-full px-2 py-2 text-xs font-medium text-center rounded-lg mb-2 ${theme === 'light' ? 'bg-red-100 text-red-800' : 'bg-red-900 text-red-300'
                    }`;
                statusEl.innerText = 'Upload failed. Please try again.';
            } finally {
                setProfileLoading(false);
            }
        }
    };

    const handleProfile = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setFormStatus(formStatus + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await fetchWithAuth(`/update-user`, {
                method: "POST",
                body: JSON.stringify(form),
            });

            const statusEl = document.getElementById('status');
            if (response.status === 'success') {
                statusEl.className = `w-full px-3 py-2 text-sm font-medium text-center rounded-lg mb-2 ${theme === 'light' ? 'bg-green-100 text-green-800' : 'bg-green-900 text-green-300'
                    }`;
                statusEl.innerText = response.message;
                await fetchUserData();
                setTimeout(() => {
                    statusEl.innerText = '';
                    statusEl.className = '';
                }, 3000);
            } else {
                statusEl.className = `w-full px-3 py-2 text-sm font-medium text-center rounded-lg mb-2 ${theme === 'light' ? 'bg-red-100 text-red-800' : 'bg-red-900 text-red-300'
                    }`;
                statusEl.innerText = response.message;
            }
        } catch (error) {
            const statusEl = document.getElementById('status');
            statusEl.className = `w-full px-3 py-2 text-sm font-medium text-center rounded-lg mb-2 ${theme === 'light' ? 'bg-red-100 text-red-800' : 'bg-red-900 text-red-300'
                }`;
            statusEl.innerText = 'Update failed. Please try again.';
        } finally {
            setLoading(false);
        }
    };

    // Theme-based styling functions
    const getMainClass = () => {
        return theme === 'light'
            ? 'bg-gradient-to-br from-gray-50 to-gray-100'
            : 'bg-gradient-to-br from-gray-900 to-black';
    };

    const getCardClass = () => {
        return theme === 'light'
            ? 'bg-white shadow-xl border border-gray-100'
            : 'bg-gray-800 shadow-2xl border border-gray-700';
    };

    const getInputClass = () => {
        return theme === 'light'
            ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            : 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
    };

    const getDisabledInputClass = () => {
        return theme === 'light'
            ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed';
    };

    const getLabelClass = () => {
        return theme === 'light'
            ? 'text-gray-700 font-semibold'
            : 'text-gray-200 font-semibold';
    };

    const getTextClass = () => {
        return theme === 'light' ? 'text-gray-600' : 'text-gray-300';
    };

    const getHeadingClass = () => {
        return theme === 'light' ? 'text-gray-800' : 'text-white';
    };

    if (!admin || Object.keys(admin).length === 0) {
        return (
            <>
                <Hd />
                <main className={`min-h-screen transition-colors duration-300 ${getMainClass()}`}>
                    <div className="container mx-auto px-4 py-8">
                        <div className="flex justify-center items-center min-h-96">
                            <div className="text-center max-w-md mx-auto">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="w-16 h-16 text-yellow-500 mb-4 mx-auto" />
                                <h2 className={`text-2xl font-bold mb-3 ${getHeadingClass()}`}>Admin Not Found</h2>
                                <p className={getTextClass()}>
                                    Please log in to view your profile.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
                <Foot />
            </>
        );
    }

    return (
        <>
            <Hd />
            <main className={`min-h-screen transition-colors duration-300 ${getMainClass()} pt-16`}>
                {/* Full Screen Container */}
                <div className="w-full min-h-[calc(100vh-4rem)] py-6 px-4">
                    <div className="max-w-8xl mx-auto">

                        {/* Header Section */}
                        <div className="mb-8">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                <div className="mb-4 lg:mb-0">
                                    <h1 className={`text-3xl lg:text-4xl font-bold ${getHeadingClass()} mb-2`}>
                                        Profile Settings
                                    </h1>
                                    <p className={`text-lg ${getTextClass()}`}>
                                        Manage your account information and security
                                    </p>
                                </div>
                                <nav className="flex items-center space-x-2 text-sm">
                                    <Link
                                        to="/admin/dashboard"
                                        className={`flex items-center transition-colors duration-200 ${theme === 'light' ? 'text-blue-600 hover:text-blue-800' : 'text-blue-400 hover:text-blue-300'}`}
                                    >
                                        <FontAwesomeIcon icon={faHome} className="w-4 h-4 mr-2" />
                                        Dashboard
                                    </Link>
                                    <span className={getTextClass()}>/</span>
                                    <span className={`font-semibold ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>
                                        {admin.name}
                                    </span>
                                </nav>
                            </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">

                            {/* Profile Sidebar */}
                            <div className="xl:col-span-1">
                                <div className={`rounded-2xl p-6 ${getCardClass()} sticky top-6`}>
                                    {/* Profile Header */}
                                    <div className="text-center mb-8">
                                        <div className="relative inline-block mb-4">
                                            <div className="relative">
                                                {!admin.pic || admin.pic === '' ? (
                                                    <img
                                                        className="w-32 h-32 rounded-2xl mx-auto border-4 shadow-lg object-cover"
                                                        src="/img/user.webp"
                                                        alt="Admin profile"
                                                    />
                                                ) : (
                                                    <img
                                                        className="w-32 h-32 rounded-2xl mx-auto border-4 shadow-lg object-cover"
                                                        src={`${admin.pic}`}
                                                        alt="Admin profile"
                                                    />
                                                )}
                                                {profileLoading && (
                                                    <div className={`absolute inset-0 bg-opacity-70 rounded-2xl flex items-center justify-center ${theme === 'light' ? 'bg-white' : 'bg-gray-900'}`}>
                                                        <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 text-blue-500 animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                                                <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 text-white" />
                                            </div>
                                        </div>

                                        <h3 className={`text-xl font-bold mb-1 ${getHeadingClass()}`}>
                                            {admin.name || 'Admin'}
                                        </h3>
                                        <p className={`text-sm font-medium mb-3 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>
                                            Administrator
                                        </p>
                                        <div className="flex items-center justify-center">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                                            <span className="text-green-600 text-sm font-medium">Active</span>
                                        </div>
                                    </div>

                                    {/* Profile Stats */}
                                    <div className="space-y-4 mb-6">
                                        <div className={`flex items-center justify-between p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
                                            <div className="flex items-center">
                                                <FontAwesomeIcon icon={faIdCard} className="w-4 h-4 text-blue-500 mr-3" />
                                                <span className={getTextClass()}>Member Since</span>
                                            </div>
                                            <span className={`font-semibold ${getTextClass()}`}>
                                                {new Date(admin.joining_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className={`flex items-center justify-between p-3 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
                                            <div className="flex items-center">
                                                <FontAwesomeIcon icon={faShieldAlt} className="w-4 h-4 text-green-500 mr-3" />
                                                <span className={getTextClass()}>Account Type</span>
                                            </div>
                                            <span className={`font-semibold ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>
                                                Admin
                                            </span>
                                        </div>
                                    </div>

                                    {/* Profile Picture Upload */}
                                    <div className="space-y-4">
                                        <p id="profilestatus" className="w-full text-center text-sm"></p>
                                        <div>
                                            <label className={`text-sm font-semibold mb-3 flex items-center ${getLabelClass()}`}>
                                                <FontAwesomeIcon icon={faCamera} className="w-4 h-4 mr-2 text-blue-500" />
                                                Update Profile Picture
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    name="profile_pic"
                                                    accept='image/*'
                                                    onChange={handleFileChange}
                                                    disabled={profileLoading}
                                                    className={`w-full px-4 py-3 border-2 border-dashed rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'light'
                                                        ? 'bg-gray-50 border-gray-300 text-gray-700 file:bg-blue-500 file:text-white hover:file:bg-blue-600 hover:border-blue-400'
                                                        : 'bg-gray-700 border-gray-600 text-gray-300 file:bg-blue-600 file:text-white hover:file:bg-blue-700 hover:border-blue-500'
                                                        }`}
                                                />
                                            </div>
                                            <p className={`text-xs mt-2 ${getTextClass()}`}>
                                                Supported formats: JPG, PNG, WEBP (Max 5MB)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="xl:col-span-3">
                                <div className={`rounded-2xl overflow-hidden ${getCardClass()}`}>

                                    {/* Tab Navigation */}
                                    <div className={`border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
                                        <div className="px-6 sm:px-8">
                                            <nav className="flex space-x-8 overflow-x-auto">
                                                <button
                                                    onClick={() => setActiveTab('personal')}
                                                    className={`font-semibold py-4 border-b-2 transition-all duration-300 flex items-center whitespace-nowrap ${activeTab === 'personal'
                                                        ? (theme === 'light' ? 'text-blue-600 border-blue-600' : 'text-blue-400 border-blue-400')
                                                        : (theme === 'light' ? 'text-gray-500 border-transparent hover:text-blue-500' : 'text-gray-400 border-transparent hover:text-blue-400')
                                                        }`}
                                                >
                                                    <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-3" />
                                                    Personal Information
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab('security')}
                                                    className={`font-semibold py-4 border-b-2 transition-all duration-300 flex items-center whitespace-nowrap ${activeTab === 'security'
                                                        ? (theme === 'light' ? 'text-blue-600 border-blue-600' : 'text-blue-400 border-blue-400')
                                                        : (theme === 'light' ? 'text-gray-500 border-transparent hover:text-blue-500' : 'text-gray-400 border-transparent hover:text-blue-400')
                                                        }`}
                                                >
                                                    <FontAwesomeIcon icon={faShieldAlt} className="w-4 h-4 mr-3" />
                                                    Security Settings
                                                </button>
                                            </nav>
                                        </div>
                                    </div>

                                    {/* Tab Content */}
                                    <div className="p-6 sm:p-8">
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <input type="hidden" name="email" value={form.email} />

                                            {/* Personal Information Tab */}
                                            {activeTab === 'personal' && (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {/* Email Field */}
                                                        <div className="md:col-span-2">
                                                            <label className={`block text-sm font-semibold mb-3 ${getLabelClass()}`}>
                                                                <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-blue-500 mr-2" />
                                                                Email Address
                                                            </label>
                                                            <input
                                                                type="email"
                                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-all duration-300 text-base ${getDisabledInputClass()}`}
                                                                value={form.email}
                                                                readOnly
                                                            />
                                                            <p className={`text-sm mt-2 ${getTextClass()}`}>
                                                                Contact support to change your email address
                                                            </p>
                                                        </div>

                                                        {/* Account Information */}
                                                        <div className={`p-4 rounded-xl ${theme === 'light' ? 'bg-blue-50 border border-blue-200' : 'bg-blue-900 border border-blue-800'}`}>
                                                            <h4 className={`font-semibold mb-3 flex items-center ${theme === 'light' ? 'text-blue-800' : 'text-blue-300'}`}>
                                                                <FontAwesomeIcon icon={faIdCard} className="w-4 h-4 mr-2" />
                                                                Account Information
                                                            </h4>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className={getTextClass()}>Role:</span>
                                                                    <span className={`font-semibold ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>Administrator</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className={getTextClass()}>Status:</span>
                                                                    <span className="font-semibold text-green-600">Active</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className={getTextClass()}>Member Since:</span>
                                                                    <span className={getTextClass()}>{new Date(admin.joining_date).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Security Settings Tab */}
                                            {activeTab === 'security' && (
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 gap-6">
                                                        {/* Password Field */}
                                                        <div>
                                                            <label className={`block text-sm font-semibold mb-3 ${getLabelClass()}`}>
                                                                <FontAwesomeIcon icon={faKey} className="w-4 h-4 text-blue-500 mr-2" />
                                                                Change Password
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type={showPassword ? "text" : "password"}
                                                                    name="password"
                                                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 text-base pr-12 ${getInputClass()}`}
                                                                    placeholder="Enter new password"
                                                                    value={form.password}
                                                                    onChange={handleProfile}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowPassword(!showPassword)}
                                                                    className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 p-2 ${theme === 'light' ? 'text-gray-400 hover:text-blue-500' : 'text-gray-500 hover:text-blue-400'
                                                                        }`}
                                                                >
                                                                    <FontAwesomeIcon
                                                                        icon={showPassword ? faEyeSlash : faEye}
                                                                        className="w-5 h-5"
                                                                    />
                                                                </button>
                                                            </div>
                                                            <p className={`text-sm mt-2 flex items-center ${getTextClass()}`}>
                                                                Leave blank to keep your current password
                                                            </p>
                                                        </div>

                                                        {/* Security Tips */}
                                                        <div className={`p-4 rounded-xl ${theme === 'light' ? 'bg-yellow-50 border border-yellow-200' : 'bg-yellow-900 border border-yellow-800'}`}>
                                                            <h4 className={`font-semibold mb-2 flex items-center ${theme === 'light' ? 'text-yellow-800' : 'text-yellow-300'}`}>
                                                                <FontAwesomeIcon icon={faShieldAlt} className="w-4 h-4 mr-2" />
                                                                Security Recommendations
                                                            </h4>
                                                            <ul className={`text-sm space-y-1 ${theme === 'light' ? 'text-yellow-700' : 'text-yellow-200'}`}>
                                                                <li>• Use a strong, unique password</li>
                                                                <li>• Avoid using personal information</li>
                                                                <li>• Include numbers and special characters</li>
                                                                <li>• Change your password regularly</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className={`pt-6 border-t ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                    <div className={`text-sm text-center sm:text-left ${getTextClass()}`}>
                                                        <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2" />
                                                        Last updated: {new Date(admin.joining_date).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row gap-3">
                                                        <p id="status" className="text-sm text-center sm:text-right"></p>
                                                        <button
                                                            disabled={formStatus === 0 || loading}
                                                            type="submit"
                                                            className={`font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center text-base min-w-[160px] ${formStatus === 0 || loading
                                                                ? "opacity-50 cursor-not-allowed"
                                                                : "hover:shadow-xl transform hover:-translate-y-0.5"
                                                                } ${theme === 'light'
                                                                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                                }`}>
                                                            {loading ? (
                                                                <>
                                                                    <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 mr-2 animate-spin" />
                                                                    Updating...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <FontAwesomeIcon icon={faSave} className="w-4 h-4 mr-2" />
                                                                    Save Changes
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Foot />
        </>
    )
}