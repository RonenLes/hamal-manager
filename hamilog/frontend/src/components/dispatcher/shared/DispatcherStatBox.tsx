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
    <div className="min-h-28 rounded-2xl border border-app bg-card p-3 shadow-xl sm:min-h-0 sm:p-5">
      <p className="text-xs font-semibold leading-tight text-muted sm:text-sm">{title}</p>
      <p className="mt-2 text-2xl font-black leading-none text-main sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs leading-snug text-soft">{subtitle}</p>
    </div>
  );
}
