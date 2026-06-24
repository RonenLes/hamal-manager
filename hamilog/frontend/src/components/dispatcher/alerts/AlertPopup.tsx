export type PopupAlert = {
  id: string;
  title: string;
  summary: string;
  summaries?: string[];
  type?: string;
  level?: "critical" | "warning" | "info" | "success";
};

type AlertPopupProps = {
  alert: PopupAlert;
  onOk: () => void;
};

function getPopupClasses(level?: PopupAlert["level"]) {
  if (level === "critical") return "border-red-500/40 bg-red-500/10";
  if (level === "warning") return "border-orange-500/40 bg-orange-500/10";
  if (level === "info") return "border-blue-500/40 bg-blue-500/10";
  return "border-emerald-500/40 bg-emerald-500/10";
}

export default function AlertPopup({ alert, onOk }: AlertPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 text-main shadow-2xl ${getPopupClasses(
          alert.level,
        )}`}
      >
        <p className="text-sm font-bold uppercase tracking-wider text-muted">
          {alert.type || "Alert"}
        </p>
        <h2 className="mt-2 text-2xl font-black">{alert.title}</h2>
        {alert.summaries && alert.summaries.length > 1 ? (
          <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-2">
            {alert.summaries.map((summary, index) => (
              <li
                key={`${summary}-${index}`}
                className="rounded-xl border border-app bg-card/60 px-4 py-3 text-sm leading-6 text-muted"
              >
                {summary}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-6 text-muted">{alert.summary}</p>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onOk}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
