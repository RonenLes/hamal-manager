type HelpPageCardProps = {
  title: string;
  href: string;
  description: string;
  features: string[];
};

export default function HelpPageCard({
  title,
  href,
  description,
  features,
}: HelpPageCardProps) {
  return (
    <article className="rounded-2xl border border-app bg-card p-5 shadow-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-main">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>

        <span className="shrink-0 rounded-full border border-app bg-card-soft px-3 py-1 text-xs font-bold text-soft">
          {href}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2 text-sm text-muted">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
