import { useState, useEffect, createContext } from "react";
import { useNavigate } from "react-router-dom";
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('skydent_user');
        return storedUser ? JSON.parse(storedUser) : null;
    })

    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            localStorage.setItem('skydent_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('skydent_user');
        }
    }, [user])

    const logout = () => {
        setUser(null);
        localStorage.removeItem('skydent_user');
        localStorage.removeItem('skydent_user_token');
        localStorage.removeItem('skydent_user_base_url');
        localStorage.removeItem('theme');
        navigate('/');
    }

    return (
        <UserContext.Provider value={{ user, setUser, logout }} >
            {children}
        </UserContext.Provider>
    )

}