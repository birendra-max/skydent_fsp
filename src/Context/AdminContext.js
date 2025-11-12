import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
    const [admin, setAdmin] = useState(() => {
        const storedAdmin = localStorage.getItem('admin');
        return storedAdmin ? JSON.parse(storedAdmin) : null;
    });

    const navigate = useNavigate();

    useEffect(() => {
        if (admin) {
            localStorage.setItem('admin', JSON.stringify(admin));
        } else {
            localStorage.removeItem('admin');
        }
    }, [admin]);

    const logout = async () => {
        setAdmin(null);
        localStorage.removeItem('admin');
        localStorage.removeItem('token');
        localStorage.removeItem('theme');
        navigate('/admin', { replace: true });
    }


    return (
        <AdminContext.Provider value={{ admin, setAdmin, logout }} >
            {children}
        </AdminContext.Provider>
    )
}