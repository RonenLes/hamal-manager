type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color?: "green" | "orange" | "blue";
  compact?: boolean;
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
  compact = false,
}: StatCardProps) {
  return (
    <div className={`${
      compact
        ? "min-h-20 w-36 p-2.5 sm:min-h-0 sm:w-44 sm:p-3"
        : "min-h-24 w-40 p-3 sm:min-h-0 sm:w-52 sm:p-4"
    } shrink-0 rounded-xl border border-app bg-card shadow-sm lg:flex-1`}>
      <div className={`flex flex-col justify-between gap-2 sm:min-h-0 sm:flex-row sm:items-start ${
        compact ? "min-h-16" : "min-h-20"
      }`}>
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-tight text-muted sm:text-sm">{title}</p>
          <p className="mt-1.5 text-xl font-black leading-none text-main sm:mt-2 sm:text-2xl">{value}</p>
          <p className="mt-2 text-xs leading-snug text-muted sm:text-sm">{subtitle}</p>
        </div>

        <div className={`self-start rounded-xl text-lg ${
          compact ? "px-2 py-1 sm:text-lg" : "px-2.5 py-1.5 sm:px-3 sm:py-2 sm:text-xl"
        } ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
