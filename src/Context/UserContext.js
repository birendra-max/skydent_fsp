import { useState, useEffect, createContext } from "react";
import { useNavigate } from "react-router-dom";
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    })

    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }, [user])

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('theme');
        navigate('/');
    }

    return (
        <UserContext.Provider value={{ user, setUser, logout }} >
            {children}
        </UserContext.Provider>
    )

}