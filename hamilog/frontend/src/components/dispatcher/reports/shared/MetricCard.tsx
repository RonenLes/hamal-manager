type MetricCardProps = {
  title: string;
  value: string;
  note: string;
};

// Renders the metric card component.
export default function MetricCard({ title, value, note }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-app bg-card p-4 shadow-xl sm:p-5">
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-3 text-2xl font-black text-main sm:text-3xl">{value}</p>
      <p className="mt-2 text-sm text-muted">{note}</p>
    </div>
  );
}
