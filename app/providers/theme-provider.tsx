"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

const ThemeContext = createContext<{
    theme: Theme;
    toggle: () => void;
}>({ theme: "dark", toggle: () => { } });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark");

    // Read from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("ff-theme") as Theme | null;
        const initial = stored ?? "dark";
        setTheme(initial);
        document.documentElement.classList.toggle("dark", initial === "dark");
        document.documentElement.classList.toggle("light", initial === "light");
    }, []);

    function toggle() {
        setTheme((prev) => {
            const next = prev === "dark" ? "light" : "dark";
            localStorage.setItem("ff-theme", next);
            document.documentElement.classList.toggle("dark", next === "dark");
            document.documentElement.classList.toggle("light", next === "light");
            return next;
        });
    }

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
