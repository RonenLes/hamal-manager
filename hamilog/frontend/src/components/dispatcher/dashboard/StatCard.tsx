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
    <div className="rounded-2xl border border-app bg-card p-3 shadow-xl sm:p-5">
      <div className="flex min-h-28 flex-col justify-between gap-3 sm:min-h-0 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-tight text-muted sm:text-sm">{title}</p>
          <p className="mt-2 text-2xl font-black leading-none text-main sm:text-3xl">{value}</p>
          <p className="mt-2 text-xs leading-snug text-muted sm:text-sm">{subtitle}</p>
        </div>

        <div className={`self-start rounded-xl px-2.5 py-1.5 text-lg sm:px-3 sm:py-2 sm:text-xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}