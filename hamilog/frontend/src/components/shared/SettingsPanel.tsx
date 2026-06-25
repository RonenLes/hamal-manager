"use client";

import { useEffect, useState } from "react";

type ThemeMode = "dark" | "light";
type FontSize = "small" | "medium" | "large";

type SettingsPanelProps = {
  audience: "dispatcher" | "driver";
};

const STORAGE_KEYS = {
  theme: "hamilog-theme",
  fontSize: "hamilog-font-size",
};

function getSavedTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";

  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  return savedTheme === "light" ? "light" : "dark";
}

function getSavedFontSize(): FontSize {
  if (typeof window === "undefined") return "medium";

  const savedFontSize = localStorage.getItem(STORAGE_KEYS.fontSize);
  return savedFontSize === "small" || savedFontSize === "large"
    ? savedFontSize
    : "medium";
}

function applySettings(theme: ThemeMode, fontSize: FontSize) {
  const root = document.documentElement;

  root.classList.remove("theme-dark", "theme-light");
  root.classList.add(theme === "dark" ? "theme-dark" : "theme-light");

  root.classList.remove("font-small", "font-medium", "font-large");
  root.classList.add(`font-${fontSize}`);
}

function OptionButton({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition ${
        active
          ? "border-blue-500 bg-blue-500/10"
          : "border-app bg-card hover:bg-card-soft"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-main">{label}</h3>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>

        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full border text-sm font-black ${
            active
              ? "border-blue-500 bg-blue-500 text-main"
              : "border-app bg-card-soft text-transparent"
          }`}
        >
          ✓
        </span>
      </div>
    </button>
  );
}

export default function SettingsPanel({ audience }: SettingsPanelProps) {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const savedTheme = getSavedTheme();
    const savedFs = getSavedFontSize();
    setTheme(savedTheme);
    setFontSize(savedFs);
    applySettings(savedTheme, savedFs);
  }, []);

  useEffect(() => {
    applySettings(theme, fontSize);
  }, [theme, fontSize]);

  function showSavedMessage(message: string) {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(""), 1500);
  }

  function handleThemeChange(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
    applySettings(nextTheme, fontSize);
    showSavedMessage("Theme updated");
  }

  function handleFontSizeChange(nextFontSize: FontSize) {
    setFontSize(nextFontSize);
    localStorage.setItem(STORAGE_KEYS.fontSize, nextFontSize);
    applySettings(theme, nextFontSize);
    showSavedMessage("Font size updated");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
          Accessibility
        </p>

        <h1 className="mt-1 text-3xl font-black">Settings</h1>

        <p className="mt-2 text-muted">
          Adjust visual accessibility settings for the {audience} dashboard.
        </p>
      </header>

      {savedMessage && (
        <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-emerald-300">
          {savedMessage}
        </div>
      )}

      <section className="space-y-6">
        <div className="rounded-2xl border border-app bg-card p-5 shadow-xl">
          <div className="mb-5">
            <h2 className="text-xl font-black text-main">Theme Mode</h2>
            <p className="mt-1 text-sm text-muted">
              Choose between dark mode and light mode.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <OptionButton
              label="Dark Mode"
              description="Dark background with bright text."
              active={theme === "dark"}
              onClick={() => handleThemeChange("dark")}
            />

            <OptionButton
              label="Light Mode"
              description="Light background with dark text."
              active={theme === "light"}
              onClick={() => handleThemeChange("light")}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-app bg-card p-5 shadow-xl">
          <div className="mb-5">
            <h2 className="text-xl font-black text-main">Font Size</h2>
            <p className="mt-1 text-sm text-muted">
              Choose the text size that is most comfortable for you.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <OptionButton
              label="Small"
              description="Compact text size."
              active={fontSize === "small"}
              onClick={() => handleFontSizeChange("small")}
            />

            <OptionButton
              label="Medium"
              description="Default text size."
              active={fontSize === "medium"}
              onClick={() => handleFontSizeChange("medium")}
            />

            <OptionButton
              label="Large"
              description="Larger text for easier reading."
              active={fontSize === "large"}
              onClick={() => handleFontSizeChange("large")}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
