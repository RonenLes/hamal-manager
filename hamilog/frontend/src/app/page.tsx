import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(6,182,212,0.06) 0%, transparent 50%)",
        }}
      />

      {/* Floating orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full animate-float pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full animate-float pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
          animationDelay: "1.5s",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-12 px-6 max-w-4xl mx-auto">
        {/* Hero title */}
        <header className="text-center" style={{ animation: "fade-up 0.7s ease-out forwards" }}>
          <h1
            className="font-[family-name:var(--font-outfit)] text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter leading-none mb-4"
            style={{
              background: "var(--gradient-hero)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
            id="hero-title"
          >
            HAMILOG
          </h1>
          <p
            className="text-lg sm:text-xl tracking-widest uppercase font-medium"
            style={{ color: "var(--text-secondary)" }}
            id="hero-subtitle"
          >
            Volunteer Logistics Command Center
          </p>
        </header>

        {/* CTA Cards */}
        <nav
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl"
          style={{ animation: "fade-up 0.7s ease-out 0.2s both" }}
          aria-label="Role selection"
        >
          {/* Dispatcher card */}
          <Link
            href="/login?role=dispatcher"
            id="cta-dispatcher"
            className="glass-card group p-8 flex flex-col items-center gap-4 cursor-pointer no-underline"
          >
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
              style={{ background: "rgba(59,130,246,0.15)", color: "var(--accent-blue)" }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8" />
                <path d="M12 17v4" />
                <path d="M7 8h2" />
                <path d="M7 12h4" />
                <circle cx="16" cy="10" r="2" />
              </svg>
            </div>
            <div className="text-center">
              <h2
                className="font-[family-name:var(--font-outfit)] text-xl font-bold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                Dispatcher Console
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Command center for coordinating missions &amp; drivers
              </p>
            </div>
            <span
              className="badge mt-auto"
              style={{
                background: "rgba(59,130,246,0.12)",
                color: "var(--accent-blue)",
                border: "1px solid rgba(59,130,246,0.25)",
              }}
            >
              Desktop Optimized
            </span>
          </Link>

          {/* Driver card */}
          <Link
            href="/login?role=driver"
            id="cta-driver"
            className="glass-card group p-8 flex flex-col items-center gap-4 cursor-pointer no-underline"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
              style={{ background: "rgba(16,185,129,0.15)", color: "var(--accent-emerald)" }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 17h14v-5H5z" />
                <path d="M2 12l3-6h14l3 6" />
                <circle cx="7.5" cy="17" r="2" />
                <circle cx="16.5" cy="17" r="2" />
              </svg>
            </div>
            <div className="text-center">
              <h2
                className="font-[family-name:var(--font-outfit)] text-xl font-bold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                Driver Portal
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Accept missions, navigate &amp; deliver
              </p>
            </div>
            <span
              className="badge mt-auto"
              style={{
                background: "rgba(16,185,129,0.12)",
                color: "var(--accent-emerald)",
                border: "1px solid rgba(16,185,129,0.25)",
              }}
            >
              Mobile Ready
            </span>
          </Link>
        </nav>

        {/* Footer */}
        <footer
          className="text-xs tracking-wider uppercase"
          style={{ color: "var(--text-secondary)", opacity: 0.5, animation: "fade-up 0.7s ease-out 0.4s both" }}
        >
          Secure &middot; Real-time &middot; AI-Powered
        </footer>
      </div>
    </main>
  );
}
