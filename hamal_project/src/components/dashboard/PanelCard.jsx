export default function PanelCard({
  title,
  color = "bg-blue-600",
  count,
  children,
  scrollable = false,
}) {
  return (
    <section className="bg-white rounded-xl shadow border overflow-hidden">
      <div className={`${color} text-white px-4 py-3 flex items-center justify-between`}>
        <h2 className="font-semibold text-sm md:text-base">
          {title}
        </h2>

        {count !== undefined && (
          <span className="bg-white text-gray-900 rounded-full px-2 py-1 text-xs font-bold">
            {count}
          </span>
        )}
      </div>

      <div className={`p-4 ${scrollable ? "max-h-80 overflow-y-auto" : ""}`}>
        {children}
      </div>
    </section>
  );
}