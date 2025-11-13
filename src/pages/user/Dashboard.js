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
    faStar
} from "@fortawesome/free-solid-svg-icons";

export default function Dashboard() {
    const base_url = localStorage.getItem('base_url');
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

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const feedBackaRef = useRef(null);
    const token = localStorage.getItem('token');
    const saveFeedback = async () => {
        if (form.feedback === '') {
            feedBackaRef.current.focus();
        }
        else {
            const resp = await fetch(`${base_url}/save-feedback`, {
                method: "POST",
                headers: {
                    'Content-Type': "application/json",
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant': 'skydent'
                },
                body: JSON.stringify(form),
            })

            const data = await resp.json()
            if (data.status === 'success') {
                const statusEl = document.getElementById('status');
                statusEl.className = 'mb-4 w-full px-4 py-2 text-sm font-medium border rounded-lg border-green-400 bg-green-100 text-green-700';
                statusEl.innerText = data.message;
                setForm({ feedback: "", likes: "" });
                document.getElementById('feedbackform').reset();
                setTimeout(() => {
                    setShowModal(false);
                }, 2000);

            } else {

                if (data.error === 'Invalid or expired token') {
                    alert('Invalid or expired token. Please log in again.')
                    navigate(logout);
                }

                const statusEl = document.getElementById('status');
                statusEl.className = 'mb-4 w-full px-4 py-2 text-sm font-medium border rounded-lg border-red-400 bg-red-100 text-red-700';
                statusEl.innerText = data.message;
                setForm({ feedback: "", likes: "" });
                document.getElementById('feedbackform').reset();
                setTimeout(() => {
                    setShowModal(false);
                }, 2000);
            }
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
                { id: "canceled", href: "/user/canceled_case", title: "Canceled Cases", count: cases.canceled, color: "from-red-500 to-rose-600", icon: faTimes },
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
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    function star(num) {
        const starElement = document.getElementById('star');
        if (!starElement) return;

        const items = starElement.children;
        setForm((prevForm) => ({
            ...prevForm,
            likes: num
        }))

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
            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
            : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500';
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

    if (cards && cards != null) {
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
                                    <p className={`text-sm font-medium truncate ${getTextClass()}`}>{card.title}</p>
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

                {/* Feedback Modal - Compact Design */}
                <div
                    id="feedbackModal"
                    className={`${showModal ? 'flex' : 'hidden'} fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4`}
                >
                    <div className={`border w-full max-w-md rounded-xl shadow-lg relative ${getModalClass()}`}>
                        <button
                            onClick={handleCloseModal}
                            className={`absolute top-3 right-3 w-8 h-8 rounded flex items-center justify-center text-sm cursor-pointer ${getButtonClass()}`}
                        >
                            ✖
                        </button>

                        <div className="p-5">

                            <p id="status" className=" mt-4 w-full mb-3"></p>

                            <form className="space-y-4" id="feedbackform">
                                <div>
                                    <label className={`block mb-2 text-sm font-medium ${getTextClass()}`}>Your Feedback</label>
                                    <textarea
                                        ref={feedBackaRef}
                                        rows="3"
                                        name="feedback"
                                        value={form.feedback}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm ${getTextAreaClass()}`}
                                        placeholder="Share your thoughts..."
                                    ></textarea>
                                </div>

                                {/* Rate Your Experience Section */}
                                <div className="mt-4">
                                    <label className={`block mb-2 text-sm font-medium ${getTextClass()}`}>
                                        Rate Your Experience
                                    </label>

                                    <div className="flex items-center justify-start space-x-2">
                                        {[1, 2, 3, 4, 5].map((num) => (
                                            <button
                                                key={num}
                                                onClick={() =>
                                                    setForm((prev) => ({ ...prev, likes: num }))
                                                }
                                                type="button"
                                                className={`
          group relative w-8 h-8 rounded-full flex items-center justify-center
          transition-all duration-300 transform hover:scale-110
          ${form.likes >= num
                                                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-[0_0_10px_rgba(250,204,21,0.6)]'
                                                        : theme === 'dark'
                                                            ? 'bg-gray-700 text-yellow-400 hover:bg-yellow-400 hover:text-white'
                                                            : 'bg-gray-200 text-yellow-500 hover:bg-yellow-400 hover:text-white'
                                                    }
        `}
                                            >
                                                <FontAwesomeIcon icon={faStar} className="text-lg" />
                                                <span className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs px-2 py-1 rounded-md bg-black/70 text-white whitespace-nowrap">
                                                    {num === 1
                                                        ? 'Terrible 😞'
                                                        : num === 2
                                                            ? 'Poor 😕'
                                                            : num === 3
                                                                ? 'Average 🙂'
                                                                : num === 4
                                                                    ? 'Good 😃'
                                                                    : 'Excellent 🤩'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    {form.likes > 0 && (
                                        <p
                                            className={`mt-2 text-sm font-medium ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                                                }`}
                                        >
                                            You rated:{' '}
                                            {form.likes === 1
                                                ? 'Terrible'
                                                : form.likes === 2
                                                    ? 'Poor'
                                                    : form.likes === 3
                                                        ? 'Average'
                                                        : form.likes === 4
                                                            ? 'Good'
                                                            : 'Excellent'}
                                        </p>
                                    )}
                                </div>


                                <div className="text-right pt-2">
                                    <button
                                        type="button"
                                        onClick={saveFeedback}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm font-medium"
                                    >
                                        Submit Feedback
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Feedback Button - Compact */}
                <div className="fixed bottom-4 right-4 z-40">
                    <button
                        onClick={handleOpenModal}
                        className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-lg cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faComments} className="text-2xl" />
                    </button>
                </div>

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