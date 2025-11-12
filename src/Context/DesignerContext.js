import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const DesignerContext = createContext();

export const DesignerProvider = ({ children }) => {
    const [designer, setDesigner] = useState(() => {
        const storedDesigner = localStorage.getItem('designer');
        return storedDesigner ? JSON.parse(storedDesigner) : null;
    });

    const navigate = useNavigate();

    useEffect(() => {
        if (designer) {
            localStorage.setItem('designer', JSON.stringify(designer));
        } else {
            localStorage.removeItem('designer');
        }
    }, [designer]);

    const logout = async () => {
        setDesigner(null);
        localStorage.removeItem('designer');
        localStorage.removeItem('token');
        localStorage.removeItem('theme');
        navigate('/designer', { replace: true });
    }


    return (
        <DesignerContext.Provider value={{ designer, setDesigner, logout }} >
            {children}
        </DesignerContext.Provider>
    )
}