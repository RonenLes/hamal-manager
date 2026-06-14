type DispatcherStatBoxProps = {
  title: string;
  value: number;
  subtitle: string;
};

export default function DispatcherStatBox({
  title,
  value,
  subtitle,
}: DispatcherStatBoxProps) {
  return (
    <div className="rounded-2xl border border-app bg-card p-5 shadow-xl">
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-2 text-3xl font-black text-main">{value}</p>
      <p className="mt-1 text-xs text-soft">{subtitle}</p>
    </div>
  );
}
