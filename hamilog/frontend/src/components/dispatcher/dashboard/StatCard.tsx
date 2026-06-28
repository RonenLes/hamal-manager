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
    <div className="min-h-24 w-40 shrink-0 rounded-xl border border-app bg-card p-3 shadow-sm sm:min-h-0 sm:w-52 sm:p-4 lg:flex-1">
      <div className="flex min-h-20 flex-col justify-between gap-2 sm:min-h-0 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-tight text-muted sm:text-sm">{title}</p>
          <p className="mt-1.5 text-xl font-black leading-none text-main sm:mt-2 sm:text-2xl">{value}</p>
          <p className="mt-2 text-xs leading-snug text-muted sm:text-sm">{subtitle}</p>
        </div>

        <div className={`self-start rounded-xl px-2.5 py-1.5 text-lg sm:px-3 sm:py-2 sm:text-xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}