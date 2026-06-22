type MetricCardProps = {
  title: string;
  value: string;
  note: string;
};

export default function MetricCard({ title, value, note }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-app bg-card p-5 shadow-xl">
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-3 text-3xl font-black text-main">{value}</p>
      <p className="mt-2 text-sm text-muted">{note}</p>
    </div>
  );
}
