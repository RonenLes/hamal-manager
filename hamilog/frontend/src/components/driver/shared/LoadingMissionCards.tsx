// Renders the loading mission cards component.
export default function LoadingMissionCards() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-app bg-card p-5 shadow-xl"
        >
          <div className="h-5 w-3/4 rounded bg-card-soft" />
          <div className="mt-3 h-3 w-1/2 rounded bg-card-soft" />
          <div className="mt-3 h-3 w-full rounded bg-card-soft" />
          <div className="mt-4 h-9 w-32 rounded bg-card-soft" />
        </div>
      ))}
    </div>
  );
}
