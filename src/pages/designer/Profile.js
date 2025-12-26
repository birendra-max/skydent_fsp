import { useContext, useState, useEffect } from 'react';
import Hd from './Hd';
import Foot from './Foot';
import { DesignerContext } from '../../Context/DesignerContext';
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ThemeContext } from "../../Context/ThemeContext";
import {
    faEye,
    faEyeSlash,
    faCamera,
    faCheckCircle,
    faUser,
    faEnvelope,
    faPhone,
    faHome,
    faCalendarAlt,
    faSave,
    faIdCard,
    faUserTie,
    faFlask,
    faStethoscope,
    faNotesMedical,
    faKey,
    faExclamationTriangle,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';

export default function Profile() {
    let base_url = localStorage.getItem('skydent_designer_base_url');
    const token = localStorage.getItem('skydent_designer_token');
    const { theme } = useContext(ThemeContext);
    const [formStatus, setFormStatus] = useState(0);
    const { designer, setDesigner } = useContext(DesignerContext);
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [form, setForm] = useState({
        email: "",
        designation: "",
        mobile: "",
        password: "",
    });

    // Fetch user data from backend on component mount
    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${base_url}/get-user-profile`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant': 'skydent'
                }
            });

            const data = await response.json();
            if (data.status === 'success') {
                setDesigner(data.designer);
                setForm({
                    email: data.designer.email || "",
                    designation: data.designer.designation || "",
                    mobile: data.designer.mobile || "",
                    password: "",
                });
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
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
                const profileresp = await fetch(`${base_url}/update-profile`, {
                    method: "POST",
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Tenant': 'skydent'
                    },
                    body: formData,
                });

                const data = await profileresp.json();
                const statusEl = document.getElementById('profilestatus');
                if (data.status === 'success') {
                    statusEl.className = `w-full px-2 sm:px-4 text-xs sm:text-sm font-bold text-center mb-2 ${theme === 'light' ? 'text-green-700' : 'text-green-400'
                        }`;
                    statusEl.innerText = data.message;
                    await fetchUserData();
                    setTimeout(() => {
                        statusEl.innerText = '';
                    }, 3000);
                } else {
                    statusEl.className = `w-full px-2 sm:px-4 text-xs sm:text-sm font-bold text-center mb-2 ${theme === 'light' ? 'text-red-700' : 'text-red-400'
                        }`;
                    statusEl.innerText = data.message;
                }
            } catch (err) {
                const statusEl = document.getElementById('profilestatus');
                statusEl.className = `w-full px-2 sm:px-4 text-xs sm:text-sm font-bold text-center mb-2 ${theme === 'light' ? 'text-red-700' : 'text-red-400'
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
            const response = await fetch(`${base_url}/update-user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant': 'skydent'
                },
                body: JSON.stringify(form),
            });

            const resp = await response.json();
            const statusEl = document.getElementById('status');
            if (resp.status === 'success') {
                statusEl.className = `w-full px-2 sm:px-4 text-sm sm:text-base font-bold text-center mb-2 ${theme === 'light' ? 'text-green-700' : 'text-green-400'
                    }`;
                statusEl.innerText = resp.message;
                await fetchUserData();
                setTimeout(() => {
                    statusEl.innerText = '';
                }, 3000);
            } else {
                statusEl.className = `w-full px-2 sm:px-4 text-sm sm:text-base font-bold text-center mb-2 ${theme === 'light' ? 'text-red-700' : 'text-red-400'
                    }`;
                statusEl.innerText = resp.message;
            }
        } catch (error) {
            const statusEl = document.getElementById('status');
            statusEl.className = `w-full px-2 sm:px-4 text-sm sm:text-base font-bold text-center mb-2 ${theme === 'light' ? 'text-red-700' : 'text-red-400'
                }`;
            statusEl.innerText = 'Update failed. Please try again.';
        } finally {
            setLoading(false);
        }
    };

    // Theme-based styling functions
    const getMainClass = () => {
        return theme === 'light'
            ? 'bg-gray-100 sm:bg-gray-200'
            : 'bg-black';
    };

    const getHeaderClass = () => {
        return theme === 'light'
            ? 'bg-white border-gray-200 text-gray-800'
            : 'bg-gray-800 border-gray-700 text-white';
    };

    const getCardClass = () => {
        return theme === 'light'
            ? 'bg-white border-gray-200 text-gray-800'
            : 'bg-gray-800 border-gray-700 text-white';
    };

    const getInputClass = () => {
        return theme === 'light'
            ? 'bg-white border-gray-200 text-gray-800 focus:ring-blue-500 focus:border-blue-500'
            : 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500';
    };

    const getDisabledInputClass = () => {
        return theme === 'light'
            ? 'bg-gray-50 border-gray-200 text-gray-500'
            : 'bg-gray-600 border-gray-500 text-gray-400';
    };

    const getTabHeaderClass = () => {
        return theme === 'light'
            ? 'bg-gray-50 border-gray-200'
            : 'bg-gray-700 border-gray-600';
    };

    const getTabButtonClass = (isActive) => {
        if (isActive) {
            return theme === 'light'
                ? 'text-blue-600 border-blue-600'
                : 'text-blue-400 border-blue-400';
        } else {
            return theme === 'light'
                ? 'text-gray-500 border-transparent hover:text-blue-500'
                : 'text-gray-400 border-transparent hover:text-blue-400';
        }
    };

    const getLabelClass = () => {
        return theme === 'light'
            ? 'text-gray-700'
            : 'text-gray-300';
    };

    const getBorderClass = () => {
        return theme === 'light'
            ? 'border-gray-200'
            : 'border-gray-600';
    };

    const getDividerClass = () => {
        return theme === 'light'
            ? 'border-gray-100'
            : 'border-gray-700';
    };

    if (!designer || Object.keys(designer).length === 0) {
        return (
            <>
                <Hd />
                <main id="main" className={`flex-grow px-4 transition-colors duration-300 ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'} pt-16 sm:pt-22`}>
                    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
                        <div className="flex justify-center items-center min-h-80 sm:min-h-96">
                            <div className="text-center px-4">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mb-3 sm:mb-4" />
                                <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'
                                    }`}>User Not Found</h2>
                                <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>
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
            <main className={`min-h-screen transition-colors duration-300 py-22 ${getMainClass()}`}>
                {/* Header Section */}
                <header className={`border-b shadow-sm px-4 ${getHeaderClass()}`}>
                    <div className="container mx-auto px-3 sm:px py-4 sm:py-3">
                        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-center sm:text-left">
                                <h1 className={`text-2xl sm:text-3xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'
                                    }`}>
                                    Profile Overview
                                </h1>
                                <p className={`mt-1 text-sm sm:text-base ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                                    }`}>Manage your account settings and preferences</p>
                            </div>
                            <nav className="flex justify-center sm:justify-start">
                                <ol className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
                                    <li>
                                        <Link to="/designer/home" className={`hover:text-blue-800 transition-colors duration-300 flex items-center ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                                            }`}>
                                            <FontAwesomeIcon icon={faHome} className="w-3 h-3 mr-1 sm:mr-2" />
                                            <span className="hidden xs:inline">Home</span>
                                        </Link>
                                    </li>
                                    <li className="flex items-center">
                                        <span className={`mx-1 sm:mx-2 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                                            }`}>/</span>
                                        <span className={`font-semibold truncate max-w-[120px] sm:max-w-none ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                                            }`}>
                                            {designer.name}
                                        </span>
                                    </li>
                                </ol>
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="mx-auto py-4 sm:py-4 px-3 sm:px-4">
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-4">

                        {/* Left Sidebar - Profile Card */}
                        <div className="xl:col-span-1">
                            <div className={`rounded-lg sm:rounded-xl shadow-md sm:shadow-lg border p-4 sm:p-6 ${getCardClass()}`}>
                                {/* Profile Image */}
                                <div className="text-center mb-4 sm:mb-6">
                                    <div className="relative inline-block">
                                        <div className="relative">
                                            {!designer.pic || designer.pic === '' ? (
                                                <img
                                                    className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-lg sm:rounded-xl mx-auto border-4 shadow-md"
                                                    src="/img/user.webp"
                                                    alt="User profile"
                                                />
                                            ) : (
                                                <img
                                                    className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-lg sm:rounded-xl mx-auto border-4 shadow-md object-cover"
                                                    src={`${designer.pic}`}
                                                    alt="User profile"
                                                />
                                            )}
                                            {profileLoading && (
                                                <div className={`absolute inset-0 bg-opacity-70 rounded-lg sm:rounded-xl flex items-center justify-center ${theme === 'light' ? 'bg-white' : 'bg-gray-900'
                                                    }`}>
                                                    <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full border-2 sm:border-4 border-white shadow-lg flex items-center justify-center">
                                            <FontAwesomeIcon icon={faCheckCircle} className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                                        </div>
                                    </div>

                                    <h3 className={`text-lg sm:text-xl font-bold mt-3 sm:mt-4 truncate px-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'
                                        }`}>
                                        {designer.name || 'Designer'}
                                    </h3>
                                    <p className={`text-xs sm:text-sm mt-1 font-medium ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                                        }`}>Professional Account</p>
                                    <div className="flex items-center justify-center mt-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                                        <span className="text-green-600 text-xs font-medium">Online</span>
                                    </div>
                                </div>

                                {/* Client Info */}
                                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                                    <div className={`flex justify-between items-center py-2 border-b ${getDividerClass()}`}>
                                        <span className={`font-medium flex items-center text-xs sm:text-sm ${getLabelClass()}`}>
                                            <FontAwesomeIcon icon={faIdCard} className="w-3 h-3 text-blue-500 mr-2" />
                                            Client ID
                                        </span>
                                        <span className={`font-semibold px-2 py-1 rounded-md text-xs sm:text-sm ${theme === 'light' ? 'text-gray-800 bg-blue-50' : 'text-white bg-blue-900/20'
                                            }`}>
                                            #{designer.desiid}
                                        </span>
                                    </div>
                                    <div className={`flex justify-between items-center py-2 border-b ${getDividerClass()}`}>
                                        <span className={`font-medium flex items-center text-xs sm:text-sm ${getLabelClass()}`}>
                                            <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3 text-purple-500 mr-2" />
                                            Member Since
                                        </span>
                                        <span className={`font-semibold text-xs sm:text-sm ${theme === 'light' ? 'text-gray-800' : 'text-white'
                                            }`}>
                                            {designer.joining_date || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* Status Button */}
                                {designer.status !== 'active' ? (
                                    <button className={`w-full text-white font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-300 mb-4 sm:mb-6 shadow-md flex items-center justify-center text-xs sm:text-sm ${theme === 'light'
                                        ? 'bg-green-500 hover:bg-green-600'
                                        : 'bg-green-600 hover:bg-green-700'
                                        }`}>
                                        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                                        Active Your Account
                                    </button>
                                ) : (
                                    <button className={`w-full text-white font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-300 mb-4 sm:mb-6 shadow-md text-xs sm:text-sm ${theme === 'light'
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-red-600 hover:bg-red-700'
                                        }`}>
                                        Inactive Your Account
                                    </button>
                                )}

                                {/* Profile Picture Upload */}
                                <div className="space-y-3 sm:space-y-4">
                                    <p id="profilestatus" className="w-full text-center text-xs sm:text-sm"></p>
                                    <div>
                                        <label className={`text-xs sm:text-sm font-semibold mb-2 flex items-center ${getLabelClass()}`}>
                                            <FontAwesomeIcon icon={faCamera} className="w-3 h-3 mr-2 text-blue-500" />
                                            Update Profile Picture
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                name="profile_pic"
                                                accept='image/*'
                                                onChange={handleFileChange}
                                                disabled={profileLoading}
                                                className={`w-full px-2 sm:px-3 py-2 border-2 border-dashed rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 file:mr-2 sm:file:mr-4 file:py-1 file:px-2 sm:file:px-3 file:rounded file:border-0 file:text-xs sm:file:text-sm file:font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'light'
                                                    ? 'bg-gray-50 border-gray-300 text-gray-700 file:bg-blue-500 file:text-white hover:file:bg-blue-600'
                                                    : 'bg-gray-700 border-gray-600 text-gray-300 file:bg-blue-600 file:text-white hover:file:bg-blue-700'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Content - Personal Details */}
                        <div className="xl:col-span-3">
                            <div className={`rounded-lg sm:rounded-xl shadow-md sm:shadow-lg border overflow-hidden ${getCardClass()}`}>
                                {/* Tab Header */}
                                <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${getTabHeaderClass()} ${getBorderClass()}`}>
                                    <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
                                        <button
                                            onClick={() => setActiveTab('personal')}
                                            className={`font-semibold pb-2 sm:pb-3 px-2 border-b-2 transition-all duration-300 flex items-center whitespace-nowrap flex-shrink-0 ${getTabButtonClass(activeTab === 'personal')}`}
                                        >
                                            <FontAwesomeIcon icon={faUser} className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                            Personal Details
                                        </button>
                                    </nav>
                                </div>

                                {/* Tab Content */}
                                <div className="p-4 sm:p-6">
                                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                        <input type="hidden" name="email" value={form.email} />

                                        {/* Responsive Grid Layout */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                            {/* Row 1 */}
                                            <div className="flex flex-col space-y-2">
                                                <label className={`font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center ${getLabelClass()}`}>
                                                    <FontAwesomeIcon icon={faUserTie} className="w-3 h-3 text-blue-500 mr-2" />
                                                    Designation
                                                </label>
                                                <input
                                                    type="text"
                                                    name="designation"
                                                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${getInputClass()}`}
                                                    value={form.designation}
                                                    onChange={handleProfile}
                                                />
                                            </div>

                                            <div className="flex flex-col space-y-2">
                                                <label className={`font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center ${getLabelClass()}`}>
                                                    <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3 text-blue-500 mr-2" />
                                                    Email Address
                                                </label>
                                                <input
                                                    type="email"
                                                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 cursor-not-allowed text-sm sm:text-base ${getDisabledInputClass()}`}
                                                    value={form.email}
                                                    readOnly
                                                />
                                            </div>

                                            {/* Row 3 */}
                                            <div className="flex flex-col space-y-2">
                                                <label className={`font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center ${getLabelClass()}`}>
                                                    <FontAwesomeIcon icon={faPhone} className="w-3 h-3 text-blue-500 mr-2" />
                                                    Mobile Number
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="mobile"
                                                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${getInputClass()}`}
                                                    value={form.mobile}
                                                    onChange={handleProfile}
                                                />
                                            </div>

                                            {/* Row 5 - Password field with eye button */}
                                            <div className="flex flex-col space-y-2">
                                                <label className={`font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center ${getLabelClass()}`}>
                                                    <FontAwesomeIcon icon={faKey} className="w-3 h-3 text-blue-500 mr-2" />
                                                    Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        name="password"
                                                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base pr-10 sm:pr-12 ${getInputClass()}`}
                                                        placeholder="Enter new password"
                                                        value={form.password}
                                                        onChange={handleProfile}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className={`absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 p-1 ${theme === 'light' ? 'text-gray-400 hover:text-blue-500' : 'text-gray-500 hover:text-blue-400'
                                                            }`}
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={showPassword ? faEyeSlash : faEye}
                                                            className="w-4 h-4 sm:w-5 sm:h-5"
                                                        />
                                                    </button>
                                                </div>
                                                <p className={`text-xs mt-1 flex items-center ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                                                    }`}>
                                                    <FontAwesomeIcon icon={faKey} className="w-3 h-3 text-blue-400 mr-1" />
                                                    Leave blank to keep current password
                                                </p>
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <div className={`pt-4 sm:pt-6 border-t ${getBorderClass()}`}>
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                                                <div className={`text-xs sm:text-sm text-center sm:text-left ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                                                    }`}>
                                                    Last updated: {designer.joining_date}
                                                </div>
                                                <div className="flex flex-col items-stretch sm:items-end gap-2">
                                                    <p id="status" className="w-full text-center sm:text-right text-xs sm:text-sm"></p>
                                                    <button
                                                        disabled={formStatus === 0 || loading}
                                                        type="submit"
                                                        className={`cursor-pointer text-white font-bold py-2 sm:py-3 px-4 sm:px-8 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center text-sm sm:text-base w-full sm:w-auto ${formStatus === 0 || loading
                                                            ? "opacity-50 cursor-not-allowed"
                                                            : "hover:bg-blue-600"
                                                            } ${theme === 'light'
                                                                ? 'bg-blue-500 hover:bg-blue-600'
                                                                : 'bg-blue-600 hover:bg-blue-700'
                                                            }`}>
                                                        {loading ? (
                                                            <>
                                                                <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                                                                Updating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FontAwesomeIcon icon={faSave} className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                                                Save All Changes
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
            </main>
            <Foot />
        </>
    )
}