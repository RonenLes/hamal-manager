"use client";

import { useEffect } from "react";

type ThemeMode = "dark" | "light";
type FontSize = "small" | "medium" | "large";

const STORAGE_KEYS = {
  theme: "hamilog-theme",
  fontSize: "hamilog-font-size",
};

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const savedTheme =
      (localStorage.getItem(STORAGE_KEYS.theme) as ThemeMode | null) || "dark";

    const savedFontSize =
      (localStorage.getItem(STORAGE_KEYS.fontSize) as FontSize | null) ||
      "medium";

    document.documentElement.classList.remove("theme-dark", "theme-light");
    document.documentElement.classList.add(
      savedTheme === "dark" ? "theme-dark" : "theme-light"
    );

    document.documentElement.classList.remove(
      "font-small",
      "font-medium",
      "font-large"
    );
    document.documentElement.classList.add(`font-${savedFontSize}`);
  }, []);

  return <>{children}</>;
}