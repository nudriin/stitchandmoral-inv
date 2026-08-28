"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getThemeStyleAction, saveThemeStyleAction, ThemeStyle } from "@/actions/theme";

interface ThemeStyleContextType {
  themeStyle: ThemeStyle;
  setThemeStyle: (style: ThemeStyle) => Promise<void>;
  isThemeModalOpen: boolean;
  setIsThemeModalOpen: (open: boolean) => void;
  isSaving: boolean;
}

const ThemeStyleContext = createContext<ThemeStyleContextType | undefined>(undefined);

export function ThemeStyleProvider({ children }: { children: ReactNode }) {
  const [themeStyle, setThemeStyleState] = useState<ThemeStyle>("default");
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage and DB
  useEffect(() => {
    setMounted(true);
    const local = localStorage.getItem("app_theme_style") as ThemeStyle;
    if (local && (local === "default" || local === "glassmorphism" || local === "neomorphism")) {
      setThemeStyleState(local);
      document.documentElement.setAttribute("data-theme-style", local);
    }

    // Fetch latest setting from database
    getThemeStyleAction().then((dbTheme) => {
      if (dbTheme && (dbTheme === "default" || dbTheme === "glassmorphism" || dbTheme === "neomorphism")) {
        setThemeStyleState(dbTheme);
        localStorage.setItem("app_theme_style", dbTheme);
        document.documentElement.setAttribute("data-theme-style", dbTheme);
      }
    });
  }, []);

  const handleSetThemeStyle = async (newStyle: ThemeStyle) => {
    setThemeStyleState(newStyle);
    localStorage.setItem("app_theme_style", newStyle);
    document.documentElement.setAttribute("data-theme-style", newStyle);

    setIsSaving(true);
    try {
      await saveThemeStyleAction(newStyle);
    } catch (err) {
      console.error("Gagal menyimpan tema ke database:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemeStyleContext.Provider
      value={{
        themeStyle,
        setThemeStyle: handleSetThemeStyle,
        isThemeModalOpen,
        setIsThemeModalOpen,
        isSaving,
      }}
    >
      {children}
    </ThemeStyleContext.Provider>
  );
}

export function useThemeStyle() {
  const context = useContext(ThemeStyleContext);
  if (!context) {
    throw new Error("useThemeStyle must be used within a ThemeStyleProvider");
  }
  return context;
}
