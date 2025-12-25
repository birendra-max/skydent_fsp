import { useEffect, useRef, useState, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from 'react-router-dom';
import { fetchWithAuth } from "../../utils/userapi";
import { ThemeContext } from "../../Context/ThemeContext";
import { UserContext } from "../../Context/UserContext";
import { useNavigate } from "react-router-dom";
import Loder from "../../Components/Loder";

import {
    faShoppingCart,
    faSpinner,
    faTimes,
    faTasks,
    faBolt,
    faBell,
    faPauseCircle,
    faCogs,
    faCalendarDay,
    faCalendarCheck,
    faCalendarWeek,
    faRepeat,
    faComments,
    faStar,
    faPaperPlane,
    faCheckCircle,
    faExclamationCircle
} from "@fortawesome/free-solid-svg-icons";

export default function Dashboard() {
    const base_url = localStorage.getItem('skydent_user_base_url');
    const navigate = useNavigate();
    const { logout } = useContext(UserContext);
    const { theme } = useContext(ThemeContext);
    const [cases, setCases] = useState(null);
    const [cards, setCards] = useState([]);
    const [form, setForm] = useState({
        feedback: "",
        likes: "",
    });
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({
        type: '', // 'success' or 'error'
        message: '',
        show: false
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const feedBackaRef = useRef(null);
    const token = localStorage.getItem('skydent_user_token');
    
    const saveFeedback = async () => {
        if (form.feedback.trim() === '') {
            feedBackaRef.current.focus();
            setSubmitStatus({
                type: 'error',
                message: 'Please enter your feedback before submitting.',
                show: true
            });
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus({ type: '', message: '', show: false });

        try {
            const resp = await fetch(`${base_url}/save-feedback`, {
                method: "POST",
                headers: {
                    'Content-Type': "application/json",
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant': 'skydent'
                },
                body: JSON.stringify(form),
            });

            const data = await resp.json();
            
            if (data.status === 'success') {
                setSubmitStatus({
                    type: 'success',
                    message: data.message || 'Thank you for your feedback!',
                    show: true
                });
                
                setForm({ feedback: "", likes: "" });
                document.getElementById('feedbackform').reset();
                
                // Reset star ratings
                const starElement = document.getElementById('star');
                if (starElement) {
                    const items = starElement.children;
                    for (let i = 0; i < items.length; i++) {
                        items[i].classList.remove('bg-yellow-400', 'scale-110', 'shadow-lg');
                    }
                }
                
                // Hide modal after 2 seconds
                setTimeout(() => {
                    setShowModal(false);
                    setSubmitStatus({ type: '', message: '', show: false });
                }, 2000);
                
            } else {
                if (data.error === 'Invalid or expired token') {
                    alert('Invalid or expired token. Please log in again.')
                    navigate(logout);
                }

                setSubmitStatus({
                    type: 'error',
                    message: data.message || 'Failed to submit feedback. Please try again.',
                    show: true
                });
            }
        } catch (error) {
            console.error("Error submitting feedback:", error);
            setSubmitStatus({
                type: 'error',
                message: 'Network error. Please check your connection and try again.',
                show: true
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        async function fetchCardsData() {
            try {
                const data = await fetchWithAuth('all-cases-data-count', {
                    method: "GET",
                });

                if (data.status === 'success') {
                    setCases(data);
                } else {
                    setCases(null);
                }
            } catch (error) {
                console.error("Error fetching cases:", error);
                setCases(null);
            }
        }

        fetchCardsData();
    }, []);

    useEffect(() => {
        if (cases) {
            const updatedCards = [
                { id: "home", href: "/user/home", title: "New Cases", count: cases.new_cases, color: "from-gray-600 to-gray-800", icon: faShoppingCart },
                { id: "progress", href: "/user/in_progress", title: "In Progress", count: cases.progress, color: "from-yellow-500 to-amber-600", icon: faSpinner },
                { id: "canceled", href: "/user/canceled_case", title: "Cancelled Cases", count: cases.canceled, color: "from-red-500 to-rose-600", icon: faTimes },
                { id: "completed", href: "/user/completed_case", title: "Completed Cases", count: cases.completed, color: "from-green-500 to-emerald-600", icon: faTasks },
                { id: "rush", href: "/user/rush_cases", title: "Rush Cases", count: cases.rush, color: "from-blue-500 to-indigo-600", icon: faBolt },
                { id: "qc", href: "/user/qc_required", title: "QC Required", count: cases.qc, color: "from-orange-500 to-amber-600", icon: faBell },
                { id: "hold", href: "/user/case_on_hold", title: "Case On Hold", count: cases.hold, color: "from-pink-500 to-rose-600", icon: faPauseCircle },
                { id: "all_c", href: "/user/all_cases", title: "All Cases", count: cases.all, color: "from-green-600 to-emerald-700", icon: faCogs },
                { id: "yesterday", href: "/user/yesterday_cases", title: "Yesterday's Cases", count: cases.yesterday_cases, color: "from-blue-400 to-blue-600", icon: faCalendarDay },
                { id: "today", href: "/user/today_cases", title: "Today's Cases", count: cases.today_cases, color: "from-purple-500 to-violet-600", icon: faCalendarCheck },
                { id: "weekly", href: "/user/weekly_case", title: "Weekly Cases", count: cases.weekly_cases, color: "from-indigo-500 to-purple-600", icon: faCalendarWeek },
                { id: "Redesign", href: "/user/redesign_cases", title: "Redesign Cases", count: cases.redesign_cases, color: "from-teal-500 to-cyan-600", icon: faRepeat },
            ];

            setCards(updatedCards);
        }
    }, [cases]);

    const handleOpenModal = () => {
        setShowModal(true);
        setSubmitStatus({ type: '', message: '', show: false });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setForm({ feedback: "", likes: "" });
        setSubmitStatus({ type: '', message: '', show: false });
    };

    function star(num) {
        const starElement = document.getElementById('star');
        if (!starElement) return;

        const items = starElement.children;
        setForm((prevForm) => ({
            ...prevForm,
            likes: num
        }));

        for (let i = 0; i < items.length; i++) {
            items[i].classList.remove('bg-yellow-400', 'scale-110', 'shadow-lg');
        }

        for (let i = 0; i < num && i < items.length; i++) {
            items[i].classList.add('bg-yellow-400', 'scale-110', 'shadow-lg');
        }
    }

    // Theme-based background classes
    const getBackgroundClass = () => {
        return theme === 'dark'
            ? 'bg-gray-900 text-white rounded-lg'
            : 'bg-gradient-to-br from-slate-50 to-blue-50 text-gray-800 rounded-lg';
    };

    const getCardClass = () => {
        return theme === 'dark'
            ? 'bg-gray-800 text-white hover:bg-gray-700 border-gray-700'
            : 'bg-white text-gray-800 hover:bg-gray-50 border-gray-200';
    };

    const getModalClass = () => {
        return theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-white'
            : 'bg-white border-gray-200 text-gray-800';
    };

    const getTextAreaClass = () => {
        return theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
            : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500';
    };

    const getButtonClass = () => {
        return theme === 'dark'
            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100';
    };

    const getTextClass = () => {
        return theme === 'dark'
            ? 'text-gray-300'
            : 'text-gray-600';
    };

    const getCountClass = () => {
        return theme === 'dark'
            ? 'text-white'
            : 'text-gray-900';
    };

    const getSubmitButtonClass = () => {
        const baseClass = "px-6 py-3 rounded-lg transition-colors cursor-pointer text-sm font-medium flex items-center justify-center gap-2 min-w-[140px]";
        
        if (isSubmitting) {
            return theme === 'dark' 
                ? `${baseClass} bg-blue-800 text-blue-200 cursor-not-allowed`
                : `${baseClass} bg-blue-400 text-white cursor-not-allowed`;
        }
        
        return theme === 'dark'
            ? `${baseClass} bg-blue-600 text-white hover:bg-blue-700`
            : `${baseClass} bg-blue-600 text-white hover:bg-blue-700`;
    };

    const getStatusClass = () => {
        if (submitStatus.type === 'success') {
            return theme === 'dark'
                ? 'bg-green-900/30 border border-green-800 text-green-300'
                : 'bg-green-50 border border-green-200 text-green-700';
        } else if (submitStatus.type === 'error') {
            return theme === 'dark'
                ? 'bg-red-900/30 border border-red-800 text-red-300'
                : 'bg-red-50 border border-red-200 text-red-700';
        }
        return '';
    };

    if (cards && cards.length > 0) {
        return (
            <section className={`p-4 ${getBackgroundClass()}`}>
                {/* Cards Grid - Compact Design */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                    {cards.map((card, idx) => (
                        <Link
                            key={idx}
                            to={card.href}
                            className={`rounded-lg p-4 transition-all duration-200 cursor-pointer border ${getCardClass()} hover:shadow-md shadow-lg`}
                            id={card.id}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`flex items-center justify-center w-12 h-12 rounded-lg text-white text-lg bg-gradient-to-br ${card.color}`}>
                                    <FontAwesomeIcon icon={card.icon} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${getTextClass()}`}>{card.title}</p>
                                    {card.count !== null ? (
                                        <h3 className={`text-lg font-bold ${getCountClass()}`}>{card.count}</h3>
                                    ) : (
                                        <h3 className={`text-lg font-bold ${getCountClass()}`}>{0}</h3>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Feedback Modal - Professional Design */}
                <div
                    id="feedbackModal"
                    className={`${showModal ? 'flex' : 'hidden'} fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all duration-300`}
                    onClick={(e) => e.target.id === 'feedbackModal' && handleCloseModal()}
                >
                    <div className={`border w-full max-w-md rounded-xl shadow-2xl relative ${getModalClass()} animate-scale-in`}>
                        <button
                            onClick={handleCloseModal}
                            className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer ${getButtonClass()} transition-all duration-200`}
                        >
                            ✖
                        </button>

                        <div className="p-6">
                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
                                    <FontAwesomeIcon icon={faComments} className="text-2xl text-white" />
                                </div>
                                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Share Your Feedback
                                </h3>
                                <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Help us improve your experience
                                </p>
                            </div>

                            {/* Status Message */}
                            {submitStatus.show && (
                                <div className={`mb-6 p-4 rounded-lg ${getStatusClass()} animate-fade-in`}>
                                    <div className="flex items-center gap-3">
                                        <FontAwesomeIcon 
                                            icon={submitStatus.type === 'success' ? faCheckCircle : faExclamationCircle} 
                                            className={submitStatus.type === 'success' ? 'text-green-500' : 'text-red-500'} 
                                        />
                                        <span className="text-sm font-medium">{submitStatus.message}</span>
                                    </div>
                                </div>
                            )}

                            <form className="space-y-6" id="feedbackform">
                                {/* Feedback Textarea */}
                                <div>
                                    <label className={`block mb-3 text-sm font-semibold ${getTextClass()}`}>
                                        Your Feedback
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <textarea
                                        ref={feedBackaRef}
                                        rows="4"
                                        name="feedback"
                                        value={form.feedback}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 resize-none ${getTextAreaClass()}`}
                                        placeholder="Tell us what you think... We value your input!"
                                        disabled={isSubmitting}
                                    ></textarea>
                                    <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Minimum 10 characters required
                                    </p>
                                </div>

                                {/* Star Rating Section */}
                                <div>
                                    <label className={`block mb-3 text-sm font-semibold ${getTextClass()}`}>
                                        Rate Your Experience
                                    </label>
                                    <div id="star" className="flex items-center justify-center space-x-1 mb-2">
                                        {[1, 2, 3, 4, 5].map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => !isSubmitting && star(num)}
                                                type="button"
                                                disabled={isSubmitting}
                                                className={`
                                                    group relative w-10 h-10 rounded-full flex items-center justify-center
                                                    transition-all duration-300 transform hover:scale-110
                                                    ${form.likes >= num
                                                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-[0_0_15px_rgba(250,204,21,0.7)]'
                                                        : theme === 'dark'
                                                            ? 'bg-gray-700 text-yellow-400 hover:bg-yellow-400 hover:text-white'
                                                            : 'bg-gray-100 text-yellow-500 hover:bg-yellow-400 hover:text-white'
                                                    }
                                                    ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                                `}
                                            >
                                                <FontAwesomeIcon icon={faStar} className="text-xl" />
                                                <span className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-300 text-xs px-3 py-1.5 rounded-md bg-gray-900 text-white whitespace-nowrap shadow-lg">
                                                    {num === 1
                                                        ? 'Poor 😞'
                                                        : num === 2
                                                            ? 'Fair 😕'
                                                            : num === 3
                                                                ? 'Good 🙂'
                                                                : num === 4
                                                                    ? 'Very Good 😃'
                                                                    : 'Excellent 🤩'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    
                                    {form.likes > 0 && (
                                        <p className={`text-center text-sm font-medium ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                            <FontAwesomeIcon icon={faStar} className="mr-2" />
                                            {form.likes === 1
                                                ? 'Poor'
                                                : form.likes === 2
                                                    ? 'Fair'
                                                    : form.likes === 3
                                                        ? 'Good'
                                                        : form.likes === 4
                                                            ? 'Very Good'
                                                            : 'Excellent'}
                                        </p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        disabled={isSubmitting}
                                        className={`px-5 py-2.5 rounded-lg border transition-colors text-sm font-medium ${theme === 'dark' 
                                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={saveFeedback}
                                        disabled={isSubmitting || form.feedback.trim().length < 10}
                                        className={getSubmitButtonClass()}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faPaperPlane} />
                                                Submit Feedback
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Feedback Button */}
                <div className="fixed bottom-6 right-6 z-40 animate-bounce-slow">
                    <button
                        onClick={handleOpenModal}
                        className="group relative w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faComments} className="text-xl" />
                        <span className="absolute -top-12 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs px-3 py-1.5 rounded-md bg-gray-900 text-white whitespace-nowrap shadow-lg">
                            Share Feedback
                        </span>
                    </button>
                </div>

                {/* Add CSS animations */}
                <style jsx>{`
                    @keyframes scale-in {
                        from {
                            transform: scale(0.95);
                            opacity: 0;
                        }
                        to {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                    @keyframes fade-in {
                        from {
                            opacity: 0;
                            transform: translateY(-10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    @keyframes bounce-slow {
                        0%, 100% {
                            transform: translateY(0);
                        }
                        50% {
                            transform: translateY(-10px);
                        }
                    }
                    .animate-scale-in {
                        animation: scale-in 0.3s ease-out;
                    }
                    .animate-fade-in {
                        animation: fade-in 0.3s ease-out;
                    }
                    .animate-bounce-slow {
                        animation: bounce-slow 2s infinite;
                    }
                `}</style>
            </section>
        )
    } else {
        return (
            <div className={`min-h-screen flex items-center justify-center ${getBackgroundClass()}`}>
                <div className="text-center">
                    <Loder status="" />
                </div>
            </div>
        )
    }
}