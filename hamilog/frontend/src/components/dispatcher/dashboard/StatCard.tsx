type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color?: "green" | "orange" | "blue";
};

const colorClasses = {
  green: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  orange: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  blue: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
};

// Renders the stat card component.
export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-app bg-card p-5 shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{title}</p>
          <p className="mt-2 text-3xl font-black text-main">{value}</p>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        </div>

        <div className={`rounded-xl px-3 py-2 text-xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}