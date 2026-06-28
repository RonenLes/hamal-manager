type DispatcherStatBoxProps = {
  title: string;
  value: number;
  subtitle: string;
};

// Renders the dispatcher stat box component.
export default function DispatcherStatBox({
  title,
  value,
  subtitle,
}: DispatcherStatBoxProps) {
  return (
    <div className="min-h-24 w-36 shrink-0 rounded-xl border border-app bg-card p-3 shadow-sm sm:min-h-0 sm:w-44 sm:p-4 lg:flex-1">
      <p className="text-xs font-semibold leading-tight text-muted sm:text-sm">{title}</p>
      <p className="mt-1.5 text-xl font-black leading-none text-main sm:mt-2 sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs leading-snug text-soft">{subtitle}</p>
    </div>
  );
}
