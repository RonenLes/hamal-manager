type DriverHeaderProps = {
  title: string;
  description: string;
  online?: boolean;
};

export default function DriverHeader({
  title,
  description,
  online = true,
}: DriverHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
          Driver Workspace
        </p>
        <h1 className="mt-1 text-3xl font-black text-main">{title}</h1>
        <p className="mt-2 max-w-3xl text-muted">{description}</p>
      </div>

      <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-app bg-card px-4 py-2 text-sm font-bold">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            online ? "bg-emerald-400" : "bg-slate-500"
          }`}
        />
        <span className={online ? "text-emerald-300" : "text-muted"}>
          {online ? "Online" : "Offline"}
        </span>
      </div>
    </header>
  );
}
