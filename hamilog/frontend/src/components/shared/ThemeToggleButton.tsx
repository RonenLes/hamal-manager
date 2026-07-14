"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/shared/Icon";

type ThemeMode = "dark" | "light";

// Renders the theme toggle button component.
export default function ThemeToggleButton() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const savedTheme =
      (localStorage.getItem("hamilog-theme") as ThemeMode | null) || "dark";

    setTheme(savedTheme);
  }, []);

  // Toggles the theme.
  function toggleTheme() {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";

    document.documentElement.classList.remove("theme-dark", "theme-light");
    document.documentElement.classList.add(
      nextTheme === "dark" ? "theme-dark" : "theme-light"
    );

    localStorage.setItem("hamilog-theme", nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-xl border border-app px-4 py-2 text-sm font-semibold text-main transition hover:bg-card-soft"
      title="Toggle light / dark mode"
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} className="h-4 w-4" />
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}