type MetricCardProps = {
  title: string;
  value: string;
  note: string;
};

// Renders the metric card component.
export default function MetricCard({ title, value, note }: MetricCardProps) {
  return (
    <div className="flex aspect-square w-36 shrink-0 flex-col justify-center rounded-xl border border-app bg-card p-3 shadow-sm sm:w-44 sm:p-4 lg:flex-1">
      <p className="text-xs font-semibold leading-tight text-muted sm:text-sm">{title}</p>
      <p className="mt-2 text-xl font-black leading-none text-main sm:text-2xl">{value}</p>
      <p className="mt-2 text-xs leading-snug text-muted sm:text-sm">{note}</p>
    </div>
  );
}
