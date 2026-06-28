"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter} from "next/navigation";
import {
  type CarType,
  createDriverRequest,
  login as apiLogin,
  getStoredUser,
  getToken,
} from "@/lib/api-client";
import { CAR_SPECS } from "@/lib/car-specs";

type ThemeMode = "dark" | "light";

const THEME_STORAGE_KEY = "hamilog-theme";

// Returns the saved theme.
function getSavedTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
}

// Applies the theme.
function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.remove("theme-dark", "theme-light");
  document.documentElement.classList.add(theme === "dark" ? "theme-dark" : "theme-light");
}

// ---------------------------------------------------------------------------
// Quick-login users seeded into Atlas for local development
// ---------------------------------------------------------------------------
const AVAILABLE_USERS = [
  { username: "dispatcher1", password: "dispatch123", role: "dispatcher", label: "Dispatcher - Operations" },
  { username: "driver_sedan", password: "drive123", role: "driver", label: "Alice Ronen - Sedan" },
  { username: "driver_suv", password: "drive123", role: "driver", label: "Bob Levi - SUV" },
  { username: "driver_van", password: "drive123", role: "driver", label: "Carol Mizrahi - Van" },
  { username: "driver_refrigerated", password: "drive123", role: "driver", label: "Dan Shapira - Refrigerated Van" },
] as const;

const carTypeOptions = Object.entries(CAR_SPECS).map(([value, spec]) => ({
  value: value as CarType,
  label: spec.label,
}));

// ---------------------------------------------------------------------------
// Inner component that uses useSearchParams
// ---------------------------------------------------------------------------
function LoginForm() {
  const router = useRouter();
  

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showDriverRegistration, setShowDriverRegistration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registerMessage, setRegisterMessage] = useState("");
  const [driverRequest, setDriverRequest] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    car_type: "sedan" as CarType,
  });
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
    async (account: (typeof AVAILABLE_USERS)[number]) => {
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

  const handleDriverRequestSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);
      setRegisterMessage("");
      setRegistering(true);

      try {
        await createDriverRequest(driverRequest);
        setRegisterMessage(
          "Request sent. A dispatcher needs to approve your driver account.",
        );
        setDriverRequest({
          name: "",
          email: "",
          phone: "",
          address: "",
          car_type: "sedan",
        });
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "detail" in err
            ? (err as { detail: string }).detail
            : "Could not send driver registration request.";
        setError(msg);
        setShaking(true);
        setTimeout(() => setShaking(false), 600);
      } finally {
        setRegistering(false);
      }
    },
    [driverRequest],
  );

  // Handles the theme toggle action.
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
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px border-t border-app" />
        <span className="text-xs uppercase tracking-wider text-muted">
          Available Users
        </span>
        <div className="flex-1 h-px border-t border-app" />
      </div>

      {/* Quick login buttons */}
      <div className="flex flex-col gap-2" id="quick-login-group">
        {AVAILABLE_USERS.map((account) => (
          <button
            key={account.username}
            type="button"
            onClick={() => handleQuickLogin(account)}
            disabled={loading}
            className="px-4 py-2.5 text-sm flex items-center justify-between cursor-pointer transition-all disabled:opacity-50 rounded-xl border border-app bg-card-soft hover:opacity-90"
            id={`quick-login-${account.username}`}
          >
            <span className="text-main font-semibold">{account.label}</span>
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

      <div className="mt-6 border-t border-app pt-5">
        <button
          type="button"
          onClick={() => {
            setShowDriverRegistration((current) => !current);
            setError(null);
            setRegisterMessage("");
          }}
          className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20"
        >
          Register as Driver
        </button>

        {showDriverRegistration && (
          <form
            onSubmit={handleDriverRequestSubmit}
            className="mt-4 grid gap-3 rounded-2xl border border-app bg-card-soft p-4"
          >
            <div>
              <h2 className="text-lg font-black text-main">
                Driver Registration
              </h2>
              <p className="mt-1 text-sm text-muted">
                Fill this form and wait for dispatcher approval.
              </p>
            </div>

            <input
              type="text"
              value={driverRequest.name}
              onChange={(event) =>
                setDriverRequest((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-app bg-input px-4 py-3 text-sm text-main outline-none focus:border-blue-500"
              placeholder="Full name"
              required
            />

            <input
              type="email"
              value={driverRequest.email}
              onChange={(event) =>
                setDriverRequest((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-app bg-input px-4 py-3 text-sm text-main outline-none focus:border-blue-500"
              placeholder="Email"
              required
            />

            <input
              type="tel"
              value={driverRequest.phone}
              onChange={(event) =>
                setDriverRequest((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-app bg-input px-4 py-3 text-sm text-main outline-none focus:border-blue-500"
              placeholder="Phone"
              required
            />

            <input
              type="text"
              value={driverRequest.address}
              onChange={(event) =>
                setDriverRequest((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-app bg-input px-4 py-3 text-sm text-main outline-none focus:border-blue-500"
              placeholder="Address"
              required
            />

            <select
              value={driverRequest.car_type}
              onChange={(event) =>
                setDriverRequest((current) => ({
                  ...current,
                  car_type: event.target.value as CarType,
                }))
              }
              className="w-full rounded-lg border border-app bg-input px-4 py-3 text-sm text-main outline-none focus:border-blue-500"
            >
              {carTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {registerMessage && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {registerMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={registering}
              className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {registering ? "Sending request..." : "Send Request"}
            </button>
          </form>
        )}
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
