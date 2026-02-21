"use client";

import { createContext, useContext, useLayoutEffect, useState } from "react";

type Theme = "dark" | "light";

const ThemeContext = createContext<{
    theme: Theme;
    toggle: () => void;
}>({ theme: "dark", toggle: () => { } });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark");

    // useLayoutEffect: runs synchronously before browser paint — no flash
    useLayoutEffect(() => {
        const stored = localStorage.getItem("ff-theme") as Theme | null;
        const initial = stored ?? "dark";
        setTheme(initial);
        applyTheme(initial);
    }, []);

    function applyTheme(t: Theme) {
        document.documentElement.classList.toggle("dark", t === "dark");
        document.documentElement.classList.toggle("light", t === "light");
    }

    function toggle() {
        setTheme((prev) => {
            const next = prev === "dark" ? "light" : "dark";
            localStorage.setItem("ff-theme", next);
            applyTheme(next);
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
