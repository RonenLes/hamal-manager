type DashboardPanelProps = {
  title: string;
  count?: number;
  accent?: "blue" | "orange" | "red" | "green" | "purple";
  children: React.ReactNode;
};

const accentClasses = {
  blue: "from-blue-600 to-blue-700",
  orange: "from-orange-600 to-orange-700",
  red: "from-red-600 to-red-700",
  green: "from-emerald-600 to-teal-700",
  purple: "from-violet-600 to-indigo-700",
};

export default function DashboardPanel({
  title,
  count,
  accent = "blue",
  children,
}: DashboardPanelProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-app bg-card shadow-xl">
      <header
        className={`flex items-center justify-between bg-gradient-to-r ${accentClasses[accent]} px-5 py-4`}
      >
        <h2 className="text-lg font-bold text-white">{title}</h2>

        {count !== undefined && (
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-900">
            {count}
          </span>
        )}
      </header>

      <div className="max-h-[340px] overflow-y-auto p-5">
        {children}
      </div>
    </section>
  );
}