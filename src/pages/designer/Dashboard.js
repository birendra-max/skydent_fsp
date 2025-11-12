import { useEffect, useRef, useState, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from 'react-router-dom';
import { ThemeContext } from "../../Context/ThemeContext";
import { fetchWithAuth } from '../../utils/designerapi';

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
    faRepeat
} from "@fortawesome/free-solid-svg-icons";

export default function Dashboard() {
    let base_url = localStorage.getItem('base_url');
    const token = localStorage.getItem('token');
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
                statusEl.className = 'mb-6 w-full px-4 py-3 text-sm font-medium border shadow-md rounded-lg border-green-400 bg-green-100 text-green-700';
                statusEl.innerText = data.message;
                setForm({ feedback: "", likes: "" });
                document.getElementById('feedbackform').reset();
                setTimeout(() => {
                    setShowModal(false);
                }, 2000);

            } else {
                const statusEl = document.getElementById('status');
                statusEl.className = 'mb-6 w-full px-4 py-3 text-sm font-medium border shadow-md rounded-lg border-red-400 bg-red-100 text-red-700';
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
                const data = await fetchWithAuth('/all-cases-data-count', {
                    method: "GET",
                });

                // data is already the parsed JSON response
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
                { id: "home", href: "/designer/home", title: "New Cases", count: cases.new_cases, color: "bg-gray-800", icon: faShoppingCart },
                { id: "progress", href: "/designer/in_progress", title: "In Progress", count: cases.progress, color: "bg-yellow-500", icon: faSpinner },
                { id: "canceled", href: "/designer/canceled_case", title: "Canceled Cases", count: cases.canceled, color: "bg-red-500", icon: faTimes },
                { id: "completed", href: "/designer/completed_case", title: "Completed Cases", count: cases.completed, color: "bg-green-600", icon: faTasks },
                { id: "rush", href: "/designer/rush_cases", title: "Rush Cases", count: cases.rush, color: "bg-blue-500", icon: faBolt },
                { id: "qc", href: "/designer/qc_required", title: "QC Required", count: cases.qc, color: "bg-orange-400", icon: faBell },
                { id: "hold", href: "/designer/case_on_hold", title: "Case On Hold", count: cases.hold, color: "bg-pink-500", icon: faPauseCircle },
                { id: "all_c", href: "/designer/all_cases", title: "All Cases", count: cases.all, color: "bg-green-500", icon: faCogs },
                { id: "yesterday", href: "/designer/yesterday_cases", title: "Yesterday's Cases", count: cases.yesterday_cases, color: "bg-blue-400", icon: faCalendarDay },
                { id: "today", href: "/designer/today_cases", title: "Today's Cases", count: cases.today_cases, color: "bg-purple-500", icon: faCalendarCheck },
                { id: "weekly", href: "/designer/weekly_case", title: "Weekly Cases", count: cases.weekly_cases, color: "bg-indigo-500", icon: faCalendarWeek },
                { id: "Redesign", href: "/designer/redesign_cases", title: "Redesign Cases", count: cases.redesign, color: "bg-teal-500", icon: faRepeat },
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
            items[i].classList.remove('bg-yellow-400');
        }

        for (let i = 0; i < num && i < items.length; i++) {
            items[i].classList.add('bg-yellow-400');
        }
    }

    // Theme-based background classes
    const getBackgroundClass = () => {
        return theme === 'dark'
            ? 'bg-gray-900 text-white'
            : 'bg-gray-200 text-gray-800';
    };

    const getCardClass = () => {
        return theme === 'dark'
            ? 'bg-gray-800 text-white hover:bg-gray-700'
            : 'bg-white text-gray-800 hover:bg-gray-50';
    };

    const getModalClass = () => {
        return theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-white'
            : 'bg-white border-white/30 text-black';
    };

    const getTextAreaClass = () => {
        return theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
            : 'bg-white border-gray-500 text-black placeholder-gray-300';
    };

    const getButtonClass = () => {
        return theme === 'dark'
            ? 'text-gray-300 hover:text-white'
            : 'text-gray-700 hover:text-gray-900';
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
            <section className={`p-6 rounded-xl ${getBackgroundClass()}`}>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {cards.map((card, idx) => (
                        <Link
                            key={idx}
                            to={card.href}
                            className={`rounded-xl shadow-md p-4 hover:shadow-xl transition cursor-pointer ${getCardClass()}`}
                            id={card.id}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`flex items-center justify-center w-14 h-14 rounded-full text-white text-2xl ${card.color}`}>
                                    <FontAwesomeIcon icon={card.icon} />
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${getTextClass()}`}>{card.title}</p>
                                    {card.count !== null ? (
                                        <h3 className={`text-xl font-bold ${getCountClass()}`}>{card.count}</h3>
                                    ) : (
                                        <h3 className={`text-xl font-bold ${getCountClass()}`}>{0}</h3>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div
                    id="feedbackModal"
                    className={`${showModal ? 'flex' : 'hidden'} fixed inset-0 bg-black/10 backdrop-blur-lg flex items-center justify-center z-50`}
                >
                    <div className={`border w-full max-w-lg p-6 rounded-2xl shadow-2xl relative animate-fadeIn ${getModalClass()}`}>
                        <button
                            onClick={handleCloseModal}
                            className={`absolute top-3 right-3 text-2xl cursor-pointer ${getButtonClass()}`}
                        >
                            ✖
                        </button>
                        <h2 className="text-2xl font-bold">We value your feedback</h2>
                        <p className={`mb-6 ${getTextClass()}`}>Please take a moment to share your thoughts with us.</p>

                        <p id="status" className="w-full"></p>

                        <form className="space-y-4" id="feedbackform">
                            <div>
                                <label className={`block mb-1 font-medium ${getTextClass()}`}>Your Feedback</label>
                                <textarea
                                    ref={feedBackaRef}
                                    rows="4"
                                    name="feedback"
                                    value={form.feedback}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none ${getTextAreaClass()}`}
                                    placeholder="Write your feedback..."
                                ></textarea>
                            </div>
                            <div>
                                <label className={`block mb-2 font-medium ${getTextClass()}`}>Rate Us</label>
                                <div className="flex space-x-2" id="star">
                                    <button onClick={() => star(1)} type="button" className="w-10 h-10 flex items-center justify-center border border-black/30 bg-white/10 rounded-full text-yellow-300 hover:bg-yellow-400 hover:text-white cursor-pointer">⭐</button>
                                    <button onClick={() => star(2)} type="button" className="w-10 h-10 flex items-center justify-center border border-black/30 bg-white/10 rounded-full text-yellow-300 hover:bg-yellow-400 hover:text-white cursor-pointer">⭐</button>
                                    <button onClick={() => star(3)} type="button" className="w-10 h-10 flex items-center justify-center border border-black/30 bg-white/10 rounded-full text-yellow-300 hover:bg-yellow-400 hover:text-white cursor-pointer">⭐</button>
                                    <button onClick={() => star(4)} type="button" className="w-10 h-10 flex items-center justify-center border border-black/30 bg-white/10 rounded-full text-yellow-300 hover:bg-yellow-400 hover:text-white cursor-pointer">⭐</button>
                                    <button onClick={() => star(5)} type="button" className="w-10 h-10 flex items-center justify-center border border-black/30 bg-white/10 rounded-full text-yellow-300 hover:bg-yellow-400 hover:text-white cursor-pointer">⭐</button>
                                </div>
                            </div>
                            <div className="text-right">
                                <button type="button" onClick={saveFeedback} className="px-6 py-2 bg-indigo-600/80 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition cursor-pointer">Submit Feedback</button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        )
    } else {
        return (
            <>
                <h1 className={theme === 'dark' ? 'text-white' : 'text-black'}>Data not found</h1>
            </>
        )
    }
}