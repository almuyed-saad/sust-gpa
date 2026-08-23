import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";

export type Theme = "light" | "dark" | "ocean" | "sunset";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
});

const STORAGE_KEY = "sust-gpa-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      return stored && THEMES.some((item) => item.id === stored) ? stored : "light";
    } catch {
      return "light";
    }
  });
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  useEffect(() => () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
  }, []);

  const setTheme = (nextTheme: Theme) => {
    if (nextTheme === theme) return;
    const root = document.documentElement;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!reducedMotion) {
      root.classList.add("theme-transition");
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      transitionTimer.current = setTimeout(() => {
        root.classList.remove("theme-transition");
        transitionTimer.current = null;
      }, 240);
    }

    setThemeState(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export const THEMES: { id: Theme; label: string; emoji: string; description: string }[] = [
  { id: "light", label: "Light", emoji: "☀️", description: "Bright and focused" },
  { id: "dark", label: "Dark", emoji: "🌙", description: "Easy on the eyes" },
  { id: "ocean", label: "Ocean", emoji: "🌊", description: "Cool and calm" },
  { id: "sunset", label: "Sunset", emoji: "🌸", description: "Warm and creative" },
];
