"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login as apiLogin, getStoredUser, getToken } from "@/lib/api-client";

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
  const searchParams = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"dispatcher" | "driver">("dispatcher");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);

  // Auto-fill role from URL param
  useEffect(() => {
    const urlRole = searchParams.get("role");
    if (urlRole === "dispatcher" || urlRole === "driver") {
      setRole(urlRole);
    }
  }, [searchParams]);

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
      setRole(account.role as "dispatcher" | "driver");
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

  return (
    <div
      className={`glass-card w-full max-w-md p-8 ${shaking ? "animate-shake" : ""}`}
      style={{ animation: "fade-up 0.6s ease-out forwards" }}
    >
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
          HAMILOG
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Sign in to continue
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Role selector */}
        <div className="flex gap-2" id="role-selector">
          {(["dispatcher", "driver"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all cursor-pointer"
              style={{
                background: role === r ? "var(--gradient-blue)" : "rgba(255,255,255,0.05)",
                color: role === r ? "#fff" : "var(--text-secondary)",
                border: role === r ? "none" : "1px solid var(--border-subtle)",
              }}
              id={`role-btn-${r}`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Username */}
        <div className="relative">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="glass-input w-full px-4 py-3 text-sm"
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
            className="glass-input w-full px-4 py-3 text-sm"
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
            className="glass-panel px-4 py-2.5 text-sm flex items-center justify-between cursor-pointer hover:border-white/15 transition-all disabled:opacity-50"
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
    <main className="relative min-h-screen flex items-center justify-center px-4">
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
