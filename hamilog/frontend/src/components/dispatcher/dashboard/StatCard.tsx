import Icon, { isIconName } from "@/components/shared/Icon";

type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color?: "green" | "orange" | "blue";
  compact?: boolean;
};

const colorClasses = {
  green: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  orange: "bg-orange-500/12 text-orange-600 dark:text-orange-400",
  blue: "bg-blue-500/12 text-blue-600 dark:text-blue-400",
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
    } shrink-0 rounded-xl border border-app bg-card lg:flex-1`}>
      <div className={`flex flex-col justify-between gap-2 sm:min-h-0 sm:flex-row sm:items-start ${
        compact ? "min-h-16" : "min-h-20"
      }`}>
        <div className="min-w-0">
          <p className="text-xs font-medium leading-tight text-muted sm:text-sm">{title}</p>
          <p className="mt-1.5 text-xl font-bold leading-none text-main sm:mt-2 sm:text-2xl">{value}</p>
          <p className="mt-2 text-xs leading-snug text-muted sm:text-sm">{subtitle}</p>
        </div>

        <div className={`flex shrink-0 items-center justify-center self-start rounded-lg ${
          compact ? "h-8 w-8" : "h-9 w-9 sm:h-10 sm:w-10"
        } ${colorClasses[color]}`}>
          {isIconName(icon) ? (
            <Icon name={icon} className={compact ? "h-4 w-4" : "h-5 w-5"} />
          ) : (
            <span className="text-sm font-semibold">{icon}</span>
          )}
        </div>
      </div>
    </div>
  );
}
