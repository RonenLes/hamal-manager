// Reusable loading spinner (Tailwind + SVG, no dependency).
// Color is inherited via `currentColor`; size via height/width classes.

type SpinnerProps = {
  className?: string;
};

// Renders an animated circular spinner.
export default function Spinner({ className = "h-5 w-5" }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-20"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Renders a full-screen centered loading state with the spinner and a label.
export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-app">
      <Spinner className="h-8 w-8 text-blue-500" />
      <p className="text-sm text-muted">{label}</p>
    </main>
  );
}
