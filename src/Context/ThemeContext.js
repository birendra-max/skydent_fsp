import { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

    // This function applies the theme styles and saves it
    const applyTheme = (theme) => {
        const root = document.getElementById('root');
        if (theme === 'dark') {
            root.classList.add('bg-black');
        } else {
            root.classList.remove('bg-black');
        }
        localStorage.setItem('theme', theme);
        setTheme(theme); // also update state
    };

    // Apply theme when the component mounts or theme changes
    useEffect(() => {
        applyTheme(theme);
        // eslint-disable-next-line
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme: applyTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
