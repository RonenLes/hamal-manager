"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter} from "next/navigation";
import { login as apiLogin, getStoredUser, getToken } from "@/lib/api-client";

type ThemeMode = "dark" | "light";

const THEME_STORAGE_KEY = "hamilog-theme";

function getSavedTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.remove("theme-dark", "theme-light");
  document.documentElement.classList.add(theme === "dark" ? "theme-dark" : "theme-light");
}

// ---------------------------------------------------------------------------
// Quick-login test accounts
// ---------------------------------------------------------------------------
const TEST_ACCOUNTS = [
  { username: "dispatcher1", password: "dispatch123", role: "dispatcher", label: "Dispatcher 1" },
  { username: "driver_sedan", password: "drive123", role: "driver", label: "Driver — Sedan" },
  { username: "driver_suv", password: "drive123", role: "driver", label: "Driver — SUV" },
  { username: "driver_van", password: "drive123", role: "driver", label: "Driver — Van" },
  { username: "driver_refrigerated", password: "drive123", role: "driver", label: "Driver — Refrigerated" },
] as const;

// ---------------------------------------------------------------------------
// Inner component that uses useSearchParams
// ---------------------------------------------------------------------------
function LoginForm() {
  const router = useRouter();
  

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(getSavedTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Redirect if already logged in
  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    if (token && user) {
      router.replace(user.role === "dispatcher" ? "/dispatcher" : "/driver");
    }
  }, [router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      try {
        const res = await apiLogin(username, password);
        const targetRole = res.user.role;
        router.push(targetRole === "dispatcher" ? "/dispatcher" : "/driver");
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "detail" in err
            ? (err as { detail: string }).detail
            : "Login failed. Check your credentials.";
        setError(msg);
        setShaking(true);
        setTimeout(() => setShaking(false), 600);
      } finally {
        setLoading(false);
      }
    },
    [username, password, router],
  );

  const handleQuickLogin = useCallback(
    async (account: (typeof TEST_ACCOUNTS)[number]) => {
      setUsername(account.username);
      setPassword(account.password);
      setError(null);
      setLoading(true);

      try {
        const res = await apiLogin(account.username, account.password);
        router.push(res.user.role === "dispatcher" ? "/dispatcher" : "/driver");
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "detail" in err
            ? (err as { detail: string }).detail
            : "Quick login failed. Is the server running?";
        setError(msg);
        setShaking(true);
        setTimeout(() => setShaking(false), 600);
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  function handleThemeToggle() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <div
     className={`w-full max-w-md p-8 rounded-2xl border border-app bg-card text-main shadow-xl ${shaking ? "animate-shake" : ""}`}
      style={{ animation: "fade-up 0.6s ease-out forwards" }}
    >
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={handleThemeToggle}
          className="flex items-center gap-3 rounded-full border border-app bg-card-soft px-3 py-2 text-sm font-semibold text-main transition hover:opacity-90"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          <span className="text-muted">{theme === "dark" ? "Dark" : "Light"}</span>
          <span
            className={`flex h-6 w-11 items-center rounded-full border border-app p-0.5 transition ${
              theme === "dark" ? "justify-start bg-slate-900" : "justify-end bg-blue-100"
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full transition ${
                theme === "dark" ? "bg-blue-400" : "bg-blue-600"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1
          className="font-[family-name:var(--font-outfit)] text-3xl font-bold tracking-tight mb-1"
          style={{
            background: "var(--gradient-blue)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          id="login-title"
        >
          LOGIN
        </h1>
        <p className="text-sm text-muted"  >
          Sign in to continue
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      

        {/* Username */}
        <div className="relative">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 text-sm rounded-lg border border-app bg-input text-main placeholder:text-soft outline-none focus:border-blue-500"
            placeholder="Username"
            autoComplete="username"
            required
            id="login-username"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 text-sm rounded-lg border border-app bg-input text-main placeholder:text-soft outline-none focus:border-blue-500"
            placeholder="Password"
            autoComplete="current-password"
            required
            id="login-password"
          />
        </div>

        {/* Error */}
        {error && (
          <div
            className="text-sm px-4 py-3 rounded-lg"
            style={{
              background: "rgba(244,63,94,0.1)",
              color: "var(--accent-rose)",
              border: "1px solid rgba(244,63,94,0.25)",
            }}
            id="login-error"
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !username || !password}
          className="btn-primary flex items-center justify-center gap-2 text-sm"
          id="login-submit"
        >
          {loading ? (
            <>
              <span
                className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                style={{ animation: "spin-slow 0.7s linear infinite" }}
              />
              Signing in…
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
        <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Quick Access
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
      </div>

      {/* Quick login buttons */}
      <div className="flex flex-col gap-2" id="quick-login-group">
        {TEST_ACCOUNTS.map((account) => (
          <button
            key={account.username}
            type="button"
            onClick={() => handleQuickLogin(account)}
            disabled={loading}
            className="px-4 py-2.5 text-sm flex items-center justify-between cursor-pointer transition-all disabled:opacity-50 rounded-xl border border-app bg-card-soft hover:opacity-90"
            id={`quick-login-${account.username}`}
          >
            <span style={{ color: "var(--text-primary)" }}>{account.label}</span>
            <span
              className="badge"
              style={{
                background:
                  account.role === "dispatcher"
                    ? "rgba(59,130,246,0.12)"
                    : "rgba(16,185,129,0.12)",
                color:
                  account.role === "dispatcher"
                    ? "var(--accent-blue)"
                    : "var(--accent-emerald)",
                border: `1px solid ${
                  account.role === "dispatcher"
                    ? "rgba(59,130,246,0.25)"
                    : "rgba(16,185,129,0.25)"
                }`,
              }}
            >
              {account.role}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page (wraps with Suspense for useSearchParams)
// ---------------------------------------------------------------------------
export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 bg-app text-main">
      {/* Background */}
      <div className="absolute inset-0 bg-dot-pattern pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(59,130,246,0.06) 0%, transparent 60%)",
        }}
      />

      <Suspense
        fallback={
          <div className="glass-card w-full max-w-md p-8 flex items-center justify-center">
            <span
              className="inline-block w-6 h-6 border-2 border-white/20 border-t-white rounded-full"
              style={{ animation: "spin-slow 0.7s linear infinite" }}
            />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
