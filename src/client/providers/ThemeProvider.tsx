import { useDarkMode, useLayoutRefEffect, useLocalStorage } from "@lilib/hooks";
import { createContext, useContext, useMemo, type ReactNode } from "react";

/** Theme selected by the visitor. */
export type Theme = "system" | "light" | "dark";

/** Theme actually applied to the document. */
export type ResolvedTheme = "light" | "dark";

// The theme bootstrap in `shell.html` reads the same key before any script
// loads, so both places must accept the same values.
const STORAGE_KEY = "lipress:theme";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Reads the theme state from the nearest `ThemeProvider`.
 *
 * @returns The selected theme, the resolved theme, and the setter.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<Theme>(STORAGE_KEY, {
    defaultValue: "system",
    serialize: (value) => value,
    deserialize: (raw) => (raw === "light" || raw === "dark" ? raw : "system"),
  });

  const systemDark = useDarkMode();
  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useLayoutRefEffect(() => {
    const root = document.documentElement;
    root.classList.add("lipress-theme-switching");
    root.dataset.theme = resolvedTheme;

    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        root.classList.remove("lipress-theme-switching");
      });
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      root.classList.remove("lipress-theme-switching");
    };
  }, [resolvedTheme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export default ThemeProvider;
