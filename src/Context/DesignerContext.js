import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const DesignerContext = createContext();

export const DesignerProvider = ({ children }) => {
    const [designer, setDesigner] = useState(() => {
        const storedDesigner = localStorage.getItem('skydent_designer');
        return storedDesigner ? JSON.parse(storedDesigner) : null;
    });

    const navigate = useNavigate();

    useEffect(() => {
        if (designer) {
            localStorage.setItem('skydent_designer', JSON.stringify(designer));
        } else {
            localStorage.removeItem('skydent_designer');
        }
    }, [designer]);

    const logout = async () => {
        setDesigner(null);
        localStorage.removeItem('skydent_designer');
        localStorage.removeItem('skydent_designer_token');
        localStorage.removeItem('skydent_designer_base_url');
        localStorage.removeItem('theme');
        navigate('/designer', { replace: true });
    }


    return (
        <DesignerContext.Provider value={{ designer, setDesigner, logout }} >
            {children}
        </DesignerContext.Provider>
    )
}