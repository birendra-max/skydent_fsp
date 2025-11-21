import { useEffect, useState, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../../utils/designerapi';
import { ThemeContext } from "../../Context/ThemeContext";
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
    faRepeat
} from "@fortawesome/free-solid-svg-icons";

export default function Dashboard() {
    const { theme } = useContext(ThemeContext);
    const [cases, setCases] = useState(null);
    const [cards, setCards] = useState([]);

    useEffect(() => {
        async function fetchCardsData() {
            try {
                const data = await fetchWithAuth('/all-cases-data-count', {
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
                { id: "home", href: "/designer/home", title: "New Cases", count: cases.new_cases, color: "from-gray-600 to-gray-800", icon: faShoppingCart },
                { id: "progress", href: "/designer/in_progress", title: "In Progress", count: cases.progress, color: "from-yellow-500 to-amber-600", icon: faSpinner },
                { id: "canceled", href: "/designer/canceled_case", title: "Cancelled Cases", count: cases.canceled, color: "from-red-500 to-rose-600", icon: faTimes },
                { id: "completed", href: "/designer/completed_case", title: "Completed Cases", count: cases.completed, color: "from-green-500 to-emerald-600", icon: faTasks },
                { id: "rush", href: "/designer/rush_cases", title: "Rush Cases", count: cases.rush, color: "from-blue-500 to-indigo-600", icon: faBolt },
                { id: "qc", href: "/designer/qc_required", title: "QC Required", count: cases.qc, color: "from-orange-500 to-amber-600", icon: faBell },
                { id: "hold", href: "/designer/case_on_hold", title: "Case On Hold", count: cases.hold, color: "from-pink-500 to-rose-600", icon: faPauseCircle },
                { id: "all_c", href: "/designer/all_cases", title: "All Cases", count: cases.all, color: "from-green-600 to-emerald-700", icon: faCogs },
                { id: "yesterday", href: "/designer/yesterday_cases", title: "Yesterday's Cases", count: cases.yesterday_cases, color: "from-blue-400 to-blue-600", icon: faCalendarDay },
                { id: "today", href: "/designer/today_cases", title: "Today's Cases", count: cases.today_cases, color: "from-purple-500 to-violet-600", icon: faCalendarCheck },
                { id: "weekly", href: "/designer/weekly_case", title: "Weekly Cases", count: cases.weekly_cases, color: "from-indigo-500 to-purple-600", icon: faCalendarWeek },
                { id: "Redesign", href: "/designer/redesign_cases", title: "Redesign Cases", count: cases.redesign, color: "from-teal-500 to-cyan-600", icon: faRepeat },
            ];

            setCards(updatedCards);
        }
    }, [cases]);

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
            </section>
        )
    } else if (cases === null) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${getBackgroundClass()}`}>
                <div className="text-center">
                    <Loder status="" />
                </div>
            </div>
        )
    } else {
        return (
            <div className={`min-h-screen flex items-center justify-center ${getBackgroundClass()}`}>
                <div className="text-center">
                    <h1 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Data not found</h1>
                </div>
            </div>
        )
    }
}